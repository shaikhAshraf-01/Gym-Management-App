import LoginForm from "./LoginForm";

// Standalone /login route — same look as before, now just wrapping the
// shared LoginForm component (also used inside the homepage's login modal).
export default function Login() {
  return (
    <div className="flex h-screen w-full justify-center items-center bg-black overflow-hidden p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/20 backdrop-blur-2xl border border-cyan-400/40 shadow-[0_0_30px_rgba(34,211,238,0.3)] flex items-center justify-center p-6 sm:p-10">
        <LoginForm />
      </div>
    </div>
  );
}