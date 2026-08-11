import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom"; // Added useNavigate
import { useDispatch, useSelector } from "react-redux";
import TrainerSidebar from "./TrainerSidebar";
import { fetchOwnerProfile } from "../../redux/slices/ownerSlice";
import SubscriptionExpiredOverlay from "../../components/ownerComponents/SubscriptionExpiredOverlay";

// Pages the trainer can still reach once their gym's subscription has
// expired (gym.status === "inactive"). Everything else under /trainer
// shows SubscriptionExpiredOverlay instead of the real page.
const ALLOWED_PATHS_WHEN_INACTIVE = ["/trainer", "/trainer/profile"];

export default function TrainerLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate(); // Hook for programmatic navigation
  
  const gym = useSelector((state) => state.owner.gym);

  // getOwnerProfile (same endpoint/thunk the owner side uses) also
  // serves trainers — it looks the gym up via req.user.gymId for them.
  useEffect(() => {
    if (!gym) {
      dispatch(fetchOwnerProfile());
    }
  }, [dispatch, gym]);

  const isInactive = gym?.status === "inactive";
  const isAllowedPage = ALLOWED_PATHS_WHEN_INACTIVE.includes(location.pathname);
  const showExpiredOverlay = isInactive && !isAllowedPage;

  // Function to pass down to the overlay to return to the trainer dashboard
  const handleReturnToDashboard = () => {
    navigate("/trainer");
  };

  return (
    <div className="flex flex-col md:flex-row bg-gray-200 min-h-screen relative">
      <TrainerSidebar />

      <div className="flex-1 pb-24 md:pb-8 md:ml-64">
        <Outlet />
      </div>

      {/* Covers the whole screen (sidebar included) once the gym is
          inactive and the trainer navigates to a restricted page. */}
      {showExpiredOverlay && (
        <SubscriptionExpiredOverlay 
          gymName={gym?.gymName} 
          onReturn={handleReturnToDashboard} // Passing the handler to the overlay
        />
      )}
    </div>
  );
}
