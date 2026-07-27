import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { loginStart, loginSuccess, loginFailure } from "../redux/slices/authSlice";
import LoginImg from "../assets/loginPage.png";

function Login() {
  const [role, setRole] = useState("owner"); // 'admin' | 'owner' | 'trainer'
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      // Simulated successful authentication request delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      const simulatedUserData = { mobile: mobile, remember: rememberMe };

      // 1. Dispatch profile credentials to central Redux
      dispatch(loginSuccess({ user: simulatedUserData, role: role }));

      // 2. Clear out strings safely
      setMobile("");
      setPassword("");

      // 3. Direct automated routing matching system layouts
      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate(`/${role}`);
      }

    } catch (err) {
      dispatch(loginFailure(err.message || "Invalid credentials. Please try again."));
    }
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setMobile("");
    setPassword("");
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      
      {/* LEFT ASPECT: Decorative Visual Illustration */}
      <div className="hidden md:block md:w-[55%] h-full">
        <img 
          src={LoginImg} 
          alt="Login Dashboard Frame" 
          className="w-full h-full object-cover" 
        />
      </div>

      {/* RIGHT ASPECT: Control Panel Submission Node */}
      <div className="w-full md:w-[45%] h-full bg-linear-30 from-blue-200 to-purple-300 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome Back</h2>
            <p className="mt-2 text-sm text-slate-500">Please select your role and sign in</p>
          </div>

          {/* iOS-Style Role Toggles */}
          <div className="flex bg-slate-200 p-1 rounded-xl relative">
            {["admin", "owner", "trainer"].map((item) => {
              const isActive = role === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleRoleChange(item)}
                  className="flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors duration-200 relative z-10 text-slate-600 data-[active=true]:text-slate-900 data-[active=true]:font-semibold focus:outline-none"
                  data-active={isActive}
                >
                  {item}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg text-center animate-pulse">
              {error}
            </div>
          )}

          {/* Form wrapper bounding animation frame transformations */}
          <div className="relative min-h-[340px]"> 
            <AnimatePresence mode="wait">
              <motion.form
                key={role}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleSubmit}
                className="space-y-5 absolute w-full"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    disabled={loading}
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit mobile number"
                    placeholder="Enter 10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <input
                    type="password"
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:bg-slate-100"
                  />
                </div>

                {/* Restored Complete Checked Node Layer Block */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2 text-slate-600 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      disabled={loading}
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 h-4 w-4" 
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="text-indigo-600 hover:underline font-medium focus:outline-none">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 capitalize flex items-center justify-center disabled:bg-indigo-400"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    `Sign In as ${role}`
                  )}
                </button>
              </motion.form>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;
