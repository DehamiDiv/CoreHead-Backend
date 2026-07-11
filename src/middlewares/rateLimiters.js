/**
 * R5-3 — Rate limiters for auth + public comment abuse protection.
 */
const rateLimit = require('express-rate-limit');

const jsonMessage = (msg) => ({
  success: false,
  error: msg,
});

/** Login / register / password / OTP — tighter limit */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many auth attempts. Please try again in a few minutes.'),
});

/** Public comment create */
const commentCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many comments. Please slow down and try again later.'),
});

module.exports = {
  authLimiter,
  commentCreateLimiter,
};
