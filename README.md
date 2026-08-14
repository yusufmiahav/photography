# yusufshoots.com — deployment guide (UGREEN DXP2800)

A single Docker container serves the whole site: the public pages, the booking flow
(real Stripe Checkout), the client galleries, and your Studio admin. All data lives
in `./data` next to the compose file — back that folder up and you've backed up the
business.

## What's in here

```
deploy/
├── docker-compose.yml     # one service (+ optional Cloudflare Tunnel)
├── Dockerfile
├── .env.example           # copy to .env and fill in
├── server/                # Node backend (Express + Stripe, JSON storage)
└── site/index.html        # the frontend
```

## 1. Prepare the NAS

1. In UGOS Pro, install **Docker** from the App Center.
2. Copy this whole `deploy/` folder to a share on the NAS, e.g. `/volume1/docker/yusufshoots`.
3. SSH in (or use the Docker app's compose UI) and `cd` to that folder.

## 2. Configure

```bash
cp .env.example .env
nano .env
```

- `ADMIN_PASSWORD` — your Studio login. Long and unique.
- `STRIPE_SECRET_KEY` — start with your **test** key (`sk_test_…`).
- `STRIPE_WEBHOOK_SECRET` — comes in step 5, leave the placeholder for now.
- `PUBLIC_URL=https://yusufshoots.com`

## 3. Start it

```bash
docker compose up -d --build
```

The site is now on `http://<nas-ip>:8080`. Check it loads on your LAN before going public.

## 4. Put it on yusufshoots.com (pick ONE)

**Option A — Cloudflare Tunnel (recommended).** No ports opened on your router,
free automatic HTTPS, hides your home IP.

1. Move your domain's DNS to Cloudflare (free plan).
2. Zero Trust → Networks → Tunnels → **Create a tunnel** → copy the token.
3. Add a public hostname: `yusufshoots.com` → `http://site:8080`.
4. Put the token in `.env` (`CLOUDFLARE_TUNNEL_TOKEN=…`), uncomment the
   `cloudflared` service in `docker-compose.yml`, then `docker compose up -d`.

**Option B — port forwarding.** Forward ports 80/443 on your router to the NAS and
run a reverse proxy (e.g. Nginx Proxy Manager) with a Let's Encrypt cert for
`yusufshoots.com` → `yusufshoots:8080`. Works, but exposes your IP and needs a
static IP or dynamic-DNS.

## 5. Wire up Stripe

1. dashboard.stripe.com → **Developers → Webhooks → Add endpoint**
   - URL: `https://yusufshoots.com/api/stripe/webhook`
   - Events: `checkout.session.completed`
2. Copy the **Signing secret** (`whsec_…`) into `.env`, then `docker compose up -d`.
3. **Test the whole flow with test keys first**: book a date on the live site using
   card `4242 4242 4242 4242`. Confirm the booking appears in the Studio and the
   date blocks out.
4. Swap `.env` to your **live** key + the live webhook's secret, restart, done.

Refunds: the Studio's "Issue refund" button calls Stripe's refund API for the real
payment and reopens the date.

## 6. Using the Studio

Open the site → scroll to the footer → click the invisible corner bottom-right →
log in with `ADMIN_PASSWORD`. Everything (galleries, bookings, availability,
discounts, website content, enquiries) now saves to the server, so it's visible to
every visitor — not just your browser.

## Backups

Everything lives in `./data` (`db.json` + `uploads/`). Use UGOS's backup app to
snapshot that folder on a schedule. To restore: put the folder back and
`docker compose up -d`.

## Updating the site

Replace `site/index.html` (and/or `server/server.js`) with a newer version, then:

```bash
docker compose up -d --build
```

## Notes & limits

- Prices are enforced server-side in `server/server.js` (`PACKAGES`). If you change
  package prices in the frontend, change them there too.
- Uploaded images/films are stored in `data/uploads` and served from `/u/…`.
- Client gallery favourites stay per-visitor (their device); comments are shared
  and stored on the server.
- The contact form and quote requests land in Studio → Enquiries. If you want
  email notifications for new enquiries/bookings, that's a small add-on later
  (e.g. SMTP or a free Resend account).
