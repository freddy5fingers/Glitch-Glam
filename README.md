
# GLITCH GLAM - AI Virtual Makeup Studio

**Glitch Glam** is a professional, AI-powered virtual makeup try-on application. It leverages Google's Gemini models to analyze skin tone, recommend products, and realistically render makeup on user photos in real-time. It uses **Supabase** for robust authentication, database, and real-time synchronization.

## ✨ Features

- **AI Face Detection**: Automatically identifies faces in uploaded photos.
- **Smart Beauty Analysis**: Analyzes skin tone and undertones to recommend matching foundations and lipsticks.
- **Realistic Try-On**: Applies Lipstick, Blush, Foundation, Eyeshadow, and Eyeliner with adjustable intensity.
- **Product Scanner**: Identifies physical makeup products using the camera and finds them online.
- **Split-Screen Comparison**: Compare "Before & After" or two different looks side-by-side.
- **Real-time Cloud Sync**: User profiles and favorites synced instantly via Supabase.
- **Cross-Platform**: Web, Android, and iOS ready.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **AI**: Google Gemini API (`gemini-2.5-flash-image`, `gemini-3-flash-preview`)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Runtime**: Capacitor (for Android/iOS)
- **Build**: Vite

## 🚀 Getting Started

### Prerequisites

1.  **Google Gemini API Key**: Get one at [aistudio.google.com](https://aistudio.google.com).
2.  **Supabase Project**: Create one at [supabase.com](https://supabase.com).
3.  **Node.js**: v18+

### Database Setup (Supabase)

Run this SQL query in your Supabase SQL Editor to create the users table:

```sql
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  favorites jsonb default '[]'::jsonb,
  custom_products jsonb default '[]'::jsonb,
  saved_looks jsonb default '[]'::jsonb
);

-- Enable Realtime
alter publication supabase_realtime add table public.users;

-- Set up Row Level Security (RLS)
alter table public.users enable row level security;

create policy "Users can view their own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own data" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert their own data" on public.users
  for insert with check (auth.uid() = id);
```

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Environment Variables**:
    Update `services/supabase.ts` with your credentials or create a `.env` file:
    ```
    API_KEY=your_google_gemini_api_key
    SUPABASE_URL=your_project_url
    SUPABASE_ANON_KEY=your_anon_key
    ```

4.  Run the web app:
    ```bash
    npm start
    ```

## 📱 Android App Deployment

Turn this web app into a native Android application using Capacitor.

### 1. Initial Setup

```bash
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/android
```

### 2. Build & Sync

```bash
npm run build
npx cap add android
npx cap sync
```

### 3. Permissions

Ensure camera permissions are added to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-feature android:name="android.hardware.camera" />
```

### 4. Run

```bash
npx cap open android
```

## 📄 License

Proprietary software. All rights reserved.
