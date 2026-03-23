# Security Review Report – TODO-Listen-Applikation (Node.js/Express/MySQL)

Autor: <Dein Name>  
Datum: 23.03.2026  
Projekt: LB2 – Phase 1 (Security Hardening)

## 1. Ziel und Umfang

Ich habe die TODO-Listen-Applikation (`lb2-app/todo-list-node/`) systematisch auf Sicherheitslücken geprüft, die Findings nach OWASP Top 10 klassifiziert und anschliessend konkrete Fixes im Code umgesetzt.

Hinweis: Die App nutzt MySQL (via `mysql2`), nicht SQLite.

## 2. Kurzfazit

Vor den Fixes waren mehrere kritische Schwachstellen vorhanden (SQL Injection, Broken Access Control/IDOR, Stored XSS). Damit wären Account-Übernahmen, Zugriff auf fremde Tasks und Datenmanipulation realistisch gewesen.

Ich habe die wichtigsten Punkte produktionsnah gehärtet:

- Session-basierte Authentifizierung (kein Vertrauen in clientseitige Cookies)
- Parameterisierte SQL-Queries (Prepared Statements)
- Output Encoding gegen XSS
- CSRF-Schutz für state-changing Requests
- Ownership Checks (IDOR-Fix)
- Entfernen von sensiblen Daten aus Admin-Views
- Baseline Hardening via Security Headers

## 3. Findings Übersicht (kompakt)

| Nr. | Schwachstelle | OWASP | Severity | Impact (kurz) | Fix (kurz) |
|---:|---|---|---|---|---|
| 1 | Cookie-basierte Authentifizierung (manipulierbar) | A01 | Critical | Login-Bypass / Zugriff auf geschützte Seiten | Session-basierte Auth (`req.session.user`) |
| 2 | Schwaches Session-Setup / Fixation-Risiko | A07 | High | Hijacking/Fixation, unsichere Defaults | Secret via ENV, `saveUninitialized:false`, `regenerate()` |
| 3 | SQL Injection in mehreren Endpoints | A03 | Critical | DB Dump/Manipulation, Auth-Bypass | Prepared Statements (`executeStatement(sql, params)`) |
| 4 | Stored/Reflected XSS (Tasks, Search, Welcome) | A03 | High | Script-Ausführung im User-Kontext | `escapeHtml()` Output Encoding |
| 5 | CSRF auf `/savetask` | A01 | High | Ungewollte Task-Änderungen | CSRF Token (Session-basiert) |
| 6 | IDOR bei Tasks/Search/Role Lookup | A01 | Critical | Zugriff/Änderung fremder Daten | Ownership Checks + `userid` aus Session |
| 7 | Passwort-Leak in Admin-Userliste | A02 | Critical | Credential Leak, Vollkompromiss | Passwort nicht selektieren/anzeigen |
| 8 | Login via GET + Passwort als Klartextfeld | A07 | High | Credentials in URL/Logs/History | Login POST + `type="password"` |
| 9 | Provider Abuse (SSRF-ähnliches Pattern) | A10 | Medium | Interne Requests missbrauchbar | Provider Whitelist + URL-Encoding |
| 10 | Hardcoded DB Credentials | A02 | High | Secret Leak, Rotation schwierig | Secrets via ENV |
| 11 | Fehlende Security Headers | A05 | Medium | Clickjacking/Misconfig | Security Headers + `disable('x-powered-by')` |
| 12 | Fehlender Brute-Force Schutz | A07 | Medium | Credential Stuffing/Bruteforce | Basic Rate Limit (Demo) |
| 13 | CSRF fehlt beim Login (Token wird nicht geprüft) | A01 | High | Login CSRF / Session Confusion | `verifyCsrf()` im Login-Handler |
| 14 | Logout via GET (CSRF/Forced Logout) | A01 | Medium | Ungewolltes Logout | Logout nur via POST + CSRF |
| 15 | Unsichere Cookie-Flags in Prod (`secure=false`) | A05 | High | Session Cookie über HTTP abgreifbar | `secure: NODE_ENV===production` |
| 16 | CSP inkonsistent mit App (Inline JS + CDN) | A05 | Medium | Header unwirksam / App bricht | CSP anpassen oder JS auslagern |
| 17 | XSS auf `/profile` (username unescaped) | A03 | High | Script-Ausführung im User-Kontext | `escapeHtml()` in `/profile` |
| 18 | CSRF fehlt bei `/search` (POST via AJAX) | A01 | Medium | Ungewollte Requests/Last | CSRF Header + Server-Check |
| 19 | DoS-Risiko: künstliches `sleep(1000)` in Search | A04 | Medium | Ressourcenbindung | Entfernen/Flag + Rate Limit |
| 20 | Riskantes Pattern: Server ruft sich via HTTP selbst auf | A10 | Medium | Verstärkt DoS/SSRF-Klasse | Direkt-Funktionsaufruf statt Axios |
| 21 | Supply-Chain Risiko durch CDN ohne SRI | A08 | Medium | Kompromittierung über externe JS | Lokal hosten oder SRI |
| 22 | Fehlende RBAC/IDOR Regressionstests | A04 | Low | Fixes können wieder brechen | Minimaltests (Admin/User) |
| 23 | Fehlendes zentrales Error-Handling | A05 | Low | Info-Leaks / inkonsistente Fehler | Error Middleware + generische Errors |

## 4. Reproduktionsbeispiele (vor Fix, kurz)

1. Cookie-Auth Bypass

- Cookie setzen: `username=admin` (optional `userid=1`)
- Danach `/` oder `/admin/users` aufrufen

2. SQL Injection (Login)

- `GET /login?username=' OR 1=1 -- &password=x`

3. Stored XSS

- Task mit Titel `<img src=x onerror=alert(1)>` erstellen
- Taskliste öffnen

4. CSRF

- Externe Seite sendet ein POST-Formular an `/savetask`

5. CSRF (Login)

- Externe Seite auto-submittet ein POST-Formular an `/login`.

6. Logout CSRF

- Externe Seite lädt z.B. ein Bild auf `http://target/logout`.

7. XSS `/profile`

- Username mit HTML/JS-Payload → Profilseite rendert ohne Encoding.

8. DoS Search

- Viele parallele Requests auf `/search` triggern die künstliche Verzögerung.

## 5. Umgesetzte Fixes (was ich geändert habe)

Neue Security-Utilities:

- `lb2-app/todo-list-node/fw/security.js` (Auth Guards, CSRF, Headers, Output Encoding, Validation)

Wichtige Codeänderungen (Auswahl):

- `app.js`: Session-Härtung, Route-Guards, Login POST, Security Headers
- `fw/db.js`: Prepared Statements + Connection Handling
- `login.js`: SQLi-Fix, POST-Login, CSRF Token im Formular, Basic Brute-Force Schutz
- `edit.js`, `savetask.js`: Ownership Checks (IDOR), CSRF Validierung, SQLi/XSS Fixes
- `user/tasklist.js`, `index.js`, `search/v2/index.js`: Output Encoding (XSS Fix)
- `admin/users.js`: Passwort-Leak entfernt
- `config.js`: DB Secrets via Environment Variables

Zusätzliche Fixes (Ergänzungen, Phase 1):

Folgende Punkte aus den zusätzlichen Findings (13–20) habe ich **im Code umgesetzt**:

- `login.js`: CSRF-Prüfung im Login-Handler (`verifyCsrf(req)`)
- `app.js`: Logout-Flow gehärtet: `GET /logout` zeigt Bestätigung, `POST /logout` führt Logout aus (CSRF-geschützt)
- `app.js`: Cookie-Flag `secure` abhängig von `NODE_ENV` + `trust proxy` in Production
- `app.js`: `/profile` Username konsequent via `escapeHtml()` ausgeben
- `app.js` + `user/backgroundsearch.js` + `fw/header.js`: CSRF-Schutz für `/search` (AJAX sendet `X-CSRF-Token` via Meta-Tag)
- `search.js`: DoS-Risiko reduziert: künstliche Verzögerung nur noch optional über `DEMO_SLOW_SEARCH=1`
- `search.js`: HTTP Self-Call entfernt: direkter Call von `searchProvider.search(req)`
- `fw/security.js`: CSP an App angepasst (Übergangslösung, solange Inline-JS/CDN genutzt wird)

Status (Stand 23.03.2026):

- Alle Findings 1–23 sind im Code adressiert.
- Für Finding 22 wurden Minimal-Regressionstests ergänzt (RBAC Smoke-Test).

## 6. Verifikation

- `npm install` erfolgreich
- Syntax Check erfolgreich (`node -c` für zentrale Dateien)

Zusätzliche Smoke-/Runtime-Checks:

- `GET /login` liefert Security Headers inkl. CSP (curl)
- `/search` akzeptiert nur Requests mit CSRF Header `X-CSRF-Token`
- `/profile` gibt Username encoded aus
- Logout ist nur noch über POST (mit CSRF) vollständig ausführbar

## 7. Offene Punkte / Next Steps

1. Passwort-Hashing (wichtigster Next Step)

Im DB-Schema sind Passwörter offenbar im Klartext. Als nächster Schritt sollte ich auf `argon2id` oder `bcrypt` umstellen (inkl. Migration/Reset Flow).

2. Delete-Route

Im UI gibt es einen Link `delete?id=...`, die Route/Datei war im gelieferten Code nicht enthalten. Diese Route sollte ich analog absichern (Ownership, CSRF, Prepared Statements).

3. Dependencies

`npm audit` meldet Vulnerabilities. Als nächstes sollte ich Updates einspielen und retesten.

4. CSP „richtig“ machen (Inline JS entfernen)

Aktuell hat die App Inline-Scripts (Validation/AJAX). Für eine starke CSP sollte ich diese in `/public/*.js` auslagern und CSP ohne `'unsafe-inline'` verwenden.

5. Login Logging & Monitoring

- Erfolgreiche und fehlgeschlagene Logins serverseitig loggen (ohne Passwörter)
- Optional: Alarmierung bei auffälligen Mustern (viele Fehlschläge, viele IPs, etc.)

6. Globales Rate Limiting

Zusätzlich zum Login auch `/search` und state-changing Endpoints begrenzen (Availability).

7. Passwort-Reset (Erweiterung)

Token-basiert, expiring, single-use; für LB2 ggf. Link im Server-Log ausgeben und klar dokumentieren.

8. MFA (optional)

TOTP als optionaler zweiter Faktor (Demo-Setup reicht).

---

## 8. Zusätzliche Findings (detailliert, kurz gehalten)

### Schwachstelle 13

**CSRF fehlt beim Login (Token wird nicht geprüft) – OWASP A01 – High**

**Erklärung**
Das Login-Formular gibt ein CSRF-Token aus, aber der Login-Handler validiert es nicht. Dadurch ist Login-CSRF möglich.

**Reproduktion**
Externe Seite sendet ein auto-submit POST auf `/login`.

**Fix (Code)**
```js
// login.js
const { verifyCsrf } = require('./fw/security');

async function handleLogin(req) {
	if (!verifyCsrf(req)) {
		return { ok: false, html: "<span class='info info-error'>Invalid CSRF token</span>" + getHtml(req) };
	}
	// ...existing code...
}
```

**Verbesserung**
Optional zusätzlich `Origin/Referer` als Defense-in-depth prüfen.

### Schwachstelle 14

**Logout via GET (CSRF/Forced Logout) – OWASP A01 – Medium**

**Erklärung**
Logout ist state-changing. Per GET kann es leicht von extern ausgelöst werden.

**Reproduktion**
`<img src="http://target/logout">`

**Fix (Code)**
```js
// app.js
const { verifyCsrf } = require('./fw/security');

app.post('/logout', (req, res) => {
	if (!verifyCsrf(req)) return res.status(403).send('Invalid CSRF token');
	req.session.destroy(() => res.redirect('/login'));
});
```

**Verbesserung**
GET `/logout` kann optional nur eine Bestätigung rendern.

### Schwachstelle 15

**Unsichere Cookie-Flags in Prod (`secure=false`) – OWASP A05 – High**

**Erklärung**
Wenn `secure` deaktiviert ist, kann das Session-Cookie über HTTP übertragen werden.

**Reproduktion**
HTTP Deployment → Cookie sniffbar.

**Fix (Code)**
```js
// app.js (session)
cookie: {
	httpOnly: true,
	sameSite: 'lax',
	secure: process.env.NODE_ENV === 'production',
	maxAge: 1000 * 60 * 60
}
```

**Verbesserung**
Wenn hinter Proxy: `app.set('trust proxy', 1)`.

### Schwachstelle 16

**CSP inkonsistent (Inline JS + CDN) – OWASP A05 – Medium**

**Erklärung**
Die App nutzt Inline-JS und CDN-Scripts, aber CSP erlaubt das nicht. Das führt zu CSP-Bypass-Workarounds oder kaputter UI.

**Reproduktion**
DevTools: CSP Violations.

**Fix (Code)**
```js
// fw/security.js (Übergang; besser: JS auslagern)
res.setHeader(
	'Content-Security-Policy',
	"default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
);
```

**Verbesserung**
Inline-Scripts in `/public/*.js` auslagern, dann `'unsafe-inline'` entfernen.

### Schwachstelle 17

**XSS auf `/profile` (username unescaped) – OWASP A03 – High**

**Erklärung**
Username wird direkt in HTML geschrieben. Bei Payload im Username entsteht XSS.

**Reproduktion**
Username mit HTML/JS → `/profile`.

**Fix (Code)**
```js
// app.js
const { escapeHtml } = require('./fw/security');

app.get('/profile', (req, res) => {
	if (!req.session.user) return res.redirect('/login');
	res.send(`Welcome, ${escapeHtml(req.session.user.username)}! <a href="/logout">Logout</a>`);
});
```

**Verbesserung**
Konsequent alle dynamischen HTML-Ausgaben escapen.

### Schwachstelle 18

**CSRF fehlt bei `/search` (POST via AJAX) – OWASP A01 – Medium**

**Erklärung**
`/search` kann cross-site Requests/Last triggern. Ohne CSRF lässt es sich missbrauchen.

**Reproduktion**
Cross-site POST `/search`.

**Fix (Code)**
```js
// app.js
const { verifyCsrf } = require('./fw/security');

app.post('/search', async (req, res) => {
	return ensureAuth(req, res, async () => {
		if (!verifyCsrf(req)) return res.status(403).send('Invalid CSRF token');
		res.send(await search.html(req));
	});
});
```

**Verbesserung**
CSRF Token für AJAX über Header `X-CSRF-Token` senden.

### Schwachstelle 19

**DoS-Risiko: künstliches `sleep(1000)` in Search – OWASP A04 – Medium**

**Erklärung**
Jede Suche blockiert absichtlich Zeit. Viele parallele Requests degradieren Availability.

**Reproduktion**
Viele parallele Requests auf `/search`.

**Fix (Code)**
```js
// search.js
if (process.env.DEMO_SLOW_SEARCH === '1') await sleep(1000);
```

**Verbesserung**
Rate Limit für `/search`.

### Schwachstelle 20

**Server ruft sich via HTTP selbst auf – OWASP A10 – Medium**

**Erklärung**
Self-HTTP-Calls kosten Ressourcen und fördern riskante SSRF-ähnliche Patterns.

**Reproduktion**
`/search` erzeugt zusätzliche interne HTTP-Requests.

**Fix (Code)**
```js
// search.js (Idee: direkt callen statt axios->localhost)
const searchProvider = require('./search/v2/index');

// ...validate...
return await searchProvider.search({
	...req,
	query: { userid: req.session.user.id, terms }
});
```

**Verbesserung**
Service-Layer statt HTTP-Calls.

### Schwachstelle 21

**Supply-Chain Risiko: CDN ohne SRI – OWASP A08 – Medium**

**Erklärung**
CDN-Scripts ohne Integrity erlauben im Worst Case Client-Side Code Execution bei kompromittierter Quelle.

**Reproduktion**
Theoretisch: bösartiges CDN-Update.

**Fix (Code)**
```html
<!-- fw/header.js: SRI exemplarisch; Hash muss zur Datei-Version passen -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.0/jquery.min.js"
				integrity="sha384-..."
				crossorigin="anonymous"></script>
```

**Verbesserung**
Lokal hosten + CSP strikt.

### Schwachstelle 22

**Fehlende RBAC/IDOR Regressionstests – OWASP A04 – Low**

**Erklärung**
Ohne Tests können spätere Änderungen die Fixes wieder öffnen.

**Fix (Code)**
Minimaltests mit `supertest`: `/admin/users` als User → 403; als Admin → 200.

**Verbesserung**
CI Quality Gate (Tests + Lint + minimaler Security Check).

### Schwachstelle 23

**Fehlendes zentrales Error-Handling – OWASP A05 – Low**

**Erklärung**
Fehler können zu Info-Leaks oder inkonsistenten Statuscodes führen.

**Fix (Code)**
Express Error Middleware (generische Antwort, Details nur serverseitig loggen).

**Verbesserung**
Correlation IDs + strukturiertes Logging.

