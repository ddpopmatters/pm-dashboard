-- Strategy alignment migration
-- Adds audience segments, Golden Thread assessment, and content assessment scores to entries.
-- Migrates old content pillar values to strategy-aligned pillars.

-- Add audience segment to entries
ALTER TABLE entries ADD COLUMN IF NOT EXISTS audience_segments JSONB DEFAULT '[]'::jsonb;

-- Add Golden Thread assessment to entries
ALTER TABLE entries ADD COLUMN IF NOT EXISTS golden_thread_pass BOOLEAN;

-- Add content assessment scores to entries
-- Structure: { mission: 1-5, platform: 1-5, engagement: 1-5, voice: 1-5, pillar: 1-5,
--              quick: { goldenThread: bool, hook: bool, platformFit: bool, shareWorthy: bool, pmVoice: bool } }
ALTER TABLE entries ADD COLUMN IF NOT EXISTS assessment_scores JSONB DEFAULT '{}'::jsonb;

-- Migrate old content pillar values to new strategy-aligned pillars
UPDATE entries SET content_pillar = 'Reproductive Rights & Bodily Autonomy' WHERE content_pillar = 'Awareness';
UPDATE entries SET content_pillar = 'Environmental Sustainability' WHERE content_pillar = 'Education';
UPDATE entries SET content_pillar = 'Population & Demographics' WHERE content_pillar = 'Engagement';
UPDATE entries SET content_pillar = 'Social Justice' WHERE content_pillar = 'Community';
UPDATE entries SET content_pillar = NULL WHERE content_pillar = 'Conversion';
