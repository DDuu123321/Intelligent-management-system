/// <reference types="vite/client" />
/// <reference types="@types/google.maps" />
/// <reference types="./src/types/element-plus" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SOCKET_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<
    Record<string, never>,
    Record<string, never>,
    any
  >;
  export default component;
}
