import { Capacitor } from "@capacitor/core";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

const TOKEN_KEY = "gymopsflow_token";

// Only the installed Android app uses this. The website never stores
// the token in any JS-reachable place — it relies entirely on the
// httpOnly cookie the backend sets, which client JS can't read or
// write at all (that's the whole point).
export const setStoredToken = async (token) => {
  if (!Capacitor.isNativePlatform() || !token) return;
  try {
    await SecureStoragePlugin.set({ key: TOKEN_KEY, value: token });
  } catch (error) {
    console.error("secureStorage: failed to save token", error);
  }
};

export const getStoredToken = async () => {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { value } = await SecureStoragePlugin.get({ key: TOKEN_KEY });
    return value;
  } catch {
    // Plugin throws when the key doesn't exist — just means "no token".
    return null;
  }
};

export const removeStoredToken = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await SecureStoragePlugin.remove({ key: TOKEN_KEY });
  } catch {
    // Already gone — fine.
  }
};