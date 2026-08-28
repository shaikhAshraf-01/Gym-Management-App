import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectSocket, disconnectSocket } from "../socket.js";
import { memberUpserted, memberRemoved } from "../redux/slices/membersSlice";
import { enquiryUpserted, enquiryRemoved } from "../redux/slices/enquiriesSlice";

// Keeps members/enquiries live across:
//   - multiple devices logged into the same account
//   - owner <-> trainer, since both work on the same gym's data
//
// Mounted once, near the top of the app (see App.jsx) — it doesn't
// render anything, just keeps one socket connection open for as long
// as the user is logged in and wires its events into Redux, so any
// screen showing members/enquiries updates itself without a refresh.
export default function useRealtimeSync() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    (async () => {
      const socket = await connectSocket();
      if (cancelled) return;

      socket.on("member:created", ({ member }) => dispatch(memberUpserted(member)));
      socket.on("member:updated", ({ member }) => dispatch(memberUpserted(member)));
      socket.on("member:deleted", ({ id }) => dispatch(memberRemoved(id)));

      socket.on("enquiry:created", ({ enquiry }) => dispatch(enquiryUpserted(enquiry)));
      socket.on("enquiry:updated", ({ enquiry }) => dispatch(enquiryUpserted(enquiry)));
      socket.on("enquiry:deleted", ({ id }) => dispatch(enquiryRemoved(id)));
    })();

    return () => {
      cancelled = true;
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, dispatch]);
}