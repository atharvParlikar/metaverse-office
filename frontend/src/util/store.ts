import { create } from "zustand";
import { Chat } from "../components/ChatPanel";
import { RemoteHero } from "../game/objects/hero/RemoteHero";
import { createClient } from "./supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { MediaConnection } from "peerjs";

type StoreT = {
  chatHistory: Chat[];
  addChat: (chat: Chat) => void;
  setChat: (chats: Chat[]) => void;

  id: number | null;
  setId: (id: number) => void;

  chatInputActive: boolean;
  setChatInputActive: (active: boolean) => void;

  remotePlayers: Map<number, RemoteHero>;
  addPlayer: (id: number, player: RemoteHero) => void;

  canCall: boolean;
  setCanCall: (canCall: boolean) => void;

  toCall: RemoteHero | null;
  setToCall: (toCall_: RemoteHero | null) => void;

  wsReady: boolean;
  setWsReady: (readyState: boolean) => void;

  supabase: SupabaseClient;

  wsAuthenticated: boolean;
  setWsAuthenticated: (isAuthenticated: boolean) => void;

  connections: MediaConnection[];
  setConnections: (connection: MediaConnection[]) => void;

  remoteVideoStream: MediaStream | null;
  setRemoteVideoStream: (videoStream: MediaStream | null) => void;

  localVideoStream: MediaStream | null;
  setLocalVideoStream: (videoStream: MediaStream | null) => void;

  userCallConsent: boolean;
  setUserCallConsent: (consent: boolean) => void;

  remoteCallConsent: boolean;
  setRemoteCallConsent: (consent: boolean) => void;

  onCall: boolean;
  setOnCall: (onCall: boolean) => void;
};

export const useStore = create<StoreT>((set) => ({
  // For chat history
  chatHistory: [],
  addChat: (chat) =>
    set((state) => ({ chatHistory: [...state.chatHistory, chat] })),
  setChat: (chats) => set(() => ({ chatHistory: chats })),

  // For player's id (socket id)
  id: null,
  setId: (id_) => set(() => ({ id: id_ })),

  // To check if player is typing a message, in which case disable game inputs
  chatInputActive: false,
  setChatInputActive: (active) => set(() => ({ chatInputActive: active })),

  // Mentain the list of positions of remote players
  remotePlayers: new Map(),
  addPlayer: (id, player) =>
    set((state) => {
      console.log("Add players called");
      const newPlayers = new Map(state.remotePlayers);
      newPlayers.set(id, player);
      console.log("new players: ");
      console.log(newPlayers);
      return { remotePlayers: newPlayers };
    }),

  // is the player close enough to make a call to some player
  canCall: false,
  setCanCall: (canCall_) => set(() => ({ canCall: canCall_ })),

  // what player to call to
  toCall: null,
  setToCall: (toCall_) => set(() => ({ toCall: toCall_ })),

  wsReady: false,
  setWsReady: (readyState) => set(() => ({ wsReady: readyState })),

  supabase: createClient(),

  wsAuthenticated: false,
  setWsAuthenticated: (isAuthenticated: boolean) =>
    set(() => ({ wsAuthenticated: isAuthenticated })),

  connections: [],
  setConnections: (connections: MediaConnection[]) =>
    set(() => ({ connections })),

  remoteVideoStream: null,
  setRemoteVideoStream: (videoStream: MediaStream | null) =>
    set(() => ({ remoteVideoStream: videoStream })),

  localVideoStream: null,
  setLocalVideoStream: (videoStream: MediaStream | null) =>
    set(() => ({ localVideoStream: videoStream })),

  userCallConsent: false,
  setUserCallConsent: (consent: boolean) =>
    set(() => ({ userCallConsent: consent })),

  remoteCallConsent: false,
  setRemoteCallConsent: (consent: boolean) =>
    set(() => ({ remoteCallConsent: consent })),

  onCall: false,
  setOnCall: (onCall: boolean) => set(() => ({ onCall })),
}));
