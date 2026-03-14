
-- Allow anonymous users to insert students too
DROP POLICY "Authenticated users can insert students" ON public.students;
CREATE POLICY "Anyone can insert students" ON public.students
FOR INSERT WITH CHECK (true);
