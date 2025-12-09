"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * LoadingScreen Component
 * Premium full-screen loading animation with progress indicator
 */
export default function LoadingScreen({ isLoading = true, message = "Preparing Experience..." }) {
  const [progress, setProgress] = useState(0);
  const [shouldRender, setShouldRender] = useState(isLoading);

  // Handle mounting/unmounting for smooth fade-out
  useEffect(() => {
    if (isLoading) {
      setShouldRender(true);
      setProgress(0);
    } else {
      setProgress(100);
      // Wait for the fade-out animation (0.8s) before unmounting
      const timer = setTimeout(() => setShouldRender(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Simulate progress
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Stall at 90%
        // Slower increment as it gets higher for realism
        const increment = Math.max(0.5, (90 - prev) / 20); 
        return prev + increment;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-gray-950 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoading ? 1 : 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Background Ambience - Deep Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-purple-950/20" />
      
      {/* Ambient Glow Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        
        {/* Animated Logo/Spinner Container */}
        <div className="relative mb-8">
          {/* Glowing Backdrop for Spinner */}
          <motion.div
            className="absolute inset-0 bg-purple-500 blur-xl rounded-full opacity-20"
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Main Spinner Ring */}
          <motion.div
            className="w-16 h-16 rounded-full border-4 border-gray-800 border-t-purple-500 border-r-purple-500/50"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Inner Static Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white/80" />
          </div>
        </div>

        {/* Loading Message */}
        <motion.h3
          className="text-white text-lg font-medium tracking-wide mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.h3>

        {/* Progress Bar Container */}
        <div className="w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden shadow-inner relative">
          {/* Moving Gradient Bar */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
          />
          
          {/* Shimmer Effect over Bar */}
          <motion.div 
            className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: [-200, 200] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Percentage Indicator */}
        <div className="mt-3 flex justify-between w-64 text-xs font-mono">
          <span className="text-gray-500">Processing</span>
          <span className="text-purple-400 font-bold">{Math.round(progress)}%</span>
        </div>

      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-purple-500/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}











// "use client";
// import { motion } from "framer-motion";
// import { useEffect, useState } from "react";

// /**
//  * LoadingScreen Component
//  * Full-screen loading animation with progress indicator
//  * 
//  * @param {boolean} isLoading - Control loading state
//  * @param {string} message - Optional loading message
//  */

// export default function LoadingScreen({ isLoading = true, message = "Loading..." }) {
//   const [progress, setProgress] = useState(0);

//   useEffect(() => {
//     if (!isLoading) return;

//     // Simulate loading progress
//     const interval = setInterval(() => {
//       setProgress((prev) => {
//         if (prev >= 90) return prev;
//         return prev + Math.random() * 10;
//       });
//     }, 200);

//     return () => clearInterval(interval);
//   }, [isLoading]);

//   useEffect(() => {
//     if (!isLoading) {
//       setProgress(100);
//     }
//   }, [isLoading]);

//   if (!isLoading && progress >= 100) return null;

//   return (
//     <motion.div
//       className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center"
//       initial={{ opacity: 1 }}
//       animate={{ opacity: isLoading ? 1 : 0 }}
//       transition={{ duration: 0.5 }}
//     >
//       <div className="relative">
//         {/* Animated logo/spinner */}
//         <motion.div
//           className="w-20 h-20 rounded-full border-4 border-purple-500/30 border-t-purple-500 mb-8"
//           animate={{ rotate: 360 }}
//           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//         />

//         {/* Loading text */}
//         <motion.p
//           className="text-white text-center font-semibold mb-4"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.2 }}
//         >
//           {message}
//         </motion.p>

//         {/* Progress bar */}
//         <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
//           <motion.div
//             className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
//             initial={{ width: 0 }}
//             animate={{ width: `${progress}%` }}
//             transition={{ duration: 0.3 }}
//           />
//         </div>

//         {/* Percentage */}
//         <motion.p
//           className="text-gray-400 text-center text-sm mt-2"
//           animate={{ opacity: [0.5, 1, 0.5] }}
//           transition={{ duration: 2, repeat: Infinity }}
//         >
//           {Math.round(progress)}%
//         </motion.p>

//         {/* Floating particles */}
//         <div className="absolute inset-0 pointer-events-none">
//           {[...Array(6)].map((_, i) => (
//             <motion.div
//               key={i}
//               className="absolute w-2 h-2 rounded-full bg-purple-500/50"
//               style={{
//                 left: `${Math.random() * 100}%`,
//                 top: `${Math.random() * 100}%`,
//               }}
//               animate={{
//                 y: [-20, 20],
//                 opacity: [0.2, 1, 0.2],
//               }}
//               transition={{
//                 duration: 2 + Math.random() * 2,
//                 repeat: Infinity,
//                 delay: Math.random() * 2,
//               }}
//             />
//           ))}
//         </div>
//       </div>
//     </motion.div>
//   );
// }
