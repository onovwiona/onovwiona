-- Create universities table
CREATE TABLE public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matric_number TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    other_name TEXT,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
    state_of_origin TEXT NOT NULL,
    lga TEXT NOT NULL,
    level TEXT NOT NULL,
    jamb_number TEXT NOT NULL UNIQUE,
    nin TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    email_address TEXT NOT NULL,
    program TEXT NOT NULL,
    department TEXT NOT NULL,
    faculty TEXT NOT NULL,
    duration_of_course TEXT NOT NULL,
    total_fees TEXT NOT NULL,
    academic_session TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert universities
CREATE POLICY "Anyone can insert universities" ON public.universities FOR INSERT WITH CHECK (true);

-- Allow anyone to view universities
CREATE POLICY "Anyone can view universities" ON public.universities FOR SELECT USING (true);

-- Allow anyone to update universities
CREATE POLICY "Anyone can update universities" ON public.universities FOR UPDATE USING (true);

-- Allow anyone to delete universities
CREATE POLICY "Anyone can delete universities" ON public.universities FOR DELETE USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_universities_updated_at
BEFORE UPDATE ON public.universities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();