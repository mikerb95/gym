import type { CapacitorConfig } from "@capacitor/cli";

// La app Android carga la PWA desplegada: un solo código para web y Android.
// Los plugins nativos (Health Connect, hápticos) se exponen a la PWA vía Capacitor.
const config: CapacitorConfig = {
  appId: "co.forja.app",
  appName: "Forja",
  webDir: "www",
  server: {
    url: process.env.APP_URL ?? "http://10.0.2.2:3000",
    cleartext: !process.env.APP_URL,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
