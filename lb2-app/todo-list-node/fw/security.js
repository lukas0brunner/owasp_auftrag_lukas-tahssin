const crypto = require('crypto');

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function toInt(value, fallback = null) {
    if (value === undefined || value === null) return fallback;
    if (typeof value === 'number' && Number.isInteger(value)) return value;
    if (typeof value !== 'string') return fallback;
    if (!/^-?\d+$/.test(value)) return fallback;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? fallback : n;
}

function isAllowedState(state) {
    return state === 'open' || state === 'in progress' || state === 'done';
}

function ensureAuth(req, res, next) {
    if (req.session && req.session.user && req.session.user.id) return next();
    return res.redirect('/login');
}

function ensureRole(role) {
    return function (req, res, next) {
        if (!req.session || !req.session.user) return res.redirect('/login');
        if (req.session.user.role !== role) return res.status(403).send('Forbidden');
        return next();
    };
}

function issueCsrfToken(req) {
    if (!req.session) return '';
    // Token should be a single-line ASCII string to safely embed in HTML attributes.
    // Defensive normalization: remove any accidental whitespace/newlines from older session values.
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    req.session.csrfToken = String(req.session.csrfToken).replace(/[\r\n\t\f\v ]+/g, '');
    return req.session.csrfToken;
}

function verifyCsrf(req) {
    const token = (req.body && req.body.csrfToken) || (req.headers && req.headers['x-csrf-token']);
    return !!(req.session && req.session.csrfToken && token && token === req.session.csrfToken);
}

function securityHeaders(req, res, next) {
    // Minimal, framework-free hardening
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    // CSP: app currently uses inline scripts and loads JS from cdnjs.
    // For LB2 Phase 1 we keep this as a transitional policy; next step is to
    // move inline JS to /public and remove 'unsafe-inline' + external hosts.
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
    );
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
}

module.exports = {
    escapeHtml,
    toInt,
    isAllowedState,
    ensureAuth,
    ensureRole,
    issueCsrfToken,
    verifyCsrf,
    securityHeaders
};
