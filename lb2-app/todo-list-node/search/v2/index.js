const db = require('../../fw/db');
const { escapeHtml } = require('../../fw/security');

async function search(req) {
    if (req.query.userid === undefined || req.query.terms === undefined){
        return "Not enough information to search";
    }

    // Ignore user-controlled userid; authorization is based on session
    const userid = req.session.user.id;
    let terms = String(req.query.terms);
    if (!terms || terms.length > 50) return 'Invalid search term';
    let result = '';

    let stmt = await db.executeStatement(
        "select ID, title, state from tasks where userID = ? and title like ?",
        [userid, `%${terms}%`]
    );
    if (stmt.length > 0) {
        stmt.forEach(function(row) {
            result += escapeHtml(row.title)+' ('+escapeHtml(row.state)+')<br />';
        });
    }

    return result;
}

module.exports = {
    search: search
};