// Cloudflare bindings (D1, R2) handed over by the Worker entry point. Kept in a tiny module of
// its own so CommonJS code anywhere in the app can reach them without importing the ESM-only
// `cloudflare:workers` specifier itself.

let bindings = {};

const setBindings = (env) => {
  bindings = env || {};
};

const getBinding = (name) => {
  const value = bindings[name];
  if (!value) throw new Error(`Cloudflare binding "${name}" is not configured`);
  return value;
};

module.exports = { setBindings, getBinding };
