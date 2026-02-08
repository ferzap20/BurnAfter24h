/*
  # Create messages and reports tables

  1. New Tables
    - `messages`
      - `id` (uuid, primary key) - Unique identifier
      - `nickname` (text) - Message author nickname (2-20 chars)
      - `message` (text) - Message content (max 400 chars)
      - `country` (text) - ISO country code (e.g., 'US', 'XX' for unknown)
      - `country_name` (text) - Full country name
      - `ip_hash` (text) - SHA-256 hash of user IP (never raw IP)
      - `created_at` (timestamptz) - When message was posted
      - `expires_at` (timestamptz) - When message auto-deletes (24 hours from creation)
      - `report_count` (integer) - Number of reports received
      - `is_hidden` (boolean) - Auto-hidden when reportCount >= 5
      - `is_highlighted` (boolean) - Future feature for paid highlighting
      - `is_private` (boolean) - Future feature for private messages
      - `burn_time_extension` (integer) - Future feature for extended lifetime

    - `reports`
      - `id` (uuid, primary key) - Unique identifier
      - `message_id` (uuid, fk) - Reference to message being reported
      - `reporter_ip_hash` (text) - SHA-256 hash of reporter's IP
      - `reason` (text) - Why the message was reported (optional)
      - `status` (text) - 'pending', 'reviewed', or 'dismissed'
      - `created_at` (timestamptz) - When report was submitted
      - `reviewed_at` (timestamptz) - When moderator reviewed (optional)
      - `reviewer_note` (text) - Moderator notes (optional)

  2. Indexes
    - Messages: TTL on expires_at, index on is_hidden, compound on (is_highlighted, created_at)
    - Reports: Unique compound on (message_id, reporter_ip_hash) to prevent duplicate reports

  3. Security
    - Enable RLS on both tables
    - Public read access to active (not hidden, not expired) messages
    - Public insert access to messages with rate limiting enforced in edge functions
    - Public create reports with duplicate prevention via unique constraint
    - Messages auto-expire via scheduled cleanup or application logic

  4. Important Notes
    - IP addresses are NEVER stored raw - always hashed immediately on client or edge function
    - TTL deletion handled by scheduled job or application cleanup (PostgreSQL doesn't have TTL like MongoDB)
    - All timestamps in UTC (timestamptz)
    - Report status workflow: pending → reviewed/dismissed
*/

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  message TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'XX',
  country_name TEXT NOT NULL DEFAULT 'Unknown',
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  report_count INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  is_private BOOLEAN NOT NULL DEFAULT false,
  burn_time_extension INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reporter_ip_hash TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewer_note TEXT,
  UNIQUE(message_id, reporter_ip_hash)
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_hidden ON messages(is_hidden);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_highlighted_created ON messages(is_highlighted DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_ip_hash ON messages(ip_hash);

-- Create indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_message_id ON reports(message_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_ip ON reports(reporter_ip_hash);

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active (not hidden, not expired) messages
CREATE POLICY "Anyone can read active messages"
  ON messages
  FOR SELECT
  TO anon, authenticated
  USING (NOT is_hidden AND expires_at > now());

-- Allow anyone to insert messages (rate limiting enforced in edge function)
CREATE POLICY "Anyone can create messages"
  ON messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow edge functions to update message report count
CREATE POLICY "System can update message report count"
  ON messages
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Enable RLS on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read reports (for moderators, eventually)
CREATE POLICY "Anyone can read reports"
  ON reports
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to create reports (duplicate prevention via unique constraint)
CREATE POLICY "Anyone can create reports"
  ON reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow updates to report status (for moderation)
CREATE POLICY "System can update report status"
  ON reports
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
