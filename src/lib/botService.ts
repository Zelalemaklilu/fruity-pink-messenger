export interface Bot {
  id: string;
  name: string;
  username: string;
  description: string;
  createdBy: string;
  createdAt: string;
  commands: BotCommand[];
  isActive: boolean;
  avatarColor: string;
}

export interface BotCommand {
  command: string;
  description: string;
  response: string;
}

export interface BotMessage {
  id: string;
  botId: string;
  userId: string;
  content: string;
  isFromBot: boolean;
  createdAt: string;
  type: 'text' | 'command' | 'card';
  cardData?: { title: string; description: string; buttonText?: string };
}

const BOTS_KEY = 'zeshopp_bots';
const botMessagesKey = (botId: string, userId: string) => `zeshopp_bot_messages_${botId}_${userId}`;

const AVATAR_COLORS = [
  'hsl(210, 80%, 55%)',
  'hsl(145, 65%, 42%)',
  'hsl(340, 75%, 55%)',
  'hsl(260, 70%, 58%)',
  'hsl(25, 85%, 55%)',
  'hsl(185, 70%, 42%)',
  'hsl(45, 85%, 50%)',
  'hsl(0, 70%, 55%)',
];

function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_BOTS: Omit<Bot, 'id' | 'createdAt' | 'avatarColor'>[] = [
  {
    name: 'Helper Bot',
    username: 'helper',
    description: 'Your friendly assistant. Ask me anything about using the app!',
    createdBy: 'system',
    isActive: true,
    commands: [
      { command: '/start', description: 'Start the bot', response: '' },
      { command: '/help', description: 'Show available commands', response: '' },
      { command: '/about', description: 'About this bot', response: 'Helper Bot is a built-in assistant that helps you navigate and use Zeshopp Chat effectively. I can answer questions about features and guide you through the app.' },
    ],
  },
  {
    name: 'Reminder Bot',
    username: 'reminder',
    description: 'Set reminders and never forget important tasks.',
    createdBy: 'system',
    isActive: true,
    commands: [
      { command: '/start', description: 'Start the bot', response: '' },
      { command: '/remind', description: 'Set a reminder', response: 'To set a reminder, use: /remind [time] [message]\nExample: /remind 30m Check the oven\n\nAvailable time formats: 5m, 1h, 2d' },
      { command: '/list', description: 'List active reminders', response: 'You have no active reminders right now. Use /remind to create one!' },
    ],
  },
  {
    name: 'Quiz Bot',
    username: 'quiz',
    description: 'Test your knowledge with fun trivia questions!',
    createdBy: 'system',
    isActive: true,
    commands: [
      { command: '/start', description: 'Start the bot', response: '' },
      { command: '/play', description: 'Start a quiz', response: 'Here is your question:\n\nWhat is the capital of France?\n\nA) London\nB) Berlin\nC) Paris\nD) Madrid\n\nReply with the letter of your answer!' },
      { command: '/score', description: 'Check your score', response: 'Your current score: 0 points\nQuizzes played: 0\nBest streak: 0' },
    ],
  },
  {
    name: 'News Bot',
    username: 'news',
    description: 'Stay updated with the latest headlines and trending topics.',
    createdBy: 'system',
    isActive: true,
    commands: [
      { command: '/start', description: 'Start the bot', response: '' },
      { command: '/latest', description: 'Get latest news', response: 'Here are today\'s top stories:\n\n1. Technology advances continue to reshape industries\n2. Global markets show positive trends\n3. New scientific discoveries announced\n4. Sports highlights from around the world\n5. Entertainment news and updates' },
      { command: '/categories', description: 'Browse categories', response: 'Available news categories:\n\n- Technology\n- Business\n- Science\n- Sports\n- Entertainment\n- Health\n- World\n\nUse /latest to see the top stories.' },
    ],
  },
];

export function initializeDefaultBots(): void {
  const existing = readJson<Bot[]>(BOTS_KEY, []);
  if (existing.length > 0) return;

  const bots: Bot[] = DEFAULT_BOTS.map((b, i) => ({
    ...b,
    id: `default_bot_${i}`,
    createdAt: new Date().toISOString(),
    avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
  }));

  writeJson(BOTS_KEY, bots);
}

export function getBots(): Bot[] {
  initializeDefaultBots();
  return readJson<Bot[]>(BOTS_KEY, []);
}

export function getBot(id: string): Bot | undefined {
  return getBots().find((b) => b.id === id);
}

export function getBotByUsername(username: string): Bot | undefined {
  const clean = username.replace(/^@/, '').toLowerCase();
  return getBots().find((b) => b.username.toLowerCase() === clean);
}

export function createBot(
  name: string,
  username: string,
  description: string,
  userId: string,
  commands: BotCommand[]
): Bot {
  const bots = getBots();
  const bot: Bot = {
    id: generateId(),
    name,
    username: username.replace(/^@/, '').toLowerCase(),
    description,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    commands: [
      { command: '/start', description: 'Start the bot', response: '' },
      { command: '/help', description: 'Show available commands', response: '' },
      ...commands.filter((c) => c.command !== '/start' && c.command !== '/help'),
    ],
    isActive: true,
    avatarColor: randomAvatarColor(),
  };
  bots.push(bot);
  writeJson(BOTS_KEY, bots);
  return bot;
}

export function deleteBot(id: string): void {
  const bots = getBots().filter((b) => b.id !== id);
  writeJson(BOTS_KEY, bots);
}

export function updateBot(id: string, updates: Partial<Bot>): Bot | undefined {
  const bots = getBots();
  const idx = bots.findIndex((b) => b.id === id);
  if (idx === -1) return undefined;
  bots[idx] = { ...bots[idx], ...updates };
  writeJson(BOTS_KEY, bots);
  return bots[idx];
}

export function sendBotMessage(botId: string, userId: string, content: string): BotMessage {
  const key = botMessagesKey(botId, userId);
  const messages = readJson<BotMessage[]>(key, []);
  const msg: BotMessage = {
    id: generateId(),
    botId,
    userId,
    content,
    isFromBot: false,
    createdAt: new Date().toISOString(),
    type: content.startsWith('/') ? 'command' : 'text',
  };
  messages.push(msg);
  writeJson(key, messages);
  return msg;
}

export function getBotMessages(botId: string, userId: string): BotMessage[] {
  return readJson<BotMessage[]>(botMessagesKey(botId, userId), []);
}

export function processBotCommand(bot: Bot, command: string, userId: string): BotMessage {
  const key = botMessagesKey(bot.id, userId);
  const messages = readJson<BotMessage[]>(key, []);
  const trimmed = command.trim().toLowerCase();

  let responseMsg: BotMessage;

  if (trimmed === '/start') {
    responseMsg = {
      id: generateId(),
      botId: bot.id,
      userId,
      content: `Welcome to ${bot.name}!`,
      isFromBot: true,
      createdAt: new Date().toISOString(),
      type: 'card',
      cardData: {
        title: bot.name,
        description: bot.description,
        buttonText: 'Get Started',
      },
    };
  } else if (trimmed === '/help') {
    const commandList = bot.commands
      .map((c) => `${c.command} - ${c.description}`)
      .join('\n');
    responseMsg = {
      id: generateId(),
      botId: bot.id,
      userId,
      content: `Available commands:\n\n${commandList}`,
      isFromBot: true,
      createdAt: new Date().toISOString(),
      type: 'text',
    };
  } else {
    const matchedCommand = bot.commands.find(
      (c) => c.command.toLowerCase() === trimmed
    );

    if (matchedCommand && matchedCommand.response) {
      responseMsg = {
        id: generateId(),
        botId: bot.id,
        userId,
        content: matchedCommand.response,
        isFromBot: true,
        createdAt: new Date().toISOString(),
        type: 'text',
      };
    } else {
      responseMsg = {
        id: generateId(),
        botId: bot.id,
        userId,
        content: "I don't understand that command. Try /help",
        isFromBot: true,
        createdAt: new Date().toISOString(),
        type: 'text',
      };
    }
  }

  messages.push(responseMsg);
  writeJson(key, messages);
  return responseMsg;
}

export function getMyBots(userId: string): Bot[] {
  return getBots().filter((b) => b.createdBy === userId);
}
