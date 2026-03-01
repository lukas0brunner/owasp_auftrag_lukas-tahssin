# Recherche-Auftrag  
## Thema: OWASP A05:2025 – Injection  
## Schwerpunkt:
- Zusammenhang zwischen CWE und OWASP Top 10 Risk  
- Unterschied zwischen OWASP Top 10 Risk und OWASP Proactive Controls  

---

# 1. KI-Erklärung der Themenbereiche

## 1.1 Was ist OWASP Top 10 (Risk)?

Die **OWASP Top 10** ist ein Awareness-Dokument des Open Web Application Security Project (OWASP).  
Sie beschreibt die **zehn kritischsten Sicherheitsrisiken für Webanwendungen**.

Wichtig:
- Es handelt sich um **Risikokategorien**, nicht um konkrete einzelne Schwachstellen.
- Die Liste wird regelmässig aktualisiert (z. B. 2021, 2025).
- Ziel ist Sensibilisierung und Priorisierung von Sicherheitsmassnahmen.

Offizielle Quelle:  
https://owasp.org/Top10/

---

## 1.2 Was ist CWE?

**CWE (Common Weakness Enumeration)** ist eine von MITRE gepflegte Klassifikation von Software-Schwachstellen.

Im Unterschied zu OWASP:
- OWASP Top 10 = Risiko-Kategorien
- CWE = konkrete Schwächenklassen

Beispiel:
- CWE-89 = SQL Injection
- CWE-79 = Cross-Site Scripting

Offizielle Quelle:  
https://cwe.mitre.org/

Beispiel CWE-89:  
https://cwe.mitre.org/data/definitions/89.html

---

## 1.3 Zusammenhang zwischen OWASP Top 10 und CWE

Die OWASP Top 10 Kategorien basieren auf einer Aggregation mehrerer konkreter Schwächen (CWE).

Beispiel:
Die Kategorie **Injection** (A03:2021, A05:2025) umfasst u. a.:

- CWE-89 (SQL Injection)
- CWE-79 (XSS)
- CWE-77 (Command Injection)

OWASP ordnet diese CWEs explizit den jeweiligen Kategorien zu.

Beispielquelle (Injection 2021 mit CWE-Auflistung):  
https://owasp.org/Top10/A03_2021-Injection/

---

# 2. Unterschied: OWASP Top 10 Risk vs. OWASP Proactive Controls

## 2.1 OWASP Top 10 Risk

Die OWASP Top 10 beschreibt:

- Welche Sicherheitsrisiken am häufigsten auftreten
- Welche Risiken den höchsten Impact haben
- Welche Kategorien bei Webanwendungen besonders kritisch sind

Es beantwortet die Frage:

> „Welche Arten von Sicherheitsproblemen sind besonders relevant?“

Offizielle Quelle:  
https://owasp.org/Top10/

---

## 2.2 OWASP Proactive Controls

Die **OWASP Proactive Controls** sind konkrete Entwicklungsrichtlinien.  
Sie beschreiben, welche Sicherheitsmassnahmen Entwickler bereits während der Implementierung berücksichtigen sollen.

Es beantwortet die Frage:

> „Wie soll ich sicher programmieren, um diese Risiken zu vermeiden?“

Offizielle Projektseite:  
https://owasp.org/www-project-proactive-controls/

Developer Guide (Proactive Controls Übersicht):  
https://devguide.owasp.org/en/05-implementation/01-documentation/01-proactive-controls/

---

## 2.3 Kerndifferenz

| OWASP Top 10 Risk | OWASP Proactive Controls |
|------------------|--------------------------|
| Risiko-Kategorien | Konkrete Sicherheitspraktiken |
| Beschreibt "Was ist gefährlich?" | Beschreibt "Wie verhindere ich es?" |
| Awareness-Dokument | Engineering-Guideline |
| Strategische Sicht | Operative Umsetzung |

---

# 3. Prompt-Log (Dokumentation der KI-Nutzung)

Die folgenden Prompts wurden verwendet, um die Themenbereiche zu erarbeiten:

---

### Prompt 1
„Erkläre mir, was die OWASP Top 10 sind und welches Ziel sie verfolgen.“

---

### Prompt 2
„Was ist die Common Weakness Enumeration (CWE) und wie unterscheidet sie sich von OWASP Top 10?“

---

### Prompt 3
„Wie hängen OWASP Top 10 Kategorien mit konkreten CWEs zusammen?“

---

### Prompt 4
„Erkläre mir den Unterschied zwischen OWASP Top 10 Risk und OWASP Proactive Controls.“

---

### Prompt 5
„Welche offiziellen Quellen bestätigen diese Aussagen? Bitte nur OWASP oder MITRE.“

---

# 4. Validierungs-Log (Quellenprüfung der KI-Aussagen)

## Aussage 1:
„OWASP Top 10 ist ein Awareness-Dokument zu den kritischsten Web-Sicherheitsrisiken.“

Validierung:  
Bestätigt durch offizielle OWASP-Seite:  
https://owasp.org/Top10/

---

## Aussage 2:
„CWE ist eine Klassifikation konkreter Software-Schwächen.“

Validierung:  
Bestätigt durch MITRE:  
https://cwe.mitre.org/

---

## Aussage 3:
„OWASP Top 10 Kategorien bestehen aus mehreren zugeordneten CWEs.“

Validierung:  
Beispiel Injection-Seite (2021) mit Notable CWEs:  
https://owasp.org/Top10/A03_2021-Injection/

---

## Aussage 4:
„OWASP Proactive Controls enthalten konkrete Entwicklungsrichtlinien.“

Validierung:  
Offizielle Projektseite:  
https://owasp.org/www-project-proactive-controls/

Developer Guide:  
https://devguide.owasp.org/en/05-implementation/01-documentation/01-proactive-controls/

---

# 5. Zusammenfassung (Kurzfazit)

- OWASP Top 10 beschreibt die wichtigsten Sicherheitsrisiken für Webanwendungen.
- CWE klassifiziert konkrete technische Schwächen.
- OWASP Top 10 Kategorien basieren auf aggregierten CWE-Daten.
- OWASP Proactive Controls liefern konkrete Entwicklungsmaßnahmen zur Risikominimierung.
- Top 10 = „Was ist gefährlich?“  
- Proactive Controls = „Wie verhindere ich es?“

---

# Ende des Recherche-Auftrags
(Demonstration und Code folgen separat)
