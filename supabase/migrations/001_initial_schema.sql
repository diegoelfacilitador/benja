-- Semanas de planificación
CREATE TABLE weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, start_date)
);

ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own weeks" ON weeks
  FOR ALL USING (auth.uid() = user_id);

-- Tareas operativas
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID REFERENCES weeks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- Registros financieros
CREATE TABLE financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID REFERENCES weeks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own financial entries" ON financial_entries
  FOR ALL USING (auth.uid() = user_id);

-- Metas financieras semanales
CREATE TABLE financial_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID REFERENCES weeks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  income_target DECIMAL(12,2) DEFAULT 0,
  expense_limit DECIMAL(12,2) DEFAULT 0,
  UNIQUE(week_id, user_id)
);

ALTER TABLE financial_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own financial targets" ON financial_targets
  FOR ALL USING (auth.uid() = user_id);

-- Chat con Centro
CREATE TABLE centro_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'morning_briefing', 'evening_review')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE centro_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own centro messages" ON centro_messages
  FOR ALL USING (auth.uid() = user_id);

-- Tokens de Google Calendar
CREATE TABLE google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own calendar tokens" ON google_calendar_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_tasks_week_id ON tasks(week_id);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_financial_entries_week_id ON financial_entries(week_id);
CREATE INDEX idx_centro_messages_user_id ON centro_messages(user_id, created_at);
CREATE INDEX idx_weeks_user_status ON weeks(user_id, status);
