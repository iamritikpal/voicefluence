# Voicefluence — Voice to Authority LinkedIn Engine

A full-stack SaaS application that transforms voice notes into high-authority LinkedIn posts, personalized to your writing style.

## How It Works

1. **Sign up / Log in** with email and password
2. **Configure your profile** — paste 3-5 past LinkedIn posts so the AI learns your writing style
3. **Record a voice note** (1-3 minutes) sharing an insight, lesson, or opinion
4. **Get a polished LinkedIn post** — the app transcribes your audio, analyzes your style, and generates an authority-driven post ready to publish

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (CRA), React Router, Axios, CSS3 |
| Backend | Node.js, Express, MongoDB (Mongoose) |
| Speech-to-Text | Google Cloud Speech-to-Text API |
| AI Generation | Azure OpenAI GPT-5.2 |
| Auth | JWT + bcrypt |

## Prerequisites

- **Node.js** v18+
- **MongoDB** running locally or a cloud instance (MongoDB Atlas)
- **Google Cloud** service account with Speech-to-Text API enabled
- **Azure OpenAI** resource with a GPT-5.2 deployment

## Setup

### 1. Clone and install dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure environment variables

**Backend** — edit `server/.env`:

```
MONGO_URI=mongodb://localhost:27017/voicefluence
JWT_SECRET=your-strong-secret-key
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-52
AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

**Frontend** — edit `client/.env`:

```
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Add Google Cloud credentials

Place your GCP service account JSON file in the `server/` directory and update `GOOGLE_APPLICATION_CREDENTIALS` in `.env`.

### 4. Start the app

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm start
```

The frontend runs on `http://localhost:3000` and the backend on `http://localhost:5000`.

## Project Structure

```
/client                    React frontend
  /src
    /components            Reusable UI components
    /pages                 Route-level pages
    /styles                Plain CSS files
    /services              API client
    App.js                 Router and auth state
    index.js               Entry point

/server                    Express backend
  /controllers             Route handlers
  /routes                  API route definitions
  /models                  Mongoose schemas
  /services                Business logic (GCP, Azure, style analysis)
  /middleware              JWT auth middleware
  server.js                Entry point
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | No | Create account |
| POST | /api/auth/login | No | Log in |
| GET | /api/auth/me | Yes | Get current user |
| GET | /api/profile | Yes | Get profile |
| PUT | /api/profile | Yes | Update profile |
| POST | /api/profile/analyze-style | Yes | Analyze writing style from posts |
| POST | /api/posts/generate | Yes | Upload audio, get LinkedIn post |
| POST | /api/posts/regenerate | Yes | Regenerate post from existing transcript |
