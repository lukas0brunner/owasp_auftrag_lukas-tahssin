# Erweiterung der TODO-Listen-Applikation

## Projekt: LB2 – Penetrationtesting Auftrag  
**Modul:** M183  
**Applikation:** TODO-Listen-App (Node.js)

---

## 1. Geplante Erweiterung

Unsere Gruppe plant die Implementierung einer Funktion zum **Löschen eines Benutzerkontos** inklusive der **zugehörigen personenbezogenen Daten und allfälliger dem Benutzer zugewiesener Tasks**.

Ziel dieser Erweiterung ist es, datenschutzrelevante Anforderungen besser umzusetzen, insbesondere das Prinzip des **„Rechts auf Vergessen“**. Wenn ein Benutzer sein Konto nicht mehr verwenden möchte, soll er die Möglichkeit haben, seine Daten aus der Applikation entfernen zu lassen.

Ohne eine solche Funktion bleiben persönliche Daten und Benutzerbezüge unnötig lange im System gespeichert. Dies stellt aus Sicht des Datenschutzes und der Informationssicherheit ein Problem dar. Die Erweiterung reduziert dieses Risiko, indem personenbezogene Informationen gezielt und kontrolliert gelöscht werden.

Die Erweiterung verbessert insbesondere die Schutzziele **Confidentiality** und **Integrity**:
- **Confidentiality**, weil personenbezogene Daten nicht unnötig im System verbleiben
- **Integrity**, weil beim Löschen sichergestellt wird, dass auch abhängige Daten konsistent behandelt werden

---

## 2. Funktionsweise der Erweiterung

Die TODO-Listen-Applikation wird um eine Funktion erweitert, mit der ein Benutzer sein eigenes Konto löschen kann. Dabei werden auch die Daten behandelt, die direkt mit diesem Benutzer verknüpft sind.

Geplante Funktionen:

- Ein eingeloggter Benutzer kann die Löschung seines eigenen Kontos auslösen
- Vor dem Löschen muss die Aktion nochmals bestätigt werden
- Das Benutzerkonto wird dauerhaft aus der Datenbank entfernt
- Alle Tasks, die diesem Benutzer eindeutig zugewiesen sind, werden ebenfalls gelöscht oder vom Benutzerbezug getrennt
- Nach dem Löschen wird die Session des Benutzers beendet
- Der Benutzer wird automatisch ausgeloggt und kann sich mit dem gelöschten Konto nicht mehr anmelden

Je nach Datenmodell der Applikation gibt es zwei mögliche Varianten für die Behandlung der Tasks:

### Variante A – Vollständiges Löschen
Falls Tasks ausschliesslich zu einem Benutzer gehören, werden diese beim Löschen des Kontos ebenfalls gelöscht.

### Variante B – Trennen des Benutzerbezugs
Falls Tasks fachlich erhalten bleiben sollen, wird nur die Verknüpfung zum Benutzer entfernt bzw. anonymisiert.

Für unsere Applikation ist vorgesehen, die Lösung so umzusetzen, dass **personenbezogene Daten sauber entfernt werden** und **keine verwaisten Datensätze** entstehen.

---

## 3. Verwendete Technologien und Libraries

Die Erweiterung wird mit folgenden Technologien umgesetzt:

- **Node.js**
- **Express.js** als Backend-Framework
- **SQLite / vorhandene Datenbank** zur Speicherung der Benutzer und Tasks
- **express-session** bzw. bestehende Session-Verwaltung für Logout nach Löschung
- **bcrypt** falls zur erneuten Passwortbestätigung vor dem Löschen verwendet
- SQL-Statements oder ORM-Logik zum sicheren Entfernen zusammenhängender Daten

Zusätzlich können serverseitige Prüfungen eingebaut werden, damit:

- nur der authentifizierte Benutzer sein eigenes Konto löschen darf
- keine unautorisierten Löschanfragen möglich sind
- referenzielle Integrität in der Datenbank gewahrt bleibt

---

## 4. Integration in die bestehende Applikation

Die Erweiterung wird in die bestehende Benutzerverwaltung und Authentifizierungslogik integriert.

Geplante Anpassungen:

- Ergänzung einer neuen Route, z. B. `/account/delete`
- Einbau einer serverseitigen Prüfung, ob der Benutzer eingeloggt ist
- Implementierung einer Löschlogik für Benutzer und abhängige Tasks
- Beenden der aktiven Session nach erfolgreicher Kontolöschung
- Anpassung der Benutzeroberfläche, damit der Benutzer die Funktion sicher auslösen kann
- Optional: Sicherheitsabfrage durch erneute Passworteingabe oder Bestätigungsdialog

Die Änderungen betreffen vor allem folgende Bereiche:

- Benutzerverwaltung
- Authentifizierung / Session-Handling
- Datenbankzugriffe auf Benutzer und Tasks
- Frontend-Maske für Kontoverwaltung

---

## 5. Sicherheits- und Datenschutzaspekte

Bei der Umsetzung dieser Erweiterung müssen mehrere Sicherheitsaspekte berücksichtigt werden:

### Zugriffsschutz
Nur der aktuell eingeloggte Benutzer darf sein eigenes Konto löschen. Ein Benutzer darf niemals ein anderes Benutzerkonto löschen können.

### Schutz vor unbeabsichtigter Löschung
Die Löschung muss bewusst ausgelöst werden, z. B. durch:
- Bestätigungsdialog
- erneute Passworteingabe
- klar beschriftete Warnmeldung

### Konsistente Datenlöschung
Beim Entfernen des Benutzerkontos dürfen keine inkonsistenten oder verwaisten Datensätze entstehen. Deshalb müssen verknüpfte Tasks kontrolliert gelöscht oder vom Benutzer entkoppelt werden.

### Session-Invalidierung
Nach erfolgreicher Löschung muss die aktive Sitzung sofort beendet werden, damit kein weiterer Zugriff mit dem gelöschten Konto möglich ist.

### Minimierung von Daten
Die Erweiterung unterstützt das Prinzip, nur so viele personenbezogene Daten wie nötig zu speichern und diese bei Bedarf wieder zu entfernen.

---

## 6. Beitrag zu den Schutzzielen der Informationssicherheit (CIA)

### Confidentiality (Vertraulichkeit)
Personenbezogene Daten werden nach der Kontolöschung aus dem System entfernt. Dadurch sinkt das Risiko, dass ehemalige Benutzerdaten unberechtigt eingesehen oder missbraucht werden.

### Integrity (Integrität)
Die Erweiterung sorgt dafür, dass zusammenhängende Daten kontrolliert gelöscht oder korrekt angepasst werden. Dadurch bleibt die Datenbank konsistent und es entstehen keine fehlerhaften Referenzen.

### Availability (Verfügbarkeit)
Die Verfügbarkeit wird nicht direkt erhöht, jedoch verbessert eine saubere Datenhaltung die Stabilität und Wartbarkeit der Applikation. Inkonsistente Alt-Daten können so vermieden werden.

---

## 7. Geplante Tests der Erweiterung

Zur Überprüfung der Funktionalität und Sicherheit planen wir unter anderem folgende Tests:

- Benutzer kann eigenes Konto erfolgreich löschen
- Benutzer wird nach dem Löschen automatisch ausgeloggt
- Login mit gelöschtem Konto ist nicht mehr möglich
- Zugewiesene Tasks werden korrekt gelöscht oder anonymisiert
- Nicht eingeloggte Benutzer können die Löschfunktion nicht aufrufen
- Ein Benutzer kann kein anderes Konto löschen
- Direkte Requests auf die Delete-Route ohne gültige Session werden blockiert
- Nach der Löschung bleiben keine inkonsistenten Datenbankeinträge zurück

Diese Tests helfen dabei, sowohl funktionale wie auch sicherheitsrelevante Anforderungen zu überprüfen.

---

## 8. Fazit

Mit der Erweiterung **„Löschen eines Benutzerkontos inklusive zugewiesener Tasks“** wird die TODO-Listen-Applikation um eine datenschutzrelevante und sicherheitstechnisch sinnvolle Funktion ergänzt. Die Erweiterung unterstützt den kontrollierten Umgang mit personenbezogenen Daten und reduziert das Risiko, dass nicht mehr benötigte Benutzerinformationen im System verbleiben.

Gleichzeitig bietet die Erweiterung praktischen Mehrwert für die Benutzer und stärkt die Informationssicherheit der Applikation, insbesondere in den Bereichen **Vertraulichkeit**, **Datenkonsistenz** und **saubere Systemarchitektur**.