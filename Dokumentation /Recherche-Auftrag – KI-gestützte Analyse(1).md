# **Recherche-Auftrag – KI-gestützte Analyse** {#recherche-auftrag-–-ki-gestützte-analyse}

[Recherche-Auftrag – KI-gestützte Analyse](#recherche-auftrag-–-ki-gestützte-analyse)

[1\. Ziel des Recherche-Auftrags](#1.-ziel-des-recherche-auftrags)

[2\. Zusammenhang zwischen CWE und OWASP Top 10](#2.-zusammenhang-zwischen-cwe-und-owasp-top-10)

[2.1 Was ist CWE?](#2.1-was-ist-cwe?)

[2.2 Was ist OWASP Top 10?](#2.2-was-ist-owasp-top-10?)

[2.3 Beziehung zwischen CWE und OWASP](#2.3-beziehung-zwischen-cwe-und-owasp)

[Beispiel](#beispiel)

[2.4 Warum das wichtig ist](#2.4-warum-das-wichtig-ist)

[3\. Unterschied zwischen OWASP Top 10 und OWASP Proactive Controls](#3.-unterschied-zwischen-owasp-top-10-und-owasp-proactive-controls)

[3.1 Ziel der OWASP Top 10](#3.1-ziel-der-owasp-top-10)

[3.2 Ziel der OWASP Proactive Controls](#3.2-ziel-der-owasp-proactive-controls)

[3.3 Wichtige Unterschiede](#3.3-wichtige-unterschiede)

[3.4 Beispiele](#3.4-beispiele)

[3.5 Bezug zu meiner Demo](#3.5-bezug-zu-meiner-demo)

[4\. Prompt-Log (KI-Nutzung)](#4.-prompt-log-\(ki-nutzung\))

[5\. Validierungs-Log](#5.-validierungs-log)

[5.1 Ergebnis der Validierung](#5.1-ergebnis-der-validierung)

[6\. Fazit](#6.-fazit)

[Ergänzung: KI-Nutzung bei der Demo-Umsetzung](#ergänzung:-ki-nutzung-bei-der-demo-umsetzung)

[7\. Einsatz der KI für die praktische Demo](#7.-einsatz-der-ki-für-die-praktische-demo)

[8\. Relevante Prompts für die Demo](#8.-relevante-prompts-für-die-demo)

[9\. Eigene Anpassungen](#9.-eigene-anpassungen)

[10\. Fazit zur KI-Nutzung in der Demo](#10.-fazit-zur-ki-nutzung-in-der-demo)

## 

## **1\. Ziel des Recherche-Auftrags** {#1.-ziel-des-recherche-auftrags}

In diesem Auftrag wurde KI benutzt, um zwei Themen besser zu verstehen:

* Zusammenhang zwischen CWE und OWASP Top 10

* Unterschied zwischen OWASP Top 10 und OWASP Proactive Controls

Die Aussagen der KI wurden danach mit offiziellen Quellen überprüft.  
 Dieser Teil gehört nicht zur Live-Demo, sondern nur zur Dokumentation.

---

# **2\. Zusammenhang zwischen CWE und OWASP Top 10** {#2.-zusammenhang-zwischen-cwe-und-owasp-top-10}

## **2.1 Was ist CWE?** {#2.1-was-ist-cwe?}

Die Common Weakness Enumeration (CWE) ist eine Liste von bekannten Software-Schwachstellen.  
 Sie beschreibt konkrete technische Fehler im Code.

Beispiele:

* CWE-79: Cross-Site Scripting

* CWE-89: SQL Injection

* CWE-362: Race Condition

CWE ist eher technisch und detailliert.

---

## **2.2 Was ist OWASP Top 10?** {#2.2-was-ist-owasp-top-10?}

Die OWASP Top 10 ist eine Liste der wichtigsten Sicherheitsrisiken bei Webanwendungen.  
 Hier geht es nicht um einzelne Fehler, sondern um grössere Risiko-Kategorien.

Beispiele:

* A01: Broken Access Control

* A05: Injection

* A07: Authentication Failures

Die OWASP Top 10 zeigt also die wichtigsten Risiken.

---

## **2.3 Beziehung zwischen CWE und OWASP** {#2.3-beziehung-zwischen-cwe-und-owasp}

CWE und OWASP gehören zusammen, haben aber verschiedene Aufgaben.

* CWE beschreibt einzelne technische Schwachstellen.

* OWASP Top 10 fasst viele Schwachstellen zu Risiko-Gruppen zusammen.

Eine OWASP-Kategorie enthält meistens mehrere CWE-Einträge.

### **Beispiel** {#beispiel}

Die Kategorie **A01: Broken Access Control** enthält unter anderem:

* CWE-284: Improper Access Control

* CWE-285: Improper Authorization

* CWE-362: Race Condition

**Bezug zu meiner Demo**

In meiner Demo geht es um eine Race Condition beim Coupon.

Einordnung:

* Schwachstelle: CWE-362

* OWASP-Risiko: A01 Broken Access Control

Damit ist die Demo korrekt eingeordnet.

---

## **2.4 Warum das wichtig ist** {#2.4-warum-das-wichtig-ist}

Der Zusammenhang hilft in der Praxis:

* Entwickler finden mit CWE konkrete Fehler.

* Security-Teams sehen mit OWASP die wichtigsten Risiken.

* Firmen bekommen so einen besseren Überblick.

---

# **3\. Unterschied zwischen OWASP Top 10 und OWASP Proactive Controls** {#3.-unterschied-zwischen-owasp-top-10-und-owasp-proactive-controls}

## **3.1 Ziel der OWASP Top 10** {#3.1-ziel-der-owasp-top-10}

Die OWASP Top 10 zeigt die häufigsten und wichtigsten Sicherheitsprobleme.

Sie beantwortet die Frage:

Wo gehen Systeme oft kaputt?

---

## **3.2 Ziel der OWASP Proactive Controls** {#3.2-ziel-der-owasp-proactive-controls}

Die OWASP Proactive Controls richten sich an Entwickler.  
 Sie zeigen, wie man Software sicher baut.

Hier geht es um die Frage:

Wie kann ich Sicherheitsprobleme vermeiden?

---

## **3.3 Wichtige Unterschiede** {#3.3-wichtige-unterschiede}

| OWASP Top 10 | OWASP Proactive Controls |
| ----- | ----- |
| Liste von Risiken | Liste von Best Practices |
| zeigt Probleme | zeigt Lösungen |
| eher reaktiv | eher präventiv |
| für Risikoanalyse | für Entwickler |

---

## **3.4 Beispiele** {#3.4-beispiele}

**OWASP Top 10**

* A01: Broken Access Control

* A05: Injection

→ beschreibt Risiken

**OWASP Proactive Controls**

* C1: Implement Access Control

* C3: Validate Input

* C5: Validate All Inputs

→ beschreibt Gegenmassnahmen

---

## **3.5 Bezug zu meiner Demo** {#3.5-bezug-zu-meiner-demo}

In meiner Demo zeige ich:

* OWASP-Risiko: A01 Broken Access Control

* konkrete Schwachstelle: Race Condition (CWE-362)

Eine passende Proactive Control ist:

* C1: Implement Access Control

Diese zeigt, wie man den Fehler verhindern kann, zum Beispiel mit atomischen Updates.

---

# **4\. Prompt-Log (KI-Nutzung)** {#4.-prompt-log-(ki-nutzung)}

Für die Recherche wurden diese Prompts verwendet:

**Prompt 1**  
 Erkläre den Zusammenhang zwischen CWE und OWASP Top 10\.

---

**Prompt 2**  
 Was ist der Unterschied zwischen OWASP Top 10 und OWASP Proactive Controls?

---

**Prompt 3**  
 Welche CWE ist mit Race Conditions in Webanwendungen verbunden?

---

**Prompt 4**  
 Unter welche OWASP-Kategorie kann eine Coupon-Race-Condition fallen?

---

**Prompt 5**  
 Gehören Race Conditions zu Broken Access Control?

---

**Prompt 6**  
 Ab wann gehören Race Conditions zu Broken Access Control und ab wann zu Mishandling of Exceptional Conditions?

---

# **5\. Validierungs-Log** {#5.-validierungs-log}

Zur Überprüfung wurden folgende Quellen genutzt:

* OWASP Top 10 Project  
   [https://owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/)

* MITRE CWE-362 Race Condition  
   [https://cwe.mitre.org/data/definitions/362.html](https://cwe.mitre.org/data/definitions/362.html)

* TryHackeMe Race Conditions  
  [https://tryhackme.com/room/raceconditionsattacks](https://tryhackme.com/room/raceconditionsattacks) 

* OWASP Proactive Controls  
   [https://owasp.org/www-project-proactive-controls/](https://owasp.org/www-project-proactive-controls/)

---

## **5.1 Ergebnis der Validierung** {#5.1-ergebnis-der-validierung}

Die wichtigsten Aussagen der KI konnten bestätigt werden:

* OWASP Top 10 ist eine Risiko-Übersicht.

* CWE beschreibt konkrete Schwachstellen.

* Race Conditions sind CWE-362.

* Broken Access Control kann durch Race Conditions entstehen.

* Proactive Controls zeigen präventive Massnahmen.

Es wurden keine wichtigen Widersprüche gefunden.

---

# **6\. Fazit** {#6.-fazit}

CWE, OWASP Top 10 und OWASP Proactive Controls haben unterschiedliche Aufgaben, ergänzen sich aber.

* CWE beschreibt konkrete technische Fehler.

* OWASP Top 10 zeigt die wichtigsten Risiken.

* OWASP Proactive Controls zeigen, wie man Software sicher baut.

Die Coupon-Race-Condition aus meiner Demo gehört zu CWE-362 und fällt unter OWASP A01 Broken Access Control.

# **Ergänzung: KI-Nutzung bei der Demo-Umsetzung** {#ergänzung:-ki-nutzung-bei-der-demo-umsetzung}

## **7\. Einsatz der KI für die praktische Demo** {#7.-einsatz-der-ki-für-die-praktische-demo}

Neben der Recherche wurde KI auch für die technische Umsetzung der Demo verwendet. Ziel war es, ein einfaches und realistisches Beispiel für Broken Access Control mit einer Race Condition zu erstellen.

Die KI wurde vor allem genutzt für:

* Aufbau einer minimalen Full-Stack-Demo

* Ideen für das Coupon-Race-Condition-Szenario

* Beispielcode für eine verwundbare Implementierung

* Vorschläge für eine sichere Fix-Variante

* Hinweise zur stabilen Reproduzierbarkeit der Race Condition

Der finale Code wurde von mir geprüft und angepasst.

---

## **8\. Relevante Prompts für die Demo** {#8.-relevante-prompts-für-die-demo}

Nachfolgend eine Auswahl der wichtigsten Prompts im Zusammenhang mit der Demo.

**Prompt A**  
 How can I build a minimal webshop demo to demonstrate a race condition in coupon usage?

**Zweck:**  
 Passende Demo-Architektur finden.

---

**Prompt B**  
 Show a vulnerable example where a coupon is checked and then invalidated (race condition risk).

**Zweck:**  
 Verwundbare Logik verstehen.

---

**Prompt C**  
 How can I fix a coupon race condition using an atomic database update?

**Zweck:**  
 Geeignete Gegenmassnahme für die sichere Version.

---

**Prompt D**  
 How can I make a race condition easier to reproduce in a demo environment?

**Zweck:**  
 Die Demo stabil und nachvollziehbar machen (z. B. durch eine kleine künstliche Verzögerung).

---

Es wurden bewusst nur die wichtigsten Prompts dokumentiert.

---

## **9\. Eigene Anpassungen** {#9.-eigene-anpassungen}

Die von der KI vorgeschlagenen Beispiele wurden nicht unverändert übernommen. Ich habe insbesondere:

* die Demo bewusst vereinfacht

* das Coupon-Szenario angepasst

* eine kleine Verzögerung für reproduzierbare Race Conditions eingebaut

* die Darstellung für die Live-Demo optimiert

So wurde sichergestellt, dass die Demo verständlich und stabil funktioniert.

---

## **10\. Fazit zur KI-Nutzung in der Demo** {#10.-fazit-zur-ki-nutzung-in-der-demo}

Die KI war hilfreich für Ideen, Struktur und Beispielcode.  
 Die eigentliche Umsetzung, Anpassung und das Testen der Demo erfolgten jedoch eigenständig.

Durch die Kombination aus KI-Unterstützung und eigener Überprüfung konnte eine funktionierende und fachlich korrekte Demonstration erstellt werden.

