const db = require('./fw/db');
const { escapeHtml, issueCsrfToken, verifyCsrf, verifyPassword } = require('./fw/security');

// Simple in-memory rate limit (good for LB2 demo; use Redis in prod)
const loginAttempts = new Map();
function getClientIp(req) {
    return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim() || 'unknown';
}

function getClientKey(req) {
    return getClientIp(req);
}

function canAttemptLogin(req) {
    const key = getClientKey(req);
    const now = Date.now();
    const entry = loginAttempts.get(key) || { count: 0, resetAt: now + 60_000 };
    if (now > entry.resetAt) {
        entry.count = 0;
        entry.resetAt = now + 60_000;
    }
    entry.count += 1;
    loginAttempts.set(key, entry);
    return entry.count <= 10; // 10 tries / minute
}

async function handleLogin(req) {
    let msg = '';

    // CSRF protection for login to prevent login-CSRF / session confusion
    if (!verifyCsrf(req)) {
        msg = "<span class='info info-error'>Invalid CSRF token</span>";
        return { ok: false, html: msg + getHtml(req) };
    }

    const username = (req.body && req.body.username) ? String(req.body.username) : '';
    const password = (req.body && req.body.password) ? String(req.body.password) : '';

    if (!canAttemptLogin(req)) {
        await auditLog('login_rate_limited', null, req);
        msg = "<span class='info info-error'>Too many login attempts. Try again later.</span>";
        return { ok: false, html: msg + getHtml(req) };
    }

    if (username && password) {
        const result = await validateLogin(username, password);
        if (result.valid) {
            await auditLog('login_success', result.userId, req);
            return {
                ok: true,
                user: { id: result.userId, username: result.username, role: result.role }
            };
        }
        await auditLog('login_failed', null, req);
        msg = "<span class='info info-error'>Invalid username or password</span>";
    }

    return { ok: false, html: msg + getHtml(req) };
}

async function validateLogin (username, password) {
    let result = { valid: false, userId: 0, username: '', role: 'user' };

    const rows = await db.executeStatement(
        'SELECT users.id as id, users.username as username, users.password as password, roles.title as roleTitle FROM users ' +
        'LEFT JOIN permissions ON users.id = permissions.userID ' +
        'LEFT JOIN roles ON permissions.roleID = roles.id ' +
        'WHERE users.username = ? LIMIT 1',
        [username]
    );

    if (rows.length === 0) return result;

    // verifyPassword supports both PBKDF2 hashes and legacy plaintext (migration)
    if (verifyPassword(password, rows[0].password)) {
        result.userId   = rows[0].id;
        result.username = rows[0].username;
        result.role     = (rows[0].roleTitle || 'user').toLowerCase() === 'admin' ? 'admin' : 'user';
        result.valid    = true;
    }

    return result;
}

// ── Audit logging helper ────────────────────────────────────────────────────
async function auditLog(eventType, userId, req) {
    try {
        const ip        = getClientIp(req);
        const userAgent = String(req.headers && req.headers['user-agent'] || '').slice(0, 255);
        await db.executeStatement(
            'INSERT INTO audit_log (event_type, user_id, ip, user_agent) VALUES (?, ?, ?, ?)',
            [eventType, userId || null, ip, userAgent]
        );
    } catch (_) {
        // audit failures must not block login flow
    }
}

function getHtml(req) {
    const csrfToken = issueCsrfToken(req);
    return `
    <h2>Login</h2>

    <form id="form" method="post" action="/login" autocomplete="off">
        <input type="hidden" name="csrfToken" value="${escapeHtml(csrfToken)}" />
        <div class="form-group">
            <label for="username">Username</label>
            <input type="text" class="form-control size-medium" name="username" id="username">
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" class="form-control size-medium" name="password" id="password">
        </div>
        <div class="form-group">
            <label for="submit" ></label>
            <input id="submit" type="submit" class="btn size-auto" value="Login" />
        </div>
    </form>`;
}

module.exports = {
    handleLogin: handleLogin,
    getHtml: getHtml
};