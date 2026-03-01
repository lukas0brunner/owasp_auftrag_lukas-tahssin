# Quiz – OWASP A05:2025 Injection

## Thema: SQL Injection (CWE-89)

Beantworte die folgenden Fragen.  
Pro Frage ist **nur eine Antwort korrekt**.

---

## Frage 1

Was ist die Hauptursache für SQL Injection?

A) Fehlende HTTPS-Verschlüsselung  
B) String-Konkatenation mit untrusted Input im SQL-Statement  
C) Zu viele Datenbanktabellen  

**Richtige Antwort:** B  

---

## Frage 2

Warum ist folgende SQL-Struktur unsicher?

SELECT * FROM users WHERE username = '<input>';

A) Weil SELECT immer unsicher ist  
B) Weil der Benutzerinput direkt Teil der SQL-Struktur wird  
C) Weil WHERE nicht verwendet werden darf  

**Richtige Antwort:** B  

---

## Frage 3

Was ist der Hauptzweck von Prepared Statements?

A) SQL-Abfragen schneller zu machen  
B) Benutzerinput automatisch zu verschlüsseln  
C) SQL-Struktur und Benutzerdaten strikt zu trennen  

**Richtige Antwort:** C  

---

## Frage 4

Welche der folgenden Auswirkungen kann SQL Injection haben?

A) Umgehung der Authentifizierung  
B) Erhöhung der Server-Geschwindigkeit  
C) Verbesserung der Datenbankstruktur  

**Richtige Antwort:** A  

---

## Frage 5

Zu welcher Kategorie gehört SQL Injection laut MITRE?

A) CWE-79  
B) CWE-89  
C) CWE-200  

**Richtige Antwort:** B  

---

# Ende des Quiz
