import { useEffect, useRef } from "react";
import { registerBackHandler, unregisterBackHandler } from "../utils/backHandlerStack";

let idCounter = 0;

/**
 * Kisi bhi modal/drawer/overlay ko hardware back button se close karne
 * ke liye ye hook use karo.
 *
 * Usage:
 *   useBackHandler(!!editingMember, () => setEditingMember(null));
 *
 * isActive true hone par ye khud ko back-handler stack mein register kar
 * deta hai. Jab tak isActive true hai, hardware back dabane par onClose
 * chalega (aur page navigate nahi hogi). isActive false hote hi ya
 * component unmount hote hi automatically unregister ho jaata hai.
 */
export function useBackHandler(isActive, onClose) {
  const idRef = useRef(null);
  if (idRef.current === null) {
    idRef.current = ++idCounter;
  }

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const id = idRef.current;
    if (isActive) {
      registerBackHandler(id, () => onCloseRef.current());
    } else {
      unregisterBackHandler(id);
    }
    return () => unregisterBackHandler(id);
  }, [isActive]);
}