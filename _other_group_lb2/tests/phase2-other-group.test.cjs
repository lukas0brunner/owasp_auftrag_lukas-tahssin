const { otherGroupRoot, readText, exists } = require('./helpers.cjs');

describe('Phase 2 - Security test protocol checks (other group)', () => {
  const appJs = otherGroupRoot('todo-list-node', 'app.js');
  const editJs = otherGroupRoot('todo-list-node', 'edit.js');
  const saveTaskJs = otherGroupRoot('todo-list-node', 'savetask.js');
  const loginJs = otherGroupRoot('todo-list-node', 'login.js');
  const searchJs = otherGroupRoot('todo-list-node', 'search.js');
  const searchV2Js = otherGroupRoot('todo-list-node', 'search', 'v2', 'index.js');
  const indexJs = otherGroupRoot('todo-list-node', 'index.js');
  const headerJs = otherGroupRoot('todo-list-node', 'fw', 'header.js');
  const adminUsersJs = otherGroupRoot('todo-list-node', 'admin', 'users.js');
  const pkgJson = otherGroupRoot('todo-list-node', 'package.json');
  const composeDb = otherGroupRoot('docker', 'compose.db.yaml');
  const composeNode = otherGroupRoot('docker', 'compose.node.yaml');

  test('Sanity: expected target files exist', () => {
    const required = [
      appJs,
      editJs,
      saveTaskJs,
      loginJs,
      searchJs,
      searchV2Js,
      indexJs,
      headerJs,
      adminUsersJs,
      pkgJson,
      composeDb,
      composeNode,
    ];

    for (const filePath of required) {
      expect(exists(filePath)).toBe(true);
    }
  });

  describe('A01 Broken Access Control', () => {
    test('TC-A01-01: unauthenticated access to GET / is blocked by requireLogin', () => {
      const src = readText(appJs);
      expect(src).toMatch(/app\.get\(\s*['"]\/['"]\s*,\s*requireLogin\s*,/);
    });

    test('TC-A01-02: IDOR protection is enforced for edit and save flows via ownership checks', () => {
      const editSrc = readText(editJs);
      const saveSrc = readText(saveTaskJs);

      expect(editSrc).toMatch(/SELECT\s+ID,\s+title,\s+state\s+FROM\s+tasks\s+WHERE\s+ID\s*=\s*\?\s+AND\s+userID\s*=\s*\?/i);
      expect(editSrc).toMatch(/req\.session\.user\.userid/);
      expect(saveSrc).toMatch(/UPDATE\s+tasks\s+SET\s+title\s*=\s*\?,\s*state\s*=\s*\?\s+WHERE\s+ID\s*=\s*\?\s+AND\s+userID\s*=\s*\?/i);
    });

    test('TC-A01-03: /admin/users is protected by requireLogin and requireAdmin', () => {
      const src = readText(appJs);
      expect(src).toMatch(/app\.get\(\s*['"]\/admin\/users['"]\s*,\s*requireLogin\s*,\s*requireAdmin\s*,/);
      expect(src).toMatch(/function\s+requireAdmin\s*\(/);
      expect(src).toMatch(/req\.session\.user\.roleid\s*!==\s*1/);
      expect(src).toMatch(/res\.status\(403\)\.send\('Access denied'\)/);
    });

    test('TC-A01-04: logout remains state-changing via GET', () => {
      const src = readText(appJs);
      expect(src).toMatch(/app\.get\(\s*['"]\/logout['"]/);
      expect(src).not.toMatch(/app\.post\(\s*['"]\/logout['"]/);
    });

    test('TC-A01-05: POST /savetask has no CSRF middleware protection in app.js', () => {
      const src = readText(appJs);
      expect(src).not.toMatch(/csrf/i);
      expect(src).toMatch(/app\.post\(\s*['"]\/savetask['"]\s*,\s*requireLogin/);
    });

    test('TC-A01-06: authorization is session-based, not based on client role/user cookies', () => {
      const src = readText(appJs);
      expect(src).toMatch(/express-session/);
      expect(src).toMatch(/req\.session\.user/);
      expect(src).not.toMatch(/req\.cookies\.(roleid|userid)/);
    });
  });

  describe('A02 Cryptographic Failures', () => {
    test.skip('TC-A02-01: DOM inspection of the admin user list remains a runtime/browser check', () => {});

    test('TC-A02-02: session cookie secure flag is false', () => {
      const src = readText(appJs);
      expect(src).toMatch(/cookie\s*:\s*\{[\s\S]*secure\s*:\s*false[\s\S]*\}/m);
    });

    test('TC-A02-03: login verifies passwords with bcrypt.compare', () => {
      const src = readText(loginJs);
      expect(src).toMatch(/require\(['"]bcrypt['"]\)/);
      expect(src).toMatch(/bcrypt\.compare\s*\(\s*password\s*,\s*dbUser\.password\s*\)/);
    });

    test('TC-A02-04: docker compose exposes HTTP only and has no 443 mapping', () => {
      const src = readText(composeNode);
      expect(src).toMatch(/"80:3000"/);
      expect(src).not.toMatch(/443\s*:/);
    });

    test('TC-A02-05: header loads CDN scripts without SRI integrity attributes', () => {
      const src = readText(headerJs);
      expect(src).toMatch(/cdnjs\.cloudflare\.com/);
      expect(src).not.toMatch(/integrity\s*=/i);
    });
  });

  describe('A03 Injection', () => {
    test('TC-A03-01: login uses a prepared statement for username lookups', () => {
      const src = readText(loginJs);
      expect(src).toMatch(/SELECT\s+id,\s+username,\s+password\s+FROM\s+users\s+WHERE\s+username\s*=\s*\?/i);
    });

    test('TC-A03-02: /edit validates numeric IDs before querying the database', () => {
      const src = readText(editJs);
      expect(src).toMatch(/taskId\s*=\s*Number\(req\.query\.id\)/);
      expect(src).toMatch(/Number\.isInteger\(taskId\)/);
      expect(src).toMatch(/taskId\s*<=\s*0/);
    });

    test('TC-A03-03: stored XSS is mitigated by escaping task titles in the task list', () => {
      const src = readText(indexJs);
      expect(src).toMatch(/function\s+escapeHtml\s*\(/);
      expect(src).toMatch(/escapeHtml\(task\.title\)/);
    });

    test('TC-A03-04: search returns raw response data, leaving reflected XSS risk', () => {
      const src = readText(searchJs);
      expect(src).toMatch(/return\s+response\.data/);
    });
  });

  describe('A04 Insecure Design', () => {
    test('TC-A04-01: /search trusts client-supplied userid', () => {
      const src = readText(searchJs);
      expect(src).toMatch(/req\.body\.userid/);
      expect(src).not.toMatch(/req\.session\.user\.userid/);
    });

    test('TC-A04-02: /search constructs the provider URL from client input', () => {
      const src = readText(searchJs);
      expect(src).toMatch(/provider\s*=\s*req\.body\.provider/);
      expect(src).toMatch(/let\s+theUrl\s*=\s*'http:\/\/localhost:3000'\s*\+\s*provider/i);
    });
  });

  describe('A05 Security Misconfiguration', () => {
    test('TC-A05-01: app.js shows no helmet usage and no explicit security header setup', () => {
      const src = readText(appJs);
      expect(src).not.toMatch(/helmet\s*\(/i);
      expect(src).not.toMatch(/require\(['"]helmet['"]\)/i);
      expect(src).not.toMatch(/Content-Security-Policy/i);
      expect(src).not.toMatch(/X-Frame-Options/i);
      expect(src).not.toMatch(/X-Content-Type-Options/i);
    });

    test('TC-A05-02: admin/users returns a generic error message', () => {
      const src = readText(adminUsersJs);
      expect(src).toMatch(/Could not load users\./);
    });

    test('TC-A05-03: hardcoded secrets remain in docker compose files', () => {
      const dbSrc = readText(composeDb);
      const nodeSrc = readText(composeNode);
      expect(dbSrc).toMatch(/MARIADB_ROOT_PASSWORD\s*=\s*Some\.Real\.Secr3t/);
      expect(nodeSrc).toMatch(/DB_PASSWORD\s*=\s*Some\.Real\.Secr3t/);
    });
  });

  describe('A06 Vulnerable and Outdated Components', () => {
    test.skip('TC-A06-01: npm audit must be run manually against the other group dependency tree', () => {});

    test('TC-A06-02: package.json still references outdated core dependencies', () => {
      const src = readText(pkgJson);
      expect(src).toMatch(/"express"\s*:\s*"\^4\.17\.1"/);
      expect(src).toMatch(/"mysql2"\s*:\s*"\^2\.3\.0"/);
      expect(src).toMatch(/"express-session"\s*:\s*"\^1\.17\.2"/);
    });
  });

  describe('A07 Identification and Authentication Failures', () => {
    test('TC-A07-01: login form uses POST and a password input field', () => {
      const src = readText(loginJs);
      expect(src).toMatch(/<form[^>]*method="post"[^>]*action="\/login"/i);
      expect(src).toMatch(/<input[^>]*type="password"/i);
    });

    test('TC-A07-02: express-rate-limit is configured globally', () => {
      const src = readText(appJs);
      expect(src).toMatch(/express-rate-limit/);
      expect(src).toMatch(/const\s+limiter\s*=\s*rateLimit\(/);
      expect(src).toMatch(/app\.use\(limiter\)/);
    });

    test.skip('TC-A07-03: cookie flags must be verified on the runtime Set-Cookie header', () => {});
  });

  describe('A08 Software and Data Integrity Failures', () => {
    test('TC-A08-01: savetask validates state against a whitelist', () => {
      const src = readText(saveTaskJs);
      expect(src).toMatch(/const\s+allowedStates\s*=\s*\[[^\]]*'open'[^\]]*'in progress'[^\]]*'done'[^\]]*\]/);
      expect(src).toMatch(/allowedStates\.includes\(state\)/);
    });
  });

  describe('A09 Security Logging and Monitoring Failures', () => {
    test('TC-A09-01: there is no dedicated audit logging, only console logging', () => {
      const appSrc = readText(appJs);
      const loginSrc = readText(loginJs);
      expect(appSrc).not.toMatch(/\baudit\b/i);
      expect(loginSrc).not.toMatch(/\baudit\b/i);
      expect(loginSrc).toMatch(/console\.log/);
    });
  });

  describe('A10 SSRF / availability risks in search flow', () => {
    test('TC-A10-01: search builds a localhost URL from client-controlled provider input', () => {
      const src = readText(searchJs);
      expect(src).toMatch(/http:\/\/localhost:3000'\s*\+\s*provider/);
    });

    test('TC-A10-02: /search contains an artificial sleep(1000)', () => {
      const src = readText(searchJs);
      expect(src).toMatch(/await\s+sleep\(1000\)/);
    });
  });

  describe('Manual protocol entries kept explicit in the suite', () => {
    test.skip('PT-01: verify security headers in browser DevTools', () => {});
    test.skip('PT-02: verify HTTP to HTTPS behavior in a live environment', () => {});
    test.skip('PT-03: perform a manual SQLi login probe', () => {});
    test.skip('PT-04: perform a manual reflected XSS probe in search', () => {});
  });
});
