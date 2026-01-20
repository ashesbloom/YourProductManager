# 🚀 Project Technical Stack & Architecture

This document outlines the architectural decisions for the Lecture Platform, optimized for high performance, type safety, and cost-efficiency within specific hosting constraints.

---

## 🏗️ The "SBC" Stack (Supabase - Bunny - Cloudflare)

| Layer               | Technology               | Hosting / Provider       |
| :------------------ | :----------------------- | :----------------------- |
| **Frontend** | React JS (Vite)          | Cloudflare Pages (Free)  |
| **Language** | TypeScript               | N/A                      |
| **Styling** | Tailwind CSS + shadcn/ui | N/A                      |
| **Database & Auth** | PostgreSQL / GoTrue      | Supabase (Free Tier)     |
| **Video Delivery** | Bunny Stream (HLS)       | Bunny.net (Paid/Credits) |
| **State Management**| TanStack Query           | N/A                      |

---

## ⚖️ Strategic Justification

### 1. Frontend: React + TypeScript on Cloudflare Pages
* **Why Cloudflare Pages:** Offers an industry-leading free tier with unlimited bandwidth and global CDN edge delivery. It integrates natively with GitHub for automated CI/CD.
* **Why TypeScript:** Since the project uses multiple external services (Supabase & Bunny), TypeScript ensures that data structures returned by these APIs are strictly typed, reducing runtime bugs and improving developer velocity.
* **Why Vite:** Provides near-instant Hot Module Replacement (HMR) and optimized production builds specifically tuned for modern browser environments.

### 2. Backend & Data: Supabase
* **Hosting Constraint:** Utilizing the **Free Tier** ($0/mo).
* **Why Supabase:** * **PostgreSQL:** Provides a relational foundation for complex lecture/user relationships.
    * **Built-in Auth:** Handles OAuth and Email/Password sessions without needing a custom Express server.
    * **Row Level Security (RLS):** Allows us to write security rules directly in the database, enabling the frontend to query the DB securely without a middle-tier API.

### 3. Video Infrastructure: Bunny.net
* **The Problem:** Standard cloud storage (like S3) is expensive for video and provides a poor user experience (buffering).
* **The Solution (Bunny Stream):** * **Low Cost:** Significantly cheaper than AWS or Mux.
    * **Automatic Transcoding:** Automatically converts uploaded lectures into multiple resolutions (1080p, 720p, etc.).
    * **Security:** Uses Media Keys and HLS (HTTP Live Streaming) to prevent users from easily downloading and pirating lecture content.

### 4. Logic & State: TanStack Query (React Query)
* **Why:** Supabase is an "external" state. TanStack Query manages the caching of lecture lists and user progress, ensuring that the app feels "instant" when navigating between pages.

---

## 🛠️ Recommended Project Structure

```text
src/
├── components/       # UI components (shadcn/ui)
├── hooks/            # Custom hooks (e.g., useLectures, useAuth)
├── lib/              # Configuration (supabaseClient.ts, bunnyClient.ts)
├── pages/            # View components (Home, Dashboard, Player)
├── types/            # TypeScript interfaces & Supabase generated types
└── services/         # API logic for Supabase and Bunny.net