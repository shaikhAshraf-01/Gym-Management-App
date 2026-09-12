import React, { useEffect } from "react"; 
import { Outlet, useLocation, useNavigate } from "react-router-dom"; 
import { useDispatch, useSelector } from "react-redux"; 
import OwnerSidebar from "./OwnerSidebar"; 
import { fetchOwnerProfile } from "../../redux/slices/ownerSlice"; 
import SubscriptionExpiredOverlay from "../../components/ownerComponents/SubscriptionExpiredOverlay"; 

const ALLOWED_PATHS_WHEN_INACTIVE = ["/owner", "/owner/profile"]; 

export default function OwnerLayout() { 
  const dispatch = useDispatch(); 
  const location = useLocation(); 
  const navigate = useNavigate(); // Added for handling programmatic redirection
  
  const gym = useSelector((state) => state.owner.gym); 

  useEffect(() => { 
    if (!gym) { 
      dispatch(fetchOwnerProfile()); 
    } 
  }, [dispatch, gym]); 

  const isInactive = gym?.status === "inactive"; 
  const isAllowedPage = ALLOWED_PATHS_WHEN_INACTIVE.includes(location.pathname); 
  const showExpiredOverlay = isInactive && !isAllowedPage; 

  // Function to safely pass down to the overlay to allow returning to the dashboard
  const handleReturnToDashboard = () => {
    navigate("/owner");
  };

  return ( 
    <div className="flex min-h-[100dvh] flex-col bg-slate-50 dark:bg-slate-950 relative md:flex-row"> 
      {/* Sidebar remains interactive or visually present in the background */}
      <OwnerSidebar /> 

      <div className="min-h-[100dvh] min-w-0 flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))] md:ml-64 md:pb-8"> 
        <Outlet /> 
      </div> 

      {/* Pass the redirect handler to your overlay component */}
      {showExpiredOverlay && ( 
        <SubscriptionExpiredOverlay 
          gymName={gym?.gymName} 
          onReturn={handleReturnToDashboard} 
        /> 
      )} 
    </div> 
  ); 
}