export interface VoiceParticipant {
  userId: string;
  name: string;
  joinedAt: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isHandRaised: boolean;
}

export interface VoiceRoom {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  participants: VoiceParticipant[];
  maxParticipants: number;
}

const VOICE_ROOMS_KEY = "zeshopp_voice_rooms";
const ACTIVE_VOICE_ROOM_KEY = "zeshopp_active_voice_room";

function loadRooms(): VoiceRoom[] {
  try {
    const data = localStorage.getItem(VOICE_ROOMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveRooms(rooms: VoiceRoom[]): void {
  localStorage.setItem(VOICE_ROOMS_KEY, JSON.stringify(rooms));
}

function updateRoom(roomId: string, updater: (room: VoiceRoom) => VoiceRoom): VoiceRoom | undefined {
  const rooms = loadRooms();
  const idx = rooms.findIndex((r) => r.id === roomId);
  if (idx === -1) return undefined;
  rooms[idx] = updater(rooms[idx]);
  saveRooms(rooms);
  return rooms[idx];
}

export function getVoiceRooms(): VoiceRoom[] {
  return loadRooms().filter((r) => r.isActive);
}

export function createVoiceRoom(
  groupId: string,
  groupName: string,
  title: string,
  userId: string,
  userName: string,
): VoiceRoom {
  const rooms = loadRooms();
  const room: VoiceRoom = {
    id: `vr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    groupId,
    groupName,
    title,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    isActive: true,
    maxParticipants: 30,
    participants: [
      {
        userId,
        name: userName,
        joinedAt: new Date().toISOString(),
        isMuted: false,
        isSpeaking: false,
        isHandRaised: false,
      },
    ],
  };
  rooms.push(room);
  saveRooms(rooms);
  localStorage.setItem(ACTIVE_VOICE_ROOM_KEY, room.id);
  return room;
}

export function getVoiceRoom(id: string): VoiceRoom | undefined {
  return loadRooms().find((r) => r.id === id);
}

export function joinVoiceRoom(roomId: string, userId: string, userName: string): VoiceRoom | undefined {
  return updateRoom(roomId, (room) => {
    if (!room.isActive) return room;
    if (room.participants.find((p) => p.userId === userId)) return room;
    if (room.participants.length >= room.maxParticipants) return room;
    room.participants.push({
      userId,
      name: userName,
      joinedAt: new Date().toISOString(),
      isMuted: false,
      isSpeaking: false,
      isHandRaised: false,
    });
    localStorage.setItem(ACTIVE_VOICE_ROOM_KEY, roomId);
    return room;
  });
}

export function leaveVoiceRoom(roomId: string, userId: string): VoiceRoom | undefined {
  const result = updateRoom(roomId, (room) => {
    room.participants = room.participants.filter((p) => p.userId !== userId);
    if (room.participants.length === 0) {
      room.isActive = false;
    }
    return room;
  });
  const activeId = localStorage.getItem(ACTIVE_VOICE_ROOM_KEY);
  if (activeId === roomId) {
    localStorage.removeItem(ACTIVE_VOICE_ROOM_KEY);
  }
  return result;
}

export function toggleMute(roomId: string, userId: string): VoiceRoom | undefined {
  return updateRoom(roomId, (room) => {
    const participant = room.participants.find((p) => p.userId === userId);
    if (participant) {
      participant.isMuted = !participant.isMuted;
      if (participant.isMuted) {
        participant.isSpeaking = false;
      }
    }
    return room;
  });
}

export function toggleHandRaise(roomId: string, userId: string): VoiceRoom | undefined {
  return updateRoom(roomId, (room) => {
    const participant = room.participants.find((p) => p.userId === userId);
    if (participant) {
      participant.isHandRaised = !participant.isHandRaised;
    }
    return room;
  });
}

export function endVoiceRoom(roomId: string): void {
  updateRoom(roomId, (room) => {
    room.isActive = false;
    room.participants = [];
    return room;
  });
  const activeId = localStorage.getItem(ACTIVE_VOICE_ROOM_KEY);
  if (activeId === roomId) {
    localStorage.removeItem(ACTIVE_VOICE_ROOM_KEY);
  }
}

export function getActiveRoomForGroup(groupId: string): VoiceRoom | undefined {
  return loadRooms().find((r) => r.groupId === groupId && r.isActive);
}

export function getActiveRoom(userId: string): VoiceRoom | undefined {
  return loadRooms().find(
    (r) => r.isActive && r.participants.some((p) => p.userId === userId),
  );
}

export function simulateSpeaking(roomId: string): void {
  updateRoom(roomId, (room) => {
    room.participants.forEach((p) => {
      if (!p.isMuted) {
        p.isSpeaking = Math.random() > 0.6;
      } else {
        p.isSpeaking = false;
      }
    });
    return room;
  });
}
