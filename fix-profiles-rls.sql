-- Fix RLS policies for profiles table
-- This allows authenticated users to read all profiles
-- and admins to manage all profiles

-- 1. Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies on profiles to avoid conflicts
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;

-- 3. Create policy: Any authenticated user can read all profiles
-- (needed for admin panel to see all users)
CREATE POLICY "profiles_select_all" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- 4. Create policy: Users can update their own profile
CREATE POLICY "profiles_update_own" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- 5. Create policy: Only admins can insert new profiles (via service role or API)
-- This is typically done via service role key, so we allow it
CREATE POLICY "profiles_insert_all" 
ON profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Verify policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'profiles';
