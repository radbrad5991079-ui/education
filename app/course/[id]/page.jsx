"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Download, Play, Eye, Clock, ChevronDown } from "lucide-react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedCard from "@/components/ui/AnimatedCard";


export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params?.id;
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSections, setOpenSections] = useState(new Set([0])); // Only section 0 (first) open by default
  const [enabledItems, setEnabledItems] = useState(new Set()); // flatIndex keys enabled for download
  const [countdowns, setCountdowns] = useState({}); // flatIndex -> seconds remaining
  // Avoid SSR/CSR mismatch from Math.random() on initial render
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const toggleSection = (index) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const startCountdown = (flatIndex) => {
    if (enabledItems.has(flatIndex)) return;
    setCountdowns((prev) => ({ ...prev, [flatIndex]: 10 }));
    const interval = setInterval(() => {
      setCountdowns((prev) => {
        const current = (prev[flatIndex] ?? 0) - 1;
        const next = { ...prev, [flatIndex]: current };
        if (current <= 0) {
          const newEnabled = new Set(enabledItems);
          newEnabled.add(flatIndex);
          setEnabledItems(newEnabled);
          // cleanup countdown entry
          delete next[flatIndex];
          clearInterval(interval);
        }
        return next;
      });
    }, 1000);
  };

  useEffect(() => {
    const load = async () => {
      if (!courseId) return;
      try {
        setLoading(true);
        const ref = doc(db, "adminContent", String(courseId));
        const snap = await getDoc(ref);
        if (!snap.exists()) { setError("Course not found"); setLoading(false); return; }
        const c = { id: snap.id, ...snap.data() };
        setCourse(c);
        const sc = Array.isArray(c.sectionControl) ? c.sectionControl : [10];
        const fields = Array.isArray(c.fields) ? c.fields : [];
        const res = [];
        let i = 0;
        for (let count of sc) {
          res.push(fields.slice(i, i + count));
          i += count;
        }
        if (i < fields.length) res.push(fields.slice(i));
        setSections(res);
      } catch (e) {
        console.error(e);
        setError("Failed to load course");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const title = course?.courseName || "Course";
  const image = course?.imageUrl || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80";
  const videoUrl = course?.videoUrl || "";

  const youTubeId = useMemo(() => {
    if (!videoUrl) return null;
    try {
      // Accept raw iframe embed markup by extracting src
      const iframeMatch = /<iframe[^>]*src=["']([^"']+)["'][^>]*><\/iframe>/i.exec(videoUrl);
      const candidate = iframeMatch ? iframeMatch[1] : videoUrl;
      // Support common YouTube URL formats
      // - https://youtu.be/<id>
      // - https://www.youtube.com/watch?v=<id>
      // - https://www.youtube.com/embed/<id>
      // - https://www.youtube.com/shorts/<id>
      const url = new URL(candidate);
      const host = url.hostname.replace(/^www\./, "");
      if (host === "youtu.be") {
        const id = url.pathname.slice(1);
        return id ? id.split("/")[0] : null;
      }
      if (host === "youtube.com" || host === "m.youtube.com") {
        if (url.pathname === "/watch") return url.searchParams.get("v");
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts[0] === "embed" && parts[1]) return parts[1];
        if (parts[0] === "shorts" && parts[1]) return parts[1];
      }
      return null;
    } catch {
      return null;
    }
  }, [videoUrl]);

  const youTubeEmbedSrc = useMemo(() => {
    // Build an embeddable src for iframe fallback
    if (!videoUrl) return null;
    try {
      const iframeMatch = /<iframe[^>]*src=["']([^"']+)["'][^>]*><\/iframe>/i.exec(videoUrl);
      const candidate = iframeMatch ? iframeMatch[1] : videoUrl;
      const url = new URL(candidate);
      const host = url.hostname.replace(/^www\./, "");
      if (host === "youtu.be") {
        const id = url.pathname.slice(1).split("/")[0];
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      if (host === "youtube.com" || host === "m.youtube.com") {
        if (url.pathname === "/watch") {
          const id = url.searchParams.get("v");
          if (id) return `https://www.youtube.com/embed/${id}`;
        }
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts[0] === "embed" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
        if (parts[0] === "shorts" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
      }
      // If already a valid https URL and not YouTube, return as-is (some providers)
      if (/^https?:\/\//i.test(candidate)) return candidate;
      return null;
    } catch {
      return null;
    }
  }, [videoUrl]);

  if (loading) return <LoadingScreen isLoading={true} message="Loading course..." />;
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center p-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Oops!</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <AnimatedButton variant="secondary" onClick={() => window.history.back()}>
            Go Back
          </AnimatedButton>
        </motion.div>
      </div>
    );
  }
  if (!course) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Animated Background Elements (client-only to prevent hydration issues) */}
      {mounted && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10"
              style={{
                width: `${Math.random() * 100 + 30}px`,
                height: `${Math.random() * 100 + 30}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Hero Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Back Button */}
            <motion.div className="mb-6" whileHover={{ x: -5 }}>
              <a
                href="/websiteDashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">Back to Dashboard</span>
              </a>
            </motion.div>

            {/* Course Header */}
            <div className="flex flex-col lg:flex-row items-start gap-6">
              {/* Course Image */}
              <motion.div
                className="w-full lg:w-80 rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 shadow-2xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="aspect-video relative group">
                  <img src={image} alt={title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>

              {/* Course Info */}
              <motion.div
                className="flex-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  {title}
                </h1>
                
                {/* Course Stats */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <motion.div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30"
                    whileHover={{ scale: 1.05 }}
                  >
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-semibold text-purple-200">
                      {sections.length} Sections
                    </span>
                  </motion.div>
                  
                  <motion.div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600/20 border border-pink-500/30"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Download className="w-5 h-5 text-pink-400" />
                    <span className="text-sm font-semibold text-pink-200">
                      {sections.reduce((acc, s) => acc + s.length, 0)} Resources
                    </span>
                  </motion.div>

                  {course.visibility === "show" && (
                    <motion.div
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Eye className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-200">Published</span>
                    </motion.div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {/* <AnimatedButton
                    variant="primary"
                    size="lg"
                    icon={<Play className="w-5 h-5" />}
                    onClick={() => {
                      const videoSection = document.getElementById('video-section');
                      if (videoSection) videoSection.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Watch Now
                  </AnimatedButton> */}
                  <AnimatedButton
                    variant="secondary"
                    size="lg"
                    onClick={() => {
                      const sectionsEl = document.getElementById('sections');
                      if (sectionsEl) sectionsEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    View Resources
                  </AnimatedButton>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Embedded YouTube video (if provided) */}
      {(youTubeId || youTubeEmbedSrc) && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12" id="video-section">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Play className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Course Preview
              </h2>
            </div>
            
            <AnimatedCard variant="glow" className="overflow-hidden">
              <div className="aspect-video bg-black relative">
                {/* Prefer native YouTube iframe for maximum compatibility */}
                <iframe
                  width="100%"
                  height="100%"
                  src={youTubeEmbedSrc || (youTubeId ? `https://www.youtube.com/embed/${youTubeId}?rel=0&modestbranding=1&playsinline=1` : undefined)}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="rounded-xl"
                />
              </div>
            </AnimatedCard>
          </motion.div>
        </div>
      )}

      {/* Sections with download buttons */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20" id="sections">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Download className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Course Resources
            </h2>
          </div>

          <div className="space-y-4">
            {sections.map((arr, sIdx) => {
              const isOpen = openSections.has(sIdx);
              
              return (
                <motion.section
                  key={sIdx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + sIdx * 0.1 }}
                >
                  <AnimatedCard variant="glass">
                    {/* Section Header - Always Visible */}
                    <button
                      onClick={() => toggleSection(sIdx)}
                      className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors rounded-t-2xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">{sIdx + 1}</span>
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-bold text-white mb-1">Section {sIdx + 1}</h3>
                          <p className="text-sm text-gray-400">{arr.length} resources available</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <motion.div
                          className="px-4 py-2 rounded-lg bg-purple-600/20 border border-purple-500/30"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="text-sm font-semibold text-purple-300">
                            {arr.filter(v => typeof v === "string" && /^https?:\/\//i.test(v)).length} Downloads
                          </span>
                        </motion.div>

                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="p-2 rounded-lg bg-white/5"
                        >
                          <ChevronDown className="w-6 h-6 text-gray-400" />
                        </motion.div>
                      </div>
                    </button>

                    {/* Section Content - Collapsible */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6">
                            <div className="pt-4 border-t border-white/10 mb-6" />
                            
                            {/* Section Items Grid */}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {arr.map((val, i) => {
                                const flatIndex = sections.slice(0, sIdx).reduce((a, b) => a + b.length, 0) + i;
                                const isLink = typeof val === "string" && /^https?:\/\//i.test(val);
                                const href = isLink ? `/api/secure-redirect?id=${course.id}&i=${flatIndex}` : undefined;
                                const isEnabled = enabledItems.has(flatIndex);
                                const countdown = countdowns[flatIndex];

                                return (
                                  <motion.div
                                    key={i}
                                    className="relative"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                  >
                                    <motion.a
                                      href={isEnabled ? (href || "#") : "#"}
                                      onClick={(e) => {
                                        if (!isLink) { e.preventDefault(); return; }
                                        if (!isEnabled) {
                                          e.preventDefault();
                                          startCountdown(flatIndex);
                                        }
                                      }}
                                      className={`group relative block px-5 py-4 rounded-xl border transition-all overflow-hidden ${
                                        isLink
                                          ? (isEnabled
                                              ? "border-blue-500/50 bg-blue-600/10 hover:bg-blue-600/20 hover:border-blue-400 cursor-pointer shadow-lg shadow-blue-500/20"
                                              : countdown != null
                                                ? "border-orange-500/50 bg-gradient-to-br from-orange-600/10 to-pink-600/10 cursor-wait shadow-lg shadow-orange-500/30"
                                                : "border-purple-500/40 bg-gradient-to-br from-purple-600/10 to-pink-600/10 hover:border-purple-400 cursor-pointer shadow-lg shadow-purple-500/20")
                                          : "border-gray-700 bg-gray-800/30 text-gray-400 cursor-not-allowed"
                                      }`}
                                      whileHover={isLink && (isEnabled || countdown == null) ? { scale: 1.03, y: -4 } : {}}
                                      whileTap={isLink && isEnabled ? { scale: 0.98 } : (isLink && countdown == null ? { scale: 0.95 } : {})}
                                    >
                                      <div className="flex items-start gap-3 relative z-10">
                                        <motion.div 
                                          className={`p-2 rounded-lg ${
                                            isLink 
                                              ? (isEnabled 
                                                  ? "bg-blue-600/30" 
                                                  : countdown != null 
                                                    ? "bg-orange-600/30" 
                                                    : "bg-purple-600/30")
                                              : "bg-gray-700/30"
                                          }`}
                                          animate={countdown != null && !isEnabled ? {
                                            scale: [1, 1.1, 1],
                                            rotate: [0, 5, -5, 0]
                                          } : {}}
                                          transition={{ duration: 0.5, repeat: Infinity }}
                                        >
                                          {isLink ? (
                                            countdown != null && !isEnabled ? (
                                              <Clock className="w-5 h-5 text-orange-300" />
                                            ) : isEnabled ? (
                                              <Download className="w-5 h-5 text-blue-300" />
                                            ) : (
                                              <Download className="w-5 h-5 text-purple-300" />
                                            )
                                          ) : (
                                            <Clock className="w-5 h-5 text-gray-500" />
                                          )}
                                        </motion.div>
                                        <div className="flex-1 min-w-0">
                                          <p className={`font-semibold mb-1 ${isLink ? "text-white" : "text-gray-400"}`}>
                                            {isLink ? `Resource ${i + 1}` : (val || "(empty)")}
                                          </p>
                                          <p className={`text-xs ${
                                            countdown != null && !isEnabled 
                                              ? "text-orange-300 font-semibold" 
                                              : "text-gray-400"
                                          }`}>
                                            {isLink
                                              ? (isEnabled
                                                  ? `Section ${sIdx + 1} • Item ${i + 1}`
                                                  : (countdown != null
                                                      ? `⏳ Unlocking in ${Math.max(0, countdown)}s...`
                                                      : `🔒 Click to unlock (10s)`))
                                              : "Not available"}
                                          </p>
                                        </div>
                                        {isLink && isEnabled && (
                                          <motion.div
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                          >
                                            <ArrowLeft className="w-5 h-5 text-blue-400 rotate-180" />
                                          </motion.div>
                                        )}
                                      </div>

                                      {/* Animated progress bar for countdown (thicker, higher contrast) */}
                                      {isLink && !isEnabled && countdown != null && (
                                        <motion.div
                                          className="absolute bottom-0 left-0 h-1.5 sm:h-2 bg-gradient-to-r from-white/80 via-orange-400 to-amber-500"
                                          initial={{ width: "100%" }}
                                          animate={{ width: `${(countdown / 10) * 100}%` }}
                                          transition={{ duration: 0.5, ease: "linear" }}
                                        />
                                      )}

                                      {/* Hover Glow Effect */}
                                      {isLink && isEnabled && (
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/0 via-blue-600/20 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                      )}

                                      {/* Unlock prompt glow */}
                                      {isLink && !isEnabled && countdown == null && (
                                        <motion.div 
                                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/0 via-purple-600/10 to-pink-600/0 opacity-60 pointer-events-none"
                                          animate={{
                                            opacity: [0.3, 0.6, 0.3]
                                          }}
                                          transition={{ duration: 2, repeat: Infinity }}
                                        />
                                      )}

                                      {/* Countdown overlay with high-contrast, larger timer */}
                                      {isLink && !isEnabled && countdown != null && (
                                        <motion.div 
                                          className="absolute inset-0 rounded-xl bg-black/80 backdrop-blur-sm flex items-center justify-center border border-orange-500/40 ring-1 ring-white/10 shadow-[0_0_40px_rgba(234,88,12,0.25)]"
                                          initial={{ opacity: 0, scale: 0.96 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 1.04 }}
                                        >
                                          <div className="text-center px-4">
                                            <motion.p 
                                              className="text-xs tracking-widest text-orange-300/90 uppercase"
                                              animate={{ opacity: [0.8, 1, 0.8] }}
                                              transition={{ duration: 1.6, repeat: Infinity }}
                                            >
                                              Unlocking
                                            </motion.p>

                                            <motion.div
                                              className="relative inline-block mt-4"
                                              animate={{ rotate: 360 }}
                                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            >
                                              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-orange-500/30 border-t-orange-400" />
                                            </motion.div>

                                            <motion.p 
                                              className="mt-4 text-6xl sm:text-7xl font-extrabold text-white drop-shadow-[0_0_12px_rgba(0,0,0,0.8)] tracking-wide"
                                              key={countdown}
                                              initial={{ scale: 1.15, opacity: 0 }}
                                              animate={{ scale: 1, opacity: 1 }}
                                              transition={{ type: "spring", stiffness: 400, damping: 22 }}
                                            >
                                              {Math.max(0, countdown)}<span className="text-2xl sm:text-3xl align-super ml-1">s</span>
                                            </motion.p>

                                            <p className="mt-2 text-sm sm:text-base text-gray-200/90">Please wait, your download will enable automatically.</p>
                                          </div>
                                        </motion.div>
                                      )}
                                    </motion.a>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </AnimatedCard>
                </motion.section>
              );
            })}
          </div>

          {/* Empty State */}
          {sections.length === 0 && (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-800/50 border border-gray-700 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-gray-500" />
              </div>
              <p className="text-gray-400 text-lg mb-2">No resources available yet</p>
              <p className="text-gray-500 text-sm">Check back later for course materials</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
