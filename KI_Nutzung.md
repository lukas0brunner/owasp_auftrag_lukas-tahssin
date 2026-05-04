# KI-Nutzung – Deklaration (Gruppe 6)

Erstellt: 2026-05-04  
Autoren: Tahssin Al-Khatib,  Lukas Brunner

---

## 1. Übersicht: Wo und wie wurde KI eingesetzt?

| Phase | Aufgabe | KI-Tool | Einsatz? | Begründung |
|---|---|---|---|---|
| Phase 1 | Schwachstellen-Suche im Originalcode | Claude Sonnet 4 | Ja | Zweite Meinung nach eigenem Review |
| Phase 1 | Implementierung CSRF-Schutz, escapeHtml, Prepared Statements | Claude Sonnet 4 | Ja | Code-Generierung + Erklärung Mechanismus |
| Phase 1 | Erweiterung „Konto löschen" (`account/delete.js`) | Claude Sonnet 4 | Ja | Grundgerüst generieren, dann manuell angepasst |
| Phase 2 | Testfälle generieren | Claude Sonnet 4 | Ja | Testfall-Template aus OWASP-Kategorien |
| Phase 2 | Testdurchführung / Protokoll ausfüllen | — | **Nein** | Muss manuell durchgeführt werden (App laufen lassen, Outputs beobachten) |
| Phase 3 | Analyse des Testberichts der anderen Gruppe | Claude Sonnet 4 | Ja | Systematischer Abgleich Finding ↔ Code |
| Phase 3 | Code-Fixes (Passwort-Hashing, Audit-Logging, .env) | Claude Sonnet 4 | Ja | Code-Generierung + Review |
| Phase 3 | Erstellung `feedback_testbericht.md` | Claude Sonnet 4 | Ja | Strukturierung + Formulierung |
| Phase 3 | Diese Deklaration | Claude Sonnet 4 | Ja | Vollständigkeit sicherstellen |

---

## 2. Detailbeschreibung nach Phase

### Phase 1

**Schwachstellen-Suche:**  
Wir haben zuerst **selbstständig** den Originalcode analysiert und folgende Schwachstellen gefunden und behoben: SQLi (Prepared Statements), fehlende Auth-Guards, Stored XSS (escapeHtml). Danach haben wir Claude den Code gegeben mit dem Prompt: *„Analysiere diesen Code auf OWASP Top 10 Schwachstellen, die ich möglicherweise übersehen habe."* Claude identifizierte zusätzlich die fehlenden Security Headers und die ungeschützten state-changing GET-Endpoints. Dieser „zweite Blick" war wertvoll, da wir diese eher konzeptuellen Schwachstellen selbst übersehen hätten.

**Warum KI hier sinnvoll:** Betriebsblindheit ist bei eigenem Code real. KI kennt typische OWASP-Patterns gut und findet systematisch Lücken, die beim manuellen Review durch Fokus auf Funktionalität entgehen.

**CSRF-Implementierung:**  
Claude generierte das Grundgerüst für `issueCsrfToken()` und `verifyCsrf()` in `fw/security.js`. Wir haben den generierten Code vollständig gelesen, auf Korrektheit geprüft (timing-safe comparison, session binding) und in die bestehende Architektur integriert.

**Erweiterung Account-Löschen:**  
Claude generierte den ersten Entwurf von `account/delete.js`. Wir haben ihn manuell auf Transaction-Korrektheit, CSRF-Schutz und Audit-Log-Einträge überprüft und angepasst.

### Phase 2

**Testfall-Generierung:**  
Prompt an Claude: *„Generiere Testfälle für eine Node.js/Express TODO-App gegen OWASP Top 10, Severity High/Medium/Low, Format: ID, OWASP-Ref, Ziel, Steps, Expected Result, Evidenz."* Die generierten Testfälle wurden kritisch durchgelesen und für unsere konkrete App angepasst. Etwa 30% wurden inhaltlich modifiziert.

**Testdurchführung – kein KI-Einsatz:**  
Die eigentliche Testdurchführung (App starten, Requests absetzen, Outputs dokumentieren) wurde vollständig manuell durchgeführt. KI kann keine laufende Applikation testen; die Resultate müssen beobachtet und bewertet werden. Dies entspricht auch den Vorgaben der Lehrperson.

### Phase 3

**Analyse des fremden Testberichts:**  
Claude analysierte sowohl unsere Codebasis als auch den Testbericht der anderen Gruppe und glich systematisch ab: *„Welche Findings sind in der aktuellen Codeversion tatsächlich noch offen, welche sind False Positives?"* Dies war besonders nützlich, da wir ohne einen unvoreingenommenen Code-Blick möglicherweise einige False Positives nicht erkannt hätten.

**Warum KI hier besonders sinnvoll war:**  
1. Die andere Gruppe hat grösstenteils die Originalapplikation (nicht unsere) analysiert. Ohne sorgfältigen Abgleich hätten wir u.U. bereits behobene Schwachstellen nochmals „gefixt", was unnötigen Aufwand bedeutet und potentiell Regressions eingeführt hätte.  
2. Die Prüfung, ob ein Fix best-practice entspricht (z.B. PBKDF2 vs. bcrypt vs. argon2), hat KI durch einen begründeten Vergleich unterstützt.

**Code-Fixes:**  
Claude implementierte folgende Änderungen, die wir anschliessend geprüft und abgenommen haben:
- `hashPassword()` / `verifyPassword()` mit PBKDF2-SHA512 und `crypto.timingSafeEqual` (keine externe Dependency, nur Node built-in `crypto`)
- Audit-Logging in `login.js` (fehlertolerantes try/catch)
- `.env`-Migration für Docker Compose Secrets
- `package.json` Versions-Update

**Feedback-Dokument:**  
Die Struktur und erste Formulierungsentwürfe für `feedback_testbericht.md` wurden mit Claude erarbeitet. Sachliche Bewertungen (valide vs. False Positive) wurden von uns basierend auf unserem Code-Wissen getroffen.

---

## 3. Entscheide, wo KI **nicht** eingesetzt wurde – und warum

| Aufgabe | Begründung für Nicht-Einsatz |
|---|---|
| Testdurchführung (Phase 2) | KI kann keine laufende App testen; Resultate müssen real beobachtet werden |
| Bewertung ob ein Finding valide ist | Urteil basiert auf Kenntnis unseres eigenen Codes – wir haben die finale Entscheidung selbst getroffen |
| Commit-Texte und PR-Beschreibungen | Kleine manuelle Aufgabe; keine KI-Unterstützung sinnvoll |

---

## 4. Reflexion: War der KI-Einsatz angemessen?

**Ja, und zwar aus folgenden Gründen:**

1. **Effizienz:** Boilerplate-Code (CSRF, escapeHtml, Security-Headers, PBKDF2-Wrapper) ist gut definiert und von KI schnell und korrekt generierbar. Das spart Zeit für konzeptuelle Arbeit.

2. **Qualitätssicherung durch externen Blick:** Ein LLM kennt OWASP-Muster umfassend und findet durch systematisches Abarbeiten oft Schwachstellen, die bei manuellem Review durch Fokus auf Funktionalität übersehen werden. Dies ist genau der Zweck, den die Lehrperson im Auftrag beschreibt.

3. **Regressionsvermeidung:** Der KI-gestützte Abgleich zwischen Testbericht und tatsächlichem Code hat verhindert, dass wir bereits behobene Schwachstellen doppelt bearbeiten oder unkritisch akzeptieren.

4. **Kein „Auslagern" der Kernarbeit:** Die eigentliche Sicherheitsanalyse, Testdurchführung und Entscheidung über Fixes haben wir selbst durchgeführt. KI war Werkzeug, nicht Entscheider.

5. **Transparenz:** Dieser Deklaration liegt das Prinzip zu Grunde, dass KI-Nutzung kein Qualitätsmangel ist, solange sie transparent und reflektiert erfolgt. Wir haben jeden KI-generierten Code gelesen, verstanden und bewusst übernommen oder verändert.
