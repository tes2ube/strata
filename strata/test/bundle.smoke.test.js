// Runs the app smoke test against the BUNDLED code (what Strata.html contains) instead of the source modules.
process.env.STRATA_BUNDLE = '1';
await import('./app.smoke.test.js');
