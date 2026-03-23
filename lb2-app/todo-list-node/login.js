const db = require('./fw/db');
const { escapeHtml, issueCsrfToken } = require('./fw/security');

// Simple in-memory rate limit (good for LB2 demo; use Redis in prod)
const loginAttempts = new Map();
function getClientKey(req) {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
    return ip || 'unknown';
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

    const username = (req.body && req.body.username) ? String(req.body.username) : '';
    const password = (req.body && req.body.password) ? String(req.body.password) : '';

    if (!canAttemptLogin(req)) {
        msg = "<span class='info info-error'>Too many login attempts. Try again later.</span>";
        return { ok: false, html: msg + getHtml(req) };
    }

    if (username && password) {
        const result = await validateLogin(username, password);
        if (result.valid) {
            return {
                ok: true,
                user: { id: result.userId, username: result.username, role: result.role }
            };
        }
        msg = "<span class='info info-error'>Invalid username or password</span>";
    }

    return { ok: false, html: msg + getHtml(req) };
}

async function validateLogin (username, password) {
    let result = { valid: false, userId: 0, username: '', role: 'user' };

    // NOTE: passwords are currently stored in plaintext in DB in this project.
    // For LB2 Phase 1 fix we at least parameterize the query.
    const rows = await db.executeStatement(
        'SELECT users.id as id, users.username as username, users.password as password, roles.title as roleTitle FROM users ' +
        'LEFT JOIN permissions ON users.id = permissions.userID ' +
        'LEFT JOIN roles ON permissions.roleID = roles.id ' +
        'WHERE users.username = ? LIMIT 1',
        [username]
    );

    if (rows.length === 0) return result;

    const db_password = rows[0].password;
    if (password === db_password) {
        result.userId = rows[0].id;
        result.username = rows[0].username;
        result.role = (rows[0].roleTitle || 'user').toLowerCase() === 'admin' ? 'admin' : 'user';
        result.valid = true;
    }

    return result;
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