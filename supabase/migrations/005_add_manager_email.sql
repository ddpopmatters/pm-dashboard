-- Add manager_email to user_profiles for DB-backed manager assignments
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS manager_email TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_manager_email ON user_profiles(manager_email);

-- Seed existing relationship: Jameen manages Daniel, Francesca, Madeleine, Shweta
UPDATE user_profiles
SET manager_email = LOWER('Jameen.Kaur@PopulationMatters.org')
WHERE LOWER(name) IN (
  'daniel davis',
  'francesca harrison',
  'madeleine hewitt',
  'shweta shirodkar'
)
AND manager_email IS NULL;
