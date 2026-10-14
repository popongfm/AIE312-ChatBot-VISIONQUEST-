CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Portfolio (spec 4.1)
CREATE TABLE team (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  concept TEXT,
  highlights TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE team_contacts (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL
);

CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  role TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE member_skills (
  member_id INT REFERENCES members (id) ON DELETE CASCADE,
  skill_id INT REFERENCES skills (id) ON DELETE CASCADE,
  level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 5),
  PRIMARY KEY (member_id, skill_id)
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  title TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  tech TEXT[] NOT NULL DEFAULT '{}',
  repo_url TEXT,
  demo_url TEXT,
  image_url TEXT,
  is_team_project BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE project_members (
  project_id INT REFERENCES projects (id) ON DELETE CASCADE,
  member_id INT REFERENCES members (id) ON DELETE CASCADE,
  contribution TEXT,
  PRIMARY KEY (project_id, member_id)
);

-- Chat (spec 4.2)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX conversations_client_id_created_at_idx
  ON conversations (client_id, created_at DESC);

CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  content TEXT NOT NULL,
  cited_members TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_id_created_at_idx
  ON messages (conversation_id, created_at);
