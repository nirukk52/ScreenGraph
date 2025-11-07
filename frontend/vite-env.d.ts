/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_BASE_URL: string;
  readonly VITE_APPIUM_SERVER_URL?: string;
  readonly VITE_APK_PATH?: string;
  readonly VITE_PACKAGE_NAME?: string;
  readonly VITE_APP_ACTIVITY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
