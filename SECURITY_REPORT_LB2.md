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

## 6. Verifikation

- `npm install` erfolgreich
- Syntax Check erfolgreich (`node -c` für zentrale Dateien)

## 7. Offene Punkte / Next Steps

1. Passwort-Hashing (wichtigster Next Step)

Im DB-Schema sind Passwörter offenbar im Klartext. Als nächster Schritt sollte ich auf `argon2id` oder `bcrypt` umstellen (inkl. Migration/Reset Flow).

2. Delete-Route

Im UI gibt es einen Link `delete?id=...`, die Route/Datei war im gelieferten Code nicht enthalten. Diese Route sollte ich analog absichern (Ownership, CSRF, Prepared Statements).

3. Dependencies

`npm audit` meldet Vulnerabilities. Als nächstes sollte ich Updates einspielen und retesten.

