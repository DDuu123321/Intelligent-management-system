// src/stores/auth.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import type { UserProfile } from "@/types/api";
import { secureStorage } from "@/utils/secureStorage";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<UserProfile | null>(null);
  const token = ref<string | null>(null);
  const isLoggedIn = ref(false);

  // 初始化状态
  const initAuth = () => {
    const savedToken = secureStorage.getToken();
    const savedUser = secureStorage.getUser();

    if (savedToken && savedUser) {
      token.value = savedToken;
      user.value = savedUser;
      isLoggedIn.value = true;
    }
  };

  // 登录
  const setAuth = (authData: { token: string; user: UserProfile }) => {
    token.value = authData.token;
    user.value = authData.user;
    isLoggedIn.value = true;

    secureStorage.setToken(authData.token);
    secureStorage.setUser(authData.user);
  };

  // 登出
  const clearAuth = () => {
    token.value = null;
    user.value = null;
    isLoggedIn.value = false;

    secureStorage.clearAuth();
  };

  return {
    user,
    token,
    isLoggedIn,
    initAuth,
    setAuth,
    clearAuth,
  };
});
