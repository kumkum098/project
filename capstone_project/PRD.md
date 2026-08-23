# Product Requirements Document (PRD)
## Ticket Resale Marketplace

## 1. Executive Summary
The Ticket Resale Marketplace is a secure, user-friendly platform designed to facilitate the buying and selling of event tickets. Built with a modern tech stack (Next.js 16, React 19, MongoDB), it addresses the growing need for a reliable secondary ticket market that eliminates scalping, fraud, and exorbitant fees. By introducing a robust Trust Score system, an Escrow payment mechanism, and geolocation-based discovery, the platform ensures trust, transparency, and convenience for all users.

## 2. Problem Statement
The secondary ticket market is currently plagued by:
- **Fraudulent Tickets:** Buyers often purchase fake or duplicate tickets.
- **Scalping:** Bots and scalpers hoard tickets and resell them at exorbitant prices.
- **Lack of Trust:** Buyers and sellers have no reliable way to verify each other's credibility.
- **Unsafe Transactions:** Direct peer-to-peer payments often result in scams.

**Our Solution:** A scalper-free, trust-based ticket resale platform that verifies users, holds payments in escrow until successful event entry, and enforces fair pricing guidelines.

## 3. Target Users
1. **Ticket Buyers:** Individuals looking for tickets to sold-out events or seeking better prices.
2. **Ticket Sellers:** Individuals who can no longer attend an event and want to recoup their costs safely.
3. **Event Enthusiasts:** Users who want to discover nearby events and concerts.
4. **Platform Administrators:** Staff who moderate listings, resolve disputes, and maintain platform integrity.

## 4. User Personas

### Persona 1: Sarah, The Last-Minute Buyer
- **Background:** 24, college student.
- **Goal:** Wants to buy a ticket to a sold-out concert this weekend.
- **Pain Point:** Afraid of getting scammed on social media.
- **Needs:** Verified tickets, secure payment, instant delivery.

### Persona 2: John, The Honest Seller
- **Background:** 32, software engineer.
- **Goal:** Sell his festival tickets because of a family emergency.
- **Pain Point:** Doesn't want to deal with lowballers or complex payment apps.
- **Needs:** Easy listing process, guaranteed payment, no-hassle communication.

## 5. Functional Requirements

### 5.1 User Authentication & Profiles
- Email/password registration with bcrypt hashing.
- JWT-based sessions via NextAuth.
- Public profiles displaying listings, reviews, and a Trust Score.

### 5.2 Ticket Listings & Discovery
- Create, read, update, and delete (CRUD) ticket listings.
- Image uploads via Cloudinary.
- Categories: concert, sports, theater, comedy, festival, conference.
- Search and filtering by price, category, date.
- **Nearby Events:** Geolocation-based discovery using Leaflet maps.

### 5.3 Purchasing, Payments & Escrow
- Razorpay payment gateway integration for seamless transactions.
- Order creation and signature verification.
- **Escrow System:** Funds are held until the buyer confirms the ticket works or the event concludes successfully.
- Automated refund processing and dispute handling.

### 5.4 Trust & Reputation
- **Trust Score:** Algorithm based on transaction history, reviews, account age, and dispute rate.
- Post-transaction review system with verified purchase badges.
- Identity verification options to boost trust.

### 5.5 Communication & Notifications
- Real-time buyer-seller messaging (Conversations).
- Push/In-app notifications for purchases, sales, messages, reviews, and price drops.

### 5.6 Admin Panel
- User and ticket moderation.
- Dispute resolution interface.
- Analytics dashboard using Recharts (total sales, active users).

## 6. Non-Functional Requirements
- **Performance:** Pages must load in under 2 seconds. API responses under 200ms.
- **Security:** Protection against XSS, CSRF, and SQL/NoSQL injection. Secure handling of payment data (PCI compliance via Razorpay).
- **Scalability:** System should handle spikes in traffic during major event announcements.
- **Availability:** 99.9% uptime.

## 7. User Stories
- **As a user**, I want to sign up using my email so I can start buying/selling tickets.
- **As a seller**, I want to upload a photo of the ticket and set a price so buyers can find it.
- **As a buyer**, I want to search for comedy shows happening this weekend so I can find entertainment.
- **As a buyer**, I want my payment held in escrow so I don't lose money if the ticket is fake.
- **As a user**, I want to see a seller's Trust Score before buying so I know they are reliable.
- **As an admin**, I want to ban fraudulent users to keep the platform safe.

## 8. Success Metrics / KPIs
- **Monthly Active Users (MAU):** Growth in platform usage.
- **Gross Merchandise Value (GMV):** Total value of tickets sold.
- **Dispute Rate:** Percentage of transactions resulting in disputes (target < 1%).
- **Conversion Rate:** Percentage of users who complete a purchase after viewing a listing.
- **Trust Score Efficacy:** Correlation between high trust scores and zero-dispute transactions.

## 9. Future Scope
- **AI Features:** AI-based ticket price recommendation and automated fraud detection.
- **Mobile Apps:** Native iOS and Android applications.
- **QR Code Integration:** Direct integration with event ticketing APIs to transfer digital QR tickets automatically.
- **Crypto Payments:** Support for Web3 payments and NFT ticketing.
