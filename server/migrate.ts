import { sql } from "./db";

/** Idempotent schema setup, safe to run on every request (each statement is IF NOT EXISTS). */
export async function runMigrations(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      owner_email TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL,
      email TEXT,
      notes TEXT,
      group_ids TEXT[] NOT NULL DEFAULT '{}',
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS contacts_owner_idx ON contacts(owner_email);`;

  await sql`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      owner_email TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at BIGINT NOT NULL
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS groups_owner_idx ON groups(owner_email);`;

  await sql`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      owner_email TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS templates_owner_idx ON templates(owner_email);`;

  await sql`
    CREATE TABLE IF NOT EXISTS broadcasts (
      id TEXT PRIMARY KEY,
      owner_email TEXT NOT NULL,
      title TEXT NOT NULL,
      message_body TEXT NOT NULL,
      status TEXT NOT NULL,
      recipients JSONB NOT NULL,
      current_index INT NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      source_group_ids TEXT[]
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS broadcasts_owner_idx ON broadcasts(owner_email);`;

  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      email TEXT PRIMARY KEY,
      created_at BIGINT NOT NULL
    );
  `;
}
