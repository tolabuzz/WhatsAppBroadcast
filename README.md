# Broadcast — Personalized WhatsApp Messaging PWA

A mobile-first Progressive Web App for sending personalized WhatsApp messages
to large groups of people — one thoughtful, reviewed message at a time.

Every message is generated individually from a template with placeholders
and opened in WhatsApp (or WhatsApp Web) via WhatsApp's official
[click-to-chat](https://faq.whatsapp.com/425247423114725) links, so the user
always reviews and sends manually. No message is ever sent automatically,
keeping the app fully compliant with WhatsApp's terms.

## Features

- **Contacts** — add, edit, search contacts; import from CSV/Excel (with a
  downloadable template) or, where supported (Chrome on Android), pick
  directly from the device's contact list.
- **Groups** — organize contacts into reusable groups (Workers, Volunteers,
  Zone A, etc.) and reuse them across broadcasts.
- **Templates** — save reusable message templates with `{{FirstName}}`,
  `{{LastName}}`, and `{{FullName}}` placeholders.
- **Broadcasts** — a 3-step wizard (recipients → message → review) to create
  a broadcast, save it as a draft, or start it immediately.
- **Broadcast runner** — a focused, one-recipient-at-a-time screen: preview
  the personalized message, tap "Open WhatsApp," then mark the recipient as
  sent or skipped. Progress is saved automatically, so a broadcast can be
  paused and resumed at any time.
- **History** — resume drafts, duplicate past broadcasts, archive completed
  ones, and track sent/skipped/pending counts at a glance.

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Dexie.js (IndexedDB) for fully client-side, offline-first storage — no
  backend or account required; all data stays on the device.
- `vite-plugin-pwa` for the installable, offline-capable PWA shell.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
```

## Notes & scope

This is a client-only MVP: contacts, groups, templates, and broadcasts are
stored locally in the browser's IndexedDB. There is no server sync, so data
is per-device. A natural next step would be optional cloud backup/sync
(e.g. via a lightweight backend or a user's own storage) for multi-device
use.
