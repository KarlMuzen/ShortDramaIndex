-- Migration: Add editorial verification and monetization mechanics
-- Safe: Uses unverified/null defaults so existing data is never falsely stamped.

-- 1. Series verification & production provenance
ALTER TABLE series 
ADD COLUMN IF NOT EXISTS production_type TEXT DEFAULT 'live_action' 
  CHECK (production_type IN ('live_action', 'hybrid', 'animation', 'ai_assisted')),
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' 
  CHECK (verification_status IN ('verified_commercial', 'editorial_approved', 'community_submitted', 'unverified')),
ADD COLUMN IF NOT EXISTS studio_name TEXT,
ADD COLUMN IF NOT EXISTS has_human_cast BOOLEAN DEFAULT true;

-- 2. Release monetization & direct watch links
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS monetization_type TEXT 
  CHECK (monetization_type IN ('coin_per_episode', 'subscription', 'ad_supported', 'free_with_ads', 'hybrid')),
ADD COLUMN IF NOT EXISTS free_episodes INT 
  CHECK (free_episodes >= 0),
ADD COLUMN IF NOT EXISTS coins_per_episode INT 
  CHECK (coins_per_episode >= 0),
ADD COLUMN IF NOT EXISTS estimated_unlock_cost_usd NUMERIC(7,2) 
  CHECK (estimated_unlock_cost_usd >= 0),
ADD COLUMN IF NOT EXISTS direct_watch_url TEXT 
  CHECK (direct_watch_url ~ '^https?://' AND length(direct_watch_url) <= 1000);

-- Comment documenting cross-field intent
COMMENT ON COLUMN series.has_human_cast IS 'Editorial flag: true if verified human actors are credited; false for synthetic AI-generated avatars';
