import { defineStore } from "pinia";
import { ref } from "vue";
import i18n from "@/i18n";

export const useLocaleStore = defineStore("locale", () => {
  const currentLocale = ref(localStorage.getItem("locale") || "zh-CN");

  const setLocale = (locale: string) => {
    currentLocale.value = locale;
    i18n.global.locale.value = locale as any;
    localStorage.setItem("locale", locale);
  };

  return {
    currentLocale,
    setLocale,
  };
});
