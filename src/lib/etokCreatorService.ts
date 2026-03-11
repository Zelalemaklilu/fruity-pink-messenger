export interface VideoAnalytics {
  videoId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  avgWatchPercent: number;
  trafficSources: { fyp: number; following: number; search: number; profile: number };
}

export interface DailyData {
  date: string;
  views: number;
  followers: number;
  likes: number;
  profileVisits: number;
}

export interface AudienceDemographics {
  genderMale: number;
  genderFemale: number;
  genderOther: number;
  ageGroups: { label: string; percent: number }[];
  topCountries: { country: string; percent: number }[];
}

export interface CreatorReward {
  id: string;
  date: string;
  views: number;
  amount: number;
  status: "paid" | "pending";
}

export interface EtokShopItem {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  emoji: string;
  category: string;
  sold: number;
  inStock: boolean;
}

export interface EtokSeries {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  price: number;
  episodeCount: number;
  coverEmoji: string;
  subscribers: number;
}

const ANALYTICS_KEY = "etok_analytics";
const REWARDS_KEY = "etok_rewards";
const SHOP_KEY = "etok_shop";
const SERIES_KEY = "etok_series";
const CREATOR_VERSION_KEY = "etok_creator_version";
const CURRENT_VERSION = "1";

function generateDailyData(days: number): DailyData[] {
  const data: DailyData[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().slice(0, 10),
      views: Math.floor(Math.random() * 50000) + 5000,
      followers: Math.floor(Math.random() * 500) + 50,
      likes: Math.floor(Math.random() * 8000) + 800,
      profileVisits: Math.floor(Math.random() * 3000) + 300,
    });
  }
  return data;
}

function generateRewards(): CreatorReward[] {
  const rewards: CreatorReward[] = [];
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    rewards.push({
      id: `r${i}`,
      date: d.toISOString().slice(0, 10),
      views: Math.floor(Math.random() * 200000) + 50000,
      amount: parseFloat((Math.random() * 50 + 5).toFixed(2)),
      status: i === 0 ? "pending" : "paid",
    });
  }
  return rewards;
}

const DEMO_SHOP: EtokShopItem[] = [
  { id: "si1", sellerId: "u2", name: "Ethiopian Spice Set", description: "Authentic berbere & mitmita blend", price: 29.99, currency: "USD", emoji: "🌶️", category: "Food", sold: 234, inStock: true },
  { id: "si2", sellerId: "u8", name: "Habesha Kemis (S)", description: "Traditional white cotton dress", price: 89.00, currency: "USD", emoji: "👗", category: "Fashion", sold: 89, inStock: true },
  { id: "si3", sellerId: "u7", name: "Beat Pack Vol.1", description: "10 exclusive Afrobeat instrumental tracks", price: 19.99, currency: "USD", emoji: "🎵", category: "Digital", sold: 567, inStock: true },
];

const DEMO_SERIES: EtokSeries[] = [
  { id: "ser1", creatorId: "u2", title: "30-Day Ethiopian Cooking Masterclass", description: "Learn to cook 30 authentic dishes in 30 days", price: 9.99, episodeCount: 30, coverEmoji: "🍳", subscribers: 1240 },
  { id: "ser2", creatorId: "u3", title: "Ethiopia Hidden Gems", description: "Off-the-beaten-path travel guide series", price: 4.99, episodeCount: 12, coverEmoji: "🗺️", subscribers: 445 },
];

function initCreatorData(): void {
  if (localStorage.getItem(CREATOR_VERSION_KEY) === CURRENT_VERSION) return;
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(generateDailyData(28)));
  localStorage.setItem(REWARDS_KEY, JSON.stringify(generateRewards()));
  localStorage.setItem(SHOP_KEY, JSON.stringify(DEMO_SHOP));
  localStorage.setItem(SERIES_KEY, JSON.stringify(DEMO_SERIES));
  localStorage.setItem(CREATOR_VERSION_KEY, CURRENT_VERSION);
}

initCreatorData();

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
}

export function getAccountGrowth(days: 7 | 28): DailyData[] {
  const all: DailyData[] = load(ANALYTICS_KEY, generateDailyData(28));
  return all.slice(-days);
}

export function getCreatorStats(period: 7 | 28): { views: number; followers: number; likes: number; profileVisits: number } {
  const data = getAccountGrowth(period);
  return data.reduce((acc, d) => ({
    views: acc.views + d.views,
    followers: acc.followers + d.followers,
    likes: acc.likes + d.likes,
    profileVisits: acc.profileVisits + d.profileVisits,
  }), { views: 0, followers: 0, likes: 0, profileVisits: 0 });
}

export function getVideoAnalytics(): VideoAnalytics[] {
  return [
    { videoId: "v1", views: 4500000, likes: 892000, comments: 12400, shares: 45000, avgWatchPercent: 78, trafficSources: { fyp: 65, following: 15, search: 12, profile: 8 } },
    { videoId: "v3", views: 2300000, likes: 567000, comments: 23400, shares: 78000, avgWatchPercent: 82, trafficSources: { fyp: 70, following: 18, search: 7, profile: 5 } },
    { videoId: "v8", views: 8900000, likes: 2100000, comments: 67000, shares: 340000, avgWatchPercent: 91, trafficSources: { fyp: 80, following: 10, search: 5, profile: 5 } },
    { videoId: "v6", views: 12000000, likes: 3400000, comments: 89000, shares: 450000, avgWatchPercent: 95, trafficSources: { fyp: 85, following: 8, search: 4, profile: 3 } },
  ];
}

export function getAudienceDemographics(): AudienceDemographics {
  return {
    genderMale: 54,
    genderFemale: 44,
    genderOther: 2,
    ageGroups: [
      { label: "13-17", percent: 12 },
      { label: "18-24", percent: 38 },
      { label: "25-34", percent: 32 },
      { label: "35-44", percent: 13 },
      { label: "45+", percent: 5 },
    ],
    topCountries: [
      { country: "Ethiopia 🇪🇹", percent: 62 },
      { country: "USA 🇺🇸", percent: 11 },
      { country: "Kenya 🇰🇪", percent: 8 },
      { country: "UK 🇬🇧", percent: 5 },
      { country: "UAE 🇦🇪", percent: 4 },
    ],
  };
}

export function getRewards(): CreatorReward[] { return load(REWARDS_KEY, []); }
export function getTotalRewardsBalance(): number {
  return getRewards().filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0);
}

export function getShopItems(): EtokShopItem[] { return load(SHOP_KEY, []); }
export function addShopItem(item: Omit<EtokShopItem, "id" | "sold">): EtokShopItem {
  const items = getShopItems();
  const newItem: EtokShopItem = { ...item, id: "si" + Date.now(), sold: 0 };
  items.push(newItem);
  localStorage.setItem(SHOP_KEY, JSON.stringify(items));
  return newItem;
}

export function getSeries(): EtokSeries[] { return load(SERIES_KEY, []); }
export function createSeries(series: Omit<EtokSeries, "id" | "subscribers">): EtokSeries {
  const all = getSeries();
  const newS: EtokSeries = { ...series, id: "ser" + Date.now(), subscribers: 0 };
  all.push(newS);
  localStorage.setItem(SERIES_KEY, JSON.stringify(all));
  return newS;
}

export function getShopRevenue(): { total: number; orders: number; conversion: number } {
  const items = getShopItems();
  const total = items.reduce((s, i) => s + i.price * i.sold, 0);
  const orders = items.reduce((s, i) => s + i.sold, 0);
  return { total: parseFloat(total.toFixed(2)), orders, conversion: 3.4 };
}
