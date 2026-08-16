import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { closeDrawer } from "../redux/slices/uiSlice";
import { consumeBackPress } from "../utils/backHandlerStack";

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
  const dispatch = useDispatch();
  const location = useLocation();
  const isDrawerOpen = useSelector((state) => state.ui.isDrawerOpen);
  const locationRef = useRef(location);
  const isDrawerOpenRef = useRef(isDrawerOpen);
  const lastBackPressRef = useRef(0);
  const [showExitToast, setShowExitToast] = useState(false);

  // location aur drawer state ko ref me rakho taaki listener ke andar
  // hamesha latest value mile (listener sirf ek baar register hota hai)
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    isDrawerOpenRef.current = isDrawerOpen;
  }, [isDrawerOpen]);

  useEffect(() => {
    // Sirf native Android/iOS app ke andar hi yeh listener chalana hai,
    // normal browser me iski zarurat nahi
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle;

    CapacitorApp.addListener("backButton", () => {
      // 1) Koi bhi registered modal/overlay (Edit, View, Delete confirm,
      //    WhatsApp popup, etc.) khula ho to sirf usko close karo
      if (consumeBackPress()) {
        return;
      }

      // 2) Mobile "Add" bottom-sheet khula ho to usko close karo
      if (isDrawerOpenRef.current) {
        dispatch(closeDrawer());
        return;
      }

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
  }, [navigate, dispatch]);

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