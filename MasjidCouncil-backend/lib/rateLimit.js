// Minimal fixed-window limiter for login endpoints.
// ponytail: in-memory, so it is per-process — swap for express-rate-limit + redis
// the day this runs behind more than one node instance.

const buckets = new Map();

const rateLimit = ({ windowMs, max, message }) => (req, res, next) => {
  const now = Date.now();
  const key = req.ip;
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);

  if (hits.length >= max) {
    buckets.set(key, hits);
    return res.status(429).json({ success: false, message });
  }

  hits.push(now);
  buckets.set(key, hits);

  // Drop clients that fell out of the window so the map cannot grow forever.
  for (const [k, times] of buckets) {
    if (times.every((t) => now - t >= windowMs)) buckets.delete(k);
  }

  next();
};

module.exports = rateLimit;
