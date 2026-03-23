const db = require('../fw/db');
const { escapeHtml } = require('../fw/security');

async function getHtml(req) {
    let html = `
    <section id="list">
        <a href="edit">Create Task</a>
        <table>
            <tr>
                <th>ID</th>
                <th>Description</th>
                <th>State</th>
                <th></th>
            </tr>
    `;

    const result = await db.executeStatement(
        'select ID, title, state from tasks where UserID = ?',
        [req.session.user.id]
    );
    result.forEach(function(row) {
        html += `
            <tr>
                <td>`+row.ID+`</td>
                <td class="wide">`+escapeHtml(row.title)+`</td>
                <td>`+escapeHtml(ucfirst(row.state))+`</td>
                <td>
                    <a href="edit?id=`+row.ID+`">edit</a> | <a href="delete?id=`+row.ID+`">delete</a>
                </td>
            </tr>`;
    });

    html += `
        </table>
    </section>`;

    return html;
}

function ucfirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
    html: getHtml
}