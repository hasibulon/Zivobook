# Systems Architecture & Design Blueprint: Verified Social Network

Welcome to the Technical Design Document for the **Verified Social Network** (colloquially styled as the **Z / VeriTrust Network**). This system is designed as a secure, full-stack, trust-oriented social media application prioritizing entity verification, secure item markets, dynamic group registries, and real-time messaging.

---

## 🏛️ System Architecture

The application is structured as a full-stack, single-page web app utilizing **Vite/React** on the frontend, styled with utility-first **Tailwind CSS**, and backed by **Firebase (Firestore/Auth)** for persistent state synchronization.

```
+-------------------------------------------------------------+
|                       REACTIVE CLIENT                       |
|           [Vite + React 19 + Tailwind CSS + Motion]         |
+------------------------------+------------------------------+
                               |
                   ⚡ Interactive Sync Flows
                               v
+-------------------------------------------------------------+
|                      CLOUD BACKEND                          |
|             [Firebase Auth & Firestore Database]            |
+-------------------------------------------------------------+
```

### Key Technical Dependencies
- **Core Framework**: React 19 / TypeScript 5.8
- **Build Engine**: Vite 6.2
- **Styling Core**: Tailwind CSS 4.1 / Lucide Icons
- **Motion & Transitions**: Net Native Smooth Animations (`motion`)
- **Persistence Layer**: Firebase SDK v12 (Firestore & Auth)

---

## 🎨 Theme, Typography & Visual Identity

The interface implements a custom, high-contrast visual theme designed for heavy read-write interactions.

- **Dual-Mode Canvas Integration**: Full dark/light system controlled dynamically via settings.
- **Typography Strategy**:
  - **Display Typography**: **Inter** (sans-serif) for general interface components, emphasizing clean, high-contrast tracking and readability.
  - **Aesthetics & Accents**: **JetBrains Mono** / **Space Grotesk** styling for verification levels, ledger records, telemetry logs, and status attributes.
- **Color Palettes**:
  - **Slate Prime Backgrounds**: Sophisticated `bg-slate-950` backdrops paired with card layers in `bg-slate-900/40` and border overlays in `border-slate-850`.
  - **Trust Green Accents**: `#10B981` (Emerald) and `#1877F2` (Facebook Blue) elements are utilized to depict authentic status, certified badge tiers, and verified state indicators.

---

## 🗂️ Frontend Component Layout & Hierarchy

The codebase adopts a highly modular components system split out of `App.tsx` for optimal performance, isolation of side effects, and readability.

### Core Entry Point (`/src/App.tsx`)
This acts as the state director and application layout manager. It coordinates:
- Core session initialization with Firebase.
- App-wide state: `activeTab` navigation router, layout settings, toast dispatchers.
- Layout wraps matching sidebars (`Sidebar.tsx`, `BottomNavbar.tsx`, `TopNavbar.tsx`) around central focus contents.

### Component Map (`/src/components/*`)

1. **Identity & Feed Controllers**
   - `AuthPage.tsx`: Secure onboarding gate handling registration, logging, and account claims.
   - `ProfileView.tsx`: User profile hub displaying details list, cover photos, customized posts feeds, stories registries and responsive modals (Reels, Custom Photos, Retro Flashbacks, Hosted Events).
   - `ProfileStats.tsx`: Multi-dimensional metrics displaying followers, followings, and overall engagement points.
   - `GlobalCreatePostModal.tsx` & `CreatePost.tsx`: Streamlined, interactive forms supporting file ingestion, category-tagging, location inputs, and privacy rules.
   - `StoriesSection.tsx`: Highlight carousels conveying dynamic community activities and live media play loops.

2. **Decentralized Groups & Markets**
   - `GroupsAndPagesView.tsx`: Collaborative forum segmented into user classes, shared pages, and personalized membership clusters.
   - `MarketplaceView.tsx`: Digital merchant portal cataloging items (Tokens, Hardware, Passes) paired with a streamlined "My Merchant Vault" control board.
   - `DirectoryView.tsx`: Public list of verified network entities, making discoverability transparent and secure.

3. **Verifications & Trust Layers**
   - `BadgesView.tsx`: Interactive center detailing the requirements and privileges associated with **Gold**, **Emerald**, and **Blue** certification classes.
   - `VerificationModal.tsx`: Multi-form system supporting government IDs, biometric signatures, and community-trust applications.
   - `PostCard.tsx`: Rich feed item containing threaded comment panels, quick-action sharing tools, and interactive content verifications.

4. **Moderation, Messaging, & Utility**
   - `AdminDashboard.tsx`: Power system for admins to moderate flag reports, ban violating records, and check global server telemetry.
   - `MessagesView.tsx`: Dynamic chat engine with structured bubble layouts and online indicators.
   - `SettingsView.tsx`: Tailored settings for themes, font size scaling, privacy defaults, and account modifications.
   - `Toast.tsx`: Event dispatcher providing success/error snackbars.

---

## 🔐 State Preservation & Firestore Blueprints

Durable storage is persisted across sessions inside Cloud Firestore.

### Collections Structure
- **Users (`/users/{userId}`)**: Identity fields, verification indices, avatar matrices, and connection graphs.
- **Posts (`/posts/{postId}`)**: Federated feeds, image associations, metadata, privacy targets, and verification hashes.
- **Comments (`/posts/{postId}/comments/{commentId}`)**: Threaded comments tied directly to parent posts.
- **Reports (`/reports/{reportId}`)**: Moderation logs tracked on the administration desk.

---

## 🚀 Key Operation Workflows

### 1. The Verification Lifecycle
```
User Requests Verification
  --> Dialog Ingestion (Select Method: Biometric / Government ID / Professional)
  --> Admin Appraisal Logged (Via Admin Console)
  --> Approve/Decline Execution
  --> Grant Class level (Gold, Emerald, Blue) & Emit Notification
```

### 2. Tab Delegation Routing
The interface maintains a modern virtual router by mapping `activeTab` to distinct layouts, matching direct sidebar selections, short menus, and internal profile navigation commands:
```ts
const handleNavigate = (tab: SidebarTab | 'admin' | 'my-shop' | 'my-groups' | 'my-pages') => {
  if (tab === 'my-shop') {
    setMarketplaceCategory('my-shop');
    setActiveTab('marketplace');
  } else if (tab === 'my-groups') {
    setGroupsAndPagesSegment('my-groups');
    setActiveTab('groups');
  } else if (tab === 'my-pages') {
    setGroupsAndPagesSegment('my-pages');
    setActiveTab('groups');
  } else {
    setActiveTab(tab as SidebarTab | 'admin');
  }
};
```

---

## 🛠️ Performance & Scalability Highlights

1. **Virtual Wrapping & Chunk Isolation**: Major subviews are split into dedicated chunks to reduce re-evaluation intervals.
2. **Infinite Scrolled Layouts**: Virtualization layers prevent layout-shifts when loading hundreds of complex post cards.
3. **Tailwind compilation optimization**: Utilizes Vite's `@tailwindcss/vite` compiler to compile inline modules instantly.

This architecture balances high client performance with absolute data persistence, maintaining integrity while creating a premium user experience.
