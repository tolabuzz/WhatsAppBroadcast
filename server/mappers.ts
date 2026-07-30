export function contactFromRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    phone: row.phone as string,
    email: (row.email as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    groupIds: (row.group_ids as string[]) ?? [],
    customData: (row.custom_data as Record<string, string> | null) ?? {},
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export function customFieldFromRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    key: row.key as string,
    label: row.label as string,
    createdAt: Number(row.created_at),
  };
}

export function groupFromRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
    createdAt: Number(row.created_at),
  };
}

export function templateFromRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    body: row.body as string,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export function broadcastFromRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    title: row.title as string,
    messageBody: row.message_body as string,
    status: row.status as string,
    recipients: row.recipients,
    currentIndex: Number(row.current_index),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    sourceGroupIds: (row.source_group_ids as string[] | null) ?? undefined,
  };
}
