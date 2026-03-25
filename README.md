<<<<<<< HEAD
# ItExists

ItExists is a chaotic hackathon web app with:
- a roast-style chat module backed by Ollama
- a character quiz + nickname assignment flow
- a profile doodle selector
- mini-game + score tracking
- meme viewer section
- optional EmailJS-powered "unhelpful" email sender

## Tech Stack

- Node.js + Express
- MySQL (`mysql2`)
- Vanilla HTML/CSS/JS frontend
- Ollama (local LLM, optional but recommended)
- EmailJS (optional)

## Project Structure

- `server.js` - Express entrypoint
- `routes/` - API routes (`user`, `chat`, `game`)
- `db/` - MySQL connection + schema
- `lib/ollama.js` - Ollama integration with CPU fallback on CUDA errors
- `public/` - frontend pages, scripts, styles, assets
- `docs/emailjs-setup.md` - detailed EmailJS setup

## Prerequisites

- Node.js 18+ (20+ recommended)
- MySQL 8+
- Ollama installed locally (if you want LLM responses)

## 1. Install dependencies

```bash
npm install
```

## 2. Create database and tables

Run `db/schema.sql` in MySQL:

```sql
CREATE DATABASE IF NOT EXISTS dumbassia;
USE dumbassia;
-- then run the rest of db/schema.sql
```

## 3. Configure environment variables

Create a `.env` file in the project root (or copy `.env.example`):

```env
PORT=3000
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_TIMEOUT_MS=60000
OLLAMA_CHAT_TIMEOUT_MS=45000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=dumbassia
```

## 4. Pull and run Ollama model (optional but recommended)

```bash
ollama pull llama3.1:8b
ollama serve
```

If Ollama is unavailable, parts of the app still work via route-level fallback responses.

## 5. Run the app

```bash
npm run start
```

Open:

- [http://localhost:3000](http://localhost:3000)

## Optional: EmailJS setup

The dashboard has an email section.

1. Configure `public/js/email-config.js` with your EmailJS keys.
2. Follow full instructions in `docs/emailjs-setup.md`.

Note: EmailJS keys are client-side in this app by design.

## Reset app data (fresh start)

If you want to clear all profiles and quiz answers:

```sql
DELETE FROM quiz_answers;
DELETE FROM users;
```

## Troubleshooting

### Chat route timeout

- Ensure `ollama serve` is running.
- Ensure the configured model exists (`ollama list`).
- Increase `OLLAMA_CHAT_TIMEOUT_MS` if needed.

### CUDA errors from Ollama

This project already includes a CPU retry fallback in `lib/ollama.js` (`num_gpu: 0`) when CUDA errors occur.

### App starts but no saved profiles

Check DB credentials in `.env` and confirm the `users` table exists.

## Scripts

- `npm run start` - start server
- `npm run dev` - same as start

## Notes for Contributors

- This project is intentionally absurd and non-serious in tone.
- Keep roast behavior sarcastic/non-helpful by design.
- Frontend state uses `localStorage` and `sessionStorage`.
=======
# Code-blooded-Stupid-Hackathon
>>>>>>> ce6e4fd8a933ac2466633e8804f4e9f892380df5
