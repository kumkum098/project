/**
 * Razorpay Payment Gateway Configuration
 *
 * This file sets up the Razorpay instance that will be used
 * throughout the application for payment processing.
 */

// Step 1: Import the Razorpay SDK
// This is the official Razorpay Node.js package
import Razorpay from "razorpay";

// Step 2: Read environment variables
// We get the credentials from environment variables for security
// Never hardcode credentials in your code!
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? "dummy_razorpay_key_id";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "dummy_razorpay_key_secret";

// Step 4: Create a reusable Razorpay instance
// This instance will be used across the application for:
// - Creating payment orders
// - Verifying payments
// - Processing refunds
// - Managing subscriptions
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,      // Your Razorpay Key ID (public key)
  key_secret: RAZORPAY_KEY_SECRET, // Your Razorpay Key Secret (private key)
});

// Step 5: Export the instance for use in other files
// You can import this in your API routes like:
// import { razorpayInstance } from "@/lib/razorpay";
export default razorpayInstance;

// Also export the key ID separately for client-side usage
// The key ID is safe to expose to the frontend (it's public)
export { RAZORPAY_KEY_ID };