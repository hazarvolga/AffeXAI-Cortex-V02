# AffeXAI Mail Service Runbook

## Service ownership

- Coolify service: `affexai-mail`
- Resource UUID: `fnu2ihmmmk0jmc7v2kj5yaxq`
- Public administration URL: `https://mail.affexai.tr/admin`
- Mail server hostname: `mail.affexai.tr`
- Runtime: Stalwart `v0.16.26`
- Certificate exporter: `ghcr.io/kereis/traefik-certs-dumper:1.8.24`
- Webmail service: `affexai-webmail`
- Webmail runtime: Roundcube `1.7.4-apache`

The service definitions, persistent volumes, runtime logs, domains, and TLS routing are visible in Coolify. Mail accounts, aliases, mail domains, DKIM keys, and TLS certificate metadata are visible in the Stalwart WebUI.

## Accounts and credential storage

- Primary mailbox: `hazarvolga@affexai.tr`
- Aliases: `info@affexai.tr`, `postmaster@affexai.tr`, `abuse@affexai.tr`
- BIM Metraj mailboxes: `info@bimmetraj.com`, `hazarvolga@bimmetraj.com`
- BIM Metraj aliases on `info@bimmetraj.com`: `postmaster@bimmetraj.com`, `abuse@bimmetraj.com`
- Administrator: `admin@affexai.tr`
- Credentials are stored in macOS Keychain under separate administrator, AffeXAI mailbox, and BIM Metraj mailbox entries.

Passwords and API credentials must not be copied into this repository, Compose, screenshots, or operational logs.

## Client settings

- IMAP: `mail.affexai.tr`, port `993`, implicit TLS
- SMTP submission: `mail.affexai.tr`, port `465`, implicit TLS
- Username: the complete email address
- ManageSieve: port `4190`

Port `587` is published by the container but is not reachable through the provider edge. Clients should use port `465`, which is the advertised submission endpoint.

`info@affexai.tr` is an alias of `hazarvolga@affexai.tr`, so it does not have a separate password. Sign in as `hazarvolga@affexai.tr` and configure `info@affexai.tr` as a sender identity when needed. Both BIM Metraj addresses are independent mailboxes and use their own credentials.

## Web access

- Administration: `https://mail.affexai.tr/admin`
- Mailbox self-service: `https://mail.affexai.tr/account`
- AffeXAI webmail: `https://webmail.affexai.tr`
- BIM Metraj webmail: `https://webmail.bimmetraj.com`

The self-service page manages the mailbox password, application passwords, two-factor authentication, and account preferences. Roundcube is the shared inbox client for both mail domains. It connects to Stalwart with IMAPS on port `993` and SMTPS on port `465`.

Roundcube stores its SQLite database and configuration in named persistent volumes. Temporary uploads use a `64 MB`, `noexec`, `nosuid`, `nodev` tmpfs and disappear when the container stops. The Roundcube credential/session encryption key is managed in Coolify and must not be copied into this repository. This key does not encrypt the SQLite volume at rest; host or storage-level encryption is required when at-rest encryption is needed.

## DNS baseline

Cloudflare DNS contains the Stalwart-generated mail records:

- DNS-only `A`: `mail.affexai.tr -> 169.58.96.15`
- `MX`: `affexai.tr -> mail.affexai.tr`, priority `10`
- SPF for the root and mail host
- RSA and Ed25519 DKIM selectors generated on 2026-10-12
- DMARC with reject policy and reports to `postmaster@affexai.tr`
- MTA-STS and TLS-RPT records
- CalDAV, CardDAV, IMAPS, JMAP, and submission SRV records
- Autoconfig, autodiscover, and user-agent auto-configuration records

POP3S is not published. The AffeXAI zone has no POP3S SRV record; the BIM Metraj zone publishes the standards-compliant unavailable-service value `0 0 0 .` so automatic client discovery does not attempt port `995`.

The `bimmetraj.com` zone uses the same mail host and contains:

- DNS-only `A`: `webmail.bimmetraj.com -> 169.58.96.15`
- `MX`: `bimmetraj.com -> mail.affexai.tr`, priority `10`
- SPF: `v=spf1 mx -all`
- DMARC reject policy with reports to `postmaster@bimmetraj.com`
- RSA and Ed25519 DKIM selectors generated on 2026-10-12
- MTA-STS, TLS-RPT, autoconfig, autodiscover, IMAPS, submission, JMAP, CalDAV, and CardDAV records
- POP3S explicitly marked unavailable with SRV target `.`

`webmail.affexai.tr` also resolves directly to `169.58.96.15`. Both webmail records are DNS-only so that Coolify/Traefik terminates TLS directly.

## TLS lifecycle

Coolify/Traefik obtains the public certificate. The `certs-dumper` sidecar exports it into the `stalwart-certs` volume, which Stalwart mounts read-only at `/data/certs`.

Stalwart uses a file-backed Certificate object and presents the certificate for `mail.affexai.tr` on SMTP and IMAP. The Coolify scheduled task `Reload Stalwart TLS certificates` runs daily in the `stalwart` container and calls `/etc/stalwart/reload-certificates.sh`. The script uses a local, narrowly scoped API key that can only authenticate and trigger the TLS reload action.

## Verification

Expected checks:

```sh
dig +short MX affexai.tr
dig +short TXT affexai.tr
dig +short TXT _dmarc.affexai.tr
openssl s_client -connect mail.affexai.tr:465 -servername mail.affexai.tr -verify_return_error </dev/null
openssl s_client -connect mail.affexai.tr:993 -servername mail.affexai.tr -verify_return_error </dev/null
```

Both TLS checks must return `Verify return code: 0 (ok)`. SMTP authentication should return code `235`; IMAP authentication should return `OK`.

On 2026-10-12 the following deployment checks passed:

- Roundcube container reported `healthy` in Docker.
- Both webmail URLs returned HTTP `200` and the Roundcube login page.
- Both webmail hostnames presented valid Let's Encrypt certificates.
- IMAP authentication succeeded for `hazarvolga@affexai.tr`, `info@bimmetraj.com`, and `hazarvolga@bimmetraj.com`.
- Public DNS returned the expected BIM Metraj MX, SPF, DMARC, RSA DKIM, and Ed25519 DKIM records.
- Coolify reported matching DNS for both webmail hostnames.
- Stalwart administration and account URLs returned the expected HTTP redirect rather than a proxy error.

## Reverse-proxy client IP handling

Stalwart's HTTP setting `useXForwarded` is enabled because Coolify/Traefik terminates HTTPS and forwards requests to the HTTP listener. This prevents public scan traffic from being attributed to the proxy container and avoids a single automatic ban blocking the WebUI for every user. Direct public access to the internal HTTP listener must remain disabled, and Traefik must remain the sole ingress path that sanitizes forwarded headers. A spoofed `X-Forwarded-For` probe was verified to reach Stalwart with the real public client address rather than the injected address.

## Provider reverse DNS

On 2026-10-12, the Contabo PTR/rDNS value for `169.58.96.15` was changed to `mail.affexai.tr`. Public resolvers `1.1.1.1` and `8.8.8.8` returned the new value immediately. Some recursive resolvers can retain the previous value until their cache expires because the provider record uses a 24-hour TTL.

Verify propagation with:

```sh
dig +short -x 169.58.96.15
```

The steady-state result is `mail.affexai.tr.`. Forward DNS also maps `mail.affexai.tr` back to `169.58.96.15`, satisfying forward-confirmed reverse DNS.
