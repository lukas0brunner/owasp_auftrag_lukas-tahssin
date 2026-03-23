const login = require('../login');
const db = require('../fw/db');
const { escapeHtml, issueCsrfToken } = require('./security');

async function getHtml(req) {
    const csrfToken = escapeHtml(issueCsrfToken(req)).replace(/\s+/g, '');
    let content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="${csrfToken}" />
    <title>TBZ 'Secure' App</title>
    <link rel="stylesheet" href="/style.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.0/jquery.min.js" integrity="sha384-JUMjoW8OzDJw4oFpWIB2Bu/c6768ObEthBMVSiIx4ruBIEdyNSUQAjJNFqT5pnJ6" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.19.1/jquery.validate.min.js" integrity="sha384-6UVI3atWyL/qZbDIJb7HW8PyHhFNMiX5rYNY2gAYcaYJjYk5cNIQShSQPBleGMYu" crossorigin="anonymous"></script>
</head>
<body>
    <header>
        <div>This is the insecure m183 test app</div>`;

    let id = 0;
    let roleid = 0;
    if(req.session && req.session.user && req.session.user.id) {
        id = req.session.user.id;
        let stmt = await db.executeStatement(
            "select users.id userid, roles.id roleid, roles.title rolename from users inner join permissions on users.id = permissions.userid inner join roles on permissions.roleID = roles.id where userid = ?",
            [id]
        );

        // load role from db
        if(stmt.length > 0) {
            roleid = stmt[0].roleid;
        }

        content += `
        <nav>
            <ul>
                <li><a href="/">Tasks</a></li>`;
        if(roleid === 1) {
            content += `
                <li><a href="/admin/users">User List</a></li>`;
        }
        content += `
                <li><a href="/logout">Logout</a></li>
            </ul>
        </nav>`;
    }

    content += `
    </header>
    <main>`;

    return content;
}

module.exports = getHtml;