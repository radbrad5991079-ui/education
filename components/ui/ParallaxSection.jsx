"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * ParallaxSection Component
 * Creates a parallax scrolling effect for sections
 * 
 * @param {number} speed - Parallax speed multiplier (0.1 - 1.0)
 * @param {ReactNode} children - Section content
 */

export default function ParallaxSection({
  speed = 0.5,
  children,
  className = "",
  ...props
}) {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.div
      className={className}
      style={{
        transform: `translateY(${offsetY * speed}px)`,
      }}
      transition={{ duration: 0 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
