import { supabase } from "@/integrations/supabase/client";

export interface EtokUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  totalLikes: number;
  isVerified: boolean;
  isBusinessAccount: boolean;
  links: { instagram?: string; youtube?: string };
  pinnedVideoIds: string[];
  profileViewIds: string[];
}

export interface EtokSound {
  id: string;
  title: string;
  authorName: string;
  coverEmoji: string;
  duration: number;
  videoCount: number;
  isOriginal: boolean;
}

export interface EtokHashtag {
  id: string;
  name: string;
  viewCount: number;
  trending: boolean;
}

export interface EtokVideo {
  id: string;
  authorId: string;
  description: string;
  hashtags: string[];
  soundId: string;
  thumbnailEmoji: string;
  thumbnailColor: string;
  videoUrl?: string;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  createdAt: string;
  privacy: "everyone" | "friends" | "only_me";
  allowComments: boolean;
  allowDuet: boolean;
  allowStitch: boolean;
  allowDownload: boolean;
  isSponsored: boolean;
  seriesId?: string;
}

export interface EtokComment {
  id: string;
  videoId: string;
  authorId: string;
  text: string;
  likes: number;
  isPinned: boolean;
  isVideoReply: boolean;
  parentId?: string;
  createdAt: string;
}

export interface EtokFollow {
  followerId: string;
  followingId: string;
}

export interface EtokSave {
  userId: string;
  videoId: string;
  savedAt: string;
}

const VIDEOS_KEY = "etok_videos";
const USERS_KEY = "etok_users";
const SOUNDS_KEY = "etok_sounds";
const HASHTAGS_KEY = "etok_hashtags";
const COMMENTS_KEY = "etok_comments";
const FOLLOWS_KEY = "etok_follows";
const LIKES_KEY = "etok_likes";
const SAVES_KEY = "etok_saves";
const REPOSTS_KEY = "etok_reposts";
const NOT_INTERESTED_KEY = "etok_not_interested";
const VERSION_KEY = "etok_data_version";
const CURRENT_VERSION = "3";

const BG_COLORS = [
  "from-purple-900 to-pink-900",
  "from-blue-900 to-cyan-900",
  "from-green-900 to-teal-900",
  "from-orange-900 to-red-900",
  "from-indigo-900 to-purple-900",
  "from-rose-900 to-orange-900",
  "from-cyan-900 to-blue-900",
  "from-yellow-900 to-orange-900",
  "from-teal-900 to-green-900",
  "from-fuchsia-900 to-pink-900",
  "from-amber-900 to-yellow-900",
  "from-sky-900 to-indigo-900",
];

const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
];

const DEMO_SOUNDS: EtokSound[] = [
  { id: "s1", title: "Flowers - Miley Cyrus", authorName: "Miley Cyrus", coverEmoji: "🌸", duration: 180, videoCount: 2400000, isOriginal: false },
  { id: "s2", title: "As It Was - Harry Styles", authorName: "Harry Styles", coverEmoji: "🎸", duration: 167, videoCount: 5100000, isOriginal: false },
  { id: "s3", title: "Calm Piano Vibes", authorName: "lofi_beats", coverEmoji: "🎹", duration: 120, videoCount: 890000, isOriginal: false },
  { id: "s4", title: "Original Sound", authorName: "etok_user", coverEmoji: "🎤", duration: 30, videoCount: 1, isOriginal: true },
  { id: "s5", title: "Dance Monkey - Tones and I", authorName: "Tones and I", coverEmoji: "🐒", duration: 210, videoCount: 8800000, isOriginal: false },
  { id: "s6", title: "Aesthetic Vibe", authorName: "aesthetic.music", coverEmoji: "✨", duration: 90, videoCount: 3200000, isOriginal: false },
];

const DEMO_HASHTAGS: EtokHashtag[] = [
  { id: "h1", name: "fyp", viewCount: 45000000000, trending: true },
  { id: "h2", name: "foryou", viewCount: 30000000000, trending: true },
  { id: "h3", name: "viral", viewCount: 20000000000, trending: true },
  { id: "h4", name: "dance", viewCount: 8000000000, trending: true },
  { id: "h5", name: "funny", viewCount: 15000000000, trending: true },
  { id: "h6", name: "cooking", viewCount: 4000000000, trending: false },
  { id: "h7", name: "travel", viewCount: 6000000000, trending: true },
  { id: "h8", name: "fitness", viewCount: 3500000000, trending: false },
  { id: "h9", name: "ethiopia", viewCount: 900000000, trending: true },
  { id: "h10", name: "addisababa", viewCount: 400000000, trending: false },
  { id: "h11", name: "music", viewCount: 12000000000, trending: true },
  { id: "h12", name: "art", viewCount: 2800000000, trending: false },
];

const DEMO_USERS: EtokUser[] = [
  { id: "u1", username: "kebede_dance", displayName: "Kebede Solomon", avatar: "🕺", bio: "Dance is life 💃 | Addis Ababa", followers: 892000, following: 412, totalLikes: 12400000, isVerified: true, isBusinessAccount: false, links: { instagram: "kebede_dance" }, pinnedVideoIds: ["v1", "v3"], profileViewIds: [] },
  { id: "u2", username: "selam_cook", displayName: "Selam Haile", avatar: "👩‍🍳", bio: "Ethiopian recipes daily 🍲 | Food blogger", followers: 234000, following: 891, totalLikes: 3200000, isVerified: false, isBusinessAccount: true, links: { youtube: "SelamCooks" }, pinnedVideoIds: ["v2"], profileViewIds: [] },
  { id: "u3", username: "abel_travel", displayName: "Abel Tesfaye", avatar: "✈️", bio: "Exploring Africa & beyond | Travel creator", followers: 567000, following: 223, totalLikes: 8900000, isVerified: true, isBusinessAccount: false, links: { instagram: "abeltravel" }, pinnedVideoIds: ["v4"], profileViewIds: [] },
  { id: "u4", username: "tigist_fitness", displayName: "Tigist Worku", avatar: "💪", bio: "Fitness | Nutrition | Motivation 🔥", followers: 145000, following: 533, totalLikes: 1800000, isVerified: false, isBusinessAccount: false, links: {}, pinnedVideoIds: [], profileViewIds: [] },
  { id: "u5", username: "biruk_comedy", displayName: "Biruk Tadesse", avatar: "😂", bio: "Making Ethiopia laugh every day 😄", followers: 1200000, following: 78, totalLikes: 34000000, isVerified: true, isBusinessAccount: false, links: { youtube: "BirukComedy" }, pinnedVideoIds: ["v6", "v8"], profileViewIds: [] },
  { id: "u6", username: "meron_art", displayName: "Meron Alemu", avatar: "🎨", bio: "Digital artist | Ethiopian culture & modern art", followers: 89000, following: 344, totalLikes: 980000, isVerified: false, isBusinessAccount: false, links: { instagram: "meron.art" }, pinnedVideoIds: [], profileViewIds: [] },
  { id: "u7", username: "yonas_music", displayName: "Yonas Belay", avatar: "🎵", bio: "Musician | Producer | Addis Ababa 🎶", followers: 445000, following: 167, totalLikes: 6700000, isVerified: true, isBusinessAccount: true, links: { instagram: "yonasmusic" }, pinnedVideoIds: ["v9"], profileViewIds: [] },
  { id: "u8", username: "hana_fashion", displayName: "Hana Bekele", avatar: "👗", bio: "Ethiopian fashion & style 💅 | Collab DMs open", followers: 312000, following: 892, totalLikes: 4400000, isVerified: false, isBusinessAccount: true, links: { instagram: "hana.fashion" }, pinnedVideoIds: ["v10"], profileViewIds: [] },
];

const DEMO_VIDEOS: EtokVideo[] = [
  { id: "v1", authorId: "u1", description: "When the beat drops and you can't stop! 🔥 #dance #fyp #viral", hashtags: ["dance", "fyp", "viral"], soundId: "s1", thumbnailEmoji: "🕺", thumbnailColor: BG_COLORS[0], videoUrl: SAMPLE_VIDEOS[0], duration: 28, views: 4500000, likes: 892000, comments: 12400, shares: 45000, saves: 23000, createdAt: "2026-03-01T10:00:00Z", privacy: "everyone", allowComments: true, allowDuet: true, allowStitch: true, allowDownload: true, isSponsored: false },
  { id: "v2", authorId: "u2", description: "How to make the best Doro Wat 🍗 Step by step recipe! #cooking #ethiopia #food", hashtags: ["cooking", "ethiopia", "food"], soundId: "s3", thumbnailEmoji: "🍗", thumbnailColor: BG_COLORS[1], videoUrl: SAMPLE_VIDEOS[1], duration: 180, views: 890000, likes: 234000, comments: 8900, shares: 12000, saves: 45000, createdAt: "2026-03-01T12:00:00Z", privacy: "everyone", allowComments: true, allowDuet: false, allowStitch: true, allowDownload: true, isSponsored: false },
  { id: "v3", authorId: "u1", description: "Eskista dance tutorial part 2! 💃 #eskista #ethiopia #addisababa #dance", hashtags: ["eskista", "ethiopia", "addisababa", "dance"], soundId: "s5", thumbnailEmoji: "💃", thumbnailColor: BG_COLORS[2], videoUrl: SAMPLE_VIDEOS[2], duration: 60, views: 2300000, likes: 567000, comments: 23400, shares: 78000, saves: 34000, createdAt: "2026-02-28T09:00:00Z", privacy: "everyone", allowComments: true, allowDuet: true, allowStitch: true, allowDownload: true, isSponsored: false },
  { id: "v4", authorId: "u3", description: "Lalibela at golden hour 😍 Most beautiful place on earth! #travel #ethiopia #lalibela #fyp", hashtags: ["travel", "ethiopia", "lalibela", "fyp"], soundId: "s6", thumbnailEmoji: "⛪", thumbnailColor: BG_COLORS[3], videoUrl: SAMPLE_VIDEOS[3], duration: 45, views: 6700000, likes: 1200000, comments: 34500, shares: 156000, saves: 89000, createdAt: "2026-02-27T15:00:00Z", privacy: "everyone", allowComments: true, allowDuet: false, allowStitch: true, allowDownload: false, isSponsored: false },
  { id: "v5", authorId: "u4", description: "Morning workout routine for beginners 💪 No gym needed! #fitness #workout #health", hashtags: ["fitness", "workout", "health"], soundId: "s2", thumbnailEmoji: "🏋️", thumbnailColor: BG_COLORS[4], videoUrl: SAMPLE_VIDEOS[4], duration: 120, views: 445000, likes: 89000, comments: 4500, shares: 8900, saves: 23000, createdAt: "2026-02-26T07:00:00Z", privacy: "everyone", allowComments: true, allowDuet: true, allowStitch: true, allowDownload: true, isSponsored: false },
  { id: "v6", authorId: "u5", description: "When mom asks who broke the plate 😂😂😂 #funny #comedy #ethiopian #viral", hashtags: ["funny", "comedy", "ethiopian", "viral"], soundId: "s4", thumbnailEmoji: "😂", thumbnailColor: BG_COLORS[5], videoUrl: SAMPLE_VIDEOS[5], duration: 32, views: 12000000, likes: 3400000, comments: 89000, shares: 450000, saves: 234000, createdAt: "2026-02-25T18:00:00Z", privacy: "everyone", allowComments: true, allowDuet: true, allowStitch: true, allowDownload: true, isSponsored: false },
  { id: "v7", authorId: "u6", description: "Speed painting — traditional Ethiopian cross pattern ✨ #art #ethiopia #painting #fyp", hashtags: ["art", "ethiopia", "painting", "fyp"], soundId: "s3", thumbnailEmoji: "🎨", thumbnailColor: BG_COLORS[6], videoUrl: SAMPLE_VIDEOS[6], duration: 90, views: 234000, likes: 67000, comments: 2300, shares: 4500, saves: 12000, createdAt: "2026-02-24T14:00:00Z", privacy: "everyone", allowComments: true, allowDuet: false, allowStitch: false, allowDownload: true, isSponsored: false },
  { id: "v8", authorId: "u5", description: "POV: You're late for work in Addis Ababa 🚌😭 #addisababa #relatable #comedy", hashtags: ["addisababa", "relatable", "comedy"], soundId: "s1", thumbnailEmoji: "🚌", thumbnailColor: BG_COLORS[7], videoUrl: SAMPLE_VIDEOS[7], duration: 22, views: 8900000, likes: 2100000, comments: 67000, shares: 340000, saves: 178000, createdAt: "2026-02-23T11:00:00Z", privacy: "everyone", allowComments: true, allowDuet: true, allowStitch: true, allowDownload: true, isSponsored: false },
  { id: "v9", authorId: "u7", description: "New beat just dropped 🎵 Who wants the full track? #music #producer #ethiopia #fyp", hashtags: ["music", "producer", "ethiopia", "fyp"], soundId: "s4", thumbnailEmoji: "🎹", thumbnailColor: BG_COLORS[8], videoUrl: SAMPLE_VIDEOS[8], duration: 60, views: 1100000, likes: 267000, comments: 18900, shares: 45000, saves: 34000, createdAt: "2026-02-22T16:00:00Z", privacy: "everyone", allowComments: true, allowDuet: true, allowStitch: true, allowDownload: false, isSponsored: false },
  { id: "v10", authorId: "u8", description: "Ethiopian traditional dress transformation ✨👗 #fashion #habesha #style #viral", hashtags: ["fashion", "habesha", "style", "viral"], soundId: "s5", thumbnailEmoji: "👗", thumbnailColor: BG_COLORS[9], videoUrl: SAMPLE_VIDEOS[9], duration: 38, views: 3400000, likes: 890000, comments: 34000, shares: 123000, saves: 67000, createdAt: "2026-02-21T13:00:00Z", privacy: "everyone", allowComments: true, allowDuet: true, allowStitch: true, allowDownload: true, isSponsored: false },
  { id: "v11", authorId: "u3", description: "Simien Mountains trekking 🏔️ A bucket list adventure! #travel #simien #nature #ethiopia", hashtags: ["travel", "simien", "nature", "ethiopia"], soundId: "s6", thumbnailEmoji: "🏔️", thumbnailColor: BG_COLORS[10], videoUrl: SAMPLE_VIDEOS[10], duration: 55, views: 2800000, likes: 712000, comments: 22000, shares: 89000, saves: 56000, createdAt: "2026-02-20T10:00:00Z", privacy: "everyone", allowComments: true, allowDuet: false, allowStitch: true, allowDownload: true, isSponsored: false },
  { id: "v12", authorId: "u4", description: "5-minute healthy Ethiopian breakfast 🥗 High protein, no sugar! #health #fitness #food", hashtags: ["health", "fitness", "food"], soundId: "s2", thumbnailEmoji: "🥗", thumbnailColor: BG_COLORS[11], videoUrl: SAMPLE_VIDEOS[11], duration: 85, views: 567000, likes: 134000, comments: 6700, shares: 23000, saves: 45000, createdAt: "2026-02-19T08:00:00Z", privacy: "everyone", allowComments: true, allowDuet: false, allowStitch: true, allowDownload: true, isSponsored: false },
];

function initData(): void {
  if (localStorage.getItem(VERSION_KEY) === CURRENT_VERSION) return;
  localStorage.setItem(VIDEOS_KEY, JSON.stringify(DEMO_VIDEOS));
  localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS));
  localStorage.setItem(SOUNDS_KEY, JSON.stringify(DEMO_SOUNDS));
  localStorage.setItem(HASHTAGS_KEY, JSON.stringify(DEMO_HASHTAGS));
  localStorage.setItem(COMMENTS_KEY, JSON.stringify([]));
  localStorage.setItem(FOLLOWS_KEY, JSON.stringify([]));
  localStorage.setItem(LIKES_KEY, JSON.stringify([]));
  localStorage.setItem(SAVES_KEY, JSON.stringify([]));
  localStorage.setItem(REPOSTS_KEY, JSON.stringify([]));
  localStorage.setItem(NOT_INTERESTED_KEY, JSON.stringify([]));
  localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
}

initData();

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
}
function save(key: string, data: unknown): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getAllVideos(): EtokVideo[] { return load<EtokVideo[]>(VIDEOS_KEY, []); }
export function getAllUsers(): EtokUser[] { return load<EtokUser[]>(USERS_KEY, []); }
export function getAllSounds(): EtokSound[] { return load<EtokSound[]>(SOUNDS_KEY, []); }
export function getAllHashtags(): EtokHashtag[] { return load<EtokHashtag[]>(HASHTAGS_KEY, []); }
export function getAllComments(): EtokComment[] { return load<EtokComment[]>(COMMENTS_KEY, []); }
export function getAllLikes(): { userId: string; videoId: string }[] { return load(LIKES_KEY, []); }
export function getAllSaves(): EtokSave[] { return load(SAVES_KEY, []); }
export function getAllFollows(): EtokFollow[] { return load(FOLLOWS_KEY, []); }
export function getAllReposts(): { userId: string; videoId: string }[] { return load(REPOSTS_KEY, []); }

export function getVideoById(id: string): EtokVideo | undefined { return getAllVideos().find(v => v.id === id); }
export function getUserById(id: string): EtokUser | undefined { return getAllUsers().find(u => u.id === id); }
export function getSoundById(id: string): EtokSound | undefined { return getAllSounds().find(s => s.id === id); }

export function getFYPVideos(currentUserId?: string): EtokVideo[] {
  const notInterested: string[] = load(NOT_INTERESTED_KEY, []);
  return getAllVideos()
    .filter(v => v.privacy === "everyone" && !notInterested.includes(v.id))
    .sort((a, b) => b.views - a.views);
}

export function getFollowingVideos(currentUserId: string): EtokVideo[] {
  const follows = getAllFollows().filter(f => f.followerId === currentUserId).map(f => f.followingId);
  return getAllVideos().filter(v => follows.includes(v.authorId) && v.privacy !== "only_me")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getFriendsVideos(currentUserId: string): EtokVideo[] {
  const myFollowing = new Set(getAllFollows().filter(f => f.followerId === currentUserId).map(f => f.followingId));
  const myFollowers = new Set(getAllFollows().filter(f => f.followingId === currentUserId).map(f => f.followerId));
  const friends = [...myFollowing].filter(id => myFollowers.has(id));
  return getAllVideos().filter(v => friends.includes(v.authorId) && v.privacy !== "only_me")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getUserVideos(userId: string): EtokVideo[] {
  return getAllVideos().filter(v => v.authorId === userId && v.privacy !== "only_me")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function isVideoLiked(userId: string, videoId: string): boolean {
  return getAllLikes().some(l => l.userId === userId && l.videoId === videoId);
}

export function toggleLike(userId: string, videoId: string): boolean {
  const likes = getAllLikes();
  const idx = likes.findIndex(l => l.userId === userId && l.videoId === videoId);
  const videos = getAllVideos();
  const v = videos.find(v => v.id === videoId);
  if (!v) return false;
  if (idx >= 0) {
    likes.splice(idx, 1);
    v.likes = Math.max(0, v.likes - 1);
    save(LIKES_KEY, likes);
    save(VIDEOS_KEY, videos);
    return false;
  } else {
    likes.push({ userId, videoId });
    v.likes += 1;
    save(LIKES_KEY, likes);
    save(VIDEOS_KEY, videos);
    return true;
  }
}

export function isVideoSaved(userId: string, videoId: string): boolean {
  return getAllSaves().some(s => s.userId === userId && s.videoId === videoId);
}

export function toggleSave(userId: string, videoId: string): boolean {
  const saves = getAllSaves();
  const idx = saves.findIndex(s => s.userId === userId && s.videoId === videoId);
  if (idx >= 0) {
    saves.splice(idx, 1);
    save(SAVES_KEY, saves);
    return false;
  } else {
    saves.push({ userId, videoId, savedAt: new Date().toISOString() });
    save(SAVES_KEY, saves);
    return true;
  }
}

export function getSavedVideos(userId: string): EtokVideo[] {
  const savedIds = getAllSaves().filter(s => s.userId === userId).map(s => s.videoId);
  return getAllVideos().filter(v => savedIds.includes(v.id));
}

export function isReposted(userId: string, videoId: string): boolean {
  return getAllReposts().some(r => r.userId === userId && r.videoId === videoId);
}

export function toggleRepost(userId: string, videoId: string): boolean {
  const reposts = getAllReposts();
  const idx = reposts.findIndex(r => r.userId === userId && r.videoId === videoId);
  if (idx >= 0) { reposts.splice(idx, 1); save(REPOSTS_KEY, reposts); return false; }
  reposts.push({ userId, videoId });
  save(REPOSTS_KEY, reposts);
  return true;
}

export function getRepostedVideos(userId: string): EtokVideo[] {
  const ids = getAllReposts().filter(r => r.userId === userId).map(r => r.videoId);
  return getAllVideos().filter(v => ids.includes(v.id));
}

export function markNotInterested(videoId: string): void {
  const list: string[] = load(NOT_INTERESTED_KEY, []);
  if (!list.includes(videoId)) { list.push(videoId); save(NOT_INTERESTED_KEY, list); }
}

export function isFollowing(followerId: string, followingId: string): boolean {
  return getAllFollows().some(f => f.followerId === followerId && f.followingId === followingId);
}

export function toggleFollow(followerId: string, followingId: string): boolean {
  const follows = getAllFollows();
  const users = getAllUsers();
  const idx = follows.findIndex(f => f.followerId === followerId && f.followingId === followingId);
  const followerUser = users.find(u => u.id === followerId);
  const followingUser = users.find(u => u.id === followingId);
  if (idx >= 0) {
    follows.splice(idx, 1);
    if (followerUser) followerUser.following = Math.max(0, followerUser.following - 1);
    if (followingUser) followingUser.followers = Math.max(0, followingUser.followers - 1);
    save(FOLLOWS_KEY, follows);
    save(USERS_KEY, users);
    return false;
  } else {
    follows.push({ followerId, followingId });
    if (followerUser) followerUser.following += 1;
    if (followingUser) followingUser.followers += 1;
    save(FOLLOWS_KEY, follows);
    save(USERS_KEY, users);
    return true;
  }
}

export function getFollowers(userId: string): EtokUser[] {
  const ids = getAllFollows().filter(f => f.followingId === userId).map(f => f.followerId);
  return getAllUsers().filter(u => ids.includes(u.id));
}

export function getFollowing(userId: string): EtokUser[] {
  const ids = getAllFollows().filter(f => f.followerId === userId).map(f => f.followingId);
  return getAllUsers().filter(u => ids.includes(u.id));
}

export function getCommentsForVideo(videoId: string): EtokComment[] {
  return getAllComments().filter(c => c.videoId === videoId && !c.parentId)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

export function addComment(videoId: string, authorId: string, text: string, parentId?: string): EtokComment {
  const comments = getAllComments();
  const comment: EtokComment = {
    id: Date.now().toString(),
    videoId,
    authorId,
    text,
    likes: 0,
    isPinned: false,
    isVideoReply: false,
    parentId,
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  save(COMMENTS_KEY, comments);
  const videos = getAllVideos();
  const v = videos.find(v => v.id === videoId);
  if (v) { v.comments += 1; save(VIDEOS_KEY, videos); }
  return comment;
}

export function likeComment(commentId: string): void {
  const comments = getAllComments();
  const c = comments.find(c => c.id === commentId);
  if (c) { c.likes += 1; save(COMMENTS_KEY, comments); }
}

export function pinComment(commentId: string, videoId: string): void {
  const comments = getAllComments();
  comments.forEach(c => { if (c.videoId === videoId) c.isPinned = false; });
  const c = comments.find(c => c.id === commentId);
  if (c) c.isPinned = true;
  save(COMMENTS_KEY, comments);
}

export function deleteComment(commentId: string): void {
  let comments = getAllComments();
  const c = comments.find(c => c.id === commentId);
  if (!c) return;
  comments = comments.filter(x => x.id !== commentId && x.parentId !== commentId);
  save(COMMENTS_KEY, comments);
}

export function pinVideo(userId: string, videoId: string): void {
  const users = getAllUsers();
  const u = users.find(u => u.id === userId);
  if (!u) return;
  if (!u.pinnedVideoIds.includes(videoId) && u.pinnedVideoIds.length < 3) {
    u.pinnedVideoIds.unshift(videoId);
    save(USERS_KEY, users);
  }
}

export function unpinVideo(userId: string, videoId: string): void {
  const users = getAllUsers();
  const u = users.find(u => u.id === userId);
  if (!u) return;
  u.pinnedVideoIds = u.pinnedVideoIds.filter(id => id !== videoId);
  save(USERS_KEY, users);
}

export function recordProfileView(viewerId: string, profileId: string): void {
  const users = getAllUsers();
  const u = users.find(u => u.id === profileId);
  if (!u) return;
  if (!u.profileViewIds.includes(viewerId)) u.profileViewIds.unshift(viewerId);
  if (u.profileViewIds.length > 50) u.profileViewIds = u.profileViewIds.slice(0, 50);
  save(USERS_KEY, users);
}

export function addVideo(video: Omit<EtokVideo, "id" | "views" | "likes" | "comments" | "shares" | "saves" | "createdAt">): EtokVideo {
  const videos = getAllVideos();
  const newVideo: EtokVideo = {
    ...video,
    id: "v" + Date.now(),
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    createdAt: new Date().toISOString(),
  };
  videos.unshift(newVideo);
  save(VIDEOS_KEY, videos);
  return newVideo;
}

export async function uploadVideo(
  blob: Blob,
  metadata: {
    authorId: string;
    description: string;
    hashtags: string[];
    soundId: string;
    thumbnailEmoji: string;
    thumbnailColor: string;
    duration: number;
    privacy: "everyone" | "friends" | "only_me";
    allowComments: boolean;
    allowDuet: boolean;
    allowStitch: boolean;
    allowDownload: boolean;
    isSponsored: boolean;
  },
  onProgress?: (pct: number) => void
): Promise<EtokVideo> {
  let videoUrl: string | undefined;

  try {
    onProgress?.(10);
    const fileName = `etok-${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;
    const { data, error } = await supabase.storage
      .from("etok-videos")
      .upload(fileName, blob, { contentType: "video/webm", upsert: false });

    if (!error && data) {
      const { data: urlData } = supabase.storage.from("etok-videos").getPublicUrl(data.path);
      videoUrl = urlData.publicUrl;
      onProgress?.(80);
    }
  } catch {
    videoUrl = URL.createObjectURL(blob);
  }

  if (!videoUrl) {
    videoUrl = URL.createObjectURL(blob);
  }

  onProgress?.(90);
  const newVideo = addVideo({ ...metadata, videoUrl });
  onProgress?.(100);
  return newVideo;
}

export function searchVideos(query: string): EtokVideo[] {
  const q = query.toLowerCase();
  return getAllVideos().filter(v => v.description.toLowerCase().includes(q) || v.hashtags.some(h => h.toLowerCase().includes(q)));
}

export function searchUsers(query: string): EtokUser[] {
  const q = query.toLowerCase();
  return getAllUsers().filter(u => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q));
}

export function searchSounds(query: string): EtokSound[] {
  const q = query.toLowerCase();
  return getAllSounds().filter(s => s.title.toLowerCase().includes(q) || s.authorName.toLowerCase().includes(q));
}

export function searchHashtags(query: string): EtokHashtag[] {
  const q = query.toLowerCase().replace(/^#/, "");
  return getAllHashtags().filter(h => h.name.toLowerCase().includes(q));
}

export function getVideosByHashtag(hashtag: string): EtokVideo[] {
  const h = hashtag.toLowerCase().replace(/^#/, "");
  return getAllVideos().filter(v => v.hashtags.some(tag => tag.toLowerCase() === h));
}

export function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
  return n.toString();
}

export function getTrendingHashtags(): EtokHashtag[] {
  return getAllHashtags().filter(h => h.trending).sort((a, b) => b.viewCount - a.viewCount);
}

export function getSuggestedUsers(currentUserId: string): EtokUser[] {
  const myFollowing = new Set(getAllFollows().filter(f => f.followerId === currentUserId).map(f => f.followingId));
  return getAllUsers().filter(u => u.id !== currentUserId && !myFollowing.has(u.id))
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 8);
}
