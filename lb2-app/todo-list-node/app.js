const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const header = require('./fw/header');
const footer = require('./fw/footer');
const login = require('./login');
const index = require('./index');
const adminUser = require('./admin/users');
const editTask = require('./edit');
const saveTask = require('./savetask');
const search = require('./search');
const searchProvider = require('./search/v2/index');
const { ensureAuth, ensureRole, securityHeaders, verifyCsrf, issueCsrfToken, escapeHtml } = require('./fw/security');
const accountDelete = require('./account/delete');

const app = express();
const PORT = 3000;

app.disable('x-powered-by');
app.use(securityHeaders);

// If running behind a reverse proxy (common in prod), allow secure cookies to work
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Middleware für Session-Handling
app.use(session({
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'dev-only-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60
    }
}));

// Middleware für Body-Parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Routen
app.get('/', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    let html = await wrapContent(await index.html(req), req);
    res.send(html);
});

app.post('/', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    let html = await wrapContent(await index.html(req), req);
    res.send(html);
})

app.get('/admin/users', async (req, res) => {
    return ensureAuth(req, res, async () => {
        return ensureRole('admin')(req, res, async () => {
            let html = await wrapContent(await adminUser.html(req), req);
            res.send(html);
        });
    });
});

// edit task
app.get('/edit', async (req, res) => {
    return ensureAuth(req, res, async () => {
        let html = await wrapContent(await editTask.html(req), req);
        res.send(html);
    });
});

app.get('/login', async (req, res) => {
    if (req.session.user) return res.redirect('/');
    let html = await wrapContent(await login.getHtml(req), req);
    res.send(html);
});

app.post('/login', async (req, res) => {
    const result = await login.handleLogin(req);
    if (result.ok) {
        req.session.regenerate(() => {
            req.session.user = result.user;
            res.redirect('/');
        });
        return;
    }

    let html = await wrapContent(result.html, req);
    res.status(401).send(html);
});

// Logout
app.get('/logout', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const token = escapeHtml(issueCsrfToken(req));
    res.send(`
        <h2>Logout</h2>
        <form method="post" action="/logout">
            <input type="hidden" name="csrfToken" value="${token}" />
            <button type="submit">Confirm Logout</button>
        </form>
    `);
});

app.post('/logout', (req, res) => {
    if (!verifyCsrf(req)) return res.status(403).send('Invalid CSRF token');
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Profilseite anzeigen
app.get('/profile', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.send(`
        <h2>Profile</h2>
        <p>Welcome, ${escapeHtml(req.session.user.username)}.</p>
        <ul>
            <li><a href="/logout">Logout</a></li>
            <li><a href="/account/delete">Delete account</a></li>
        </ul>
    `);
});

// Account delete (GET confirm)
app.get('/account/delete', async (req, res) => {
    return ensureAuth(req, res, async () => {
        const content = await accountDelete.getDeleteAccountHtml(req);
        const html = await wrapContent(content, req);
        res.send(html);
    });
});

// Account delete (POST execute)
app.post('/account/delete', async (req, res) => {
    return ensureAuth(req, res, async () => {
        const result = await accountDelete.handleDeleteAccount(req);
        if (!result.ok) {
            const content = `<span class='info info-error'>${escapeHtml(result.message || 'Delete failed')}</span>` + await accountDelete.getDeleteAccountHtml(req);
            const html = await wrapContent(content, req);
            return res.status(400).send(html);
        }

        req.session.destroy(() => {
            res.redirect('/login');
        });
    });
});

// Delete task (existing UI link)
app.get('/delete', async (req, res) => {
    return ensureAuth(req, res, async () => {
        const id = req.query && req.query.id ? String(req.query.id) : '';
        const token = escapeHtml(issueCsrfToken(req));
        const content = `
            <h2>Delete task</h2>
            <p>Do you really want to delete this task?</p>
            <form method="post" action="/delete">
                <input type="hidden" name="csrfToken" value="${token}" />
                <input type="hidden" name="id" value="${escapeHtml(id)}" />
                <button type="submit">Delete</button>
            </form>
        `;
        res.send(await wrapContent(content, req));
    });
});

app.post('/delete', async (req, res) => {
    return ensureAuth(req, res, async () => {
        if (!verifyCsrf(req)) return res.status(403).send('Invalid CSRF token');
        const taskId = req.body && req.body.id ? parseInt(req.body.id, 10) : NaN;
        if (!Number.isInteger(taskId) || taskId <= 0) return res.status(400).send('Invalid id');

        // Ownership enforced
        await require('./fw/db').executeStatement(
            'DELETE FROM tasks WHERE id = ? AND userID = ?',
            [taskId, req.session.user.id]
        );
        res.redirect('/');
    });
});

// save task
app.post('/savetask', async (req, res) => {
    return ensureAuth(req, res, async () => {
        let html = await wrapContent(await saveTask.html(req), req);
        res.send(html);
    });
});

// search
app.post('/search', async (req, res) => {
    return ensureAuth(req, res, async () => {
    if (!verifyCsrf(req)) return res.status(403).send('Invalid CSRF token');
        let html = await search.html(req);
        res.send(html);
    });
});

// search provider
app.get('/search/v2/', async (req, res) => {
    return ensureAuth(req, res, async () => {
        let result = await searchProvider.search(req);
        res.send(result);
    });
});

// Central error handler (avoid leaking internals)
app.use((err, req, res, next) => {
    try {
        console.error('Unhandled error:', err);
    } catch (_) {
        // ignore
    }
    if (res.headersSent) return next(err);
    res.status(500).send('Internal Server Error');
});


// Server starten (nur wenn direkt ausgeführt, nicht beim Import in Tests)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

async function wrapContent(content, req) {
    let headerHtml = await header(req);
    return headerHtml+content+footer;
}

module.exports = app;