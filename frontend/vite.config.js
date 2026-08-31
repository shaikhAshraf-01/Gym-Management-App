import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
//
// The `mode` param below is what lets ONE vite.config.js produce two
// different builds from the same codebase:
//   - `vite build`               (mode "production", the website)  → PWA plugin included
//   - `vite build --mode android` (used by the android:sync script) → PWA plugin skipped
//
// WHY: a service worker inside Capacitor's native WebView can hold on
// to stale cached files after an app update, since the WebView is
// already loading bundled local assets, not fetching over the network
// the way a real PWA install does — the two caching layers just fight
// each other. The manifest.webmanifest ("Add to Home Screen" icons/
// name) is likewise meaningless inside a native app shell. So the
// Android build simply never gets either.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(mode === "android"
      ? []
      : [
          VitePWA({
            // "autoUpdate" = when you ship a new build, the next time a
            // user opens the installed app it silently fetches the new
            // version in the background — no "update available" prompt to
            // build/handle, no stale cached version stuck on their device.
            registerType: "autoUpdate",

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
        ]),
  ],
}))