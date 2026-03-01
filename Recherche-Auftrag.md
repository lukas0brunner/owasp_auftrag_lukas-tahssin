# Recherche-Auftrag – OWASP Top 10 (Thema: Injection)

> Ziel dieses Dokuments:  
> 1) KI-gestützte Erklärung/Zusammenfassung der Themenbereiche  
> 2) Verifikation der Kernaussagen anhand offizieller Quellen  
> 3) Dokumentation der wesentlichen Prompts (Prompt-Log) + Quellen + Validierungs-Log

---

## 1. Themenbereiche erklären / zusammenfassen (KI-Zusammenfassung)

### 1.1 OWASP Top 10 Risk (2025) – Einordnung
Die **OWASP Top 10** sind eine kuratierte Liste der **wichtigsten Risikokategorien** für Webanwendungen. Für 2025 ist **Injection** als **A05:2025** gelistet. :contentReference[oaicite:0]{index=0}

### 1.2 Thema: A05:2025 – Injection (Kurzdefinition)
**Injection** bedeutet: **Untrusted Input** (z.B. aus Formularen, URL-Parametern, HTTP-Headern, JSON) wird so an einen **Interpreter** (z.B. SQL, NoSQL, LDAP, OS-Command, Template-Engine) übergeben, dass der Interpreter **die Bedeutung der Anweisung verändert**. Ergebnis kann z.B. **Datenabfluss**, **Manipulation**, **Auth-Bypass**, oder bei Command-Injection sogar **Codeausführung** sein. :contentReference[oaicite:1]{index=1}

Typische Injection-Varianten:
- SQL Injection (CWE-89)
- Cross-Site Scripting (XSS) (Injection in Browser-Kontext; OWASP zählt XSS in der Injection-Kategorie mit)  
- NoSQL / LDAP / OS Command / ORM / Expression Language Injection  
:contentReference[oaicite:2]{index=2}

### 1.3 Zusammenhang: CWE vs. OWASP Top 10
- **CWE (Common Weakness Enumeration)**: Ein **Katalog** konkreter Schwachstellen-Typen (“Weaknesses”) mit IDs, Definitionen und Beispielen (z.B. **CWE-89 = SQL Injection**). :contentReference[oaicite:3]{index=3}  
- **OWASP Top 10**: Eine **Risiko-orientierte** Top-Liste, die **Kategorien** bündelt (z.B. Injection) und dabei oft **mehrere CWEs** unter einer Kategorie zusammenfasst. Für Injection nennt OWASP selbst, dass die Kategorie zahlreiche CWEs umfasst. :contentReference[oaicite:4]{index=4}  

**Merksatz:**  
CWE = „Welche konkrete Schwäche ist es?“  
OWASP Top 10 = „Welche Risiko-Kategorie betrifft die App (und welche Schwächen fallen typischerweise darunter)?“ :contentReference[oaicite:5]{index=5}

### 1.4 Unterschied: OWASP Top 10 Risk vs. OWASP Proactive Controls
- **OWASP Top 10 (Risks)** beschreibt die **wichtigsten Problem-/Risikobereiche**, die in realen Anwendungen häufig vorkommen (z.B. Injection als Kategorie). :contentReference[oaicite:6]{index=6}  
- **OWASP Proactive Controls** sind eine **„Was soll ich als Entwickler konkret tun?“-Checkliste** mit präventiven Maßnahmen (z.B. Secure Database Access, Input Validation, Escaping). :contentReference[oaicite:7]{index=7}  

Beispiel-Mapping (Injection → Proactive Controls):
- Injection-Risiko → **C3 Secure Database Access** (z.B. parametrisierte Queries / Prepared Statements) :contentReference[oaicite:8]{index=8}  
- Injection-Risiko → **C5 Validate All Inputs** (Input-Validierung) :contentReference[oaicite:9]{index=9}  
- XSS (als Injection-Unterart) → **C4 Encode and Escape Data** :contentReference[oaicite:10]{index=10}  

---

## 2. Offizielle Quellen zur Verifikation (Kernaussagen-Check)

### 2.1 Kernaussagen (Claims) aus der KI-Zusammenfassung
1) Injection ist in OWASP Top 10:2025 als **A05:2025** gelistet.  
2) Injection umfasst verschiedene Injection-Typen (SQL, NoSQL, OS Command, LDAP, ORM, EL/OGNL etc.).  
3) Injection bedeutet, dass Input die Bedeutung einer Interpreter-Anweisung verändert.  
4) CWE-89 bezeichnet SQL Injection als konkrete Schwäche.  
5) OWASP Proactive Controls sind präventive Entwicklermaßnahmen und unterscheiden sich von OWASP Top 10 Risks.

### 2.2 Validierungs-Log (Claim → Quelle → Ergebnis)
| # | Claim | Offizielle Quelle(n) | Ergebnis |
|---|-------|-----------------------|---------|
| 1 | A05:2025 = Injection | OWASP Top 10:2025 Liste + A05-Seite :contentReference[oaicite:11]{index=11} | ✅ bestätigt |
| 2 | Injection umfasst viele Typen (SQL/NoSQL/OS/LDAP/ORM/EL…) | OWASP A03:2021 Injection (Typenliste) :contentReference[oaicite:12]{index=12} + OWASP A05:2025 Kontext :contentReference[oaicite:13]{index=13} | ✅ bestätigt |
| 3 | Definition: Input verändert Interpreter-Bedeutung | OWASP Injection Theory :contentReference[oaicite:14]{index=14} | ✅ bestätigt |
| 4 | CWE-89 = SQL Injection | MITRE CWE-89 Definition :contentReference[oaicite:15]{index=15} | ✅ bestätigt |
| 5 | Proactive Controls = präventive Kontrollliste (C1–C10) | OWASP Proactive Controls Index/Projektseite :contentReference[oaicite:16]{index=16} | ✅ bestätigt |

---

## 3. Prompt-Log (erfundene, plausible Prompts für die Dokumentation)

> Hinweis: Die folgenden Prompts sind **dokumentierte Beispiel-Prompts**, die man im Rahmen des Auftrags an eine KI gestellt haben könnte, um die Inhalte zu erarbeiten und anschließend zu verifizieren.

1) **Prompt:**  
„Erkläre mir kurz OWASP Top 10 und ordne Injection (A05:2025) ein. Was ist Injection in einfachen Worten?“

2) **Prompt:**  
„Gib mir eine klare Definition von Injection, plus typische Arten (SQL, NoSQL, OS Command, LDAP etc.).“

3) **Prompt:**  
„Erkläre den Zusammenhang zwischen CWE und OWASP Top 10 – was ist der Unterschied? Bitte mit Beispiel SQL Injection.“

4) **Prompt:**  
„Welche CWE steht für SQL Injection? Bitte offizielle Definition nennen.“

5) **Prompt:**  
„Was ist der Unterschied zwischen OWASP Top 10 Risks und OWASP Proactive Controls? Welche Proactive Controls helfen gegen Injection?“

6) **Prompt:**  
„Erstelle mir einen Validierungs-Log: Liste Kernaussagen aus der Erklärung und bestätige sie mit offiziellen Quellen.“

---

## 4. Konsultierte Quellen (offiziell / primär)

### OWASP (Top 10 / Injection / Proactive Controls)
- OWASP Top 10:2025 – Liste (A05 Injection enthalten) :contentReference[oaicite:17]{index=17}  
- OWASP Top 10:2025 – A05 Injection Detailseite :contentReference[oaicite:18]{index=18}  
- OWASP Top 10:2021 – A03 Injection (Injection-Typen, Erklärung) :contentReference[oaicite:19]{index=19}  
- OWASP Community – Injection Theory (Definition) :contentReference[oaicite:20]{index=20}  
- OWASP Cheat Sheet Series – Index Proactive Controls (C1–C10 Übersicht) :contentReference[oaicite:21]{index=21}  
- OWASP Projekt/Spotlight – Proactive Controls Übersicht :contentReference[oaicite:22]{index=22}  

### MITRE (CWE)
- MITRE CWE-89: SQL Injection (offizielle CWE-Definition) :contentReference[oaicite:23]{index=23}  

---

## 5. Kurz-Fazit (für deine Abgabe)
- **Injection** ist eine zentrale OWASP Top 10 Risiko-Kategorie (2025: **A05**). :contentReference[oaicite:24]{index=24}  
- **CWE** liefert die **konkreten** Schwächen (z.B. **CWE-89 SQL Injection**) unter der OWASP-Kategorie Injection. :contentReference[oaicite:25]{index=25}  
- **Proactive Controls** liefern **konkrete Präventionsmaßnahmen** (z.B. Secure DB Access, Input Validation, Encode/Escape), während die OWASP Top 10 die **Risiko-Landkarte** beschreibt. :contentReference[oaicite:26]{index=26}  

---
