-- Create app_feedback table for storing user feedback
CREATE TABLE public.app_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert feedback
CREATE POLICY "Anyone can submit feedback"
ON public.app_feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to view feedback (for admin purposes)
CREATE POLICY "Authenticated users can view feedback"
ON public.app_feedback
FOR SELECT
TO authenticated
USING (true);