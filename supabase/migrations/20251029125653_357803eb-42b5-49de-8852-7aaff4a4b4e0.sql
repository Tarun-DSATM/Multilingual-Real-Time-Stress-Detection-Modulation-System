-- Create users table for voice-aware-zen system
CREATE TABLE public.users (
  user_id TEXT PRIMARY KEY,
  baseline_threshold FLOAT DEFAULT 0.5,
  preferred_language TEXT DEFAULT 'kn',
  session_count INT DEFAULT 0,
  intervention_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE public.sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stress_score FLOAT NOT NULL CHECK (stress_score >= 0.0 AND stress_score <= 1.0),
  language TEXT NOT NULL,
  intervention TEXT,
  effectiveness FLOAT CHECK (effectiveness >= 0.0 AND effectiveness <= 1.0),
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_timestamp ON public.sessions(timestamp DESC);
CREATE INDEX idx_sessions_language ON public.sessions(language);
CREATE INDEX idx_sessions_stress_score ON public.sessions(stress_score);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated clinicians/researchers
-- Only authenticated users can view data
CREATE POLICY "Authenticated users can view all users"
ON public.users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view all sessions"
ON public.sessions FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can insert/update data
CREATE POLICY "Authenticated users can insert users"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update users"
ON public.users FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert sessions"
ON public.sessions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sessions"
ON public.sessions FOR UPDATE
TO authenticated
USING (true);

-- Allow API (anon key) to insert data from Python backend
CREATE POLICY "API can insert users"
ON public.users FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "API can update users"
ON public.users FOR UPDATE
TO anon
USING (true);

CREATE POLICY "API can insert sessions"
ON public.sessions FOR INSERT
TO anon
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for real-time dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;