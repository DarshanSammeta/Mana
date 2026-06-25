import { create } from "zustand";

interface LoadingState {
  isLoading: boolean;
  message: string;
  setIsLoading: (isLoading: boolean, message?: string) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  message: "Loading...",
  setIsLoading: (isLoading, message = "Loading...") => set({ isLoading, message }),
}));
