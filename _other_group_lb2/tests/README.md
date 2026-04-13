# Other group - Security test harness

Diese Tests sind dafuer gedacht, Phase-2-Testfaelle reproduzierbar zu belegen.

- Fokus: Static/config/code-level checks (ohne Server zu starten), damit die Tests direkt auf den abgegebenen Dateien laufen.
- `helpers.cjs` sucht die andere Gruppenabgabe automatisch ueber `OTHER_GROUP_ROOT`, danach ueber den lokalen Downloads-Pfad und zuletzt ueber `lb2-app` im Repo.
- Manuelle Laufzeit-Checks aus dem Testprotokoll bleiben in `phase2-other-group.test.cjs` bewusst als `test.skip(...)` markiert.
