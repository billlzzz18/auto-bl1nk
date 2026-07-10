type MaybeDate = Date | string | null | undefined;

function serializeTimestamp(value: MaybeDate): string {
  if (!value) {
    return new Date().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

export function toProject(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    user_id: String(row.userId ?? row.user_id ?? ""),
    is_favorite: Boolean(row.isFavorite ?? row.is_favorite ?? false),
    sharing_settings: (row.sharingSettings as
      | Record<string, unknown>
      | undefined) ?? {
      public_access: false,
      include_subpages: false,
    },
    custom_properties: Array.isArray(row.customProperties)
      ? row.customProperties
      : [],
    created_at: serializeTimestamp(row.createdAt as MaybeDate),
    drive_folder_id: (row.driveFolderId as string | undefined) ?? undefined,
    drive_folder_link: (row.driveFolderLink as string | undefined) ?? undefined,
    folder_id: (row.folderId as string | null | undefined) ?? null,
  };
}

export function toTask(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    project_id: String(row.projectId ?? row.project_id ?? ""),
    user_id: String(row.userId ?? row.user_id ?? ""),
    description: String(row.description ?? ""),
    status: (row.status as any) ?? "todo",
    due_date: String(row.dueDate ?? row.due_date ?? ""),
    start_time: (row.startTime as string | undefined) ?? undefined,
    end_time: (row.endTime as string | undefined) ?? undefined,
    priority: (row.priority as any) ?? "medium",
    type: (row.type as any) ?? "task",
    estimated_time:
      row.estimatedTime != null ? Number(row.estimatedTime) : undefined,
    actual_time: row.actualTime != null ? Number(row.actualTime) : undefined,
    parent_id: (row.parentId as string | undefined) ?? undefined,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    comments: Array.isArray(row.comments)
      ? (row.comments as Array<Record<string, unknown>>)
      : [],
    created_at: serializeTimestamp(row.createdAt as MaybeDate),
    updated_at: serializeTimestamp(row.updatedAt as MaybeDate),
  };
}

export function toFolder(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    parent_id: (row.parentId as string | null | undefined) ?? null,
    user_id: String(row.userId ?? row.user_id ?? ""),
    created_at: serializeTimestamp(row.createdAt as MaybeDate),
  };
}

export function toTag(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    color: String(row.color ?? "#FFD700"),
    user_id: String(row.userId ?? row.user_id ?? ""),
  };
}

export function toTagRule(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    type: (row.type as any) ?? "restricted",
    folder_id: (row.folderId as string | undefined) ?? undefined,
    rule_value: String(row.ruleValue ?? row.rule_value ?? ""),
    user_id: String(row.userId ?? row.user_id ?? ""),
  };
}

export function toAutomation(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    project_id: String(row.projectId ?? row.project_id ?? ""),
    trigger_event: (row.triggerEvent as any) ?? "status_changed",
    condition_field: (row.conditionField as string | undefined) ?? undefined,
    condition_value: (row.conditionValue as string | undefined) ?? undefined,
    action_type: (row.actionType as any) ?? "webhook",
    action_value: String(row.actionValue ?? row.action_value ?? ""),
    isActive: Boolean(row.isActive ?? row.is_active ?? true),
    user_id: String(row.userId ?? row.user_id ?? ""),
  };
}

export function toWebhook(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    url: String(row.url ?? ""),
    events: Array.isArray(row.events) ? (row.events as string[]) : [],
    isActive: Boolean(row.isActive ?? row.is_active ?? true),
    user_id: String(row.userId ?? row.user_id ?? ""),
    created_at: serializeTimestamp(row.createdAt as MaybeDate),
  };
}

export function toApiKey(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    key: String(row.key ?? ""),
    masked_key: String(row.maskedKey ?? row.masked_key ?? ""),
    name: String(row.name ?? ""),
    user_id: String(row.userId ?? row.user_id ?? ""),
    created_at: serializeTimestamp(row.createdAt as MaybeDate),
  };
}

export function toTrashItem(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    item_type: (row.itemType as any) ?? "task",
    item_id: String(row.itemId ?? row.item_id ?? ""),
    item_data: row.itemData as Record<string, unknown>,
    deleted_at: serializeTimestamp(row.deletedAt as MaybeDate),
    user_id: String(row.userId ?? row.user_id ?? ""),
  };
}

export function toExtension(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    version: String(row.version ?? "1.0.0"),
    author: String(row.author ?? "Developer Node"),
    type: String(row.type ?? "block"),
    code: String(row.code ?? ""),
    is_enabled: Boolean(row.isEnabled ?? row.is_enabled ?? true),
    user_id: String(row.userId ?? row.user_id ?? ""),
  };
}
