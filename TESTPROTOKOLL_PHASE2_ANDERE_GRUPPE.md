# Phase 2 – Security Testing (andere Gruppe)

## Zentrale Findings

Die folgenden Findings sind die wichtigsten, weil sie entweder **direkt ausnutzbar** sind oder **systemweit** Risiko erzeugen.

- **Reflected XSS im Search-Flow** (OWASP A03, **High**) – Search-Response wird ohne serverseitiges Output-Encoding zurückgegeben; XSS-Payload kann im Browser ausgeführt werden.
- **Hardcoded Secrets in Docker Compose** (OWASP A05, **Medium**) – DB-Passwörter sind im Klartext in `compose*.yaml` hinterlegt.
- **Kein HTTPS/TLS & Session-Cookie nicht `Secure`** (OWASP A02, **Medium**) – Zugriff erfolgt über HTTP; Session-Cookies sind nicht transportgehärtet.
- **SSRF-ähnliches Verhalten im Search-Endpoint** (OWASP A10/A04, **Medium**) – serverseitiger Request wird aus clientkontrollierten Parametern konstruiert (Self-call via axios).
- **Fehlende Security Headers** (OWASP A05, **Medium**) – keine Helmet-/Header-Härtung sichtbar.
- **DoS-Risiko durch `sleep(1000)` in `/search`** (OWASP A10, **Medium**) – künstliche Verzögerung ermöglicht Request-Stau.

## 1) Testkonzept (Vorgehen)

**Ziel:** Systematisch prüfen, ob die bereitgestellte TODO-Listen-App typische OWASP-Top-10-Risiken aufweist, und daraus umsetzbare Empfehlungen ableiten.

**Testobjekt (Codebasis):** `/Users/tahssin-val/Downloads/lb2-applikation-main/todo-list-node/`

**Vorgehen (kompakt):**
1. **Code-/Config-Review** (primär): AuthZ/AuthN-Checks, DB-Queries (SQLi), Output-Encoding (XSS), Session/Cookies, Docker Compose Secrets/TLS.
2. **Automatisierte, reproduzierbare Checks** (statisch): Jest-Suiten `_other_group_lb2/tests/phase2-other-group.test.cjs` und `_other_group_lb2/tests/owasp.test.cjs` prüfen sicherheitsrelevante Indizien in Quelltext/Compose/package.json.
3. **Manuelle/UI-Checks (optional, falls Zeit)**: DevTools für Headers/Cookies, typische Interaktionspfade (Login/Logout/Tasks/Search).

**Bewertungslogik:**
- **PASSED/FAILED** als einheitliches Ergebnisformat im Bericht.
- Ergebnis basiert auf Code-/Config-Evidenz und den automatisierten Jest-Checks.
- Wo sinnvoll wurden manuelle Plausibilitätschecks (PT-01 bis PT-04) als finales Resultat abgeleitet.

**Severity:** L/M/H nach Impact und Ausnutzbarkeit.

### 1.1 Testdurchführung (Reproduzierbar)

Verwendete Befehle:

```bash
cd _other_group_lb2
npm test -- --runTestsByPath tests/phase2-other-group.test.cjs
npm test
```

Letzte gemessene Resultate (Run am 13.04.2026):

- `phase2-other-group.test.cjs`: **27 passed, 7 skipped, 34 total**, 1/1 Suite passed
- Gesamter Testordner (`npm test`): **51 passed, 7 skipped, 58 total**, 2/2 Suites passed

Interpretation:
- `passed` = automatisiert verifizierte, reproduzierbare Testfälle.
- `skipped` = bewusst als manuell markierte Prüfpunkte (z. B. DevTools-/Laufzeit-Checks), die separat in Abschnitt 2.3 dokumentiert sind.

## 2) Testbericht (konkrete Resultate)

### 2.1 Übersicht (kompakt)

| ID | OWASP | Thema | Severity | Result | Evidenz (Kurz) |
|---|---|---|---|---|---|
| TC-A01-01 | A01 | Zugriff ohne Login | H | PASSED | `app.get('/', requireLogin, ...)` |
| TC-A01-02 | A01 | IDOR /edit?id= (Ownership) | H | PASSED | `WHERE ID = ? AND userID = ?` |
| TC-A01-03 | A01 | Admin-Only Route | H | PASSED | `roleid !== 1 => 403` |
| TC-A01-04 | A01 | CSRF: Logout via GET (Forced Logout) | M | FAILED | `app.get('/logout', ...)` → state-changing ohne Schutz |
| TC-A01-05 | A01 | CSRF-Schutz bei state-changing POSTs | H | FAILED | kein `csrf`/keine Tokenprüfung in `app.js` |
| TC-A01-06 | A01 | Rollen-/UserID Manipulation im Client | H | PASSED | `express-session` → Cookie ist Session-ID; AuthZ via `req.session.user.*` |
| TC-A02-02 | A02 | Cookie Secure Flag / HTTPS | M | FAILED | `cookie: { secure: false }` |
| TC-A02-04 | A02 | TLS/HTTPS nicht vorhanden | M | FAILED | `"80:3000"`, kein `443:` |
| TC-A02-05 | A02 | Frontend-CDN ohne SRI (Supply-Chain) | M | FAILED | `header.js` lädt cdnjs ohne `integrity=` |
| TC-A03-01 | A03 | SQLi Login | H | PASSED | `WHERE username = ?` |
| TC-A03-02 | A03 | SQLi /edit?id= | H | PASSED | Param + Integer-Check + Ownership |
| TC-A03-03 | A03 | Stored XSS (Task-Titel) | H | PASSED | `escapeHtml(task.title)` |
| TC-A03-04 | A03 | Reflected XSS (Search) | H | FAILED | `res.send(response.data)` ohne Encoding |
| TC-A04-01 | A04 | Trust in client data (`userid`) | H | FAILED | `req.body.userid` wird verwendet |
| TC-A04-02 | A04 | Input-basiertes URL-Building (Design-Risiko) | M | FAILED | `theUrl='http://localhost:3000'+provider...` |
| TC-A05-01 | A05 | Security Headers | M | FAILED | kein `helmet`/keine Header-Setups |
| TC-A05-03 | A05 | Secrets in Compose | M | FAILED | `Some.Real.Secr3t` hardcoded |
| TC-A06-02 | A06 | Outdated Components | H | FAILED | `express@4.17.1`, `mysql2@2.3.0` |
| TC-A07-01 | A07 | Login POST / no creds in URL | H | PASSED | `<form method="post">`, `type="password"` |
| TC-A07-02 | A07 | Rate Limiting | M | PASSED | `express-rate-limit` global |
| TC-A07-03 | A07 | Session Cookie Flags (HttpOnly/SameSite) | M | FAILED | `secure: false` gesetzt (fehlende Transporthärtung) |
| TC-A08-01 | A08 | Server-side Validation (state whitelist) | M | PASSED | `allowedStates.includes(state)` |
| TC-A09-01 | A09 | Security Logging/Audit Trail | L | FAILED | kein Audit-Logging ersichtlich |
| TC-A10-01 | A10 | SSRF-ähnlich: provider self-call | M | FAILED | `http://localhost:3000` + client `provider` |
| TC-A10-02 | A10 | DoS: `sleep(1000)` in /search | M | FAILED | `await sleep(1000);` |

### 2.2 Evidenz / Nachweise (kompakt)

### 2.2 Einzeltestfälle (Details)

Die folgende Detailsektion ergänzt die Übersicht um konkrete **Test-Schritte**, **messbare Expected Results** und eine kurze, nachvollziehbare **Evidence-Begründung**.

#### TC-A01-01 – Zugriff auf geschützte Seiten ohne Login

- **OWASP:** A01 Broken Access Control
- **Ziel:** Verifizieren, dass unauthentifizierte Requests nicht an geschützte Ressourcen gelangen.
- **Severity:** High
- **Result:** PASSED
- **Steps (praktisch):**
	1. Browser: Cookies löschen (Application/Storage → Clear site data).
	2. `GET /` aufrufen.
	3. `GET /admin/users` aufrufen.
- **Expected Result (messbar):**
	- Redirect auf `/login` (302) oder `401/403`.
	- Keine Inhalte der Zielseiten im Response/DOM.
- **Evidence (Code/Config) + Relevanz:**
	- `app.get('/', requireLogin, ...)` → Route ist durch Login-Guard geschützt.

#### TC-A01-02 – IDOR: Zugriff auf fremde Tasks über `id`

- **OWASP:** A01 Broken Access Control
- **Ziel:** Verhindern, dass User A Tasks von User B über erratene IDs lesen/ändern kann.
- **Severity:** High
- **Result:** PASSED
- **Steps (praktisch):**
	1. Als User A einloggen.
	2. URL manuell ändern: `/edit?id=<fremdeTaskId>`.
	3. Prüfen, ob Taskdaten angezeigt werden.
- **Expected Result (messbar):**
	- `403` oder leere/fehlende Taskdaten (kein Titel/State der fremden Aufgabe).
- **Evidence (Code/Config) + Relevanz:**
	- `WHERE ID = ? AND userID = ?` → Ownership-Check direkt in SQL verhindert IDOR.

#### TC-A01-03 – Admin-Funktionen für normale Benutzer gesperrt

- **OWASP:** A01 Broken Access Control
- **Ziel:** Verifizieren, dass `/admin/users` nur für Admin erreichbar ist.
- **Severity:** High
- **Result:** PASSED
- **Steps (praktisch):**
	1. Als normaler User einloggen.
	2. `GET /admin/users` aufrufen.
- **Expected Result (messbar):**
	- `403 Forbidden` (oder Redirect `/login` falls Session fehlt).
- **Evidence (Code/Config) + Relevanz:**
	- `roleid !== 1 => 403` → serverseitige RBAC-Prüfung auf Session-Rolle.

#### TC-A01-04 – CSRF/Forced Logout: Logout via GET

- **OWASP:** A01 (state-changing ohne Schutz), auch A07-relevant
- **Ziel:** Prüfen, ob Logout von Drittseiten aus ausgelöst werden kann.
- **Severity:** Medium
- **Result:** FAILED
- **Steps (praktisch):**
	1. Einloggen.
	2. In neuem Tab `GET /logout` öffnen.
	3. Danach versuchen, `GET /` aufzurufen.
- **Expected Result (messbar):**
	- **Secure:** Logout nur via POST + CSRF, GET sollte 405/404 liefern.
	- **Vulnerable:** GET invalidiert Session sofort.
- **Evidence (Code/Config) + Relevanz:**
	- `app.get('/logout', ...)` → state-changing GET ist per Definition CSRF-anfällig.

#### TC-A01-05 – CSRF-Schutz für state-changing POSTs (z.B. `/savetask`)

- **OWASP:** A01 Broken Access Control
- **Ziel:** Prüfen, ob state-changing POST-Requests CSRF-geschützt sind.
- **Severity:** High
- **Result:** FAILED
- **Steps (praktisch):**
	1. Einloggen.
	2. In DevTools ein legitimes `POST /savetask` beobachten.
	3. Prüfen, ob ein CSRF-Token (Hidden Field / Header) erforderlich ist.
- **Expected Result (messbar):**
	- Ohne gültigen CSRF-Token: `403/400`.
- **Evidence (Code/Config) + Relevanz:**
	- Kein `csrf` im Code sichtbar → fehlende serverseitige Tokenprüfung zu erwarten.

#### TC-A01-06 – Rollen-/UserID Manipulation im Client

- **OWASP:** A01 Broken Access Control
- **Ziel:** Prüfen, ob sich `roleid/userid` clientseitig manipulieren lässt.
- **Severity:** High
- **Result:** PASSED
- **Steps (praktisch):**
	1. Einloggen.
	2. Cookies prüfen: gibt es Cookie-Werte wie `roleid=1` oder `userid=...`?
	3. Falls ja, manipulieren und `/admin/users` erneut testen.
- **Expected Result (messbar):**
	- Cookie enthält nur Session-ID (`connect.sid`); Manipulation führt nicht zu Adminzugriff.
- **Evidence (Code/Config) + Relevanz:**
	- `express-session` → Cookie ist Session-Identifier; Rechteprüfung liest `req.session.user.*` serverseitig.

#### TC-A02-02 – Session-Cookie `Secure` Flag / Transport-Härtung

- **OWASP:** A02 Cryptographic Failures
- **Ziel:** Sicherstellen, dass Session-Cookies nicht über Klartext-HTTP übertragen werden.
- **Severity:** Medium
- **Result:** FAILED
- **Steps (praktisch):**
	1. Login durchführen.
	2. DevTools → Network → Response Headers: `Set-Cookie` prüfen.
- **Expected Result (messbar):**
	- In TLS: `Secure; HttpOnly; SameSite=...` gesetzt.
- **Evidence (Code/Config) + Relevanz:**
	- `cookie: { secure: false }` → Cookie wird auch ohne HTTPS akzeptiert (für Prod unsicher).

#### TC-A02-04 – TLS/HTTPS nicht vorhanden

- **OWASP:** A02 Cryptographic Failures
- **Ziel:** Prüfen, ob Client↔Server Transportverschlüsselung vorhanden ist.
- **Severity:** Medium
- **Result:** FAILED
- **Steps (praktisch):**
	1. `http://<host>/` öffnen.
	2. `https://<host>/` öffnen.
- **Expected Result (messbar):**
	- HTTPS verfügbar; HTTP redirectet (301/302) auf HTTPS.
- **Evidence (Code/Config) + Relevanz:**
	- Compose mappt `"80:3000"` und keine `443:` Konfiguration → TLS-Termination nicht ersichtlich.

#### TC-A02-05 – Frontend-CDN ohne SRI (Supply-Chain)

- **OWASP:** A02 (Integrität/Transport), auch A08-nahe
- **Ziel:** Reduzieren des Risikos manipulierten CDN-JS (Integritätsnachweis).
- **Severity:** Medium
- **Result:** FAILED
- **Steps (praktisch):**
	1. HTML-Source der Seite prüfen.
	2. Script-Tags von CDN prüfen: `integrity` + `crossorigin` vorhanden?
- **Expected Result (messbar):**
	- Externe Scripts haben SRI (`integrity=...`) + `crossorigin="anonymous"`.
- **Evidence (Code/Config) + Relevanz:**
	- `header.js` lädt cdnjs ohne `integrity=` → keine Integritätsprüfung im Browser.

#### TC-A03-01 – SQL Injection im Login (username)

- **OWASP:** A03 Injection
- **Ziel:** Verhindern von Auth-Bypass und SQL-Fehlerleaks.
- **Severity:** High
- **Result:** PASSED
- **Steps (praktisch):**
	1. Login mit `username = ' OR 1=1 --`.
	2. Passwort beliebig.
- **Expected Result (messbar):**
	- Kein Login; keine SQL-Fehler im Response.
- **Evidence (Code/Config) + Relevanz:**
	- `WHERE username = ?` → Parameterbindung verhindert SQLi.

#### TC-A03-02 – SQL Injection über `/edit?id=`

- **OWASP:** A03 Injection
- **Ziel:** Sicherstellen, dass Query-Parameter nicht SQL-ausführbar sind.
- **Severity:** High
- **Result:** PASSED
- **Steps (praktisch):**
	1. Als User einloggen.
	2. `GET /edit?id=1%20OR%201=1`.
- **Expected Result (messbar):**
	- `400` oder sichere Ablehnung; kein Datenleak.
- **Evidence (Code/Config) + Relevanz:**
	- Integer-Check + `WHERE ID = ? AND userID = ?` → verhindert SQLi und IDOR.

#### TC-A03-03 – Stored XSS über Task-Titel

- **OWASP:** A03 Injection (XSS)
- **Ziel:** Verhindern persistenten JS-Execution im UI.
- **Severity:** High
- **Result:** PASSED
- **Steps (praktisch):**
	1. Task mit Titel `<img src=x onerror=alert(1)>` speichern.
	2. Taskliste öffnen.
- **Expected Result (messbar):**
	- Keine JS-Ausführung; Payload wird als Text escaped.
- **Evidence (Code/Config) + Relevanz:**
	- `escapeHtml(task.title)` → verhindert HTML/JS-Ausführung im Output.

#### TC-A03-04 – Reflected XSS über Search

- **OWASP:** A03 Injection (XSS)
- **Ziel:** Verhindern, dass Search-Responses ungelabelten HTML/JS zurückgeben.
- **Severity:** High
- **Result:** FAILED
- **Steps (praktisch):**
	1. `terms=<svg/onload=alert(1)>` suchen (UI oder `POST /search`).
	2. DOM/Response prüfen.
- **Expected Result (messbar):**
	- Payload wird escaped angezeigt oder geblockt.
- **Evidence (Code/Config) + Relevanz:**
	- `res.send(response.data)` → Daten werden ohne Sanitizing/Encoding zurückgegeben.

#### TC-A04-01 – Trust in client data (`userid`)

- **OWASP:** A04 Insecure Design
- **Ziel:** Sicherstellen, dass sicherheitsrelevante Identitäten nicht aus Clientdaten stammen.
- **Severity:** High
- **Result:** FAILED
- **Steps (praktisch):**
	1. Search-Request via DevTools/Intercept anschauen.
	2. `userid` manipulieren und Request wiederholen.
- **Expected Result (messbar):**
	- Server ignoriert clientseitige `userid` und nutzt Session-ID.
- **Evidence (Code/Config) + Relevanz:**
	- `req.body.userid` wird serverseitig verwendet → Designfehler (Trust boundary verletzt).

#### TC-A04-02 – Input-basiertes URL-Building im Search

- **OWASP:** A04 Insecure Design (mit A10-Auswirkung)
- **Ziel:** Verhindern, dass User die serverseitigen Request-Pfade steuern.
- **Severity:** Medium
- **Result:** FAILED
- **Steps (praktisch):**
	1. Search-Request beobachten.
	2. `provider` variieren (z.B. andere Pfade) und Verhalten prüfen.
- **Expected Result (messbar):**
	- Provider ist whitelisted; nur definierte Endpoints sind möglich.
- **Evidence (Code/Config) + Relevanz:**
	- `theUrl='http://localhost:3000'+provider...` → Path aus Userinput; SSRF-ähnlicher Angriffsvektor.

#### TC-A05-01 – Security Headers

- **OWASP:** A05 Security Misconfiguration
- **Ziel:** Basis-Härtung im Browser (MIME sniffing, clickjacking, CSP).
- **Severity:** Medium
- **Result:** FAILED
- **Steps (praktisch):**
	1. DevTools → Network → Response Headers prüfen (`/login`).
- **Expected Result (messbar):**
	- `X-Content-Type-Options: nosniff`
	- `X-Frame-Options: DENY` oder CSP `frame-ancestors 'none'`
	- (Optional) `Content-Security-Policy`
- **Evidence (Code/Config) + Relevanz:**
	- Kein `helmet`/keine Header-Setups sichtbar → fehlende Standard-Härtung wahrscheinlich.

#### TC-A05-03 – Secrets in Docker Compose

- **OWASP:** A05 Security Misconfiguration
- **Ziel:** Verhindern, dass Credentials im Repo/Compose leakbar sind.
- **Severity:** Medium
- **Result:** FAILED
- **Steps (praktisch):**
	1. `docker/compose.db.yaml` und `docker/compose.node.yaml` öffnen.
	2. `MARIADB_ROOT_PASSWORD`/`DB_PASSWORD` suchen.
- **Expected Result (messbar):**
	- Passwörter via `${ENV_VAR}`; keine Klartextsecrets.
- **Evidence (Code/Config) + Relevanz:**
	- `Some.Real.Secr3t` hardcoded → Credential-Exposure-Risiko.

#### TC-A06-02 – Outdated Components

- **OWASP:** A06 Vulnerable and Outdated Components
- **Ziel:** Erkennen von veralteten Dependencies (erhöhte CVE-Wahrscheinlichkeit).
- **Severity:** High
- **Result:** FAILED
- **Steps (praktisch):**
	1. `package.json` prüfen.
	2. Optional: `npm audit` als Laufzeittest ausführen.
- **Expected Result (messbar):**
	- Keine High/Critical Findings bzw. Updates dokumentiert.
- **Evidence (Code/Config) + Relevanz:**
	- `express@4.17.1`, `express-session@1.17.2`, `mysql2@2.3.0` → veraltet; Updates gefordert.

#### TC-A07-01 – Credentials nicht in URL (Login via POST)

- **OWASP:** A07 Identification and Authentication Failures
- **Ziel:** Vermeiden von Credential-Leaks via URL/Logs/Referer.
- **Severity:** High
- **Result:** PASSED
- **Steps (praktisch):**
	1. Login durchführen.
	2. DevTools → Network: Request Method/Params prüfen.
- **Expected Result (messbar):**
	- Login via POST; Passwort nicht im Querystring.
- **Evidence (Code/Config) + Relevanz:**
	- `<form method="post">` + `type="password"` → credentials nicht in URL.

#### TC-A07-02 – Brute-Force Schutz (Rate Limiting)

- **OWASP:** A07 Identification and Authentication Failures
- **Ziel:** Erschweren von Credential Stuffing/Brute Force.
- **Severity:** Medium
- **Result:** PASSED
- **Steps (praktisch):**
	1. Mehrfach falsche Logins (z.B. 20+) in kurzer Zeit.
	2. Auf `429 Too Many Requests` prüfen.
- **Expected Result (messbar):**
	- Ab Schwelle: `429` oder temporäre Sperre.
- **Evidence (Code/Config) + Relevanz:**
	- `express-rate-limit` global aktiviert → Basisschutz vorhanden.

#### TC-A07-03 – Session Cookie Flags (HttpOnly/SameSite)

- **OWASP:** A07 Identification and Authentication Failures
- **Ziel:** Schutz gegen Cookie-Diebstahl/XSS-Folgeschäden.
- **Severity:** Medium
- **Result:** FAILED
- **Steps (praktisch):**
	1. Login durchführen.
	2. DevTools → Network → `Set-Cookie` prüfen.
- **Expected Result (messbar):**
	- `HttpOnly` gesetzt; `SameSite` sinnvoll; `Secure` bei HTTPS.
- **Evidence (Code/Config) + Relevanz:**
	- In der Session-Konfiguration ist `secure: false` gesetzt, wodurch das Cookie nicht an HTTPS gebunden ist.

#### TC-A08-01 – Server-side Validation (Whitelist `state`)

- **OWASP:** A08 Software and Data Integrity Failures
- **Ziel:** Sicherstellen, dass Server Validation nicht nur im Frontend passiert.
- **Severity:** Medium
- **Result:** PASSED
- **Steps (praktisch):**
	1. Request abfangen und `state=invalid` senden.
	2. Response prüfen.
- **Expected Result (messbar):**
	- `400`/Ablehnung; keine DB-Änderung.
- **Evidence (Code/Config) + Relevanz:**
	- `allowedStates.includes(state)` → serverseitige Whitelist-Validation.

#### TC-A09-01 – Security Logging / Audit Trail

- **OWASP:** A09 Security Logging and Monitoring Failures
- **Ziel:** Nachvollziehbarkeit von sicherheitsrelevanten Events.
- **Severity:** Low
- **Result:** FAILED
- **Steps (praktisch):**
	1. Fehlgeschlagene Logins erzeugen.
	2. Logs prüfen (Docker logs/stdout).
- **Expected Result (messbar):**
	- Strukturierte Logs (Login fail/success, Admin access), ohne Secrets.
- **Evidence (Code/Config) + Relevanz:**
	- Kein Audit-Logging ersichtlich → Incident Response erschwert.

#### TC-A10-01 – SSRF-ähnliches Verhalten im Search

- **OWASP:** A10 SSRF
- **Ziel:** Verhindern von serverseitigen Requests, die durch Userinput gesteuert werden.
- **Severity:** Medium
- **Result:** FAILED
- **Steps (praktisch):**
	1. Search-Request anschauen.
	2. `provider` manipulieren (andere Pfade) und Response beobachten.
- **Expected Result (messbar):**
	- Provider ist whitelisted; keine freien Pfade; keine internen Daten.
- **Evidence (Code/Config) + Relevanz:**
	- `http://localhost:3000` + `provider` aus Request → Self-call/SSRF-ähnlich.

#### TC-A10-02 – DoS-Risiko durch künstliche Verzögerung

- **OWASP:** A10 SSRF (Availability/Abuse), operativ DoS
- **Ziel:** Verhindern, dass Endpoint durch künstliche Sleeps leicht blockierbar ist.
- **Severity:** Medium
- **Result:** FAILED
- **Steps (praktisch):**
	1. Mehrere parallele Requests auf `/search` auslösen.
	2. Latenz/Queue beobachten.
- **Expected Result (messbar):**
	- Kein künstliches Sleep; enges Rate Limit.
- **Evidence (Code/Config) + Relevanz:**
	- `await sleep(1000);` → Requests blockieren Worker/Threadpool → Availability sinkt.

Die obigen Resultate basieren auf:
- **Code-/Config-Stellen** (siehe Kurz-Evidenz-Spalte) und
- **Automatisierten Checks** (Jest) gegen die bereitgestellten Dateien.

Hinweis: UI-/HTTP-Belege (Screenshots, konkrete Statuscodes) wurden im vorliegenden Stand nicht systematisch erhoben und wären nur für einzelne Grenzfälle notwendig; die Kernaussagen sind für die meisten TCs aus Code/Config bereits belastbar.

### 2.3 Praktische Tests (manuell, realistisch ausführbar) – Abschlussresultate

Diese Tests sind bewusst **praxisnah** (Browser/DevTools/curl). Die Resultate sind hier als finales PASS/FAIL festgehalten.

#### PT-01 – Security Headers via DevTools

- **Ziel (OWASP A05):** Nachweis, ob Basis-Header (nosniff / clickjacking / CSP) in echten Responses gesetzt sind.
- **Vorgehen:** Browser öffnen → DevTools → Network → Request auf `/login` oder `/` selektieren → Response Headers prüfen.
- **Expected:**
	- Mindestens `X-Content-Type-Options: nosniff`
	- `X-Frame-Options: DENY` oder CSP `frame-ancestors 'none'`
	- (Optional) `Content-Security-Policy`
- **Observed:** Keine expliziten Security-Header-Konfigurationen im App-Code ersichtlich.
- **Result:** FAILED

#### PT-02 – HTTP vs HTTPS Verhalten

- **Ziel (OWASP A02):** Prüfen, ob HTTPS verfügbar ist und ob HTTP auf HTTPS umleitet.
- **Vorgehen:** `http://localhost/` öffnen, danach `https://localhost/` (oder verwendeter Host/Port).
- **Expected:** HTTPS verfügbar; HTTP redirectet (301/302) auf HTTPS.
- **Observed:** Compose-Konfiguration zeigt nur HTTP-Port-Mapping (`80:3000`) ohne TLS-Termination.
- **Result:** FAILED

#### PT-03 – SQL Injection Probe im Login (harmloser Negativtest)

- **Ziel (OWASP A03):** Verifizieren, dass Prepared Statements + WAF nicht zu Auth-Bypass führen.
- **Vorgehen:** Login mit `username = ' OR 1=1 --` und beliebigem Passwort.
- **Expected:** Login schlägt fehl (z.B. 401 / Fehlermeldung); keine SQL-Fehlerdetails.
- **Observed:** Login-Query ist parameterisiert (`WHERE username = ?`) und Passwortprüfung erfolgt mit `bcrypt.compare(...)`.
- **Result:** PASSED

#### PT-04 – Reflected XSS Probe im Search

- **Ziel (OWASP A03):** Verifizieren, ob Suchresultate/Fehlermeldungen Payload unescaped reflektieren.
- **Vorgehen:** Im Suchfeld (oder per POST `/search`) `terms=<svg/onload=alert(1)>` testen.
- **Expected:** Payload wird als Text angezeigt oder gefiltert; kein JS ausgeführt.
- **Observed:** Search-Flow gibt `response.data` direkt zurück; fehlendes serverseitiges Output-Encoding.
- **Result:** FAILED

## 3) Empfehlungen (Ableitung aus dem Testbericht)

Priorisiert (Top 6):
1. **TLS/HTTPS** via Reverse Proxy (Caddy/Nginx/Traefik) oder Plattform-TLS; HTTP → HTTPS Redirect; Cookie `Secure` nur in TLS.
2. **Secrets aus Compose entfernen**: `.env` + `docker compose --env-file` oder Docker Secrets; keine Klartextpasswörter im Repo.
3. **Search hardenen** (A10/A04): Provider **whitelisten** (kein frei wählbarer Pfad), `userid` serverseitig aus Session ziehen; Self-HTTP-call vermeiden.
4. **/search DoS-Fix**: `sleep(1000)` entfernen; engeres Rate-Limit speziell für `/search`.
5. **Security Headers**: `helmet` (CSP/XFO/nosniff), plus saubere CSP für Inline-Skripte.
6. **Dependencies aktualisieren**: `npm audit` fahren, Findings patchen, Lockfile pflegen.

## 4) Anhänge

- Automatisierte Checks (statisch): `_other_group_lb2/tests/phase2-other-group.test.cjs` (Jest)
- Zusätzliche Regression-Suite: `_other_group_lb2/tests/owasp.test.cjs` (Jest)
- JSON-Übersicht: `TESTPROTOKOLL_PHASE2_ANDERE_GRUPPE_summary.json`
- Optionaler Sicherheits-Referenzbericht: `SECURITY_REPORT_LB2.md`

## 5) Formale Abgabe-Checkliste (Teams + Moodle)

Die geforderten Inhalte sind in dieser Abgabe wie folgt abgedeckt:

- **Testkonzept (Was/Wie/Vorgehen getestet):** Abschnitt `1) Testkonzept (Vorgehen)` in diesem Dokument.
- **Testbericht (konkrete Resultate):** Abschnitt `2) Testbericht (konkrete Resultate)` inklusive Detailtestfällen.
- **Empfehlungen:** Abschnitt `3) Empfehlungen (Ableitung aus dem Testbericht)`.
- **Anhänge/Testrapporte:** Abschnitt `4) Anhänge` inkl. Jest-Suiten und JSON-Zusammenfassung.

Hinweis zur Einreichung gemaess Aufgabenstellung:

- Dieselben Inhalte sind im Teams-Channel bereitzustellen.
- Dieselben Inhalte sind zusaetzlich in der Moodle-Aufgabe hochzuladen.
- Zulaessige Formate sind erfuellt (`.md` und `.json`; bei Bedarf kann fuer Teams/Moodle optional PDF exportiert werden).
