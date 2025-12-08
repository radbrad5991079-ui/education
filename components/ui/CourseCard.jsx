"use client";
import { motion } from "framer-motion";
import { Play, Clock, BookOpen } from "lucide-react";

/**
 * CourseCard Component
 * Beautiful course card with hover effects and animations
 * 
 * @param {Object} course - Course data
 * @param {number} delay - Animation delay for stagger effect
 * @param {Function} onClick - Click handler
 */

export default function CourseCard({
  course,
  delay = 0,
  onClick,
  className = "",
}) {
  return (
    <motion.div
      className={`
        group relative bg-gray-900/50 backdrop-blur-xl border border-gray-800 
        rounded-2xl overflow-hidden cursor-pointer
        hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20
        transition-all duration-500
        ${className}
      `}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{ y: -8 }}
      onClick={onClick}
    >
      {/* Course Image */}
      <div className="relative aspect-video overflow-hidden">
        <motion.img
          src={course.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"}
          alt={course.courseName || "Course"}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Play Button Overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          initial={false}
        >
          <motion.div
            className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/50"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </motion.div>
        </motion.div>

        {/* Badge */}
        {course.visibility === "show" && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-600/90 backdrop-blur-sm text-white text-xs font-semibold">
            Available
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
          {course.courseName || "Untitled Course"}
        </h3>

        {/* Course Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
          {course.sectionControl && (
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{course.sectionControl.length} sections</span>
            </div>
          )}
          {course.fields && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.fields.length} lessons</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-purple-400 font-semibold group-hover:text-purple-300 transition-colors">
            View Course →
          </span>
        </motion.div>
      </div>

      {/* Animated Border Effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-purple-500 opacity-0 group-hover:opacity-100"
        initial={false}
        transition={{ duration: 0.3 }}
      />

      {/* Glow Effect */}
      <motion.div
        className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-20 blur-xl -z-10"
        initial={false}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  );
}
