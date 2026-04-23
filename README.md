# Mailform Workers
![Mailform](https://hosted.inled.es/mailform-workers.png)

> [!IMPORTANT]
> The UI is on spanish. You can change it very easy.

## Features
- **Security:** Server-side Turnstile validation.
- **Privacy:** Secrets handled via Cloudflare Secrets.
- **Minimalism:** No heavy frameworks, pure and responsive HTML.

## Configuration and Deployment

> [!IMPORTANT]
> Before starting, you must rename all files ending in `.example` by removing that extension (e.g., rename `wrangler.toml.example` to `wrangler.toml`).

To configure your own form interactively, run:

```bash
./setup.sh
```

The script will ask for:
1. **Turnstile Site Key**: Obtain from the Cloudflare Dashboard.
2. **Turnstile Secret Key**: This will be stored as a Cloudflare secret (never exposed).
3. **Destination Email**: The email address where you will receive notifications.

## Local Development

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`

## Prerequisites
- A Cloudflare account.
- Configure **Email Routing** on your Cloudflare domain for sending emails.

---
Created by JaimeGH.