-- Supabase migration: Initial schema for pm-dashboard
-- Converted from D1/SQLite schema to PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'disabled')),
  is_admin BOOLEAN DEFAULT false,
  is_approver BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);

-- Entries (scheduled content)
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  platforms JSONB DEFAULT '[]'::jsonb,
  asset_type TEXT DEFAULT 'Design',
  caption TEXT,
  platform_captions JSONB DEFAULT '{}'::jsonb,
  first_comment TEXT,
  approval_deadline DATE,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  approvers JSONB DEFAULT '[]'::jsonb,
  author TEXT,
  author_email TEXT,
  campaign TEXT,
  content_pillar TEXT,
  preview_url TEXT,
  checklist JSONB DEFAULT '{}'::jsonb,
  analytics JSONB DEFAULT '{}'::jsonb,
  workflow_status TEXT DEFAULT 'Draft' CHECK (workflow_status IN ('Draft', 'In Review', 'Approved', 'Scheduled', 'Published')),
  status_detail TEXT,
  ai_flags JSONB DEFAULT '[]'::jsonb,
  ai_score JSONB DEFAULT '{}'::jsonb,
  testing_framework_id UUID,
  testing_framework_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_entries_date ON entries(date);
CREATE INDEX idx_entries_status ON entries(status);
CREATE INDEX idx_entries_workflow_status ON entries(workflow_status);
CREATE INDEX idx_entries_author_email ON entries(author_email);
CREATE INDEX idx_entries_deleted_at ON entries(deleted_at) WHERE deleted_at IS NULL;

-- Ideas (content ideas)
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT DEFAULT 'Other',
  title TEXT NOT NULL,
  notes TEXT,
  links JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  inspiration TEXT,
  created_by TEXT,
  created_by_email TEXT,
  target_date DATE,
  target_month TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ideas_target_month ON ideas(target_month);
CREATE INDEX idx_ideas_created_by_email ON ideas(created_by_email);

-- Guidelines (content rules) - single row table
CREATE TABLE IF NOT EXISTS guidelines (
  id TEXT PRIMARY KEY DEFAULT 'default',
  char_limits JSONB DEFAULT '{}'::jsonb,
  banned_words JSONB DEFAULT '[]'::jsonb,
  required_phrases JSONB DEFAULT '[]'::jsonb,
  language_guide TEXT,
  hashtag_tips TEXT,
  teams_webhook_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LinkedIn submissions
CREATE TABLE IF NOT EXISTS linkedin_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_type TEXT DEFAULT 'My own account',
  status TEXT DEFAULT 'Draft',
  title TEXT,
  post_copy TEXT,
  comments TEXT,
  owner TEXT,
  owner_email TEXT,
  submitter TEXT,
  submitter_email TEXT,
  links JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_linkedin_submissions_owner_email ON linkedin_submissions(owner_email);
CREATE INDEX idx_linkedin_submissions_target_date ON linkedin_submissions(target_date);

-- Testing frameworks
CREATE TABLE IF NOT EXISTS testing_frameworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  hypothesis TEXT,
  audience TEXT,
  metric TEXT,
  duration TEXT,
  status TEXT DEFAULT 'Planned' CHECK (status IN ('Planned', 'Running', 'Completed', 'Cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log (audit trail)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  target_title TEXT,
  actor_email TEXT NOT NULL,
  actor_name TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  related_users JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_target_id ON activity_log(target_id);
CREATE INDEX idx_activity_log_actor_email ON activity_log(actor_email);
CREATE INDEX idx_activity_log_related_users ON activity_log USING GIN (related_users);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_email ON notifications(user_email);
CREATE INDEX idx_notifications_read ON notifications(user_email, read) WHERE read = false;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entries_updated_at BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_linkedin_submissions_updated_at BEFORE UPDATE ON linkedin_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guidelines_updated_at BEFORE UPDATE ON guidelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
