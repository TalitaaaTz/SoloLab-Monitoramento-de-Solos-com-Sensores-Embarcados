import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuração do Capacitor para empacotar o SoloLab como APK Android.
 *
 * Propositalmente SEM bloco `server.url` — assim o APK final carrega o
 * bundle estático embutido (pasta `dist/` sincronizada com `npx cap sync`),
 * e não depende do preview da Lovable estar no ar.
 */
const config: CapacitorConfig = {
  appId: "br.ufrpe.sololab",
  appName: "SoloLab",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
};

export default config;
