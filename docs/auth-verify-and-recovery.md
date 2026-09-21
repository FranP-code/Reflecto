# Auth: Email Verification and Password Recovery (Appwrite)

This document explains how email verification and password reset are implemented in the web app using Appwrite Auth, where to configure the redirect URLs, and how to test the flows locally and in production.

- Appwrite SDK: `appwrite@^14.0.1`
- Web app paths:
  - Verification route: `/verify-email`
  - Password route: `/password` with modes: `change`, `recover`, `confirm`

## Prerequisites

- Appwrite project endpoint and IDs configured in `apps/web/.env`:

```
VITE_APPWRITE_ENDPOINT=https://<REGION>.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=<PROJECT_ID>
```

- Add the web app origin(s) as a Platform in Appwrite Console → Project Settings → Platforms. These must include every hostname you will use for redirects, for example:
  - `http://localhost:3001` (local dev with `pnpm --filter web dev`)
  - `https://your-domain.tld`

If a hostname is not registered as a Platform, Appwrite will reject the redirect to protect against open redirect attacks.

## Where the code lives

- Appwrite client and helpers: `apps/web/src/lib/auth-client.ts`
  - `verify.sendEmail(redirectUrl)` → sends verification email via `account.createVerification(redirectUrl)`
  - `verify.confirm({ userId, secret })` → confirms via `account.updateVerification(userId, secret)`
  - `password.recover.request({ email, redirectUrl })` → starts recovery via `account.createRecovery(email, redirectUrl)`
  - `password.recover.confirm({ userId, secret, password })` → finishes via `account.updateRecovery(userId, secret, password)`

- Verification UI route: `apps/web/src/routes/verify-email.tsx`
- Password UI route: `apps/web/src/routes/password.tsx`

## Email Verification

Appwrite allows login before verification, but you can restrict data access to verified users using the `user([USER_ID], "verified")` role in your database or storage permissions.

Flow:
1. User signs up and logs in.
2. User goes to `/verify-email` and clicks "Send verification email".
3. Appwrite emails a link that redirects back to `/verify-email?userId=...&secret=...`.
4. The page auto-detects `userId` and `secret` and calls `account.updateVerification(userId, secret)`.
5. On success, the session cache is invalidated and the UI reflects verified status.

Implementation details:
- Redirect URL builder in the route uses the current origin: `new URL('/verify-email', window.location.origin).toString()`.
- You must include that origin in Appwrite Platforms.

Testing locally:
- Start web on port 3001.
- Visit `http://localhost:3001/verify-email` while logged in.
- Send email, click link in inbox, confirm success state in UI.

## Password Reset / Recovery

There are two flows in `/password`:

- Change password (authenticated): `/password?mode=change` (default). Uses `account.updatePassword(newPassword, oldPassword)`.
- Recover password (email): `/password?mode=recover` to request a reset link, which redirects back to `/password?mode=confirm&userId=...&secret=...` where you set a new password.

Flow (recovery):
1. User opens `/password?mode=recover` and submits email.
2. App sends `account.createRecovery(email, redirectUrl)` where `redirectUrl` is built as `new URL('/password', origin)` with `mode=confirm`.
3. Email link lands on `/password?mode=confirm&userId=...&secret=...`.
4. User enters a new password and app calls `account.updateRecovery(userId, secret, password)`.

Notes:
- Appwrite recovery links are valid for 1 hour.
- Verification links are valid for 7 days.
- All redirect URLs must be on registered Platforms.

## Configuration Checklist

- [ ] `VITE_APPWRITE_ENDPOINT` and `VITE_APPWRITE_PROJECT_ID` set in `apps/web/.env`.
- [ ] Appwrite Platforms include all needed origins (dev and prod).
- [ ] SMTP provider configured in Appwrite (Console → Project → Email) so verification/recovery emails send successfully.
- [ ] Optional: Enforce verified emails in your data permissions with `user([USER_ID], "verified")`.

## Common Errors

- "Redirect URL not allowed": Add the origin to Appwrite Platforms; ensure exact protocol/host/port.
- "Invalid or expired token": Verification link is older than 7 days, or recovery link older than 1 hour; resend.
- Nothing arrives to inbox: Check Appwrite email provider settings and logs; also check spam.

## Quick API References (Web SDK)

- Send verification: `account.createVerification(redirectUrl)`
- Confirm verification: `account.updateVerification(userId, secret)`
- Start recovery: `account.createRecovery(email, redirectUrl)`
- Confirm recovery: `account.updateRecovery(userId, secret, password)`

See official docs:
- Verify user: https://appwrite.io/docs/products/auth/verify-user
- Account API (web): https://appwrite.io/docs/references/cloud/client-web/account
- Email/password auth: https://appwrite.io/docs/products/auth/email-password
