"use client";
import { motion } from "framer-motion";
import { componentVariants } from "@/lib/design-system";

/**
 * AnimatedButton Component
 * A highly animated button with multiple variants and hover effects
 * 
 * @param {string} variant - Button style: primary, secondary, ghost, danger, success
 * @param {string} size - Button size: sm, md, lg
 * @param {boolean} isLoading - Show loading state
 * @param {ReactNode} children - Button content
 * @param {ReactNode} icon - Optional icon (left side)
 * @param {Function} onClick - Click handler
 */

export default function AnimatedButton({
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  icon = null,
  className = "",
  ...props
}) {
  // Size configurations
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      className={`
        ${componentVariants.button[variant] || componentVariants.button.primary}
        ${sizeClasses[size]}
        ${className}
        rounded-xl font-semibold
        relative overflow-hidden
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        flex items-center justify-center gap-2
      `}
      // Hover animation
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      // Initial entrance animation
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: "easeOut"
      }}
      disabled={isLoading}
      {...props}
    >
      {/* Shimmer effect overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        whileHover={{ x: "200%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {isLoading ? (
          <motion.div
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <>
            {icon && <span className="w-5 h-5">{icon}</span>}
            {children}
          </>
        )}
      </span>

      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0"
        style={{
          boxShadow: "0 0 20px rgba(167, 139, 250, 0.5)",
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}
