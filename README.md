# OWASP A01 Demo - Broken Access Control (Race Condition beim Coupon)

Ultra-minimales Full-Stack-Demo-Projekt (Node.js + TypeScript + Express + SQLite). Ein Container, Port 3000.

**Build/Run**

1. Docker Image bauen:

```bash
docker build -t owasp-a01-demo .
```

2. Vulnerable Mode starten:

```bash
docker run --rm -p 3000:3000 -e MODE=vuln owasp-a01-demo
```

3. Fixed Mode starten:

```bash
docker run --rm -p 3000:3000 -e MODE=fixed owasp-a01-demo
```

Dann im Browser auf `http://localhost:3000`.

**Burp / Parallel Requests**

1. Starte im `vuln`-Mode und druecke im UI einmal `Reset`.
2. Sende mehrere parallele `POST /apply-coupon` Requests mit gleichem Body:

```json
{ "userId": "u1", "code": "TENOFF" }
```

Moegliche Burp-Varianten:
1. Burp Repeater: Request mehrfach klonen und gleichzeitig senden (z. B. mit "Send" in mehreren Tabs).
2. Burp Intruder / Turbo Intruder: Mehrere identische Requests parallel ausfuehren.

**Erwartetes Ergebnis**

- **vuln**: Der Discount erhoeht sich bei parallelen Requests mehrfach (z. B. 10, 20, 30 ...), obwohl der Coupon nur einmal genutzt werden sollte.
- **fixed**: Nur der erste Request ist erfolgreich, alle weiteren erhalten `409` mit `Coupon already used`.

**Endpoints**

- `GET /` liefert das Frontend.
- `GET /cart?userId=u1` liefert `{ subtotal, discount, total, appliedCoupons }`.
- `POST /apply-coupon` wendet den Coupon an.
- `POST /reset` setzt die Demo zurueck.
