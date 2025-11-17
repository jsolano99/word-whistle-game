-- Create bug_reports table
CREATE TABLE public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  screenshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert bug reports (no auth required)
CREATE POLICY "Anyone can submit bug reports"
ON public.bug_reports
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Create storage bucket for bug screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-screenshots', 'bug-screenshots', false);

-- Allow anyone to upload screenshots
CREATE POLICY "Anyone can upload bug screenshots"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'bug-screenshots');