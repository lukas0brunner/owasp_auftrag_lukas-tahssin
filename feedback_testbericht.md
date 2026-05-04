# Phase 3 – Feedback auf Testbericht (Gruppe 7 → Gruppe 6)

Erstellt: 2026-05-04  
Reviewer: Gruppe 6 (Lukas Brunner / Tahssin-al)

---

## 1. Zusammenfassung

Das Testprotokoll der Gruppe 7 ist in seiner Struktur klar und enthält für jeden Testfall eine OWASP-Referenz, eine Severity-Einstufung und eine kurze Evidence-Begründung. Es deckt die OWASP Top 10 systematisch ab. Allerdings beruht ein Grossteil der FAILED-Einträge auf einer **veralteten Codebasis** – die Tester haben offenbar den ursprünglichen Quellstand (vor unseren Phase-1-Fixes) analysiert und nicht die abgegebene Version. Daraus entstehen sowohl False Positives als auch einige False Negatives.

Im Folgenden kommentieren wir jedes Finding einzeln.

---

## 2. Kommentare zu den einzelnen Findings

### TC-A01-01 – Zugriff ohne Login → PASSED
**Valide.** `requireLogin`-Guard ist korrekt implementiert. Ergebnis stimmt.

---

### TC-A01-02 – IDOR /edit?id= → PASSED
**Valide.** `WHERE ID = ? AND userID = ?` verhindert IDOR zuverlässig. Ergebnis stimmt.

---

### TC-A01-03 – Admin-Only Route → PASSED
**Valide.** `ensureRole('admin')` greift serverseitig auf `req.session.user.role`. Ergebnis stimmt.

---

### TC-A01-04 – CSRF/Forced Logout via GET → FAILED **False Positive**
**Nicht valide.** Die Tester haben offenbar eine ältere Version analysiert.  
In der abgegebenen Version zeigt `GET /logout` lediglich ein Bestätigungsformular – die Session wird **nicht** zerstört. Der eigentliche Logout erfolgt ausschliesslich via `POST /logout` mit CSRF-Token-Prüfung (`verifyCsrf(req)`). Ein „Forced Logout" durch Einbetten einer `<img src="/logout">` auf einer Drittseite ist damit nicht möglich.  
**Kein Fix nötig.**

---

### TC-A01-05 – CSRF-Schutz bei state-changing POSTs → FAILED **False Positive**
**Nicht valide.** Die Tester schreiben „kein csrf im Code sichtbar". Das stimmt für die Phase-1-Abgabe nicht:  
- `/savetask` (POST): CSRF-Prüfung in `savetask.js`
- `/delete` (POST): CSRF-Prüfung in `app.js`
- `/logout` (POST): CSRF-Prüfung in `app.js`
- `/search` (POST): CSRF-Prüfung in `app.js`
- `/account/delete` (POST): CSRF-Prüfung in `account/delete.js`

CSRF-Tokens werden serverseitig mit `crypto.randomBytes(32)` generiert und Session-gebunden validiert (`fw/security.js`).  
**Kein Fix nötig** – Finding basiert auf falscher Codebasis.

---

### TC-A02-02 / TC-A07-03 – Cookie Secure Flag → FAILED **Teilweise valide**
**Teilweise valide.** In unserer Konfiguration ist `secure: process.env.NODE_ENV === 'production'`. Im Entwicklungsmodus (ohne TLS) ist `secure: false` korrekt – ansonsten würde die App lokal nicht funktionieren. In einem produktiven Setup mit TLS (oder einem Reverse Proxy) ist das Flag automatisch aktiv.  
**Der tatsächliche Mangel liegt in TC-A02-04 (kein HTTPS).** Dort liegt die eigentliche Ursache.

---

### TC-A02-04 – TLS/HTTPS nicht vorhanden → FAILED **Valide**
**Valide.** HTTPS ist nicht im Compose-Setup konfiguriert. Dies ist eine bekannte Limitation unserer Demo-Umgebung. Die Empfehlung der Tester (Reverse Proxy mit Caddy/Nginx/Traefik) ist korrekt.  
**Massnahme Phase 3:** Dokumentiert. Ein Reverse Proxy (z. B. Caddy) würde TLS-Termination und automatisches HTTP→HTTPS-Redirect ermöglichen. Im Rahmen dieses Schulprojekts ohne eigene Domain ist eine vollständige HTTPS-Konfiguration nicht umsetzbar, aber der Ansatz ist in der Architektur vorbereitet (`trust proxy` + `secure: true` in production).

---

### TC-A02-05 – Frontend-CDN ohne SRI → FAILED **False Positive**
**Nicht valide.** Die Tester schreiben „header.js lädt cdnjs ohne integrity=". Das ist falsch. In `fw/header.js` sind **beide** CDN-Scripts mit SRI-Hash und `crossorigin="anonymous"` ausgestattet:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.0/jquery.min.js"
  integrity="sha384-JUMjoW8OzDJw4oFpWIB2Bu/c6768ObEthBMVSiIx4ruBIEdyNSUQAjJNFqT5pnJ6"
  crossorigin="anonymous"></script>
```
**Kein Fix nötig** – Finding ist faktisch falsch.

---

### TC-A03-01 – SQLi Login → PASSED
**Valide.** Parametrisierte Queries verhindern SQLi. Ergebnis stimmt.

---

### TC-A03-02 – SQLi /edit?id= → PASSED
**Valide.** Integer-Check + Ownership-Query. Ergebnis stimmt.

---

### TC-A03-03 – Stored XSS → PASSED
**Valide.** `escapeHtml()` auf allen Ausgaben. Ergebnis stimmt.

---

### TC-A03-04 – Reflected XSS (Search) → FAILED **False Positive**
**Nicht valide für unsere Codebasis.** Die Tester referenzieren `res.send(response.data)` – das ist Code aus der originalen, unmodifizierten Applikation. In unserer Version:
1. `search.js` ruft den Provider **direkt** auf (kein HTTP self-call, kein `response.data`)
2. `search/v2/index.js` escaped **alle** Ausgaben mit `escapeHtml()` vor der Rückgabe

Die jQuery-Methode `$("#result").html(data)` auf dem Client rendert die server-seitig HTML-entitätsierten Strings (`&lt;svg&gt;` → Textinhalt, kein DOM-Parsing).  
**Kein Fix nötig.**

---

### TC-A04-01 – Trust in client data (`userid`) → FAILED **False Positive**
**Nicht valide.** Die Tester sehen `req.body.userid` im alten Code. In unserer Version:
- `search.js` liest `userid` **ausschliesslich** aus `req.session.user.id` (Zeile 16)
- Der `userid`-Wert aus dem Request-Body wird ignoriert

**Kein Fix nötig.**

---

### TC-A04-02 – Input-basiertes URL-Building → FAILED **False Positive**
**Nicht valide.** `search.js` verwendet eine explizite Whitelist:
```js
const provider = req.body.provider === '/search/v2/' ? '/search/v2/' : null;
if (!provider) return 'Invalid provider';
```
Jeder andere Wert führt zu einer sofortigen Ablehnung. Ein SSRF ist damit nicht möglich.  
**Kein Fix nötig.**

---

### TC-A05-01 – Security Headers → FAILED **False Positive**
**Nicht valide.** `fw/security.js` enthält eine `securityHeaders`-Middleware, die als erstes Middleware in `app.js` registriert ist und folgende Header setzt:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'self'; ...`
- `Referrer-Policy: no-referrer`
- `Cross-Origin-Opener-Policy: same-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

**Kein Fix nötig.** Das Finding ist falsch – die Tester hätten die App ausführen und die Response-Headers prüfen sollen.

---

### TC-A05-03 – Secrets in Docker Compose → FAILED **Valide**
**Valide.** Das DB-Passwort `Some.Real.Secr3t` war im Klartext in `compose.db.yaml` hinterlegt.  
**Fix Phase 3:** Credentials in `lb2-app/docker/.env` ausgelagert. Compose-Files nutzen jetzt `${MARIADB_ROOT_PASSWORD}` und `${SESSION_SECRET}`. `.env` ist in `.gitignore` eingetragen. Eine `.env.example`-Template-Datei ist im Repo.

---

### TC-A06-02 – Outdated Components → FAILED **Valide**
**Valide.** `express@4.17.1`, `express-session@1.17.2`, `mysql2@2.3.0` sind veraltet.  
**Fix Phase 3:** `package.json` auf aktuelle Versionen aktualisiert:
- `express`: 4.17.1 → **4.21.2**
- `express-session`: 1.17.2 → **1.18.1**
- `mysql2`: 2.3.0 → **3.12.0**
- `axios`: 1.7.2 → **1.7.9**
- `nodemon`: 3.1.0 → **3.1.9**

---

### TC-A07-01 – Credentials nicht in URL → PASSED
**Valide.** POST + `type="password"`. Ergebnis stimmt.

---

### TC-A07-02 – Rate Limiting → PASSED
**Valide.** In-Memory Rate-Limiter (10 Versuche/Minute pro IP) in `login.js`. Ergebnis stimmt.  
**Hinweis:** Die Evidenz nennt `express-rate-limit` – das ist nicht korrekt, wir verwenden eine eigene In-Memory-Implementierung. Der Test-Outcome (PASSED) ist jedoch richtig.

---

### TC-A07-03 – Session Cookie Flags → FAILED **Nur bedingt valide**
Siehe Kommentar zu TC-A02-02. Das `Secure`-Flag fehlt in der lokalen Dev-Umgebung bewusst. In Production (mit TLS) ist es aktiv. Das Finding ist technisch korrekt für eine Nicht-HTTPS-Umgebung, beschreibt aber kein eigenständiges Problem.

---

### TC-A08-01 – Server-side Validation → PASSED
**Valide.** `isAllowedState()` in `fw/security.js` und Nutzung in `savetask.js`. Ergebnis stimmt.

---

### TC-A09-01 – Security Logging / Audit Trail → FAILED **Valide**
**Valide.** Audit-Logging war nur in `account/delete.js` vorhanden, nicht für Login-Events.  
**Fix Phase 3:** `login.js` schreibt jetzt `login_success`, `login_failed` und `login_rate_limited` in die `audit_log`-Tabelle (fehlertolerantes try/catch, blockiert Login nicht).

---

### TC-A10-01 – SSRF im Search → FAILED **False Positive**
**Nicht valide.** Wir haben den HTTP-Self-Call (`axios http://localhost:3000/...`) bereits in Phase 1 eliminiert. `search.js` ruft `searchProvider.search()` **direkt** auf (Funktionsaufruf, kein Netzwerk-Request). SSRF ist damit strukturell unmöglich.

---

### TC-A10-02 – DoS durch `sleep(1000)` → FAILED **False Positive**
**Nicht valide.** Das `sleep(1000)` ist nur aktiv, wenn `process.env.DEMO_SLOW_SEARCH === '1'` gesetzt ist (Opt-in-Demo-Flag). Standardmässig ist es deaktiviert. Der Kommentar im Code ist explizit.

---

## 3. Kritisches Feedback zur Qualität des Testprotokolls

### Stärken
- **Strukturierung:** Klares tabellarisches Format mit OWASP-Referenz, Severity und Result ist gut.
- **Abdeckung:** 25 Testfälle über alle OWASP Top 10 ist ein solides Breite-Coverage.
- **Reproduzierbarkeit:** Automatisierte Jest-Checks verbessern die Nachvollziehbarkeit erheblich.

### Schwächen

**1. Falsche Codebasis analysiert (kritisch)**  
Der grösste Mangel: Mindestens 8 von 14 FAILED-Findings beruhen auf der **ursprünglichen unmodifizierten Applikation** und nicht auf unserer Phase-1-Abgabe. Die Tester haben offenbar den Code aus `lb2-applikation-main` (Originaldownload) und nicht unsere überarbeitete Version getestet. Der Testbericht dokumentiert dadurch nicht unsere Applikation, sondern ein Referenz-Repository.

**2. Keine Laufzeit-Verifikation der meisten Findings**  
Fast alle Findings basieren auf reinem Code-Review/Static Analysis. Es gibt keine HTTP-Responses, Screenshots oder Network-Logs als Beweise. Beim Finding TC-A05-01 (Security Headers) hätte ein einziger `curl -I http://localhost:8080/login` alle Header sichtbar gemacht und das Finding als falsch identifiziert.

**3. Widersprüche in der Evidenz**  
- TC-A07-02: Evidence nennt `express-rate-limit`, das nicht im `package.json` vorkommt (wir verwenden eine eigene Implementierung). Das wurde nicht überprüft.
- PT-03: Evidence erwähnt `bcrypt.compare(...)` – das existiert in unserem Code nicht. Die Tester haben die App als sicher bewertet, aber aus falschen Gründen.

**4. Fehlende Quantifizierung bei SSRF/DoS**  
TC-A10-01 und TC-A10-02 hätten mit einem einfachen curl-Proof-of-Concept viel stärker belegt werden können. Ein nicht ausnutzbarer „SSRF-ähnlicher" Vektor sollte klar als Low eingestuft werden, wenn Provider-Whitelisting bereits existiert.

**5. Keine Differenzierung zwischen architekturellen und fixbaren Findings**  
TC-A02-04 (kein HTTPS) und TC-A05-03 (Secrets) sind sehr unterschiedlich in ihrer Behebbarkeit. TLS in einem Demo-Schulprojekt ohne Domain ist nicht trivial umsetzbar, während Secrets in .env-Files ein einfacher 10-Minuten-Fix ist.

### Fazit
Das Testprotokoll ist formal gut strukturiert und zeigt ein klares Verständnis der OWASP-Kategorien. Die grösste Schwäche liegt darin, dass es nicht unsere tatsächliche Codebasis analysiert. Dies führt zu einer unzuverlässigen Bewertung: Echte Probleme (Outdated Deps, Secrets, fehlendes Login-Logging) wurden korrekt identifiziert, aber viele bereits behobene Schwachstellen wurden fälschlicherweise als offen gemeldet.

---

## 4. Übersicht umgesetzter Fixes (Phase 3)

| Finding | Status | Fix |
|---|---|---|
| TC-A01-04 CSRF Logout GET | False Positive – kein Fix nötig | — |
| TC-A01-05 CSRF bei POSTs | False Positive – kein Fix nötig | — |
| TC-A02-02/A07-03 Secure Cookie | Architekturell korrekt (prod=true) | — |
| TC-A02-04 TLS/HTTPS | Valide – Infra-Limitation | Dokumentiert; .env + trust proxy vorbereitet |
| TC-A02-05 CDN ohne SRI | False Positive – kein Fix nötig | — |
| TC-A03-04 Reflected XSS | False Positive – kein Fix nötig | — |
| TC-A04-01 userid aus Body | False Positive – kein Fix nötig | — |
| TC-A04-02 URL-Building | False Positive – kein Fix nötig | — |
| TC-A05-01 Security Headers | False Positive – kein Fix nötig | — |
| **TC-A05-03 Secrets in Compose** | **Valide – FIXED** | Credentials in `.env`, `.gitignore` |
| **TC-A06-02 Outdated Deps** | **Valide – FIXED** | `package.json` auf aktuelle Versionen |
| **TC-A09-01 Audit Logging** | **Valide – FIXED** | Login-Events in `audit_log` |
| TC-A10-01 SSRF | False Positive – kein Fix nötig | — |
| TC-A10-02 DoS Sleep | False Positive – kein Fix nötig | — |
| **Bonus: Plaintext Passwords** | **Nicht gefunden, trotzdem FIXED** | PBKDF2-SHA512 in `fw/security.js` |
