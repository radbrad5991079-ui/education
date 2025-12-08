"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ADMIN_EMAILS } from "@/lib/config";
import { motion } from "framer-motion";
import { Mail, Lock, Chrome, Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedInput from "@/components/ui/AnimatedInput";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function WebsiteLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const redirectedRef = useRef(false);

  useEffect(() => {
    // Simulate initial page load
    setTimeout(() => setIsPageLoading(false), 1000);

    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && !redirectedRef.current) {
        redirectedRef.current = true;
        const isAdmin = ADMIN_EMAILS.includes(u.email || "");
        router.replace(isAdmin ? "/websiteadminpage" : "/websiteDashboard");
      }
    });
    return () => unsub();
  }, [router]);

  const loginEmail = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        const isAdmin = ADMIN_EMAILS.includes(cred.user?.email || "");
        router.replace(isAdmin ? "/websiteadminpage" : "/websiteDashboard");
      }
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        const isAdmin = ADMIN_EMAILS.includes(cred.user?.email || "");
        router.replace(isAdmin ? "/websiteadminpage" : "/websiteDashboard");
      }
    } catch (err) {
      setError(err?.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  if (isPageLoading) {
    return <LoadingScreen isLoading={true} message="Welcome to BrainFuel..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating gradient orbs */}
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-pink-600/20 blur-3xl"
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-purple-500/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Login Card */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Glowing border effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-xl opacity-30 animate-pulse" />

        <div className="relative bg-gray-900/80 backdrop-blur-2xl border border-gray-800 rounded-3xl p-8 shadow-2xl">
          {/* Logo and Title */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 mb-4 shadow-lg shadow-purple-500/50"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(168, 85, 247, 0.5)",
                  "0 0 40px rgba(168, 85, 247, 0.7)",
                  "0 0 20px rgba(168, 85, 247, 0.5)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-3xl">🧠</span>
            </motion.div>

            <h1 className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Welcome Back
              </span>
            </h1>
            <p className="text-gray-400">Sign in to continue your learning journey</p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-900/40 backdrop-blur-sm border border-red-700 rounded-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-red-200 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Login Form */}
          
{/*  */}
          {/* Divider */}
          <motion.div
            className="relative my-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            {/* <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900 text-gray-400">Or continue with</span>
            </div> */}
          </motion.div>

          {/* Google Login */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <AnimatedButton
              type="button"
              variant="ghost"
              size="lg"
              onClick={loginGoogle}
              disabled={loading}
              className="w-full btn-transition hover:shadow-[0_0_30px_rgba(236,72,153,0.35)]"
              icon={<Chrome className="w-5 h-5" />}
            >
              Continue with Google
            </AnimatedButton>
          </motion.div>

          {/* Footer Links */}
          <motion.div
            className="mt-8 text-center text-sm text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {/* <p>
              Don't have an account?{" "}
              <a href="/signup" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Sign up
              </a>
            </p> */}
          </motion.div>
        </div>

        {/* Decorative elements */}
        <motion.div
          className="absolute -top-10 -right-10 w-20 h-20"
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Sparkles className="w-full h-full text-purple-500/30" />
        </motion.div>
      </motion.div>
    </div>
  );
}
