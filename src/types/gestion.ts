// Tipos del módulo Gestión — Control Hub
// Drop this into your EF Hub types directory

export type WeekStatus = "planning" | "active" | "completed"
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled"
export type TaskPriority = "low" | "medium" | "high" | "critical"
export type FinancialEntryType = "income" | "expense"
export type MessageRole = "user" | "assistant" | "system"
export type MessageType = "chat" | "morning_briefing" | "evening_review"

export interface Week {
  id: string
  user_id: string
  start_date: string
  end_date: string
  status: WeekStatus
  created_at: string
}

export interface Task {
  id: string
  week_id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  completed_at: string | null
  created_at: string
}

export interface FinancialEntry {
  id: string
  week_id: string
  user_id: string
  type: FinancialEntryType
  amount: number
  category: string
  description: string | null
  date: string
  created_at: string
}

export interface FinancialTarget {
  id: string
  week_id: string
  user_id: string
  income_target: number
  expense_limit: number
}

export interface CentroMessage {
  id: string
  user_id: string
  role: MessageRole
  content: string
  message_type: MessageType
  created_at: string
}

export interface CalendarEvent {
  id: string
  summary: string
  start: string
  end: string
  description?: string
}
