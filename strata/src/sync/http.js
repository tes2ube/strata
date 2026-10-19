// One shared HTTP client for every sync call. Throttles per host (MusicBrainz asks for at most one request a second from one IP),
// retries 429 and 503 by waiting as the server asks, optionally routes through a proxy you run, and turns failures into SyncError.
// fetch, the clock and sleep are injectable so the tests can run it without a network.
export class SyncError extends Error {
  constructor(kind, message, status = null, host = null) { super(message); this.name = 'SyncError'; this.kind = kind; this.status = status; this.host = host; }
}

export function createHttp({ cfg, fetchFn = globalThis.fetch?.bind(globalThis), now = () => Date.now(), sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  const nextAt = {};
  const delayFor = (host) => { try { return cfg.get(`sync.delayMs.${host}`); } catch { return 0; } };
  const viaProxy = (url) => { const t = cfg.get('sync.proxyTemplate'); return t && t.includes('{url}') ? t.replace('{url}', encodeURIComponent(url)) : url; };

  async function request(host, url, { method = 'GET', headers = {}, body, signal, allow404 = false } = {}) {
    if (!fetchFn) throw new SyncError('network', 'fetch is not available here.', null, host);
    const retries = cfg.get('sync.retries');
    for (let attempt = 0; ; attempt++) {
      if (signal?.aborted) throw new SyncError('aborted', 'Stopped.', null, host);
      // reserve the next free slot for this host now, so overlapping callers queue up behind each other
      const t = now(), slot = Math.max(t, nextAt[host] || 0); nextAt[host] = slot + delayFor(host);
      if (slot > t) await sleep(slot - t);
      let res;
      try {
        res = await fetchFn(viaProxy(url), { method, headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined, signal });
      } catch (e) {
        if (e?.name === 'AbortError') throw new SyncError('aborted', 'Stopped.', null, host);
        throw new SyncError('network', `Could not reach ${host}. Either you are offline or the browser blocked the request (CORS). If it is CORS, set a request proxy in the Sync settings.`, null, host);
      }
      // ListenBrainz documents these headers: when the window is used up, wait for it to reset
      if (host === 'listenbrainz' && res.headers?.get?.('X-RateLimit-Remaining') === '0') { const s = Number(res.headers.get('X-RateLimit-Reset-In')); if (s > 0) nextAt[host] = Math.max(nextAt[host], now() + s * 1000); }
      if (res.status === 429 || res.status === 503) {
        if (attempt >= retries) throw new SyncError('rate', `${host} is rate limiting (HTTP ${res.status}). Try again later.`, res.status, host);
        const ra = Number(res.headers?.get?.('Retry-After')) || Number(res.headers?.get?.('X-RateLimit-Reset-In')) || 2 ** attempt;
        nextAt[host] = Math.max(nextAt[host] || 0, now() + ra * 1000); continue;
      }
      if (res.status === 204) return null;
      if (res.status === 404 && allow404) return null;
      if (res.status === 401 || res.status === 403) throw new SyncError('auth', `${host} refused the request (HTTP ${res.status}). Check the username, token or key.`, res.status, host);
      if (!res.ok) { let msg = ''; try { msg = (await res.json())?.error || ''; } catch { /* no body */ } throw new SyncError('http', `${host} answered HTTP ${res.status}${msg ? ': ' + msg : ''}.`, res.status, host); }
      try { return await res.json(); } catch { throw new SyncError('parse', `${host} sent something that was not JSON.`, res.status, host); }
    }
  }
  return { request };
}
