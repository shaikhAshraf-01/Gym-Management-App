import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";

// Screens jahan se "back" dabane par app exit honi chahiye
// (yani yeh har role ki "home" screen hai, yaha se piche jaane ki koi jagah nahi)
const EXIT_SCREENS = ["/login", "/admin", "/owner", "/trainer"];

function isExitScreen(pathname) {
  // exact home path OR role root jaise "/owner", "/owner/" dono match ho jaye
  return EXIT_SCREENS.some(
    (p) => pathname === p || pathname === `${p}/`
  );
}

export default function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  const lastBackPressRef = useRef(0);
  const [showExitToast, setShowExitToast] = useState(false);

  // location ko ref me rakho taaki listener ke andar hamesha latest path mile
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    // Sirf native Android/iOS app ke andar hi yeh listener chalana hai,
    // normal browser me iski zarurat nahi
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle;

    CapacitorApp.addListener("backButton", () => {
      const currentPath = locationRef.current.pathname;

      if (isExitScreen(currentPath)) {
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          // 2 second ke andar dobara back dabaya -> app exit
          CapacitorApp.exitApp();
        } else {
          // pehli baar -> warn karo, exit mat karo
          lastBackPressRef.current = now;
          setShowExitToast(true);
          setTimeout(() => setShowExitToast(false), 2000);
        }
      } else {
        // ek step piche jao
        navigate(-1);
      }
    }).then((handle) => {
      listenerHandle = handle;
    });

    return () => {
      listenerHandle?.remove();
    };
  }, [navigate]);

  if (!showExitToast) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "40px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.85)",
        color: "#fff",
        padding: "10px 20px",
        borderRadius: "24px",
        fontSize: "14px",
        zIndex: 9999,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      Press back again to exit
    </div>
  );
}