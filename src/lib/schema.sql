-- D1 Schema for Lacrosse Bracket Predictor
-- Deploy with: wrangler d1 execute bracket-db --remote --file=./src/lib/schema.sql

-- Tournament configurations
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK(type IN ('olympic_sixes', 'ncaa', 'pll', 'world_championship', 'pan_american')),
  config_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'active', 'completed')),
  start_date TEXT,
  end_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bracket picks
CREATE TABLE IF NOT EXISTS brackets (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  group_picks TEXT NOT NULL,
  knockout_picks TEXT NOT NULL,
  third_place_picks TEXT NOT NULL DEFAULT '[]',
  score INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);

-- Email collection
CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  bracket_id TEXT,
  tournament_id TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);

-- Private groups
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  tournament_id TEXT NOT NULL,
  created_by_email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);

-- Group membership
CREATE TABLE IF NOT EXISTS group_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id TEXT NOT NULL,
  bracket_id TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (bracket_id) REFERENCES brackets(id),
  UNIQUE(group_id, email)
);

-- Actual tournament results
CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id TEXT NOT NULL,
  match_id TEXT,
  group_id TEXT,
  result_json TEXT NOT NULL,
  played_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brackets_tournament ON brackets(tournament_id);
CREATE INDEX IF NOT EXISTS idx_brackets_email ON brackets(email);
CREATE INDEX IF NOT EXISTS idx_emails_tournament ON emails(tournament_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite ON groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_groups_tournament ON groups(tournament_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_results_tournament ON results(tournament_id);