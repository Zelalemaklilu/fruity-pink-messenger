export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface Poll {
  id: string;
  chatId: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: string;
  isAnonymous: boolean;
  allowMultiple: boolean;
  closed: boolean;
}

const STORAGE_KEY = "zeshopp_polls";

function loadPolls(): Poll[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePolls(polls: Poll[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
}

export function createPoll(
  chatId: string,
  question: string,
  options: string[],
  createdBy: string,
  isAnonymous = false,
  allowMultiple = false,
): Poll {
  const polls = loadPolls();
  const newPoll: Poll = {
    id: Date.now().toString(),
    chatId,
    question,
    options: options.map((text, i) => ({
      id: `${Date.now()}_opt_${i}`,
      text,
      votes: [],
    })),
    createdBy,
    createdAt: new Date().toISOString(),
    isAnonymous,
    allowMultiple,
    closed: false,
  };
  polls.push(newPoll);
  savePolls(polls);
  return newPoll;
}

export function votePoll(
  pollId: string,
  optionId: string,
  userId: string,
): Poll | null {
  const polls = loadPolls();
  const poll = polls.find((p) => p.id === pollId);
  if (!poll || poll.closed) return null;

  const option = poll.options.find((o) => o.id === optionId);
  if (!option) return null;

  if (!poll.allowMultiple) {
    poll.options.forEach((o) => {
      o.votes = o.votes.filter((v) => v !== userId);
    });
  }

  if (option.votes.includes(userId)) {
    option.votes = option.votes.filter((v) => v !== userId);
  } else {
    option.votes.push(userId);
  }

  savePolls(polls);
  return poll;
}

export function closePoll(pollId: string): Poll | null {
  const polls = loadPolls();
  const poll = polls.find((p) => p.id === pollId);
  if (!poll) return null;
  poll.closed = true;
  savePolls(polls);
  return poll;
}

export function getPollsForChat(chatId: string): Poll[] {
  return loadPolls().filter((p) => p.chatId === chatId);
}

export function getPoll(pollId: string): Poll | null {
  return loadPolls().find((p) => p.id === pollId) || null;
}

export function deletePoll(pollId: string): void {
  const polls = loadPolls();
  savePolls(polls.filter((p) => p.id !== pollId));
}
