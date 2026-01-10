-- Supabase migration: Row Level Security policies
-- Following PM-Productivity-Tool security patterns

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE testing_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE email = auth.jwt() ->> 'email'
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user email
CREATE OR REPLACE FUNCTION current_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN auth.jwt() ->> 'email';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USER_PROFILES POLICIES
-- ============================================

-- Anyone authenticated can read user profiles (for approver lists, etc.)
CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "user_profiles_update_own" ON user_profiles
  FOR UPDATE TO authenticated
  USING (email = current_user_email())
  WITH CHECK (email = current_user_email());

-- Admins can manage all profiles
CREATE POLICY "user_profiles_admin_all" ON user_profiles
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- ENTRIES POLICIES
-- ============================================

-- All authenticated users can read non-deleted entries
CREATE POLICY "entries_select" ON entries
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- Users can create entries
CREATE POLICY "entries_insert" ON entries
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Users can update entries they authored or are approvers on, or admins
CREATE POLICY "entries_update" ON entries
  FOR UPDATE TO authenticated
  USING (
    author_email = current_user_email()
    OR approvers::text ILIKE '%' || current_user_email() || '%'
    OR is_admin()
  );

-- Only authors and admins can delete (soft delete)
CREATE POLICY "entries_delete" ON entries
  FOR DELETE TO authenticated
  USING (
    author_email = current_user_email()
    OR is_admin()
  );

-- ============================================
-- IDEAS POLICIES
-- ============================================

-- All authenticated users can read ideas
CREATE POLICY "ideas_select" ON ideas
  FOR SELECT TO authenticated
  USING (true);

-- All authenticated users can create ideas
CREATE POLICY "ideas_insert" ON ideas
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Users can update their own ideas or admins
CREATE POLICY "ideas_update" ON ideas
  FOR UPDATE TO authenticated
  USING (
    created_by_email = current_user_email()
    OR is_admin()
  );

-- Users can delete their own ideas or admins
CREATE POLICY "ideas_delete" ON ideas
  FOR DELETE TO authenticated
  USING (
    created_by_email = current_user_email()
    OR is_admin()
  );

-- ============================================
-- GUIDELINES POLICIES
-- ============================================

-- All authenticated users can read guidelines
CREATE POLICY "guidelines_select" ON guidelines
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can modify guidelines
CREATE POLICY "guidelines_admin_modify" ON guidelines
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- LINKEDIN_SUBMISSIONS POLICIES
-- ============================================

-- All authenticated users can read submissions
CREATE POLICY "linkedin_select" ON linkedin_submissions
  FOR SELECT TO authenticated
  USING (true);

-- All authenticated users can create submissions
CREATE POLICY "linkedin_insert" ON linkedin_submissions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Users can update their own submissions or admins
CREATE POLICY "linkedin_update" ON linkedin_submissions
  FOR UPDATE TO authenticated
  USING (
    submitter_email = current_user_email()
    OR owner_email = current_user_email()
    OR is_admin()
  );

-- Users can delete their own submissions or admins
CREATE POLICY "linkedin_delete" ON linkedin_submissions
  FOR DELETE TO authenticated
  USING (
    submitter_email = current_user_email()
    OR is_admin()
  );

-- ============================================
-- TESTING_FRAMEWORKS POLICIES
-- ============================================

-- All authenticated users can read testing frameworks
CREATE POLICY "testing_frameworks_select" ON testing_frameworks
  FOR SELECT TO authenticated
  USING (true);

-- All authenticated users can create testing frameworks
CREATE POLICY "testing_frameworks_insert" ON testing_frameworks
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- All authenticated users can update testing frameworks
CREATE POLICY "testing_frameworks_update" ON testing_frameworks
  FOR UPDATE TO authenticated
  USING (true);

-- Only admins can delete testing frameworks
CREATE POLICY "testing_frameworks_delete" ON testing_frameworks
  FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================
-- ACTIVITY_LOG POLICIES
-- ============================================

-- All authenticated users can read activity log
CREATE POLICY "activity_log_select" ON activity_log
  FOR SELECT TO authenticated
  USING (true);

-- All authenticated users can insert activity (logging their actions)
CREATE POLICY "activity_log_insert" ON activity_log
  FOR INSERT TO authenticated
  WITH CHECK (actor_email = current_user_email());

-- Activity log is append-only, no updates or deletes
-- (no update/delete policies)

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can only read their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_email = current_user_email());

-- System can insert notifications for any user
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Users can update (mark read) their own notifications
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_email = current_user_email())
  WITH CHECK (user_email = current_user_email());

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE TO authenticated
  USING (user_email = current_user_email());
