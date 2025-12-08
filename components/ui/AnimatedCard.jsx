"use client";
import { motion } from "framer-motion";
import { componentVariants } from "@/lib/design-system";

/**
 * AnimatedCard Component
 * A versatile card component with entrance animations and hover effects
 * 
 * @param {string} variant - Card style: default, hover, glow
 * @param {number} delay - Animation delay for stagger effect
 * @param {boolean} enableHoverLift - Enable lift effect on hover
 * @param {ReactNode} children - Card content
 * @param {Function} onClick - Optional click handler
 */

export default function AnimatedCard({
  variant = "hover",
  delay = 0,
  enableHoverLift = true,
  children,
  className = "",
  onClick,
  ...props
}) {
  return (
    <motion.div
      className={`
        ${componentVariants.card[variant] || componentVariants.card.default}
        ${className}
        ${onClick ? 'cursor-pointer' : ''}
      `}
      // Entrance animation
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      // Hover effects
      whileHover={enableHoverLift ? {
        y: -8,
        transition: { duration: 0.3 }
      } : {}}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}
