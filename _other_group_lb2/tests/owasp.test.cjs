const fs = require('fs');
const path = require('path');
const request = require('supertest');

const { OTHER_GROUP_ROOT, requireOtherGroup } = require('./helpers.cjs');

// NOTE:
// We avoid inventing concrete HTTP responses. Where we can run the Express app in-memory,
// we assert on actual status codes and response bodies.
// Where a test depends on DB existing data or external setup, we mark it as pending with explicit reasons.

let app;

beforeAll(() => {
  // app.js of other group does not export app. For Supertest we need an express instance.
  // So we create a minimal express app that mounts the other group server module by requiring it.
  // However, requiring app.js will start listening immediately (side effect).
  // To keep tests deterministic, we won't require app.js directly.
  // Instead we do lightweight static/config tests and only run HTTP tests where possible.
  app = null;
});

describe('OWASP Phase 2 – Other group – static/config-based tests', () => {
  test('TC-A05-03: docker compose contains hardcoded DB passwords (LIKELY_FAIL)', () => {
    const composeDb = fs.readFileSync('/Users/tahssin-val/Downloads/lb2-applikation-main/docker/compose.db.yaml', 'utf8');
    const composeNode = fs.readFileSync('/Users/tahssin-val/Downloads/lb2-applikation-main/docker/compose.node.yaml', 'utf8');

    expect(composeDb).toMatch(/MARIADB_ROOT_PASSWORD\s*=\s*.+/);
    expect(composeDb).toMatch(/Some\.Real\.Secr3t/);
    expect(composeNode).toMatch(/DB_PASSWORD\s*=\s*Some\.Real\.Secr3t/);
  });

  test('TC-A02-04: No HTTPS/TLS termination in compose (LIKELY_FAIL)', () => {
    const composeNode = fs.readFileSync('/Users/tahssin-val/Downloads/lb2-applikation-main/docker/compose.node.yaml', 'utf8');

    // Evidence of plain HTTP exposure: 80:3000 mapping.
    expect(composeNode).toMatch(/"80:3000"/);
    // No explicit TLS indication in compose.
    expect(composeNode).not.toMatch(/443:/);
  });

  test('TC-A06-02: Outdated deps exist in other group package.json (LIKELY_FAIL)', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'package.json'), 'utf8'));

    expect(pkg.dependencies).toBeTruthy();
    expect(pkg.dependencies.express).toBeDefined();
    expect(pkg.dependencies['express-session']).toBeDefined();

    // We don't claim vulnerable CVEs here; this test only proves using older versions.
    expect(pkg.dependencies.express).toBe('^4.17.1');
    expect(pkg.dependencies['express-session']).toBe('^1.17.2');
    expect(pkg.dependencies.mysql2).toBe('^2.3.0');
  });

  test('TC-A08-01: CDN scripts without SRI present in header (LIKELY_FAIL supply-chain)', () => {
    const headerJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'fw', 'header.js'), 'utf8');

    expect(headerJs).toMatch(/cdnjs\.cloudflare\.com\/ajax\/libs\/jquery\/3\.4\.0\/jquery\.min\.js/);
    expect(headerJs).toMatch(/cdnjs\.cloudflare\.com\/ajax\/libs\/jquery-validate\/1\.19\.1\/jquery\.validate\.min\.js/);

    // No integrity attributes in the template.
    expect(headerJs).not.toMatch(/integrity=/i);
  });
});

describe('OWASP Phase 2 – Other group – code-level checks (no network)', () => {
  test('TC-A02-02: session cookie secure flag is false in app.js (LIKELY_FAIL for prod)', () => {
    const appJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'app.js'), 'utf8');
    expect(appJs).toMatch(/secure:\s*false/);
  });

  test('TC-A01-03: admin access control checks roleid === 1 (LIKELY_PASS for RBAC gate)', () => {
    const appJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'app.js'), 'utf8');
    expect(appJs).toMatch(/function\s+requireAdmin\s*\(/);
    expect(appJs).toMatch(/roleid\s*!==\s*1/);
    expect(appJs).toMatch(/res\.status\(403\)\.send\('Access denied'\)/);
  });

  test('TC-A01-02: edit endpoint queries enforce ownership via userID = session user (LIKELY_PASS)', () => {
    const editJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'edit.js'), 'utf8');
    expect(editJs).toMatch(/SELECT\s+ID,\s+title,\s+state\s+FROM\s+tasks\s+WHERE\s+ID\s*=\s*\?\s+AND\s+userID\s*=\s*\?/i);
    expect(editJs).toMatch(/req\.session\.user\.userid/);
  });

  test('TC-A01-02: savetask enforces ownership on update via WHERE ID=? AND userID=? (LIKELY_PASS)', () => {
    const saveJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'savetask.js'), 'utf8');
    expect(saveJs).toMatch(/UPDATE\s+tasks\s+SET\s+title\s*=\s*\?,\s*state\s*=\s*\?\s+WHERE\s+ID\s*=\s*\?\s+AND\s+userID\s*=\s*\?/i);
  });

  test('TC-A01-01: requireLogin redirects unauthenticated users to /login (LIKELY_PASS)', () => {
    const appJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'app.js'), 'utf8');
    expect(appJs).toMatch(/function\s+requireLogin\s*\(/);
    expect(appJs).toMatch(/return\s+res\.redirect\('\/login'\)/);
  });

  test('TC-A01-04: logout is state-changing over GET (LIKELY_FAIL - logout CSRF)', () => {
    const appJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'app.js'), 'utf8');
    expect(appJs).toMatch(/app\.get\('\/logout'/);
    expect(appJs).not.toMatch(/app\.post\('\/logout'/);
  });

  test('TC-A01-05: CSRF protection is missing for POST /savetask (LIKELY_FAIL)', () => {
    const appJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'app.js'), 'utf8');

    // No csrf middleware/token verification referenced.
    expect(appJs).not.toMatch(/csrf/i);
    // Endpoint exists and is POST.
    expect(appJs).toMatch(/app\.post\('\/savetask'/);
  });

  test('TC-A10-01: search constructs internal URL from user-controlled provider/userid/terms (LIKELY_FAIL SSRF-like)', () => {
    const searchJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'search.js'), 'utf8');
    expect(searchJs).toMatch(/let\s+theUrl\s*=\s*'http:\/\/localhost:3000'\s*\+\s*provider/i);
    expect(searchJs).toMatch(/provider\s*=\s*req\.body\.provider/);
    expect(searchJs).toMatch(/userid\s*=\s*req\.body\.userid/);
  });

  test('TC-A04-02: DoS risk - artificial sleep(1000) in search (LIKELY_FAIL availability)', () => {
    const searchJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'search.js'), 'utf8');
    expect(searchJs).toMatch(/await\s+sleep\(1000\)/);
  });

  test('TC-A05-01: no explicit security headers middleware present in app.js (LIKELY_FAIL)', () => {
    const appJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'app.js'), 'utf8');
    expect(appJs).not.toMatch(/helmet/i);
    expect(appJs).not.toMatch(/Content-Security-Policy/i);
    expect(appJs).not.toMatch(/X-Frame-Options/i);
  });

  test('TC-A03-01: WAF blocks common SQLi token patterns (LIKELY_BLOCKED for some payloads)', () => {
    const wafJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'fw', 'waf.js'), 'utf8');
  // Check for the presence of the SQLi keyword regex in code (escaped as source text).
  expect(wafJs).toMatch(/union\\s\+select/i);
  expect(wafJs).toMatch(/\(\\%27\)\|\(\\'\)\|\(\\-\\-\)/i);
    expect(wafJs).toMatch(/res\.status\(403\)\.send\('Request blocked by WAF'\)/);
  });

  test('TC-A07-01: login form uses POST and password input type=password (LIKELY_PASS)', () => {
    // Static check to avoid loading native bcrypt bindings from the other group's node_modules.
    const loginJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'login.js'), 'utf8');
    expect(loginJs).toMatch(/<form[^>]*method=\"post\"/i);
    expect(loginJs).toMatch(/<input[^>]*type=\"password\"/i);
  });

  test('TC-A10-02: /search has artificial sleep(1000) (LIKELY_FAIL DoS)', () => {
    const searchJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'search.js'), 'utf8');
    expect(searchJs).toMatch(/await\s+sleep\(1000\)/);
  });

  test('TC-A10-01: /search builds localhost URL from provider (SSRF-like self-call) (LIKELY_FAIL)', () => {
    const searchJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'search.js'), 'utf8');
    expect(searchJs).toMatch(/http:\/\/localhost:3000'\s*\+\s*provider/);
  });

  test('TC-A01-02: edit uses ownership check in SQL (LIKELY_PASS)', () => {
    const editJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'edit.js'), 'utf8');
    expect(editJs).toMatch(/WHERE\s+ID\s*=\s*\?\s+AND\s+userID\s*=\s*\?/i);
  });

  test('TC-A05-01: no helmet() / no explicit security headers in app.js (LIKELY_FAIL)', () => {
    const appJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'app.js'), 'utf8');
    expect(appJs).not.toMatch(/helmet\(/);
    expect(appJs).not.toMatch(/Content-Security-Policy/i);
    expect(appJs).not.toMatch(/X-Frame-Options/i);
    expect(appJs).not.toMatch(/X-Content-Type-Options/i);
  });

  test('TC-A07-03: logout is implemented as GET (LIKELY_FAIL)', () => {
    const appJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'app.js'), 'utf8');
    expect(appJs).toMatch(/app\.get\('\/logout'/);
  });

  test('TC-A04-01: /search requires client-supplied userid (trust client input) (LIKELY_FAIL)', () => {
    const searchJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'search.js'), 'utf8');
    expect(searchJs).toMatch(/req\.body\.userid/);
  });

  test('TC-A05-02: admin/users returns generic error message on failure (LIKELY_PASS)', () => {
    const adminUsersJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'admin/users.js'), 'utf8');
    expect(adminUsersJs).toMatch(/Could not load users\./);
  });

  test('WAF present: waf middleware blocks common XSS/SQLi patterns (defense-in-depth)', () => {
    const wafJs = fs.readFileSync(path.join(OTHER_GROUP_ROOT, 'fw/waf.js'), 'utf8');
    expect(wafJs).toMatch(/Request blocked by WAF/);
  // Match the actual pattern definition (regex literal contains escaped sequences)
  expect(wafJs).toMatch(/union\\s\+select/);
    expect(wafJs).toMatch(/<script/);
  });
});

// Optional HTTP-path tests would require an exported app (or refactor) and DB seed.
// We intentionally do not start the server here.
