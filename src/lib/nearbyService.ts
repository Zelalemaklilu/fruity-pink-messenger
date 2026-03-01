export interface NearbyUser {
  id: string;
  userId: string;
  name: string;
  username?: string;
  distance: string;
  lastSeen: string;
  isOnline: boolean;
  bio?: string;
}

interface ConnectionRequest {
  fromUserId: string;
  fromName: string;
  createdAt: string;
}

const NEARBY_VISIBLE_KEY = 'zeshopp_nearby_visible';
const NEARBY_USERS_KEY = 'zeshopp_nearby_users';
const CONNECTION_REQUESTS_KEY = 'zeshopp_connection_requests';

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

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan',
  'Riley', 'Avery', 'Quinn', 'Cameron', 'Dakota',
  'Skyler', 'Reese', 'Parker', 'Finley', 'Sage',
];

const LAST_NAMES = [
  'Chen', 'Smith', 'Johnson', 'Williams', 'Brown',
  'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez',
  'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore',
];

const BIOS = [
  'Coffee lover and tech enthusiast',
  'Always up for a good conversation',
  'New in town, looking to connect',
  'Music producer and DJ',
  'Freelance designer',
  'Student at the local university',
  'Fitness coach and wellness advocate',
  'Foodie exploring new restaurants',
  'Book worm and movie buff',
  'Digital nomad traveling the world',
  'Pet parent and nature lover',
  'Startup founder',
];

const DISTANCES = [
  '50m', '100m', '150m', '200m', '350m', '500m',
  '750m', '1.0km', '1.2km', '1.5km', '2.0km', '2.8km',
];

function parseDistanceMeters(d: string): number {
  if (d.endsWith('km')) return parseFloat(d) * 1000;
  return parseFloat(d);
}

export function isNearbyVisible(userId: string): boolean {
  const data = readJson<Record<string, boolean>>(NEARBY_VISIBLE_KEY, {});
  return data[userId] ?? false;
}

export function setNearbyVisible(userId: string, visible: boolean): void {
  const data = readJson<Record<string, boolean>>(NEARBY_VISIBLE_KEY, {});
  data[userId] = visible;
  writeJson(NEARBY_VISIBLE_KEY, data);
}

export function generateMockNearbyUsers(): NearbyUser[] {
  const count = 8 + Math.floor(Math.random() * 5);
  const users: NearbyUser[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let firstName: string;
    let lastName: string;
    let fullName: string;
    do {
      firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      fullName = `${firstName} ${lastName}`;
    } while (usedNames.has(fullName));
    usedNames.add(fullName);

    const minutesAgo = Math.floor(Math.random() * 60);
    const lastSeen = new Date(Date.now() - minutesAgo * 60000).toISOString();

    users.push({
      id: generateId(),
      userId: `nearby_${generateId()}`,
      name: fullName,
      username: `${firstName.toLowerCase()}${Math.floor(Math.random() * 100)}`,
      distance: DISTANCES[Math.floor(Math.random() * DISTANCES.length)],
      lastSeen,
      isOnline: Math.random() > 0.4,
      bio: Math.random() > 0.3 ? BIOS[Math.floor(Math.random() * BIOS.length)] : undefined,
    });
  }

  users.sort((a, b) => parseDistanceMeters(a.distance) - parseDistanceMeters(b.distance));
  writeJson(NEARBY_USERS_KEY, users);
  return users;
}

export function getNearbyUsers(): NearbyUser[] {
  const existing = readJson<NearbyUser[]>(NEARBY_USERS_KEY, []);
  if (existing.length === 0) {
    return generateMockNearbyUsers();
  }
  return existing.sort((a, b) => parseDistanceMeters(a.distance) - parseDistanceMeters(b.distance));
}

export function sendConnectionRequest(fromUserId: string, toUserId: string): void {
  const allRequests = readJson<Record<string, ConnectionRequest[]>>(CONNECTION_REQUESTS_KEY, {});
  const existing = allRequests[toUserId] || [];
  if (existing.some((r) => r.fromUserId === fromUserId)) return;
  existing.push({
    fromUserId,
    fromName: 'You',
    createdAt: new Date().toISOString(),
  });
  allRequests[toUserId] = existing;
  writeJson(CONNECTION_REQUESTS_KEY, allRequests);
}

export function getConnectionRequests(userId: string): ConnectionRequest[] {
  const allRequests = readJson<Record<string, ConnectionRequest[]>>(CONNECTION_REQUESTS_KEY, {});
  return allRequests[userId] || [];
}

export function acceptConnectionRequest(userId: string, fromUserId: string): void {
  const allRequests = readJson<Record<string, ConnectionRequest[]>>(CONNECTION_REQUESTS_KEY, {});
  const existing = allRequests[userId] || [];
  allRequests[userId] = existing.filter((r) => r.fromUserId !== fromUserId);
  writeJson(CONNECTION_REQUESTS_KEY, allRequests);
}

export function declineConnectionRequest(userId: string, fromUserId: string): void {
  const allRequests = readJson<Record<string, ConnectionRequest[]>>(CONNECTION_REQUESTS_KEY, {});
  const existing = allRequests[userId] || [];
  allRequests[userId] = existing.filter((r) => r.fromUserId !== fromUserId);
  writeJson(CONNECTION_REQUESTS_KEY, allRequests);
}
