import { createI18n } from "vue-i18n";
import zhCN from "./locales/zh-CN";
import enUS from "./locales/en-US";

const messages = {
  "zh-CN": zhCN,
  zh: zhCN,
  "en-US": enUS,
  en: enUS,
};

// 从localStorage获取保存的语言，默认中文
const getLocale = () => {
  const saved = localStorage.getItem("locale");
  return saved || "zh-CN";
};

const i18n = createI18n({
  legacy: false,
  locale: getLocale(),
  fallbackLocale: "zh-CN",
  messages,
  globalInjection: true,
});

export default i18n;
