-- Allow authenticated users to insert their own role (only once during signup)
CREATE POLICY "Users can insert own role during signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);