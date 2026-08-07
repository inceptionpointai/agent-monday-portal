/** @type {import("next").NextConfig} */

// INC-2096: this file previously carried literal SPREAKER_API_KEY and
// YOUTUBE_API_KEY values in an `env` block. Problems with that, on top of the
// values sitting in a public repository:
//
//   1. Next.js inlines every `env` entry into the build output at compile
//      time. Measured on this app the keys landed in .next/server only, not
//      in .next/static -- no client component reads them today, so they were
//      not served to browsers. That is an accident of current imports, not a
//      guarantee: the first `process.env.YOUTUBE_API_KEY` in a "use client"
//      file would have published the key to every visitor with no warning.
//   2. Rotating a key meant editing source and redeploying.
//
// Both keys are read at runtime instead. `lib/spreaker.ts`,
// `lib/spreaker-analytics.ts` and `lib/youtube-analytics.ts` already do
// `process.env.<NAME>`, and they are only imported from route handlers under
// `app/api/`, which run on the server -- so no `env` block is needed for them
// to resolve. Set the values in the hosting environment (Vercel project
// settings -> Environment Variables) or a local `.env.local`. See .env.example.

const nextConfig = {};

module.exports = nextConfig;
