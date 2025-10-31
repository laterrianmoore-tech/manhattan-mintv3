# Launch27/Automaid Integration Setup Guide

## Overview
Manhattan Mint now uses Launch27/Automaid's API to create bookings programmatically. Customers complete the entire flow on your site, and bookings are created directly in Launch27.

## Setup Steps

### 1. Get Your API Credentials

1. Log into your Launch27/Automaid dashboard
2. Go to **Settings** → **API** (or **Integrations**)
3. Generate/copy your **API Key**
4. Note your Launch27 subdomain (e.g., `yourcompany.launch27.com`)

### 2. Configure Environment Variables

Edit `.env.local` (create it if it doesn't exist):

```bash
# Launch27/Automaid API Configuration
LAUNCH27_API_KEY=your_actual_api_key_here
LAUNCH27_BASE_URL=https://yourcompany.launch27.com/api/v1

# Your site URL (update for production)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**For production (Netlify):**
- Go to your Netlify site → **Site settings** → **Environment variables**
- Add:
  - `LAUNCH27_API_KEY` = your actual key
  - `LAUNCH27_BASE_URL` = `https://yourcompany.launch27.com/api/v1`
  - `NEXT_PUBLIC_SITE_URL` = `https://www.manhattanmintnyc.com`

### 3. Create Services in Launch27 Dashboard

Launch27 requires you to create **Service Types** in their dashboard before bookings can be created via API.

1. Go to **Services** in Launch27 dashboard
2. Create these services:
   - **Standard Clean** (flat rate)
   - **Deep Clean** (flat rate)
   - **Move-In/Out** (flat rate)
   - **Hourly Cleaning** (hourly rate)

3. Note each service's **ID** (you'll see it in the URL or service details)

4. **Optional:** Update `src/app/api/launch27/create-booking/route.ts` to map service names to IDs:

```typescript
const SERVICE_IDS = {
  'Standard Clean': 123,
  'Deep Clean': 124,
  'Move-In/Out': 125,
  'Hourly': 126,
};

// Then in the payload:
service: {
  id: SERVICE_IDS[body.cleaningType] || SERVICE_IDS['Standard Clean'],
  name: body.serviceName,
  price: body.total,
  duration: body.hours ? body.hours * 60 : undefined,
},
```

### 4. Payment Integration (CRITICAL)

**⚠️ SECURITY WARNING:** The current implementation does NOT send card details to Launch27 for PCI compliance reasons.

**Options:**

**A. Launch27's Built-in Payment Gateway (Recommended)**
1. Enable Stripe/Square in Launch27 settings
2. Use Launch27's client-side payment form or tokenization
3. Send the token to your API route instead of raw card data

**B. Stripe Direct Integration**
1. Add `@stripe/stripe-js` to your project
2. Tokenize card client-side in `PricingAvailabilityClient.tsx`
3. Send token to Launch27 API

**C. Launch27 Invoicing (Temporary workaround)**
- Set `payment.method: 'invoice'` in the API route
- Launch27 will send an invoice to the customer
- You collect payment details but don't process them yet

### 5. Test the Flow

1. **Local testing:**
   ```powershell
   npm run dev
   ```

2. Navigate through:
   - Homepage → "Book Now"
   - Quote page → fill details → "Get Pricing"
   - Pricing page → fill contact/payment → "Complete Booking"

3. Check Launch27 dashboard for the new booking

4. Monitor the browser console and terminal for any API errors

### 6. API Route Details

**Endpoint:** `POST /api/launch27/create-booking`

**Request body:**
```json
{
  "contact": {
    "first": "John",
    "last": "Doe",
    "email": "john@example.com",
    "phone": "2125551234",
    "address": "123 Main St",
    "apt": "4B",
    "city": "New York City",
    "state": "NY",
    "zip": "10001",
    "entry": "doorman",
    "entryNotes": "..."
  },
  "date": "2025-11-15",
  "start": "09:00",
  "end": "12:00",
  "frequency": "weekly",
  "serviceName": "Standard Clean (2BR, 1BA)",
  "hours": 3,
  "cleaners": 2,
  "addons": [
    { "label": "Inside fridge", "price": 45 }
  ],
  "notes": "Pet-friendly products please",
  "total": 250
}
```

**Success response:**
```json
{
  "success": true,
  "bookingId": 12345,
  "confirmationNumber": "ABC123",
  "message": "Booking created successfully"
}
```

### 7. Debugging Tips

**If bookings don't appear in Launch27:**
1. Check Netlify function logs: **Site → Functions → launch27-create-booking**
2. Verify API key is correct (try it in Postman/curl first)
3. Check Launch27 API documentation for required fields
4. Ensure service IDs exist in Launch27

**Common errors:**
- `401 Unauthorized` → API key is wrong or expired
- `422 Unprocessable Entity` → Missing required fields (check Launch27 docs)
- `404 Not Found` → Base URL is wrong (check subdomain)

### 8. Next Steps

- [ ] Replace `/booking` page (currently Jobber) with Launch27 widget or remove it
- [ ] Set up Launch27 webhooks to sync booking status back to your site
- [ ] Add loading spinner during booking submission
- [ ] Implement proper payment tokenization (Stripe/Launch27)
- [ ] Add email confirmation via Launch27's automated emails
- [ ] Update thank-you page to show Launch27 confirmation number

## API Documentation

Launch27 API docs: https://launch27.readme.io/reference (check with Launch27 for exact URL)

## Support

- Launch27 support: support@launch27.com
- Check their dashboard for live chat support

---

**Current Status:** ✅ API route created, pricing page updated. Need to add your API key and test.
