# Pocketwall

A mobile-first console for a Sophos Firewall running SFOS 23. It talks to the firewall configuration REST API at `/api/firewall-config/v1` with an administrator API key as a bearer token.

The phone never calls the firewall directly. Pocketwall’s server forwards each request, which avoids browser certificate and cross-origin limits. The API key stays in the browser and is sent only to this app.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use **Preview sample data** to walk the screens, or connect to a firewall this computer can reach.

Optional environment variables are listed in `.env.example`.

- `POCKETWALL_PASSWORD` locks the site before it will call a firewall.
- `POCKETWALL_SECRET` signs that unlock cookie.
- `POCKETWALL_ALLOW_PRIVATE=1` lets the server call a private firewall address. Local runs already allow private addresses. Vercel does not, unless you set this and the server can actually route there.

## Firewall setup

1. Administration → API access: turn API access on.
2. Allowed IP hosts: add the address shown in Pocketwall under Settings. That is the public address of the Pocketwall server.
3. Administration → Device access: allow HTTPS admin from the zone the request arrives on.
4. Create a dedicated administrator, sign in as that account, and add an API key. Copy it before closing the dialog. It is shown once, lasts one year, and has the same permissions as that administrator.
5. In Pocketwall, enter the firewall hostname, admin port (usually 4444), and the key. Leave “Trust the appliance certificate” on when the firewall uses the default certificate.

A hosted Pocketwall cannot reach `192.168.x.x`, `10.x`, or other private addresses. Use a public admin hostname, or run Pocketwall on a machine on that network and allow that machine’s address instead.
