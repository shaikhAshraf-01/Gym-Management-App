import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { loginStart, loginSuccess, loginFailure } from "../redux/slices/authSlice";
import LoginImg from "../assets/loginPage.png";
import {adminLogin, sendOtp, verifyOtp} from "../api/authApi";

 function Login() {
  const [role, setRole] = useState("owner");
  
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleVerifyEmail = async () => {
    if (!email) return;
    setVerifyingEmail(true);
    try {
      await sendOtp( { email, role });
      setIsEmailVerified(true);
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.message || "Failed to send verification code."));
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    try {
      let response;
      if (role === "admin") {
        response = await adminLogin({ mobile, password, rememberMe });
      } else {
        response = await verifyOtp({ email, otp, role, rememberMe });
      }

      dispatch(loginSuccess({ token:response.data.token,
         user: response.data.user, 
         role, }));

      setMobile("");
      setPassword("");
      setEmail("");
      setOtp("");
      setIsEmailVerified(false);

      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate(`/${role}`);
      }
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.message || "Invalid credentials. Please try again."));
    }
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setMobile("");
    setPassword("");
    setEmail("");
    setOtp("");
    setIsEmailVerified(false);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <div className="hidden md:block md:w-[55%] h-full">
        <img src={LoginImg} alt="Login Dashboard Frame" className="w-full h-full object-cover" />
      </div>

      <div className="w-full md:w-[45%] h-full bg-linear-30 from-blue-200 to-purple-300 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome Back</h2>
            <p className="mt-2 text-sm text-slate-500">Please select your role and sign in</p>
          </div>

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
                {role === "admin" ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Email Address</label>
                      <div className="flex mt-1 space-x-2">
                        <input
                          type="email"
                          required
                          disabled={loading || isEmailVerified}
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:bg-slate-100"
                        />
                        <button
                          type="button"
                          disabled={loading || verifyingEmail || !email || isEmailVerified}
                          onClick={handleVerifyEmail}
                          className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:text-slate-500 whitespace-nowrap"
                        >
                          {verifyingEmail ? "Sending..." : isEmailVerified ? "Sent" : "Verify"}
                        </button>
                      </div>
                    </div>

                    {isEmailVerified && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1"
                      >
                        <label className="block text-sm font-medium text-slate-700">Enter OTP</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          disabled={loading}
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="mt-1 block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:bg-slate-100 text-center tracking-widest font-semibold"
                        />
                      </motion.div>
                    )}
                  </>
                )}

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
                  {role === "admin" && (
                    <a href="#" className="text-indigo-600 hover:underline font-medium focus:outline-none">
                      Forgot password?
                    </a>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || (role !== "admin" && !isEmailVerified)}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 capitalize flex items-center justify-center disabled:bg-indigo-400"
                >
                  {loading ? "Authenticating..." : `Sign In as ${role}`}
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
