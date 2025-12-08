"use client";
import { motion } from "framer-motion";
import { componentVariants } from "@/lib/design-system";
import { useState } from "react";

/**
 * AnimatedInput Component
 * Beautiful input field with focus animations and floating labels
 * 
 * @param {string} label - Input label
 * @param {string} type - Input type
 * @param {string} placeholder - Placeholder text
 * @param {string} variant - Input style: default, glow
 * @param {ReactNode} icon - Optional icon (left side)
 * @param {string} error - Error message to display
 */

export default function AnimatedInput({
  label,
  type = "text",
  placeholder = "",
  variant = "glow",
  icon = null,
  error = "",
  className = "",
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {/* Floating label */}
      {label && (
        <motion.label
          className={`
            absolute left-4 pointer-events-none transition-all duration-300
            ${isFocused || hasValue
              ? '-top-2 text-xs bg-gray-900 px-2 text-purple-400'
              : 'top-3 text-base text-gray-500'
            }
          `}
          initial={false}
          animate={{
            y: isFocused || hasValue ? 0 : 0,
            scale: isFocused || hasValue ? 0.9 : 1,
          }}
        >
          {label}
        </motion.label>
      )}

      {/* Input wrapper for icon support */}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5">
            {icon}
          </div>
        )}

        <motion.input
          type={type}
          placeholder={isFocused ? placeholder : ''}
          className={`
            ${componentVariants.input[variant] || componentVariants.input.default}
            ${icon ? 'pl-12' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''}
            ${className}
            w-full outline-none
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            setHasValue(e.target.value.length > 0);
          }}
          onChange={(e) => setHasValue(e.target.value.length > 0)}
          // Scale animation on focus
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          {...props}
        />

        {/* Focus ring animation */}
        {isFocused && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-purple-500 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>

      {/* Error message */}
      {error && (
        <motion.p
          className="text-red-400 text-sm mt-2 ml-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
