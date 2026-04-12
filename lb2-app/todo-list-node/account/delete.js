const db = require('../fw/db');
const { escapeHtml, issueCsrfToken, verifyCsrf } = require('../fw/security');

function getClientIp(req) {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
    return ip || null;
}

async function getDeleteAccountHtml(req) {
    const token = escapeHtml(issueCsrfToken(req));
    return `
        <h2>Delete account</h2>
        <p>
            This action is irreversible. Your user account and all your tasks will be permanently deleted.
        </p>
        <form method="post" action="/account/delete" autocomplete="off">
            <input type="hidden" name="csrfToken" value="${token}" />
            <div class="form-group">
                <label for="password">Confirm password</label>
                <input type="password" class="form-control size-medium" name="password" id="password" required />
            </div>
            <div class="form-group">
                <button type="submit">Delete my account</button>
            </div>
        </form>
    `;
}

async function handleDeleteAccount(req) {
    if (!verifyCsrf(req)) {
        await db.executeStatement(
            'INSERT INTO audit_log (event_type, user_id, ip, user_agent) VALUES (?, ?, ?, ?)',
            ['account_delete_csrf_failed', req.session.user.id, getClientIp(req), (req.headers['user-agent'] || '').toString().slice(0, 255)]
        );
        return { ok: false, message: "Invalid CSRF token" };
    }

    const userId = req.session.user.id;
    const password = (req.body && req.body.password) ? String(req.body.password) : '';
    if (!password) return { ok: false, message: 'Password required' };

    // NOTE: Passwords are plaintext in the given DB. This confirms via equality.
    // Next step (Phase 2/3): migrate to bcrypt/argon2.
    const rows = await db.executeStatement('SELECT id, password FROM users WHERE id = ? LIMIT 1', [userId]);
    if (rows.length === 0) return { ok: false, message: 'User not found' };
    if (password !== rows[0].password) {
        await db.executeStatement(
            'INSERT INTO audit_log (event_type, user_id, ip, user_agent) VALUES (?, ?, ?, ?)',
            ['account_delete_password_failed', userId, getClientIp(req), (req.headers['user-agent'] || '').toString().slice(0, 255)]
        );
        return { ok: false, message: 'Incorrect password' };
    }

    const conn = await db.connectDB();
    try {
        await conn.beginTransaction();
        // Variante A: Vollständiges Löschen (Tasks gehören eindeutig zum User)
        await conn.execute('DELETE FROM tasks WHERE userID = ?', [userId]);
        await conn.execute('DELETE FROM permissions WHERE userID = ?', [userId]);
        await conn.execute('DELETE FROM users WHERE id = ?', [userId]);

        // Audit log: keep minimal metadata, no secrets
        await conn.execute(
            'INSERT INTO audit_log (event_type, user_id, ip, user_agent) VALUES (?, ?, ?, ?)',
            ['account_deleted', userId, getClientIp(req), (req.headers['user-agent'] || '').toString().slice(0, 255)]
        );

        await conn.commit();
        return { ok: true };
    } catch (e) {
        try { await conn.rollback(); } catch (_) { /* ignore */ }
        return { ok: false, message: 'Delete failed' };
    } finally {
        try { await conn.end(); } catch (_) { /* ignore */ }
    }
}

module.exports = {
    getDeleteAccountHtml,
    handleDeleteAccount
};
