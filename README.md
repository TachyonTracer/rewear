# Problem Statement : ReWear – Community Clothing Exchange

# Team Name : Team 3139

# Team Leader Email : priyanshpankhaniya@gmail.com

# Our Site is Deployed at Vercel

# Auth Credentials

## Admin - Email : Alpha@123 , Password : Alpha@123
## User - Email : Beta@123 , Password : Beta@123

---

## Google OAuth Setup

To enable Google sign-in, you must set up OAuth credentials in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Create OAuth 2.0 credentials.
2. Add the following Authorized redirect URIs:
   - For local development: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://<your-vercel-domain>/api/auth/google/callback`
3. Copy your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

---

## Environment Variables

Create a `.env.local` file in your project root with the following:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000 # or your deployed URL
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

- For production, set `NEXT_PUBLIC_APP_URL` to your deployed Vercel domain (e.g., `https://rewear-tawny.vercel.app`).
- Restart your dev server after changing environment variables.

---

## Real-Time Features & Vercel Limitations

- **Online users and real-time features (WebSockets, in-memory state) will NOT work on Vercel** because Vercel is serverless and does not support persistent connections or shared memory.
- For real-time features in production, use a service like [Pusher](https://pusher.com/), [Ably](https://ably.com/), or host your own WebSocket server on a traditional VM.
- Locally, real-time features work because the server is persistent.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
