# AffeXAI Mail Service Runbook

## Service ownership

- Coolify service: `affexai-mail`
- Resource UUID: `fnu2ihmmmk0jmc7v2kj5yaxq`
- Public administration URL: `https://mail.affexai.tr/admin`
- Mail server hostname: `mail.affexai.tr`
- Runtime: Stalwart `v0.16.26`
- Certificate exporter: `ghcr.io/kereis/traefik-certs-dumper:1.8.24`

The service definition, persistent volumes, runtime logs, and TLS reload schedule are visible in Coolify. Mail accounts, aliases, domains, DKIM keys, and TLS certificate metadata are visible in the Stalwart WebUI.

## Accounts and credential storage

- Primary mailbox: `hazarvolga@affexai.tr`
- Aliases: `info@affexai.tr`, `postmaster@affexai.tr`, `abuse@affexai.tr`
- Administrator: `admin@affexai.tr`
- macOS Keychain services:
  - `AffeXAI Stalwart Admin`
  - `AffeXAI Mailbox`

Passwords and API credentials must not be copied into this repository, Compose, screenshots, or operational logs.

## Client settings

- IMAP: `mail.affexai.tr`, port `993`, implicit TLS
- SMTP submission: `mail.affexai.tr`, port `465`, implicit TLS
- Username: the complete email address
- ManageSieve: port `4190`

Port `587` is published by the container but is not reachable through the provider edge. Clients should use port `465`, which is the advertised submission endpoint.

## Web access

- Administration: `https://mail.affexai.tr/admin`
- Mailbox self-service: `https://mail.affexai.tr/account`

The self-service page manages the mailbox password, application passwords, two-factor authentication, and account preferences. It is not an inbox reader. This deployment does not currently include a webmail client; mailbox messages are accessed through an IMAP client such as Apple Mail, Outlook, Thunderbird, or a separately deployed webmail application.

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

POP3S is not published and therefore has no SRV record.

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

## Provider reverse DNS

On 2026-10-12, the Contabo PTR/rDNS value for `169.58.96.15` was changed to `mail.affexai.tr`. Public resolvers `1.1.1.1` and `8.8.8.8` returned the new value immediately. Some recursive resolvers can retain the previous value until their cache expires because the provider record uses a 24-hour TTL.

Verify propagation with:

```sh
dig +short -x 169.58.96.15
```

The steady-state result is `mail.affexai.tr.`. Forward DNS also maps `mail.affexai.tr` back to `169.58.96.15`, satisfying forward-confirmed reverse DNS.
