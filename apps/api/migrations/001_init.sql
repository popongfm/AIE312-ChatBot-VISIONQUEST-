-- Portfolio data (shapes follow @vq/shared: Team, Contact, Member, MemberSkill, MemberProject, TeamProject)

CREATE TABLE team (
  id         integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- exactly one team row
  name       text NOT NULL,
  tagline    text,
  concept    text,
  highlights text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE contacts (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type       text NOT NULL,
  label      text NOT NULL,
  url        text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE members (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug       text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  name       text NOT NULL,
  nickname   text,
  role       text NOT NULL,
  bio        text,
  avatar_url text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE member_skills (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id  integer NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name       text NOT NULL,
  category   text NOT NULL CHECK (category IN ('frontend', 'backend', 'ai', 'data', 'design', 'other')),
  level      smallint NOT NULL CHECK (level BETWEEN 1 AND 5),
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (member_id, name)
);

-- Personal projects. Team projects live in team_projects and are linked through team_project_members.
CREATE TABLE member_projects (
  id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id    integer NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title        text NOT NULL,
  summary      text NOT NULL,
  tech         text[] NOT NULL DEFAULT '{}',
  repo_url     text,
  demo_url     text,
  image_url    text,
  contribution text,
  sort_order   integer NOT NULL DEFAULT 0
);

CREATE TABLE team_projects (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title      text NOT NULL,
  summary    text NOT NULL,
  tech       text[] NOT NULL DEFAULT '{}',
  repo_url   text,
  demo_url   text,
  image_url  text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE team_project_members (
  team_project_id integer NOT NULL REFERENCES team_projects(id) ON DELETE CASCADE,
  member_id       integer NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  contribution    text,
  PRIMARY KEY (team_project_id, member_id)
);

-- Chat (shapes follow @vq/shared: Conversation, Message)

CREATE TABLE conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  text NOT NULL, -- anonymous browser id; each visitor only sees their own conversations
  title      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX conversations_client_recent ON conversations (client_id, created_at DESC);

CREATE TABLE messages (
  id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            text NOT NULL CHECK (role IN ('user', 'model')),
  content         text NOT NULL,
  cited_members   text[] NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_by_conversation ON messages (conversation_id, id);
