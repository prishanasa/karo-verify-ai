-- Drop the old trigger and function that tries to insert role into profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new function to handle user signup
-- This function creates both a profile AND a user_role entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the role from signup metadata, default to 'user'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  -- Create profile entry (without role column)
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  
  -- Create user_role entry
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role);
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();