import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IUserResponse, ILoginResponse } from "../types/backend";

interface AuthState {
  token: string | null;
  user: IUserResponse | null;
  setAuth: (res: ILoginResponse) => void;
  setUser: (user: IUserResponse) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      setAuth: (res) =>
        set({
          token: res.token,
          user: res.user,
        }),

      setUser: (user) =>
        set({
          user,
        }),

      clearAuth: () => {
        set({ token: null, user: null });
        document.cookie =
          "refresh_token=; Max-Age=0; path=/; secure; samesite=None";
      },
    }),
    { name: "auth-storage" }
  )
);
