# Agent Monday — Content Review Portal

🕵️ **Review and approve Agent Monday content before it hits the public record.**

A Next.js content review portal for the Agent Monday podcast network. Built by Inception Point AI.

## Shows

| Show | Format | Schedule |
|------|--------|----------|
| **Monday's Report** | Daily Brief (5-10 min) | Daily |
| **The Docket** | Deep Dive (20-30 min) | Weekly |
| **Cold Case Monday** | Cold Case Review (15-20 min) | Weekly |
| **White Collar Wednesday** | Financial Crime (10-15 min) | Weekly |
| **Breaking** | Breaking News (3-5 min) | As needed |
| **The Booking Log** | Arrest Roundup (~10 min) | Weekly |

## Features

- 📋 Content review queue with approval/rejection workflow
- 🏷️ Filter by show, status, and content type
- 🎙️ Spreaker integration for podcast publishing
- 📺 YouTube publishing support
- 📊 Analytics dashboard
- 🌑 Noir-themed UI (navy #1a1a2e + amber #d4a037)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

- `KV_REST_API_URL` — Vercel KV store URL
- `KV_REST_API_TOKEN` — Vercel KV auth token
- `SPREAKER_API_KEY` — Spreaker API key for publishing
- `YOUTUBE_API_KEY` — YouTube Data API key

## Tech Stack

- **Next.js 15** with App Router
- **Tailwind CSS** with noir palette
- **Vercel KV** for content storage
- **Spreaker API** for podcast publishing
- **YouTube Data API** for video analytics

## Monday's Voice

> "Monday's report. Short declarative sentences. Dry wit. Cite case numbers when possible. Monday out."

---

Built by [Inception Point AI](https://inceptionpoint.ai) • Monday Factory
