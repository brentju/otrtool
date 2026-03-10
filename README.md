# OTR Tool - Educator Dashboard

A warm, modern dashboard for educators to analyze classroom dialogue transcripts, focusing on Opportunities to Respond (OTRs) and student reasoning patterns.

## Features

- **Transcript Upload**: Drag-and-drop classroom dialogue transcripts (CSV, TXT)
- **OTR Analytics**: Visualize opportunities to respond by elicitation type, response type, and cognitive depth
- **Student Reasoning**: Automatic detection of student reasoning using EduConvoKit
- **Session Comparison**: Track teaching patterns across multiple sessions
- **Interactive Transcript**: Explore annotated teacher-student exchanges with filtering

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Recharts
- **Backend**: Python Flask API
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (frontend), Railway/Render (backend)
- **Annotation**: EduConvoKit for student reasoning detection

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Supabase account
- (Optional) OpenAI API key for advanced annotation

### 1. Clone and Setup

```bash
cd otrtool
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `backend/supabase_schema.sql`
3. Copy your project URL and anon key

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials

# Run the server
python app.py
```

The API will be available at `http://localhost:5000`

### 4. Frontend Setup

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials and API URL

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 5. Upload Sample Data

Use the provided `gpt5mini_annotations.csv` file as a sample transcript upload to test the dashboard.

## Project Structure

```
otrtool/
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route pages
│   │   ├── lib/          # API clients and utilities
│   │   └── types/        # TypeScript type definitions
│   └── package.json
├── backend/              # Flask API backend
│   ├── app.py           # Main Flask application
│   ├── supabase_schema.sql
│   └── requirements.txt
├── gpt5mini_annotations.csv  # Sample annotation data
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload transcript file |
| GET | `/api/sessions` | List all sessions |
| GET | `/api/sessions/<id>` | Get session details |
| GET | `/api/sessions/<id>/metrics` | Get session metrics |
| GET | `/api/sessions/<id>/otrs` | Get session OTRs |
| POST | `/api/sessions/<id>/annotate` | Trigger student reasoning annotation |
| DELETE | `/api/sessions/<id>` | Delete session |

## Deployment

### Quick Demo Deploy (Vercel + Render)

This is the fastest reliable setup for a next-day demo:

1. **Deploy backend to Render**
   - Create a new Render **Web Service** from this repo and set root directory to `backend/`.
   - You can also use the included `render.yaml` Blueprint.
   - Python version is pinned to 3.11 for dependency compatibility (`PYTHON_VERSION=3.11.11`).
   - Start command:
     - `gunicorn app:app --bind 0.0.0.0:$PORT`
   - Add environment variables in Render:
     - `SUPABASE_URL`
     - `SUPABASE_KEY` (Supabase **service role** key)
     - `OPENAI_API_KEY` (optional, but recommended for real annotation output)
   - After deploy, verify:
     - `https://<your-backend-domain>/api/health` returns `{"status":"ok"}`

2. **Deploy frontend to Vercel**
   - Import the same repository into Vercel (root-level `vercel.json` is already configured).
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_API_URL` = `https://<your-backend-domain>/api`
   - Redeploy after saving env vars.

3. **Run a 2-minute smoke test**
   - Open the deployed frontend URL.
   - Upload `gpt5mini_annotations.csv`.
   - Confirm dashboard charts load and session details render.

### Alternative: Render (both services)

You can also host the frontend as a Render Static Site and keep the same backend setup. Use the same environment variables shown above and point `VITE_API_URL` to your Render backend `/api` URL.

## Design Philosophy

The dashboard uses a warm, earthy color palette (terracotta, sage, coral) to create an inviting, non-intimidating analytics experience for educators. The design avoids generic AI aesthetics in favor of:

- Humanist typography (Nunito, Source Sans 3)
- Rounded, soft component shapes
- Organic data visualizations
- Approachable microcopy

## Future Enhancements

- Audio recording and transcription integration
- Longitudinal session comparison
- Custom annotation rubrics
- Export to PDF/CSV
- Collaborative annotation features

## License

MIT
