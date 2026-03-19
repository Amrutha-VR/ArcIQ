# ArcIQ - AI Quiz App That Doesn’t Get Repetitive

> *"Sometimes you gotta run before you can walk."* - Tony Stark

---

## Overview

ArcIQ is a quiz app that generates questions on the fly instead of pulling from a fixed database.

You pick a topic, difficulty, and number of questions - the app handles the rest. Every quiz is created in real time, so you don’t keep seeing the same questions over and over again.

The goal is simple: make learning feel less like memorizing answers and more like actually understanding things.

It’s built with Next.js 14, TypeScript, and Supabase for auth and storage. AI question generation is powered by Meta Llama 3.1 via Hugging Face. State is handled with Zustand, and the UI leans into an Iron Man-style HUD just for fun.

---

## Why This Exists

Most quiz apps get boring pretty quickly.

* Questions repeat
* You start memorizing instead of learning
* Topic coverage is limited

ArcIQ tries to fix that by generating questions dynamically. You can quiz yourself on pretty much anything, and the experience stays fresh.

Of course, using AI brings its own challenges - like incorrect answers or formatting issues - so there’s a lot of validation and cleanup happening behind the scenes to make sure the output is usable.

---

## Features

### Core

* Generate quizzes on any topic
* Choose difficulty (Easy / Medium / Hard)
* Select number of questions (5–20)
* Multiple choice questions (4 options)
* Timer per question (auto-submit when time runs out)
* Progress tracking with a combined progress + timer bar
* Navigate between questions freely
* Auto-save progress (survives refresh)

### Results & Review

* Final score + percentage
* Time taken
* Full answer breakdown with explanations
* Highlighted correct answers
* Ability to review all questions after finishing

### History

* Saved quiz attempts per user
* Filter by difficulty
* Sort by date, score, or topic
* Retake previous quizzes

### Extras

* Authentication (email + Google login)
* AI assistant (JARVIS-style hints during quizzes)
* Achievement badges and streak tracking
* Performance charts (progress over time)
* Leaderboard (personal bests)
* Share results
* Export results as PDF
* Confetti for high scores (because why not)

---

## Tech Stack

* **Frontend:** Next.js 14 (App Router), TypeScript
* **Styling:** Tailwind CSS
* **State Management:** Zustand
* **Backend / DB:** Supabase (PostgreSQL + Auth)
* **AI:** Hugging Face Inference Router (Llama 3.1)
* **Charts:** Recharts
* **PDF Export:** jsPDF

---

## How It Works

All AI requests go through backend API routes.

```
Browser → /api/generate → Hugging Face → validate → return questions
```

This keeps API keys secure and lets us clean up the AI response before sending it to the frontend.

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/ArcIQ.git
cd Quizzzzz
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add environment variables

Create a `.env.local` file:

```env
HUGGINGFACE_API_KEY=your_key_here

NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the app

```bash
npm run dev
```

---

## Known Limitations

* First quiz can take ~20–30 seconds (cold start on free tier)
* AI can occasionally return slightly incorrect answers
* Very niche topics may not always be accurate
* Rate limit on quiz generation (to avoid abuse)

---

## Future Improvements

* Shareable quiz links
* Better PDF export styling
* Offline support (PWA improvements)
* More question types
* Better handling of edge-case AI responses

---

## Final Note

This project started as a way to experiment with AI + full-stack development, but it turned into something actually useful.

If nothing else, it proves one thing , quizzes don’t have to be boring.

---

## License

MIT
