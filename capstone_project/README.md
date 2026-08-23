# 🎟️ Ticket Resale Marketplace (MVP)

A secure, high-trust secondary ticket resale platform engineered with modern full-stack web technologies. The marketplace eliminates fraud, scalping, and exorbitant buyer fees through an **Automated Escrow Payment System**, a dynamic **Seller Trust Score Algorithm**, **Geolocation-based Nearby Event Maps**, and an **AI-powered Fraud Authenticator & Price Analyzer** powered by Google Gemini.

---

## 🚀 Key Platform Features

- **🔒 Financial Escrow Protection**: Buyer payments are securely locked in escrow upon purchase. Funds are released to the seller only after the buyer confirms valid e-ticket receipt or event completion.
- **⭐ Dynamic Seller Trust Score**: Calculates dynamic reputation scores (0-100) based on verified transactions, fast transfer speeds, average review ratings, and dispute ratios.
- **🤖 Gemini AI Ticket Authenticator**: Evaluates ticket listings in real-time against market demand, detecting anomalous pricing, prompt injection attempts, and fake listings.
- **🗺️ Geolocation & Interactive Maps**: Geolocation-based discovery powered by Leaflet to find concerts, comedy shows, and sports events happening near the user's location.
- **💬 Real-Time Buyer/Seller Chat**: In-platform conversation rooms for direct communication and instant ticket transfer updates.
- **🔔 Live Notification System**: Instant notification alerts for payment receipts, escrow fund holds, ticket transfer updates, and reviews.
- **🛡️ Admin Moderation & Analytics**: Complete admin suite for reviewing seller identity verifications, resolving transaction disputes, and tracking GMV analytics with Recharts.

---

## 📁 Repository Architecture & Folder Structure

The project features a **Client-Server Architecture** designed for maintainability, modularity, and clean separation of concerns:

```
ticket-resale-marketplace/
├── client/                     # 🖥️ Client Subsystem (Frontend Layer)
│   ├── components/             # Reusable UI Components (Navbar, TicketCard, TrustScore, etc.)
│   ├── hooks/                  # Custom React Hooks (useAuth, useEscrow, useNotifications)
│   ├── services/               # Client API Layer (Axios Client, Razorpay, AI Service)
│   └── index.ts                # Client Unified Barrel Export
│
├── server/                     # ⚙️ Server Subsystem (Backend Layer)
│   ├── controllers/            # Route Controllers (Auth, Ticket, Transaction, Admin)
│   ├── db/                     # Connection Pools (MongoDB Mongoose, Prisma Client)
│   ├── middleware/             # Security Middleware (Auth Guard, Sanitization, Prompt Guard)
│   ├── models/                 # Mongoose & Prisma Schemas (User, Ticket, Transaction, Review)
│   ├── services/               # Core Engines (Escrow Engine, Trust Score Engine, Gemini AI)
│   └── index.ts                # Server Unified Barrel Export
│
├── app/                        # 🌐 Next.js 16 App Router (Bridges Client & Server Routes)
│   ├── admin/                  # Admin Dashboard Pages (Analytics, Verifications)
│   ├── api/                    # RESTful API Endpoints (Auth, Tickets, Payments, AI, Chat)
│   ├── checkout/               # Secure Checkout Page
│   ├── dashboard/              # User Dashboard Pages (Purchases, Sales, My Listings)
│   ├── nearby-events/          # Leaflet Geolocation Map Search Page
│   ├── search/                 # Advanced Catalog Search Page
│   └── tickets/                # Ticket Details & Creation Pages
│
├── __tests__/                  # 🧪 Automated Jest Test Suite (Sanitization & Security Tests)
├── prisma/                     # 🗄️ Prisma Database Schema
├── docs/                       # 📄 Comprehensive Architecture & API Documentation
├── ARCHITECTURE.md             # 📐 Architectural Specifications & System Diagrams
├── API_DOCUMENTATION.md        # 📖 Complete OpenAPI REST API Reference
├── SETUP_AND_DEPLOYMENT.md     # 🛠️ Setup, Docker, and Deployment Guide
├── PRD.md                      # 🎯 Product Requirements Document
├── HLD.md                      # 🏛️ High-Level Design Document
└── LLD.md                      # 🔧 Low-Level Design Document
```

---

## 🛠️ Technology Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router), React 19 | Server & Client Rendered UI |
| **Styling & UI** | Vanilla CSS, TailwindCSS v4, Lucide Icons | Responsive Design & Glassmorphism |
| **Backend / API** | Node.js, Next.js API Routes, NextAuth.js | REST API Handlers & JWT Auth |
| **Database** | MongoDB (Mongoose), PostgreSQL (Prisma ORM) | Dual Database Architecture |
| **Payment Gateway** | Razorpay SDK | Escrow Payment Processing & Verification |
| **AI Integration** | Google Gemini 1.5/3.6 Flash | Ticket Authenticity & Fair Pricing Analysis |
| **Maps & Location** | Leaflet, React-Leaflet | Interactive Geolocation & Distance Search |
| **Testing** | Jest, ts-jest | Automated Unit & Security Testing |
| **Containerization** | Docker, Docker Compose | Containerized Deployment |

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or later
- **MongoDB**: Local instance or MongoDB Atlas URI
- **npm**: v9.0.0 or later

### Installation & Environment Setup

1. **Clone the repository and install dependencies**:
   ```bash
   git clone https://github.com/kumkum098/ticket-resale-marketplace.git
   cd ticket-resale-marketplace
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   # Database Connections
   MONGODB_URI=mongodb://localhost:27017/ticket_marketplace
   DATABASE_URL=postgresql://postgres:password@localhost:5432/ticket_marketplace

   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3001
   NEXTAUTH_SECRET=your_jwt_secret_key_change_in_production

   # Razorpay Payment Gateway Keys
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret_key

   # Google Gemini AI Key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Run Database Migrations & Seeds**:
   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Seed nearby sample tickets
   npx ts-node scripts/seed-nearby-tickets.ts
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3001` in your web browser.

---

## 🧪 Running Unit Tests

Run the automated Jest unit test suite:
```bash
npm test
```
The test suite validates input sanitization, XSS payload removal, SQL injection prevention, and LLM prompt injection guards.

---

## 📚 Documentation Index

For detailed technical specifications, refer to:
- 📐 [ARCHITECTURE.md](./ARCHITECTURE.md): System architecture, sequence diagrams, and mathematical models.
- 📖 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md): Endpoint list, request/response schemas, and status codes.
- 🛠️ [SETUP_AND_DEPLOYMENT.md](./SETUP_AND_DEPLOYMENT.md): Production deployment guide, Docker setup, and environment config.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for details.
# kumkum-kumkum
