# Erweiterung der TODO-Listen-Applikation

## Projekt: LB2 – Penetrationtesting Auftrag  
**Modul:** M183  
**Applikation:** TODO-Listen-App (Node.js)

---

# 1. Geplante Erweiterung

Unsere Gruppe plant die Implementierung eines **Schutzmechanismus gegen Brute-Force-Angriffe auf die Login-Funktion** der TODO-Listen-Applikation. Zusätzlich sollen **Login-Aktivitäten protokolliert werden**, um verdächtige Zugriffsversuche erkennen und analysieren zu können.

Bei Brute-Force-Angriffen versuchen Angreifer durch eine grosse Anzahl an Login-Versuchen Passwörter zu erraten. Ohne Schutzmechanismen kann ein Angreifer dadurch Benutzerkonten kompromittieren. Die Erweiterung soll solche Angriffe erschweren bzw. verhindern.

Die Erweiterung verbessert insbesondere die Schutzziele der Informationssicherheit **Confidentiality** und **Integrity**, da unbefugte Zugriffe auf Benutzerkonten verhindert werden.

---

# 2. Funktionsweise der Erweiterung

Die Login-Funktion der Applikation wird erweitert, sodass wiederholte fehlgeschlagene Login-Versuche erkannt und begrenzt werden.

Geplante Funktionen:

- Nach **mehreren fehlgeschlagenen Login-Versuchen (z.B. 5 Versuche)** wird der Benutzeraccount temporär gesperrt.
- Die Sperrzeit beträgt **ca. 10–15 Minuten**.
- Während dieser Zeit kann sich der Benutzer nicht erneut anmelden.
- Nach erfolgreichem Login wird der Zähler der Fehlversuche wieder zurückgesetzt.

Zusätzlich werden **Login-Aktivitäten protokolliert**, damit sicherheitsrelevante Ereignisse nachvollzogen werden können.

Folgende Informationen werden gespeichert:

- Benutzername
- Zeitpunkt des Login-Versuchs
- IP-Adresse des Clients
- Ergebnis des Login-Versuchs (erfolgreich oder fehlgeschlagen)

Diese Informationen können später für Sicherheitsanalysen oder zur Erkennung von Angriffsmustern verwendet werden.

---

# 3. Verwendete Technologien und Libraries

Die Erweiterung wird mit folgenden Technologien umgesetzt:

- **Node.js**
- **Express.js** (Backend-Framework der bestehenden Applikation)
- **express-rate-limit** zur Begrenzung von Login-Versuchen
- **bcrypt** zur sicheren Passwortprüfung
- **SQLite / vorhandene Datenbank** zur Speicherung von Login-Versuchen oder Sperrstatus

Zusätzlich kann eine Middleware implementiert werden, welche Login-Versuche überwacht und entsprechende Schutzmechanismen aktiviert.

---

# 4. Integration in die bestehende Applikation

Die Erweiterung wird direkt in die bestehende Login-Funktion integriert.

Geplante Anpassungen:

- Erweiterung der Login-Route im Backend
- Implementierung einer Middleware zur Überwachung von Login-Versuchen
- Speicherung von Login-Versuchen in der Datenbank oder in Log-Dateien
- Anpassung der Fehlermeldungen, sodass keine sensiblen Informationen über Benutzerkonten preisgegeben werden

Die Änderungen erfolgen hauptsächlich im Bereich der **Authentifizierungslogik und der Login-Routen** der Applikation.

---

# 5. Beitrag zu den Schutzzielen der Informationssicherheit (CIA)

Die Erweiterung unterstützt folgende Sicherheitsziele:

### Confidentiality (Vertraulichkeit)
Unbefugte Zugriffe auf Benutzerkonten werden erschwert, wodurch sensible Daten geschützt werden.

### Integrity (Integrität)
Verhindert Manipulation von TODO-Einträgen durch kompromittierte Benutzerkonten.

### Availability (Verfügbarkeit)
Durch Rate-Limiting wird verhindert, dass Login-Angriffe das System überlasten.