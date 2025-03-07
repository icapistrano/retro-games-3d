import { create } from "zustand";

interface CharacterState {
  characterPosition: [number, number, number];
  characterRotation: [number, number, number, number];
  setCharacterPosition: (position: [number, number, number]) => void;
  setCharacterRotation: (rotation: [number, number, number, number]) => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  characterPosition: [0, 0, 0],
  characterRotation: [0, 0, 0, 1],
  setCharacterPosition: (position) => set({ characterPosition: position }),
  setCharacterRotation: (rotation) => set({ characterRotation: rotation }),
}));
