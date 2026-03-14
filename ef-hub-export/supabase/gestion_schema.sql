-- Gestión Module Schema
-- Run this migration in your Supabase project
-- Tables are prefixed with gestion_ to avoid conflicts with existing EF Hub tables

-- Weeks (weekly planning cycles)
CREATE TABLE IF NOT EXISTS gestion_weeks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks
CREATE TABLE IF NOT EXISTS gestion_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID REFERENCES gestion_weeks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Financial entries
CREATE TABLE IF NOT EXISTS gestion_financial_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID REFERENCES gestion_weeks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Financial targets (per week)
CREATE TABLE IF NOT EXISTS gestion_financial_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID REFERENCES gestion_weeks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  income_target DECIMAL(12,2) DEFAULT 0,
  expense_limit DECIMAL(12,2) DEFAULT 0,
  UNIQUE(week_id)
);

-- Centro messages (AI chat history)
CREATE TABLE IF NOT EXISTS gestion_centro_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'morning_briefing', 'evening_review')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE gestion_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestion_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestion_financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestion_financial_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestion_centro_messages ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users manage own weeks" ON gestion_weeks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own tasks" ON gestion_tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own financial entries" ON gestion_financial_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own financial targets" ON gestion_financial_targets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own centro messages" ON gestion_centro_messages
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gestion_weeks_user_status ON gestion_weeks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_gestion_tasks_week ON gestion_tasks(week_id);
CREATE INDEX IF NOT EXISTS idx_gestion_entries_week ON gestion_financial_entries(week_id);
CREATE INDEX IF NOT EXISTS idx_gestion_messages_user ON gestion_centro_messages(user_id, created_at);
