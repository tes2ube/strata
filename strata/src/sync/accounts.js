// Account details for the sync providers. Kept in their own storage key, never in settings or the save file,
// so exporting settings or progress cannot leak a token.
export const ACCOUNTS_KEY = 'strata.accounts.v1';
export function loadAccounts(storage) { try { const o = JSON.parse(storage.getItem(ACCOUNTS_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch { return {}; } }
export function saveAccounts(storage, accounts) { try { storage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); return true; } catch { return false; } }
export function setAccountField(accounts, provider, key, value) { const a = (accounts[provider] ||= {}); const v = String(value ?? '').trim(); if (v) a[key] = v; else delete a[key]; return accounts; }
export const hasAccount = (accounts, provider, required) => required.every((k) => accounts[provider]?.[k]);
export function clearAccount(accounts, provider) { delete accounts[provider]; return accounts; }
