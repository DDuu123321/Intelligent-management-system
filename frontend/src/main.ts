import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

// 导入国际化
import i18n from "./i18n";

// 导入权限指令
import { setupPermissionDirective } from "./directives/permission";

import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";

const app = createApp(App);
const pinia = createPinia();

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(pinia);
app.use(router);
app.use(ElementPlus);
app.use(i18n); // 添加国际化支持

// 注册权限指令
setupPermissionDirective(app);

// 初始化用户状态
const authStore = useAuthStore();
authStore.initAuth();

app.mount("#app");
