This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Testing

This project uses [Playwright](https://playwright.dev/) for end-to-end testing.

### Running Tests

```bash
# Run tests in headless mode
pnpm test

# Run tests with browser visible
pnpm test:headed

# Run tests with Playwright UI (interactive mode)
pnpm test:ui
```

### Test Coverage

The main E2E test (`tests/time-tracking-workflow.spec.ts`) covers the complete time tracking workflow:

1. Clears local data for consistent state
2. Logs in to the Engineering team
3. Adds a new ticket
4. Starts work on the ticket (triggers clock-in prompt)
5. Verifies clocked-in state
6. Stops the timer and adds a note
7. Verifies the timer stopped
8. Starts work on a second ticket
9. Clocks out
10. Verifies the timer stopped on the second ticket

### Viewing Test Reports

After running tests, an HTML report is generated. To view it:

```bash
npx playwright show-report
```
