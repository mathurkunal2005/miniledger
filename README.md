# MiniLedger

A small app to track money lent to friends: log in with your phone number, record loans, mark them repaid, and see what's overdue at a glance.

Built as a full-stack take-home exercise.

## Features

**Required**
- Phone number login with a mock OTP (printed in the server log)
- Add a loan (friend name, amount, due date) and mark it as repaid
- Summary endpoint: total lent, total repaid, overdue amount (plus outstanding)
- React Native app: login screen, loan list with overdue loans highlighted, add-loan form, summary card

**Bonus**
- Receipt photo upload (camera or gallery) with an in-app viewer
- Input validation on both server (Zod) and app
- 12 unit tests (Vitest) for the summary math and validation rules

**Extras**
- Stays logged in (token kept in encrypted SecureStore), tokens expire after 7 days, auto-logout on 401
- Loading, error and offline states; pull to refresh
- OTP sending behind an `SmsSender` interface, so a real SMS provider is a one-file change

## Tech stack

| Part | Stack |
| --- | --- |
| Backend | Node.js, TypeScript, Fastify, Prisma, PostgreSQL, Zod, Vitest |
| App | React Native, Expo (SDK 58), TypeScript, expo-image-picker, expo-secure-store |

## Project structure

```
miniledger/
├── server/                 # Backend API
│   ├── prisma/             # Database schema + migrations
│   └── src/
│       ├── routes/         # auth, loans, summary, receipts
│       ├── summary.ts      # Summary math (pure function, unit tested)
│       ├── sms.ts          # SmsSender interface + console mock
│       └── index.ts        # Server setup
└── app/                    # React Native (Expo) app
    ├── App.tsx             # Switches between login and home
    └── src/
        ├── screens/        # LoginScreen, HomeScreen
        ├── components/     # SummaryCard, LoanItem, AddLoanModal
        ├── api.ts          # All server calls
        └── config.ts       # Backend address
```

## Prerequisites

- Node.js 22 or newer
- PostgreSQL running locally
- The **Expo Go** app on your phone (it must support SDK 58)
- Your phone and computer on the same Wi-Fi network

## 1. Run the backend

```bash
cd server
npm install

# Create the database
createdb miniledger

# Set up environment variables
cp .env.example .env
```

Edit `.env` if your Postgres needs a username or password:
```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/miniledger"
JWT_SECRET="any-long-random-string"
```

Then create the tables and start the server:
```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Check it's running: open http://localhost:3000/health and you should see `{"ok":true}`.

Run the tests:
```bash
npm test
```

## 2. Run the app

Find your computer's local IP address (macOS: `ipconfig getifaddr en0`; Windows: `ipconfig`), then put it in `app/src/config.ts`:
```ts
export const API_URL = "http://YOUR_IP:3000";
```

Then:
```bash
cd app
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iPhone).

## 3. Log in

1. Enter any valid 10-digit Indian mobile number (starts with 6–9), e.g. `9876543210`
2. Tap **Send OTP**
3. The OTP is printed in the **server terminal**:
   ```
   OTP for 9876543210: 482913
   ```
4. Enter it in the app. OTPs expire after 5 minutes and can be used only once.

## API

All routes except `/health` and `/auth/*` need an `Authorization: Bearer <token>` header.

| Method | Route | Description |
| --- | --- | --- |
| POST | `/auth/send-otp` | Body `{ phone }`. Generates an OTP and logs it |
| POST | `/auth/verify-otp` | Body `{ phone, code }`. Returns `{ token, user }` |
| POST | `/loans` | Body `{ friendName, amountPaise, dueDate }`. Adds a loan |
| GET | `/loans` | Lists your loans, each with `isOverdue` |
| PATCH | `/loans/:id/repay` | Marks a loan repaid |
| GET | `/summary` | `{ totalLentPaise, totalRepaidPaise, overduePaise, outstandingPaise }` |
| POST | `/loans/:id/receipt` | Multipart upload, field `receipt` (JPG/PNG/WEBP, max 5 MB) |

## Design decisions

- **Money is stored as integer paise**, not decimals, to avoid floating-point errors (`0.1 + 0.2 !== 0.3`). The app converts rupees ↔ paise only for input and display.
- **"Overdue" is calculated, not stored**: a loan is overdue if it isn't repaid and its due date has passed. A stored flag would go stale as time passes.
- **`repaidAt` is a nullable date**: `null` means not repaid, a date means repaid and when.
- **Every loan query checks ownership** (`id` + `userId`), so users can't read or change each other's loans.
- **Validation happens twice**: in the app for instant feedback, and on the server because the server never trusts the client.
- **The summary math is a pure function** with the current time passed in, which keeps it easy to test.

## Known limitations / next steps

- OTP is mocked for local development; production would use an SMS provider (e.g. MSG91) via `SmsSender`, plus rate limiting on OTP requests
- Receipts are stored on local disk; production would use private S3 storage with signed URLs
- No deployment config yet (Docker, CI)