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

## Supabase (Auth)

This project uses Supabase for login/registro.

Add these variables to your `.env.local` (you said you’ll fill values later):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database schema (Supabase Postgres)

The full ecommerce schema lives in [database/schema.sql](database/schema.sql).

How to apply it:

1. Create a Supabase project.
2. Go to **SQL Editor** → run the contents of [database/schema.sql](database/schema.sql).
3. Verify tables under **Database → Tables** (public schema).

Notes:

- RLS is enabled across customer data.
- A trigger creates a `public.customers` row automatically when a user signs up in `auth.users`.

### What’s already working

- Auth (Supabase email/password): login + register modal.
- Header uses real Supabase session (no fake-auth).
- Profile page:
	- Personal details (name/phone) saved to `public.customers` + auth user_metadata.
	- Addresses CRUD against `public.customer_addresses` (create/edit/delete + “default” via DB trigger).
	- Orders list reads from `public.orders` (when orders exist).
	- Payments tab lists `public.payment_intents` tied to your orders (when they exist).

### What’s still pending / mocked

- Checkout flow (creating `orders`, `order_items`, `payment_intents`, `shipments`).
- Cart is still local (localStorage) and not persisted in `public.carts` / `public.cart_items`.
- Product catalog currently comes from JSON; it’s not yet DB-driven.
- Admin section is mostly UI mock; needs real CRUD against the schema + admin role setup.

### Recommended next steps

- Add a seed/import script to load products from `src/features/products/data/products.json` into `public.products` (and optionally variants/categories).
- Implement “place order” endpoint (server route) that:
	- gets/creates customer,
	- creates `orders` + `order_items`,
	- creates a `payment_intent` in your provider (Stripe/MercadoPago) and stores it in `public.payment_intents`.
- Add a webhook route to reconcile payment status and set `orders.status`.
- Decide whether to store payment methods (usually via provider vault, not in DB).

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
