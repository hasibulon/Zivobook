# Zivobook Software Architecture & Tech Stack Profile
## System Version: 1.0.0-MVP (Hybrid Production Blueprint)

This document establishes the official technical specifications, architectural guidelines, database schemas, and state-management protocols for **Zivobook**. It is designed to act as a gold-standard reference prompt that can be directly fed into downstream code generators, LLMs, or system developers to implement updates with 100% precision.

---

## 1. Core Tech Stack Dashboard
| Layer | Technology | Role & Integration |
| :--- | :--- | :--- |
| **Frontend** | React 18+ (Vite) | High-fidelity Single Page Application styled with Tailwind CSS |
| **State Management** | Redux Toolkit + Context API | RTK for high-frequency feed metrics (reactions, counters); Context for global UI (theme, modals) |
| **Primary Identity** | Firebase Auth | Single identity source of truth; signs JWTs and triggers backend sync |
| **Primary Relational Store** | Supabase (PostgreSQL) | Fully relational, normalized transaction ledgers, posts, comments, profiles under RLS |
| **Blob & Media Storage** | Firebase Storage | Bucket architecture for raw Reels, stories, post photos |
| **Media Delivery** | Image Optimization CDN | Converts ingest uploads to lightweight WebP format dynamically |
| **Real-Time Gateway** | Supabase channels / WS | High-frequency realtime listeners (Model A) scaling to Socket.io/Redis (Model B) |

---

## 2. Authentication & Identity Sync Protocol

To prevent client-side race conditions and identity mismatch, **Firebase Authentication** serves as the unique source of truth. Users never register directly into PostgreSQL.

### Sync Flow & Database Schema
```
[User Signup] ──(Client)──> [Firebase Auth]
                                │
                        (Cloud Function Hook)
                                │
                                ▼
                       (Upsert with Firebase UID)
                                │
                                ▼
               [Supabase PostgreSQL: `profiles` Table]
```

### PostgreSQL Schema Definition: `profiles`
```sql
CREATE TABLE public.profiles (
    id VARCHAR(128) PRIMARY KEY, -- Maps directly to Firebase Auth UID
    display_name VARCHAR(255) NOT NULL,
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
    email VARCHAR(255) UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Row-Level Security Rules for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow users to update own profiles" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

---

## 3. Real-Time State Engine & Optimistic Reaction Loop

High-frequency actions (such as Liking a post or reacting to Reel counters) must update instantly on the UI first. Under extreme feed loads, database connections are preserved via debounced payload dispatchers.

### Redux Toolkit Reaction Slice (Optimistic Middleware Concept)
```typescript
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

interface ReactionState {
  reactionsByPost: Record<string, {
    likesCount: number;
    isLikedByMe: boolean;
    localPending: boolean;
  }>;
}

const initialState: ReactionState = { reactionsByPost: {} };

// Local debounced cache to hold intermediate states before DB sync
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const reactionSlice = createSlice({
  name: 'reactions',
  initialState,
  reducers: {
    toggleLikeOptimistic: (state, action: PayloadAction<{ postId: string }>) => {
      const { postId } = action.payload;
      if (!state.reactionsByPost[postId]) {
        state.reactionsByPost[postId] = { likesCount: 0, isLikedByMe: false, localPending: false };
      }
      const post = state.reactionsByPost[postId];
      post.isLikedByMe = !post.isLikedByMe;
      post.likesCount += post.isLikedByMe ? 1 : -1;
      post.localPending = true;
    }
  }
});
```

### Throttle & DB Dispatch Strategy
```typescript
/**
 * Debounces database write back-pressure to exactly 500ms.
 * Even if user clicks "like" 15 times, a single final payload reaches PostgreSQL.
 */
export const dispatchReactionUpdateDB = (postId: string, isLiked: boolean) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  
  debounceTimer = setTimeout(async () => {
    const response = await fetch(`/api/posts/${postId}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isLiked })
    });
    if (!response.ok) {
      // Rollback logic is triggered inside Redux store if DB transaction fails
    }
  }, 500);
};
```

---

## 4. Dual-Zone Payment & Unified Subscription Ledger

To transition seamlessly from a social platform to a highly monetized creators network, the app manages dual-currency ledgers (USD for international via Stripe Webhooks, BDT for Bangladesh via SSLCommerz/bKash Webhooks) in a consolidated ledger.

### Database Schema Definition: `payment_transactions` & `subscriptions`
```sql
CREATE TYPE currency_type AS ENUM ('BDT', 'USD');
CREATE TYPE payment_gateway AS ENUM ('STRIPE', 'SSLCOMMERZ', 'BKASH', 'NAGAD');
CREATE TYPE subscription_status AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id VARCHAR(128) REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier_name VARCHAR(100) NOT NULL, -- e.g., 'TIER_PRO_CREATOR'
    price_charged NUMERIC(10, 2) NOT NULL,
    currency currency_type NOT NULL, -- Fixed 'BDT' or 'USD' (no dynamic floating rates)
    gateway payment_gateway NOT NULL,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    status subscription_status DEFAULT 'PENDING' NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### Mock Package Configuration Structure (Static System Schemas)
```json
{
  "packages": {
    "tier_pro_creator": {
      "display_title": "Zivobook Pro Creator License",
      "rates": {
        "USD": 5.00,
        "BDT": 500.00
      },
      "entitlements": [
        "VERIFIED_BADGE_ACCENT",
        "AD_FREE_EXPERIENCE",
        "SSE_AI_CHATBOT_STREAMING"
      ]
    }
  }
}
```

---

## 5. Contextual AI RAG Pipeline with SSE Streaming

The Zivobook Chatbot Assistant leverages Retrieval-Augmented Generation to ground AI suggestions using verified data from PostgreSQL.

### Architecture Topology
```
[User Prompts Chat] ───> [Zivobook SSE Route] ───> Pull Context (e.g. user_goals, custom_post_bookmarks)
                                                        │
                                                        ▼
                                             Assemble System Prompt
                                                        │
                                                        ▼
                                             Invoke Gemini SDK Stream
                                                        │
                                                        ▼
                        <─── [EventSource Streams tokens back token-by-token]
```

### Server-Side streaming route template (`server.ts`)
```typescript
import { GoogleGenAI } from "@google/genai";
import express from 'express';

const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/api/ai/chat-stream', async (req, res) => {
  const { userPrompt, userId } = req.query;

  // Set necessary SSE headers for low latency token stream
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // 1. Fetch RAG Context from active database tables using server controller
    const userContextQuery = "SELECT title, target_date FROM user_goals WHERE profile_id = $1";
    // ... Execute query to assemble contextual payload ...

    // 2. Stream generation via modern SDK
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: `Context: ${JSON.stringify(userContextQuery)}. User prompt: ${userPrompt}`,
    });

    for await (const chunk of responseStream) {
       res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
    }
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: "Stream error occurred" })}\n\n`);
  } finally {
    res.end();
  }
});
```

---

## 6. Realtime Asset optimization Pipeline

All uploads to Firebase Storage must go through a serverless optimization flow before delivery to prevent cellular network degradation on mobile.

```
[Media Upload (Client App)] ──> [Firebase Storage Bucket: /raw]
                                        │
                                        ▼
                             [Sharp Converter Service]
                                        │ (Converts to WebP, reduces dimensions to max-w: 1200px)
                                        ▼
                               [Optimized Delivery Bucket: /public]
                                        │
                                        ▼
                               [Edge CDN Network]
                                        │
                                        ▼
                             [Buttery Smooth Client Render]
```

---

### Architectural Sign-off
*Zivobook has completed the design parameters for MVP rollout. These instructions decouple layout, state, media distribution, transactions, and AI grounding to avoid structural debt during immediate growth phases.*
