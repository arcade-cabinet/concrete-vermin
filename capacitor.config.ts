import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.arcadecabinet.concretevermin",
  appName: "Concrete Vermin",
  webDir: "dist",
  server: { androidScheme: "https" },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0d0c0a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: { style: "DARK", backgroundColor: "#0d0c0a", overlaysWebView: false },
    ScreenOrientation: { lockedOrientation: "landscape" },
  },
};

export default config;
