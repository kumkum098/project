# Low-Level Design (LLD) Document
## Ticket Resale Marketplace

## 1. Detailed Component Design (React/Next.js)

### `TicketCard` Component
- **Props:** `ticket` (Object), `showActions` (Boolean)
- **State:** `isHovered`
- **Hooks:** `useRouter`
- **Logic:** Displays ticket thumbnail, title, price, and event date. If `showActions` is true, displays Edit/Delete buttons (used in dashboard).

### `CheckoutForm` Component
- **Props:** `ticketId`, `price`
- **State:** `isProcessing`, `error`
- **Hooks:** `useSession`, `useRazorpay`
- **Logic:** Calls `/api/payment/create-order` on mount. Renders Razorpay UI. On success callback, sends signature to `/api/payment/verify`. Handles UI loading states and errors.

### `ChatInterface` Component
- **Props:** `conversationId`, `recipient`
- **State:** `messages` (Array), `newMessage` (String)
- **Hooks:** `useSWR` (for polling or fetching), `useRef` (for auto-scrolling)
- **Logic:** Fetches initial messages. Submits POST to `/api/chat`. Optimistically updates the UI.

## 2. API Route Specifications

### `POST /api/tickets`
- **Description:** Creates a new ticket listing.
- **Auth Required:** Yes (JWT).
- **Request Body Validation (Zod):**
  ```typescript
  z.object({
    title: z.string().min(5).max(100),
    description: z.string().min(20),
    price: z.number().positive(),
    category: z.enum(['concert', 'sports', 'theater', 'comedy', 'festival', 'conference']),
    eventDate: z.string().datetime(),
    images: z.array(z.string().url()).min(1)
  })
  ```
- **Response:**
  - `201 Created`: `{ success: true, ticket: TicketObject }`
  - `400 Bad Request`: `{ error: "Validation failed", details: [...] }`
  - `401 Unauthorized`: `{ error: "Please log in" }`

### `POST /api/payment/verify`
- **Description:** Verifies Razorpay signature and updates transaction.
- **Request Body:** `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`
- **Logic:**
  1. Generate HMAC SHA256 of `order_id + "|" + payment_id` using Razorpay Secret.
  2. Compare with `razorpay_signature`.
  3. If match, update Transaction `status` to `completed` and `escrowStatus` to `locked`.
  4. Update Ticket `status` to `sold`.

## 3. Database Schema Details (Mongoose)

### Ticket Schema
```javascript
const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, index: true },
  eventDate: { type: Date, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // For Leaflet Map geo-queries
  },
  images: [String], // Cloudinary URLs
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  status: { type: String, enum: ['available', 'pending', 'sold'], default: 'available' }
}, { timestamps: true });
ticketSchema.index({ location: '2dsphere' });
```

### Transaction Schema
```javascript
const transactionSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  amount: Number,
  platformFee: Number,
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded', 'disputed'] },
  razorpayDetails: { orderId: String, paymentId: String, signature: String },
  escrowStatus: { type: String, enum: ['pending', 'locked', 'released', 'refunded'], default: 'pending' },
  escrowReleaseDate: Date
});
```

## 4. Escrow System Logic
**State Machine:**
1. `pending`: Initial state when order is created.
2. `locked`: Payment verified. Funds held by platform. `escrowReleaseDate` set to `eventDate + 24 hours`.
3. `disputed`: Buyer raises an issue within 24 hours post-event. Admin intervention required.
4. `released`: No dispute raised. Funds credited to seller's wallet/bank.
5. `refunded`: Dispute resolved in buyer's favor or event canceled.

## 5. Trust Score Algorithm
Calculated dynamically or updated via cron/triggers.
**Base Score:** 50
**Factors:**
- **Completed Sales:** +5 points per successful sale without dispute (Max 40).
- **Account Age:** +1 point per month (Max 10).
- **Verified Identity:** +15 points.
- **Average Rating:** (Rating / 5) * 20.
- **Disputes:** -20 points per lost dispute.
- **Cancellations:** -5 points per seller-initiated cancellation.

## 6. File Upload Pipeline (Cloudinary)
1. Client selects image.
2. Form data submitted to `/api/upload` (utilizes `multer` memory storage).
3. API streams buffer to Cloudinary using `cloudinary.uploader.upload_stream`.
4. Cloudinary returns secure URL.
5. URL is saved to MongoDB within the Ticket document.

## 7. State Management Patterns
- **Global Auth State:** Managed by NextAuth's `SessionProvider` and accessed via `useSession()`.
- **Server State:** Handled by Next.js App Router's `fetch` caching and React Server Components (RSC). Forms use Server Actions where appropriate.
- **Local UI State:** React `useState` and `useReducer` for complex form states (e.g., multi-step ticket creation).

## 8. Error Handling Strategy
- **Client-Side:** Axios interceptors or custom fetch wrappers catch HTTP errors and trigger Toast notifications (e.g., react-hot-toast).
- **Server-Side:** Global error handling middleware wrapper for API routes to return standardized JSON error formats `{ success: false, error: message }` and appropriate HTTP status codes. Logging via console/external logger.
