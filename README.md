# Arc IQ

An AI-powered quiz app I built as part of a full-stack assignment. You type a topic, pick how hard you want it, and the app generates a fresh set of questions using Meta Llama 3.1 via Hugging Face. No question banks, no repeated sets — every quiz is generated on the fly.

I themed it around Iron Man because I wanted something that felt distinctive rather than another generic quiz interface. The HUD aesthetic, the arc reactor score animation, the JARVIS chatbot — it all came together into something that actually felt fun to build and use. The name Arc IQ is a nod to the arc reactor that powers Iron Man's suit — the idea being that knowledge is your power source.

> "Sometimes you gotta run before you can walk." — Tony Stark

---

## Live Demo

🌐 **[arc-iq.vercel.app](https://arc-iq.vercel.app)**

---

## What it does

The basic loop is: create a quiz → answer questions with a timer → see your score with a breakdown of what you got right and wrong → earn badges based on performance → track history over time.

Beyond that there's a floating JARVIS chatbot that knows what topic you're quizzing on and gives hints without spoiling answers, a dashboard with score trend charts, a badge wallet with 10 achievements, PDF export, and Google OAuth alongside email login.






---

## Features

### The things that were required

- AI question generation — topic, difficulty (Easy / Medium / Hard), 5 to 20 questions
- One question at a time with a countdown timer that auto-submits if you run out
- Progress bar, dot navigation, previous/next buttons
- Auto-saves progress to localStorage so a page refresh doesn't kill your quiz
- Results page with your score, time taken, and a question-by-question breakdown
- Full quiz history with search, filter by difficulty, and sort options
- Retake any previous quiz
- Zustand for state management with persist middleware
- Responsive on mobile and desktop
- Error handling for API failures, bad AI responses, and network issues

### The optional stuff I also built

- Email + password auth and Google OAuth via Supabase
- Forgot password with a reset link and a password strength indicator
- Protected routes via Next.js middleware — you have to be logged in to take a quiz
- Quiz history saved to Supabase so it persists across devices and sessions
- JARVIS AI chat assistant — floats bottom-right, aware of what quiz you're on
- 10 achievement badges — performance-based ones for every quiz plus milestone badges
- Badge wallet page with JARVIS remarks when you click on a badge
- Dashboard with a score trend line chart and a difficulty breakdown bar chart
- Streak tracking
- Personal leaderboard
- Confetti on scores above 80%
- Rotating motivational quotes on the home page
- PDF export of results
- Share results via Web Share API with clipboard fallback
- Rate limiting on the generation endpoint (5 per minute per IP)
- React error boundary wrapping the whole app
- PWA manifest

---

## Tech stack

| | |
|---|---|
| Framework | Next.js 14 with App Router |
| Language | TypeScript — strict mode, no `any` |
| Styling | Tailwind CSS + CSS custom properties for theming |
| State | Zustand with persist middleware |
| Database + Auth | Supabase (PostgreSQL + Auth) |
| AI | Meta Llama 3.1 8B Instruct via Hugging Face Inference Router |
| Charts | Recharts |
| PDF | jsPDF |
| Fonts | Orbitron + Rajdhani from Google Fonts |

---

## Architecture decisions

### AI calls go through API routes

The Hugging Face key never touches the browser. Everything goes through `/api/generate` and `/api/chat` server-side. This was non-negotiable from a security standpoint — you can't expose API keys in client code.

### Zustand over Redux

I looked at Redux Toolkit and React Context for state management. Zustand won because there's genuinely zero boilerplate — no actions, no reducers, no providers. The `persist` middleware handled localStorage sync automatically and the `partialize` option let me control exactly what gets saved. For a project this size it was the right call.

### Supabase for history persistence

Early on I had quiz history only in localStorage. That meant if you cleared your browser or switched devices, everything was gone. Moving to Supabase's `quiz_attempts` table fixed this properly. When you log in, `AuthProvider` calls `loadResults(userId)` which pulls everything from the DB. Logout clears local state. The history is always accurate.

### Row Level Security

All tables have RLS enabled. Users can only read and write their own rows — enforced at the database level, not just the application level. This matters because even if someone found the anon key, they couldn't read another user's quiz history.

### The correctAnswer bug

This one took a while to track down. The AI model occasionally returns `correctAnswer` as a string `"2"` instead of a number `2`. In TypeScript, `selectedOption === "2"` where `selectedOption` is a number is always `false`. This caused correct answers to appear highlighted red while a wrong option went green — which is about as bad as it gets for a quiz app.

The fix was applied at three levels: `safeParseInt()` in the JSON parser, `Number(question.correctAnswer)` at render time, and `isCorrect = selectedOption === correctIdx` as a pure number comparison. Temperature was also dropped to `0.1` which significantly reduced how often the model produced inconsistent output.

### No resetQuiz() on finish

I had `resetQuiz()` being called in `handleFinishQuiz()` before the router navigated to results. This wiped the Zustand store before the results page could read from it — blank screen every time. The fix was to remove that call entirely and only reset state when the user explicitly navigates away.

---

## Setting up locally

You'll need Node 20+, a Supabase project, and a Hugging Face account. All free.

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/arc-iq.git
cd arc-iq
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and wait for it to provision. Then go to **SQL Editor** and run this:

```sql
-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  total_quizzes integer default 0,
  streak integer default 0,
  last_quiz_date date,
  created_at timestamp with time zone default timezone('utc', now())
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Quiz attempts table
create table public.quiz_attempts (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  quiz_id text not null,
  topic text not null,
  difficulty text not null,
  num_questions integer not null,
  questions jsonb not null,
  answers jsonb not null,
  score integer not null,
  percentage numeric not null,
  time_taken integer not null,
  completed_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc', now())
);

alter table public.quiz_attempts enable row level security;
create policy "Users can insert own attempts" on public.quiz_attempts for insert with check (auth.uid() = user_id);
create policy "Users can view own attempts" on public.quiz_attempts for select using (auth.uid() = user_id);
create policy "Users can delete own attempts" on public.quiz_attempts for delete using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 3. Get your API keys

**Supabase** — Settings → API:
- Project URL
- anon public key
- service_role key

**Hugging Face** — [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens):
- New token → Read access → copy it

### 4. Create .env.local

```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxx

NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Add redirect URL in Supabase

Supabase Dashboard → Authentication → URL Configuration → Redirect URLs:
```
http://localhost:3000/auth/callback
```

### 6. (Optional) Google OAuth

1. [console.cloud.google.com](https://console.cloud.google.com) → New project → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID → Web application
3. Authorized redirect URIs:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
4. Copy Client ID + Secret into Supabase → Authentication → Providers → Google

### 7. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/arc-iq.git
git branch -M main
git push -u origin main
```

Make sure `.env.local` is in your `.gitignore` — never push API keys.

### Step 2 — Import to Vercel

1. Go to [vercel.com](https://vercel.com) → sign up with GitHub
2. New Project → import your `arc-iq` repo
3. Vercel detects Next.js automatically — don't change anything

### Step 3 — Add environment variables

Before clicking Deploy, add all five variables from your `.env.local`:

```
HUGGINGFACE_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL    ← set this to https://arc-iq.vercel.app
```

Click Deploy and wait ~2 minutes.

### Step 4 — Update URLs after first deploy

Once you have your Vercel URL:

**Supabase** → Authentication → URL Configuration → add:
```
https://arc-iq.vercel.app/auth/callback
```

**Vercel** → your project → Settings → Environment Variables → update `NEXT_PUBLIC_APP_URL` to your production URL → Redeploy.

### Step 5 — Check it works

- Register with email
- Sign in with Google
- Generate a quiz
- Finish it, check results appear
- Log out, log back in — history should still be there

If the build fails, check the error log in Vercel. TypeScript errors and missing files are the two most common causes. Run `npm run build` locally first to catch them before pushing.

---

## AI integration details

### Model

Meta Llama 3.1 8B Instruct accessed via `https://router.huggingface.co/v1/chat/completions`. This is the OpenAI-compatible endpoint Hugging Face introduced in 2024 as a replacement for the legacy `api-inference.huggingface.co`. It accepts the same `messages` format as OpenAI's API.

The model is routed through Novita's infrastructure (`:novita` suffix in the model name) which tends to have better cold-start performance on the free tier.

### Why this model

Llama 3.1 8B was chosen after considering Mixtral 7B and Gemma 2B. Mixtral produced better output but was less consistently available on the free tier. Gemma was fast but struggled with structured JSON output. Llama 3.1 8B hit the right balance of quality, availability, and instruction-following.

### Getting consistent JSON out of an LLM

This was genuinely the hardest part of the whole project. LLMs don't naturally want to output raw JSON — they want to explain things, add commentary, wrap things in markdown code blocks. A few things that actually helped:

**Temperature at 0.1.** This was the biggest single improvement. Lower temperature means the model picks its most confident token at each step rather than sampling creatively. For factual quiz questions you want determinism, not creativity.

**A worked example in the prompt.** Just telling the model "correctAnswer is an index 0-3" wasn't enough. Showing it `"What is 2+2?" → options:["3","4","5","6"], correctAnswer:1` made it click. Models are few-shot learners — show don't tell.

**Stripping markdown at parse time.** Even with clear instructions the model sometimes wraps the JSON in backticks. `parseAIResponse()` strips ` ```json ` and ` ``` ` before trying to parse.

**`safeParseInt()` for correctAnswer.** The model returns `"2"` as a string sometimes. TypeScript's strict equality means `selectedOption === "2"` is always false when selectedOption is a number. Always coerce.

**Retry logic.** HuggingFace's free tier loads models on-demand. The first request to a cold model returns a 503. The API route retries up to 3 times with a 20 second wait between attempts.

### JARVIS assistant

Same model, different system prompt. When you're in a quiz, the assistant knows the topic and difficulty and is instructed to give Socratic hints rather than direct answers. Outside of a quiz it just helps with general knowledge questions.

---

## Known limitations

**Cold start latency.** On Hugging Face's free tier the first quiz generation after the model unloads can take 25–30 seconds. There's a loading message that cycles through JARVIS lines to make this feel intentional rather than broken. Switching to a paid tier or Groq's free API would fix this.

**AI still occasionally gets answers wrong.** Temperature 0.1 and careful prompting reduced this significantly but didn't eliminate it. The model struggles most with very recent events, highly specialised technical topics, and anything where the correct answer is non-obvious. There's no silver bullet here without fine-tuning or a retrieval-augmented approach.

**No real-time quiz sharing.** The share button copies a text summary to clipboard. There's no live shareable quiz link where someone else can take the same generated quiz. This would require storing quizzes in Supabase and generating shareable IDs.

**PDF export is functional but plain.** It gets the job done but it's basic jsPDF layout. A richer export would use html2canvas to screenshot the actual results page.

**No offline support.** The PWA manifest is there but there's no service worker. Offline quiz-taking would require caching generated questions and answers locally.

**Rate limit is global, not per-user.** The current rate limiter uses IP address. Behind a shared NAT (university network, VPN) this could incorrectly rate-limit multiple users. A proper implementation would limit per authenticated user ID.

---

## References

- Vercel. (2024). *Next.js App Router documentation*. https://nextjs.org/docs/app
- Supabase. (2024). *Server-Side Auth with Next.js*. https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase. (2024). *Row Level Security*. https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase. (2024). *OAuth with PKCE — Google*. https://supabase.com/docs/guides/auth/social-login/auth-google
- Hugging Face. (2024). *Inference Providers*. https://huggingface.co/docs/inference-providers/index
- Zustand contributors. (2024). *Persist middleware*. https://docs.pmnd.rs/zustand/integrations/persisting-store-data
- Wei, J., et al. (2022). *Chain-of-Thought Prompting Elicits Reasoning in Large Language Models*. https://arxiv.org/abs/2201.11903
- Ouyang, L., et al. (2022). *Training language models to follow instructions with human feedback*. https://arxiv.org/abs/2203.02155
- Recharts contributors. (2024). *Recharts documentation*. https://recharts.org/en-US/api
- OWASP. (2023). *Authentication Cheat Sheet*. https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- MDN Web Docs. (2024). *Web Share API*. https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
- Nielsen Norman Group. (2020). *Progress Indicators Make Users Feel Faster*. https://www.nngroup.com/articles/progress-indicators/
- React Team. (2024). *Rules of Hooks*. https://react.dev/reference/rules/rules-of-hooks

---

*Iron Man theme is fan-made. All Marvel trademarks belong to Disney/Marvel Entertainment.*
