
-- Allow anyone to view, update, and delete students
DROP POLICY "Admins can view all students" ON public.students;
DROP POLICY "Admins can update students" ON public.students;
DROP POLICY "Admins can delete students" ON public.students;

CREATE POLICY "Anyone can view students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Anyone can update students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete students" ON public.students FOR DELETE USING (true);
