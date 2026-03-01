export interface Sticker {
  id: string;
  emoji: string;
  label: string;
  pack: string;
}

export interface StickerPack {
  id: string;
  name: string;
  icon: string;
  stickers: Sticker[];
}

const STICKER_PACKS: StickerPack[] = [
  {
    id: "smileys",
    name: "Smileys",
    icon: "☺",
    stickers: [
      { id: "s1", emoji: "☺", label: "Smile", pack: "smileys" },
      { id: "s2", emoji: "☻", label: "Happy", pack: "smileys" },
      { id: "s3", emoji: "♡", label: "Love", pack: "smileys" },
      { id: "s4", emoji: "☼", label: "Sunny Face", pack: "smileys" },
      { id: "s5", emoji: "✿", label: "Flower Face", pack: "smileys" },
      { id: "s6", emoji: "◕‿◕", label: "Cute Face", pack: "smileys" },
      { id: "s7", emoji: "╰(*°▽°*)╯", label: "Excited", pack: "smileys" },
      { id: "s8", emoji: "(◠‿◠)", label: "Cheerful", pack: "smileys" },
      { id: "s9", emoji: "ᕙ(⇀‸↼)ᕗ", label: "Strong", pack: "smileys" },
      { id: "s10", emoji: "♥‿♥", label: "Heart Eyes", pack: "smileys" },
      { id: "s11", emoji: "(╥﹏╥)", label: "Crying", pack: "smileys" },
      { id: "s12", emoji: "¯\\_(ツ)_/¯", label: "Shrug", pack: "smileys" },
      { id: "s13", emoji: "(ᵔᴥᵔ)", label: "Bear Face", pack: "smileys" },
      { id: "s14", emoji: "(*^▽^*)", label: "Joy", pack: "smileys" },
    ],
  },
  {
    id: "animals",
    name: "Animals",
    icon: "♞",
    stickers: [
      { id: "a1", emoji: "♞", label: "Horse", pack: "animals" },
      { id: "a2", emoji: "☙", label: "Bird", pack: "animals" },
      { id: "a3", emoji: "⚘", label: "Butterfly", pack: "animals" },
      { id: "a4", emoji: "◈", label: "Fish", pack: "animals" },
      { id: "a5", emoji: "❀", label: "Bee", pack: "animals" },
      { id: "a6", emoji: "⊛", label: "Spider", pack: "animals" },
      { id: "a7", emoji: "ʕ•ᴥ•ʔ", label: "Bear", pack: "animals" },
      { id: "a8", emoji: "▼・ᴥ・▼", label: "Dog", pack: "animals" },
      { id: "a9", emoji: "(=^・ω・^=)", label: "Cat", pack: "animals" },
      { id: "a10", emoji: "◎⃝", label: "Owl", pack: "animals" },
      { id: "a11", emoji: "⋆⁺₊⋆", label: "Firefly", pack: "animals" },
      { id: "a12", emoji: "≋≋≋", label: "Snake", pack: "animals" },
      { id: "a13", emoji: "◉‿◉", label: "Frog", pack: "animals" },
      { id: "a14", emoji: "⊹⊹⊹", label: "Ladybug", pack: "animals" },
    ],
  },
  {
    id: "food",
    name: "Food",
    icon: "♨",
    stickers: [
      { id: "f1", emoji: "♨", label: "Hot Food", pack: "food" },
      { id: "f2", emoji: "◉", label: "Donut", pack: "food" },
      { id: "f3", emoji: "▽", label: "Ice Cream", pack: "food" },
      { id: "f4", emoji: "◐", label: "Cookie", pack: "food" },
      { id: "f5", emoji: "☕", label: "Coffee", pack: "food" },
      { id: "f6", emoji: "✦", label: "Star Fruit", pack: "food" },
      { id: "f7", emoji: "◆", label: "Chocolate", pack: "food" },
      { id: "f8", emoji: "◇", label: "Rice Ball", pack: "food" },
      { id: "f9", emoji: "▣", label: "Waffle", pack: "food" },
      { id: "f10", emoji: "⊕", label: "Pizza", pack: "food" },
      { id: "f11", emoji: "◎", label: "Sushi", pack: "food" },
      { id: "f12", emoji: "❁", label: "Cake", pack: "food" },
      { id: "f13", emoji: "⊗", label: "Pie", pack: "food" },
      { id: "f14", emoji: "◯", label: "Egg", pack: "food" },
      { id: "f15", emoji: "☘", label: "Salad", pack: "food" },
      { id: "f16", emoji: "◬", label: "Sandwich", pack: "food" },
    ],
  },
  {
    id: "sports",
    name: "Sports",
    icon: "⚽",
    stickers: [
      { id: "sp1", emoji: "⚽", label: "Soccer", pack: "sports" },
      { id: "sp2", emoji: "⚾", label: "Baseball", pack: "sports" },
      { id: "sp3", emoji: "♛", label: "Champion", pack: "sports" },
      { id: "sp4", emoji: "⚔", label: "Fencing", pack: "sports" },
      { id: "sp5", emoji: "☆", label: "Gold Star", pack: "sports" },
      { id: "sp6", emoji: "⚑", label: "Flag", pack: "sports" },
      { id: "sp7", emoji: "♕", label: "Winner", pack: "sports" },
      { id: "sp8", emoji: "⛳", label: "Golf", pack: "sports" },
      { id: "sp9", emoji: "▶", label: "Play", pack: "sports" },
      { id: "sp10", emoji: "◈", label: "Diamond", pack: "sports" },
      { id: "sp11", emoji: "⚡", label: "Speed", pack: "sports" },
      { id: "sp12", emoji: "★", label: "MVP", pack: "sports" },
      { id: "sp13", emoji: "⊕", label: "Target", pack: "sports" },
      { id: "sp14", emoji: "⚙", label: "Training", pack: "sports" },
    ],
  },
  {
    id: "travel",
    name: "Travel",
    icon: "✈",
    stickers: [
      { id: "t1", emoji: "✈", label: "Airplane", pack: "travel" },
      { id: "t2", emoji: "☀", label: "Sunny", pack: "travel" },
      { id: "t3", emoji: "☁", label: "Cloudy", pack: "travel" },
      { id: "t4", emoji: "☂", label: "Umbrella", pack: "travel" },
      { id: "t5", emoji: "★", label: "Star Night", pack: "travel" },
      { id: "t6", emoji: "☾", label: "Moon", pack: "travel" },
      { id: "t7", emoji: "⛰", label: "Mountain", pack: "travel" },
      { id: "t8", emoji: "⚓", label: "Anchor", pack: "travel" },
      { id: "t9", emoji: "♫", label: "Music Trip", pack: "travel" },
      { id: "t10", emoji: "⊞", label: "Luggage", pack: "travel" },
      { id: "t11", emoji: "◈", label: "Compass", pack: "travel" },
      { id: "t12", emoji: "❋", label: "Snowflake", pack: "travel" },
      { id: "t13", emoji: "☸", label: "Wheel", pack: "travel" },
      { id: "t14", emoji: "⛺", label: "Camping", pack: "travel" },
    ],
  },
  {
    id: "symbols",
    name: "Symbols",
    icon: "♪",
    stickers: [
      { id: "sy1", emoji: "♥", label: "Heart", pack: "symbols" },
      { id: "sy2", emoji: "★", label: "Star", pack: "symbols" },
      { id: "sy3", emoji: "♪", label: "Music", pack: "symbols" },
      { id: "sy4", emoji: "♦", label: "Diamond", pack: "symbols" },
      { id: "sy5", emoji: "▲", label: "Triangle", pack: "symbols" },
      { id: "sy6", emoji: "●", label: "Circle", pack: "symbols" },
      { id: "sy7", emoji: "✦", label: "Sparkle", pack: "symbols" },
      { id: "sy8", emoji: "⚡", label: "Lightning", pack: "symbols" },
      { id: "sy9", emoji: "✧", label: "Twinkle", pack: "symbols" },
      { id: "sy10", emoji: "♣", label: "Club", pack: "symbols" },
      { id: "sy11", emoji: "♠", label: "Spade", pack: "symbols" },
      { id: "sy12", emoji: "⊛", label: "Asterisk", pack: "symbols" },
      { id: "sy13", emoji: "◆", label: "Filled Diamond", pack: "symbols" },
      { id: "sy14", emoji: "✶", label: "Six Star", pack: "symbols" },
      { id: "sy15", emoji: "❖", label: "Four Diamond", pack: "symbols" },
      { id: "sy16", emoji: "✿", label: "Flower", pack: "symbols" },
    ],
  },
];

const RECENT_KEY = "zeshopp_recent_stickers";
const FAVORITES_KEY = "zeshopp_favorite_stickers";

export function getAllPacks(): StickerPack[] {
  return STICKER_PACKS;
}

export function getPackById(id: string): StickerPack | undefined {
  return STICKER_PACKS.find((p) => p.id === id);
}

export function getRecentStickers(): Sticker[] {
  try {
    const data = localStorage.getItem(RECENT_KEY);
    if (!data) return [];
    return JSON.parse(data) as Sticker[];
  } catch {
    return [];
  }
}

export function addRecentSticker(sticker: Sticker): void {
  try {
    const recent = getRecentStickers().filter((s) => s.id !== sticker.id);
    recent.unshift(sticker);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 20)));
  } catch {}
}

export function searchStickers(query: string): Sticker[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results: Sticker[] = [];
  for (const pack of STICKER_PACKS) {
    for (const sticker of pack.stickers) {
      if (
        sticker.label.toLowerCase().includes(q) ||
        sticker.pack.toLowerCase().includes(q)
      ) {
        results.push(sticker);
      }
    }
  }
  return results;
}

export function getFavoriteStickers(): Sticker[] {
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    if (!data) return [];
    return JSON.parse(data) as Sticker[];
  } catch {
    return [];
  }
}

export function toggleFavoriteSticker(sticker: Sticker): boolean {
  try {
    const favorites = getFavoriteStickers();
    const index = favorites.findIndex((s) => s.id === sticker.id);
    if (index >= 0) {
      favorites.splice(index, 1);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      return false;
    } else {
      favorites.push(sticker);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      return true;
    }
  } catch {
    return false;
  }
}
