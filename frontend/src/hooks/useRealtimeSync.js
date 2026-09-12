import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectSocket, disconnectSocket } from "../socket.js";
import { memberUpserted, memberRemoved, deletedMemberRemoved, fetchMembers } from "../redux/slices/membersSlice";
import { enquiryUpserted, enquiryRemoved } from "../redux/slices/enquiriesSlice";
import { gymProfileUpdated, trainersUpdated } from "../redux/slices/ownerSlice";
import { gymUpserted, gymRemoved, gymTrainersUpdated } from "../redux/slices/gymSlice";

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
      // Restored (from another device's Deleted Members screen) —
      // put them back in the main list and drop them from Deleted.
      socket.on("member:restored", ({ member }) => {
        dispatch(memberUpserted(member));
        dispatch(deletedMemberRemoved(member.id));
      });
      socket.on("member:permanently-deleted", ({ id }) => dispatch(deletedMemberRemoved(id)));

      socket.on("enquiry:created", ({ enquiry }) => dispatch(enquiryUpserted(enquiry)));
      socket.on("enquiry:updated", ({ enquiry }) => dispatch(enquiryUpserted(enquiry)));
      socket.on("enquiry:deleted", ({ id }) => dispatch(enquiryRemoved(id)));

      // "gym:updated" is broadcast both to the gym's own room (owner/
      // trainer) and to the admins room — harmless to dispatch both
      // reducers on every client since each one no-ops unless the
      // gym id actually matches what that slice is holding.
      socket.on("gym:updated", (payload) => {
        dispatch(gymProfileUpdated(payload));
        if (payload?.gym) dispatch(gymUpserted(payload.gym));

        // Admin-side edit (plan upgrade, status change, etc.) — pull
        // fresh members straight from the server so Dashboard/Sales/
        // MembersView never show stale data without a manual refresh.
        dispatch(fetchMembers());
      });
      socket.on("gym:created", (payload) => {
        if (payload?.gym) dispatch(gymUpserted(payload.gym));
      });
      socket.on("gym:deleted", ({ id }) => dispatch(gymRemoved(id)));

      // Trainer roster changed (owner or admin added/edited/removed
      // a trainer) — keep both the owner's own profile page and the
      // admin's gym list in sync.
      socket.on("trainers:updated", (payload) => {
        dispatch(trainersUpdated(payload));
        dispatch(gymTrainersUpdated(payload));
      });
    })();

    return () => {
      cancelled = true;
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, dispatch]);
}