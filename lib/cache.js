const cacheStore = new Map();

function get(key) {
  const record = cacheStore.get(key);
  if (!record) return undefined;
  const { value, expiresAt } = record;
  if (expiresAt !== 0 && Date.now() > expiresAt) {
    cacheStore.delete(key);
    return undefined;
  }
  return value;
}

function set(key, value, ttlMs) {
  const expiresAt = ttlMs && ttlMs > 0 ? Date.now() + ttlMs : 0;
  cacheStore.set(key, { value, expiresAt });
}

async function getOrSet(key, ttlMs, computeFn) {
  const existing = get(key);
  if (existing !== undefined) return existing;
  const result = await computeFn();
  // Avoid caching errors/undefined aggressively
  if (result !== undefined) {
    set(key, result, ttlMs);
  }
  return result;
}

module.exports = { get, set, getOrSet };


