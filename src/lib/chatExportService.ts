export interface ExportOptions {
  chatId: string;
  chatName: string;
  format: "json" | "text";
  includeMedia: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface ImportResult {
  success: boolean;
  messageCount: number;
  error?: string;
}

export function exportChat(messages: any[], options: ExportOptions): void {
  const filtered = filterMessagesByDate(messages, options.dateFrom, options.dateTo);
  const processedMessages = options.includeMedia
    ? filtered
    : filtered.map((m: any) => {
        const clone = { ...m };
        if (clone.mediaUrl) delete clone.mediaUrl;
        if (clone.media_url) delete clone.media_url;
        return clone;
      });

  let content: string;
  let mimeType: string;
  let extension: string;

  if (options.format === "json") {
    content = exportAsJson(processedMessages, options.chatName);
    mimeType = "application/json";
    extension = "json";
  } else {
    content = exportAsText(processedMessages, options.chatName);
    mimeType = "text/plain";
    extension = "txt";
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${options.chatName.replace(/[^a-zA-Z0-9]/g, "_")}_export.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAsJson(messages: any[], chatName: string): string {
  const exportData = {
    chatName,
    exportDate: new Date().toISOString(),
    messageCount: messages.length,
    messages: messages.map((m: any) => ({
      id: m.id,
      text: m.text || m.content || "",
      timestamp: m.timestamp || m.created_at || "",
      isOwn: m.isOwn ?? false,
      type: m.type || m.message_type || "text",
      mediaUrl: m.mediaUrl || m.media_url || undefined,
      fileName: m.fileName || m.file_name || undefined,
      status: m.status || undefined,
    })),
  };
  return JSON.stringify(exportData, null, 2);
}

export function exportAsText(messages: any[], chatName: string): string {
  const lines: string[] = [];
  lines.push(`Chat Export: ${chatName}`);
  lines.push(`Export Date: ${new Date().toLocaleString()}`);
  lines.push(`Total Messages: ${messages.length}`);
  lines.push("---");
  lines.push("");

  for (const m of messages) {
    const time = m.timestamp || m.created_at || "";
    const sender = m.isOwn ? "You" : chatName;
    const text = m.text || m.content || "";
    const type = m.type || m.message_type || "text";

    if (type === "text") {
      lines.push(`[${time}] ${sender}: ${text}`);
    } else {
      const media = m.mediaUrl || m.media_url || "";
      lines.push(`[${time}] ${sender}: [${type}] ${text || media}`);
    }
  }

  return lines.join("\n");
}

export async function importChat(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.messages || !Array.isArray(data.messages)) {
      return { success: false, messageCount: 0, error: "Invalid file format: missing messages array" };
    }

    return {
      success: true,
      messageCount: data.messages.length,
    };
  } catch {
    return { success: false, messageCount: 0, error: "Failed to parse file. Please use a valid JSON export file." };
  }
}

export function filterMessagesByDate(messages: any[], from?: string, to?: string): any[] {
  if (!from && !to) return messages;

  return messages.filter((m: any) => {
    const msgDate = m.timestamp || m.created_at || "";
    if (!msgDate) return true;

    const msgTime = new Date(msgDate).getTime();
    if (isNaN(msgTime)) return true;

    if (from) {
      const fromTime = new Date(from).getTime();
      if (!isNaN(fromTime) && msgTime < fromTime) return false;
    }

    if (to) {
      const toTime = new Date(to + "T23:59:59").getTime();
      if (!isNaN(toTime) && msgTime > toTime) return false;
    }

    return true;
  });
}
