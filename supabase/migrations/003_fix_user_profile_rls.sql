-- Fix: user_profiles_update_own allows self-privilege-escalation
-- Users could set is_admin=true, change features, or alter status on their own row.
-- Replace with a restricted policy that only allows safe column updates.

-- Drop the permissive policy
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;

-- Users can only update their own name and avatar — nothing else.
-- Admin-only fields (is_admin, is_approver, features, status) remain protected
-- by the existing admin-only policy "user_profiles_admin_all".
CREATE POLICY "user_profiles_update_own_safe" ON user_profiles
  FOR UPDATE TO authenticated
  USING (email = current_user_email())
  WITH CHECK (
    email = current_user_email()
    -- Block escalation: these columns must remain unchanged
    AND is_admin = (SELECT up.is_admin FROM user_profiles up WHERE up.email = current_user_email())
    AND is_approver = (SELECT up.is_approver FROM user_profiles up WHERE up.email = current_user_email())
    AND features = (SELECT up.features FROM user_profiles up WHERE up.email = current_user_email())
    AND status = (SELECT up.status FROM user_profiles up WHERE up.email = current_user_email())
  );
