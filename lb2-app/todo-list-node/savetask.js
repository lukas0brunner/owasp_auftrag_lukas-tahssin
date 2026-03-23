const db = require('./fw/db');
const { verifyCsrf, toInt, isAllowedState, escapeHtml } = require('./fw/security');

async function getHtml(req) {
    let html = '';
    let taskId = '';

    if (!verifyCsrf(req)) {
        return "<span class='info info-error'>Invalid CSRF token</span>";
    }

    // see if the id exists in the database
    if (req.body.id !== undefined && req.body.id.length !== 0) {
        const parsedId = toInt(req.body.id, null);
        if (parsedId !== null) taskId = parsedId;
        let stmt = await db.executeStatement('select ID, title, state from tasks where ID = ? and userID = ?', [taskId, req.session.user.id]);
        if (stmt.length === 0) {
            taskId = '';
        }
    }

    if (req.body.title !== undefined && req.body.state !== undefined){
        let state = String(req.body.state).toLowerCase();
        let title = String(req.body.title);
        let userid = req.session.user.id;

        if (!title || title.length > 200) {
            return "<span class='info info-error'>Invalid title</span>";
        }
        if (!isAllowedState(state)) {
            return "<span class='info info-error'>Invalid state</span>";
        }

        if (taskId === ''){
            await db.executeStatement(
                'insert into tasks (title, state, userID) values (?, ?, ?)',
                [title, state, userid]
            );
        } else {
            await db.executeStatement(
                'update tasks set title = ?, state = ? where ID = ? and userID = ?',
                [title, state, taskId, userid]
            );
        }

        html += "<span class='info info-success'>Update successfull</span>";
    } else {
        html += "<span class='info info-error'>No update was made</span>";
    }

    return html;
}

module.exports = { html: getHtml }