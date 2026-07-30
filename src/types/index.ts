export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string; // stored in E.164-ish digits, e.g. +2348012345678
  email?: string;
  notes?: string;
  groupIds: string[];
  customData?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface CustomField {
  id: string;
  key: string;
  label: string;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export type TemplateCategory =
  | "Birthday"
  | "Event Reminder"
  | "Prayer Alert"
  | "Follow-up"
  | "Meeting Reminder"
  | "Appreciation"
  | "General";

export interface MessageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export type RecipientStatus = "pending" | "sent" | "skipped";

export interface BroadcastRecipient {
  contactId?: string; // undefined for ad-hoc / one-off recipients
  firstName: string;
  lastName: string;
  phone: string;
  status: RecipientStatus;
  sentAt?: number;
  customData?: Record<string, string>;
}

export type BroadcastStatus = "draft" | "active" | "completed" | "archived";

export interface Broadcast {
  id: string;
  title: string;
  messageBody: string;
  status: BroadcastStatus;
  recipients: BroadcastRecipient[];
  currentIndex: number;
  createdAt: number;
  updatedAt: number;
  sourceGroupIds?: string[];
}

export interface ImportRow {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  raw?: Record<string, string>;
}
