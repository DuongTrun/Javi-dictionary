import { create } from "zustand";

interface PremiumModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const usePremiumModalStore = create<PremiumModalState>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}));
