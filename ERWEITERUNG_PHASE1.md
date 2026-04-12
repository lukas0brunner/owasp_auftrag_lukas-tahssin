# Phase 1 – Erweiterung: Konto löschen inkl. Tasks

Autor: <Dein Name>  
Datum: 12.04.2026  
Projekt: LB2 – Penetrationtesting Auftrag (Modul M183)

## 1. Ziel der Erweiterung

Ich habe eine Funktion implementiert, mit der ein eingeloggter Benutzer **sein eigenes Konto löschen** kann. Dabei werden auch die **zugehörigen Tasks** entfernt. Damit setze ich das Prinzip „Recht auf Vergessen“ um und reduziere das Risiko, dass unnötig lange personenbezogene Daten gespeichert bleiben.

## 2. Umsetzung (Funktionsweise)

- `GET /account/delete`: Bestätigungsseite mit Warnhinweis und Passwortfeld
- `POST /account/delete`: Löscht Daten in einer DB-Transaktion:
  - Tasks des Users (`tasks`)
  - Berechtigungen (`permissions`)
  - Benutzerkonto (`users`)
- Danach wird die Session beendet und der Benutzer ausgeloggt.

Zusätzlich protokolliert die Applikation den Account-Delete als Audit-Event (ohne sensible Daten), damit sicherheitsrelevante Aktionen nachvollziehbar sind.

Hinweis: In der vorhandenen Codebasis werden Passwörter aktuell im Klartext gespeichert. Die Passwortbestätigung erfolgt deshalb per Vergleich. Eine Migration auf bcrypt/argon2 ist als Next Step vorgesehen.

Relevante Dateien:

- `lb2-app/todo-list-node/account/delete.js` (neu)
- `lb2-app/todo-list-node/app.js` (Routen + Profil-Link)

## 3. Security- und Datenschutzmassnahmen

- Zugriffsschutz: User-ID kommt ausschliesslich aus der serverseitigen Session (`req.session.user.id`).
- CSRF-Schutz: POST-Request benötigt gültigen CSRF Token.
- Schutz vor unbeabsichtigter Löschung: Bestätigung + erneute Passworteingabe.
- Konsistenz: Löschung in einer Transaktion (`BEGIN/COMMIT/ROLLBACK`), damit keine verwaisten Datensätze entstehen.
- Session-Invalidierung: Session wird nach erfolgreicher Löschung zerstört.
- Logging/Monitoring: Ein Audit-Log Event wird in der DB gespeichert (Event-Typ, User-ID, IP, User-Agent, Timestamp).

## 4. Beitrag zu CIA

- Confidentiality: personenbezogene Daten werden nach Löschung entfernt.
- Integrity: transaktionales Löschen verhindert inkonsistente Daten.
- Availability: indirekter Nutzen durch bessere Datenhygiene und Wartbarkeit.

## 5. Tests (geplant/durchgeführt)

- Benutzer kann eigenes Konto löschen.
- Benutzer ist nach dem Löschen ausgeloggt; Login mit gelöschtem Konto funktioniert nicht.
- Tasks des Benutzers werden mitgelöscht.
- Nicht eingeloggte Benutzer können die Route nicht ausführen.
- CSRF ohne Token wird blockiert.
- Ein Benutzer kann kein anderes Konto löschen.
- Audit-Log wird geschrieben (Erfolg und Fehlversuche, ohne Passwort/Secrets).
