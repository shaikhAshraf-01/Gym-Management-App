import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "autoUpdate" = when you ship a new build, the next time a
      // user opens the installed app it silently fetches the new
      // version in the background — no "update available" prompt to
      // build/handle, no stale cached version stuck on their device.
      registerType: "autoUpdate",

      // Capacitor already produces its own native Android app from
      // this same `dist` build — the PWA manifest below is only for
      // browser installs (iOS Safari "Add to Home Screen", desktop
      // Chrome, etc.), so it doesn't interfere with the Capacitor build.
      manifest: {
        name: "GymOpsFlow",
        short_name: "GymOpsFlow",
        description: "Gym membership & operations management",
        // Matches the app's dark theme (see icon-only.png background)
        // so the status bar / splash background doesn't flash white
        // on launch.
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone", // hides the browser UI (address bar, tabs)
        start_url: "/",
        icons: [
          {
            src: "/pwa-icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            // "maskable" lets Android crop the icon into a circle/
            // squircle/etc. per the device's icon theme, instead of
            // showing it on a plain white square background.
            src: "/pwa-icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        // Precache the built JS/CSS/HTML so the app shell still loads
        // (and shows a cached screen) on a flaky connection — API
        // calls themselves are NOT cached here, so members/enquiries
        // data always comes fresh from the network, same as today.
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
    }),
  ],
})