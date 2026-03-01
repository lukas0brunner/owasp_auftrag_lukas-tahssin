
# Prozessdokumentation – OWASP A05:2025 Injection

Autor:  
Datum:  
Projekt: SQL Injection Webdemo (Node.js / Express / SQLite)

---

## 1. Ziel der Dokumentation

Diese Dokumentation beschreibt die technische Funktionsweise der implementierten Webanwendung sowie die Ursache und Behebung der enthaltenen SQL-Injection-Schwachstellen.

Behandelt werden:

- Systemaufbau und Datenfluss
- Funktionsweise der Login- und Suchlogik
- Entstehung der Injection-Schwachstelle
- Sicherheitsauswirkungen
- Korrekte sichere Implementierung

Bezug:
OWASP Top 10 – Injection  
https://owasp.org/Top10/

CWE-89 – SQL Injection  
https://cwe.mitre.org/data/definitions/89.html

---

## 2. Systemübersicht

Technologien:

- Node.js
- Express
- SQLite (In-Memory)
- HTML / JavaScript Frontend

Komponenten:

- Login-Endpoint (POST /api/login)
- Such-Endpoint (GET /api/search)
- Admin-Endpoint (GET /api/admin)
- SQLite-Datenbank mit Tabelle "users"

---

## 3. Datenbankstruktur

Tabelle: users

Spalten:
- id (Primary Key)
- username (TEXT)
- password (TEXT)
- role (TEXT)

Beispieldaten:

alice / alice123 / user  
bob / bob123 / admin  
charlie / charlie123 / user  

---

## 4. Funktionsweise der Anwendung

### 4.1 Login-Prozess

Ablauf:

1. Benutzer gibt username und password ein.
2. Frontend sendet POST-Request an /api/login.
3. Backend liest req.body.username und req.body.password.
4. Backend erzeugt ein SQL-Statement.
5. SQLite führt das Statement aus.
6. Ergebnis wird als JSON zurückgegeben.

Unsichere SQL-Struktur (konzeptionell):

SELECT id, username, role  
FROM users  
WHERE username = '<username>'  
AND password = '<password>';

Hier wird der Benutzerinput direkt in die SQL-Struktur eingebaut.

---

### 4.2 Suchfunktion

Ablauf:

1. Benutzer gibt einen Suchbegriff ein.
2. Frontend sendet GET-Request an /api/search?q=...
3. Backend erzeugt eine LIKE-Abfrage.
4. SQLite liefert passende Datensätze zurück.

Unsichere SQL-Struktur (konzeptionell):

SELECT id, username, role  
FROM users  
WHERE username LIKE '%<q>%';

Auch hier wird der Benutzerinput direkt integriert.

---

## 5. Entstehung der Schwachstelle

Die Schwachstelle entsteht durch String-Konkatenation.

Problem:

- Benutzerinput wird ungefiltert in SQL eingefügt.
- Es findet keine Parametrisierung statt.
- Die Datenbank interpretiert den gesamten String als ausführbaren SQL-Code.

Wenn ein Benutzer SQL-Syntax eingibt, wird diese als Teil der Abfrage ausgeführt.

Dies entspricht der Definition von CWE-89:
Improper Neutralization of Special Elements used in an SQL Command.

---

## 6. Sicherheitsauswirkungen

Durch SQL Injection kann ein Angreifer:

- Authentifizierung umgehen
- Rollenbasierte Zugriffskontrollen umgehen
- Als Administrator auftreten
- Alle Benutzerdaten auslesen
- Datenbanklogik manipulieren

Injection zählt laut OWASP zu den kritischsten Web-Sicherheitsrisiken.

---

## 7. Korrekte Implementierung (Soll-Zustand)

Die Lösung ist die Verwendung von Prepared Statements.

Sichere Login-Abfrage (konzeptionell):

SELECT id, username, role  
FROM users  
WHERE username = ?  
AND password = ?;

Die Parameter werden separat gebunden und nicht in den SQL-String integriert.

Beispiel (Backend-Konzept):

db.get(sqlSafe, [username, password], callback)

---

## 8. Warum ist das sicher?

- SQL-Struktur wird fest definiert.
- Benutzerinput wird als Daten übergeben.
- SQL-Sonderzeichen im Input werden nicht als SQL-Code interpretiert.
- WHERE-Bedingungen können nicht manipuliert werden.

Damit wird SQL Injection vollständig verhindert.

---

## 9. Zusammenfassung

Die Webanwendung demonstriert eine klassische SQL-Injection-Schwachstelle.

Ursache:
String-Konkatenation mit untrusted input.

Auswirkung:
Manipulation von Authentifizierung und Datenzugriff.

Lösung:
Verwendung von Prepared Statements und Parameterbindung.

Injection entsteht nicht durch komplexe Angriffe,
sondern durch fehlende Trennung von Code und Daten.
