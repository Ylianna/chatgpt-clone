# ChatGPT Clone (Next.js + Supabase)

A minimal ChatGPT-like application built with modern web technologies.  
Supports chat conversations, AI responses, image uploads, and authentication.

---

## 🚀 Features

- 💬 Chat system with message history
- 🤖 AI responses via OpenRouter API
- 🖼 Image upload and preview
- 👤 Email authentication (magic link)
- 🆓 Anonymous mode (3 free messages)
- 🧠 Chat title generated from first message

---

## 🛠 Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Supabase (Database, Auth, Storage)
- OpenRouter (LLM API)
- Tailwind CSS
- shadcn/ui

---

## 📦 Installation

### 1. Clone the repository
-git clone <https://github.com/Ylianna/chatgpt-clone>
-cd chatgpt-clone
### 2. Install dependencies
npm install
### 3. Environment Variables
Create a .env.local file in the root of the project:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_key
### 4. Running the App
npm run dev

App will be available at:
http://localhost:3000