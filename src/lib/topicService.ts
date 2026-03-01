export interface Topic {
  id: string;
  groupId: string;
  title: string;
  icon: string;
  color: string;
  createdBy: string;
  createdAt: string;
  messageCount: number;
  lastActivity: string;
  pinned: boolean;
}

export interface TopicMessage {
  id: string;
  topicId: string;
  groupId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

const TOPICS_KEY = "zeshopp_topics";
const TOPIC_MESSAGES_KEY = "zeshopp_topic_messages";

export const TOPIC_ICONS = [
  "MessageSquare",
  "Hash",
  "Megaphone",
  "HelpCircle",
  "Lightbulb",
  "Bug",
  "Wrench",
  "Star",
];

export const TOPIC_COLORS = [
  "hsl(210, 90%, 60%)",
  "hsl(145, 65%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 75%, 55%)",
  "hsl(260, 80%, 60%)",
  "hsl(338, 85%, 60%)",
  "hsl(168, 75%, 41%)",
  "hsl(45, 90%, 55%)",
];

function loadTopics(): Topic[] {
  try {
    return JSON.parse(localStorage.getItem(TOPICS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveTopics(topics: Topic[]): void {
  localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
}

function loadTopicMessages(): TopicMessage[] {
  try {
    return JSON.parse(localStorage.getItem(TOPIC_MESSAGES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveTopicMessages(messages: TopicMessage[]): void {
  localStorage.setItem(TOPIC_MESSAGES_KEY, JSON.stringify(messages));
}

export function createTopic(
  groupId: string,
  title: string,
  icon: string,
  color: string,
  createdBy: string,
): Topic {
  const topics = loadTopics();
  const now = new Date().toISOString();
  const topic: Topic = {
    id: `topic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    groupId,
    title,
    icon,
    color,
    createdBy,
    createdAt: now,
    messageCount: 0,
    lastActivity: now,
    pinned: false,
  };
  topics.push(topic);
  saveTopics(topics);
  return topic;
}

export function getTopics(groupId: string): Topic[] {
  const topics = loadTopics();
  return topics
    .filter((t) => t.groupId === groupId)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });
}

export function getTopic(topicId: string): Topic | null {
  const topics = loadTopics();
  return topics.find((t) => t.id === topicId) || null;
}

export function updateTopic(topicId: string, updates: Partial<Topic>): void {
  const topics = loadTopics();
  const idx = topics.findIndex((t) => t.id === topicId);
  if (idx === -1) return;
  topics[idx] = { ...topics[idx], ...updates, id: topicId };
  saveTopics(topics);
}

export function deleteTopic(topicId: string): void {
  const topics = loadTopics();
  saveTopics(topics.filter((t) => t.id !== topicId));
  const messages = loadTopicMessages();
  saveTopicMessages(messages.filter((m) => m.topicId !== topicId));
}

export function togglePinTopic(topicId: string): void {
  const topics = loadTopics();
  const idx = topics.findIndex((t) => t.id === topicId);
  if (idx === -1) return;
  topics[idx].pinned = !topics[idx].pinned;
  saveTopics(topics);
}

export function addTopicMessage(
  topicId: string,
  groupId: string,
  senderId: string,
  content: string,
): TopicMessage {
  const messages = loadTopicMessages();
  const now = new Date().toISOString();
  const message: TopicMessage = {
    id: `tmsg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    topicId,
    groupId,
    senderId,
    content,
    createdAt: now,
  };
  messages.push(message);
  saveTopicMessages(messages);

  const topics = loadTopics();
  const idx = topics.findIndex((t) => t.id === topicId);
  if (idx !== -1) {
    topics[idx].messageCount = (topics[idx].messageCount || 0) + 1;
    topics[idx].lastActivity = now;
    saveTopics(topics);
  }

  return message;
}

export function getTopicMessages(topicId: string): TopicMessage[] {
  const messages = loadTopicMessages();
  return messages
    .filter((m) => m.topicId === topicId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function deleteTopicMessage(messageId: string): void {
  const messages = loadTopicMessages();
  const msg = messages.find((m) => m.id === messageId);
  saveTopicMessages(messages.filter((m) => m.id !== messageId));

  if (msg) {
    const topics = loadTopics();
    const idx = topics.findIndex((t) => t.id === msg.topicId);
    if (idx !== -1) {
      topics[idx].messageCount = Math.max(0, (topics[idx].messageCount || 1) - 1);
      saveTopics(topics);
    }
  }
}
