import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
// import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // vueDevTools(), // 暂时禁用以避免容器路径问题
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "localhost",
    port: 5173,
    // 如果需要启用 HTTPS 以支持摄像头功能，取消注释以下配置：
    // https: {
    //   key: './localhost-key.pem',
    //   cert: './localhost.pem'
    // }
  },
});
