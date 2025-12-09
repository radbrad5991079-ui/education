"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ADMIN_EMAILS } from "@/lib/config";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Save, Trash2, Eye, EyeOff, Image, 
  Video, List, LayoutDashboard, LogOut, Loader2, Link as LinkIcon 
} from "lucide-react";

// --- Components ---

const AnimatedCard = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl ${className}`}
  >
    {children}
  </motion.div>
);

const AnimatedInput = ({ label, value, onChange, type = "text", placeholder, icon }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-300 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors">
        {icon}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full pl-11 pr-4 py-3 bg-gray-900/60 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-600 outline-none transition-all duration-300"
        placeholder={placeholder}
      />
    </div>
  </div>
);

export default function AdminEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id;

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const redirectedRef = useRef(false);

  const [loadingDoc, setLoadingDoc] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [course, setCourse] = useState(null);

  const [courseName, setCourseName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrl2, setImageUrl2] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [visibility, setVisibility] = useState("show");
  const [sectionControlInput, setSectionControlInput] = useState("");
  const [fields, setFields] = useState([""]);
  const [bulkLinks, setBulkLinks] = useState("");
  const [saving, setSaving] = useState(false);

  // Auth Check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setIsLoading(false);
      if (!u && !redirectedRef.current) { 
        redirectedRef.current = true; 
        router.replace("/websiteloginpage"); 
        return; 
      }
      if (u && !ADMIN_EMAILS.includes(u.email || "") && !redirectedRef.current) { 
        redirectedRef.current = true; 
        router.replace("/websiteDashboard"); 
        return; 
      }
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  // Load Course Data
  useEffect(() => {
    const load = async () => {
      if (!courseId) return;
      try {
        setLoadingDoc(true);
        const ref = doc(db, "adminContent", String(courseId));
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("Course not found");
          return;
        }
        const data = snap.data();
        setCourse({ id: snap.id, ...data });
        setCourseName(data.courseName || "");
        setImageUrl(data.imageUrl || "");
        setVisibility(data.visibility || "show");
        setSectionControlInput(Array.isArray(data.sectionControl) ? data.sectionControl.join(",") : "10");
        setFields(Array.isArray(data.fields) && data.fields.length ? data.fields.map((v) => String(v || "")) : [""]);
        setImageUrl2(data.imageUrl2 || "");
        setVideoUrl(data.videoUrl || "");
      } catch (e) {
        console.error("Load course error", e);
        setError("Failed to load course");
      } finally {
        setLoadingDoc(false);
      }
    };
    load();
  }, [courseId]);

  // Logic for Sections
  const sectionCounts = useMemo(() => {
    return String(sectionControlInput)
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0);
  }, [sectionControlInput]);

  const maxFields = useMemo(() => {
    if (!sectionCounts.length) return Infinity;
    return sectionCounts.reduce((sum, n) => sum + n, 0);
  }, [sectionCounts]);

  const sectionsPreview = useMemo(() => {
    if (!Array.isArray(fields) || fields.length === 0) return [];
    const clean = fields.map((f) => String(f ?? ""));
    const out = [];
    let idx = 0;
    for (let c of sectionCounts) {
      const slice = clean
        .slice(idx, Math.min(idx + c, clean.length))
        .map((v, i) => ({ index: idx + i, value: v }));
      out.push(slice);
      idx += c;
    }
    return out;
  }, [fields, sectionCounts]);

  const distributeFromBulk = () => {
    const raw = String(bulkLinks || "");
    const parsed = raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const limit = sectionCounts.length ? sectionCounts.reduce((a, b) => a + b, 0) : parsed.length;
    const trimmed = parsed.slice(0, limit);
    if (trimmed.length === 0) return;
    setFields(trimmed);
  };

  const addField = () => setFields((prev) => [...prev, ""]);
  const updateField = (i, v) => setFields((prev) => prev.map((f, idx) => (idx === i ? v : f)));
  const removeField = (i) => setFields((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      if (!auth.currentUser) {
        setError("You are not signed in. Please login again.");
        return;
      }
      setSaving(true);
      const sectionControl = sectionCounts.length ? sectionCounts : [10];
      const payload = {
        courseName: courseName.trim(),
        imageUrl: imageUrl.trim(),
        imageUrl2: imageUrl2.trim(),
        videoUrl: videoUrl.trim(),
        visibility,
        sectionControl,
        fields: fields.map((f) => String(f || "").trim()),
        updatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, "adminContent", String(courseId)), payload);
      setSuccess("Changes saved successfully!");
      setBulkLinks("");
    } catch (err) {
      console.error("Update error:", err);
      setError(`Failed to save: ${err?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-purple-400">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10"
            style={{
              width: `${Math.random() * 200 + 50}px`,
              height: `${Math.random() * 200 + 50}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 8 + Math.random() * 10,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Modern Navbar */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => router.push("/adminIndexCourses")}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Edit Course
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <motion.a
                href="/websiteDashboard?adminPreview=1"
                className="hidden sm:flex items-center px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </motion.a>
              <motion.button
                onClick={async () => { await signOut(auth); router.replace("/websiteDashboard"); }}
                className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white text-sm transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        
        {/* Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 rounded-xl bg-emerald-900/40 border border-emerald-700 text-emerald-200"
            >
              {success}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 rounded-xl bg-red-900/40 border border-red-700 text-red-200"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {loadingDoc ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
            <p className="text-gray-400">Loading course data...</p>
          </div>
        ) : (
          <AnimatedCard className="p-6 md:p-8">
            <form onSubmit={handleSave} className="space-y-8">
              
              {/* Top Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatedInput 
                  label="Course Name"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  icon={<LinkIcon className="w-5 h-5" />}
                />
                <AnimatedInput 
                  label="Primary Image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  icon={<Image className="w-5 h-5" />}
                />
                <AnimatedInput 
                  label="Secondary Image URL"
                  value={imageUrl2}
                  onChange={(e) => setImageUrl2(e.target.value)}
                  icon={<Image className="w-5 h-5" />}
                />
                <div>
                  <AnimatedInput 
                    label="Video URL (Optional)"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://... or blob:..."
                    icon={<Video className="w-5 h-5" />}
                  />
                  <p className="text-xs text-gray-500 mt-1 ml-1">Replaces 2nd image if provided.</p>
                </div>
              </div>

              {/* Controls Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300 ml-1">Visibility</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                      {visibility === 'show' ? <Eye className="w-5 h-5"/> : <EyeOff className="w-5 h-5"/>}
                    </div>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-900/60 border border-gray-700 rounded-xl focus:border-purple-500 text-white outline-none appearance-none"
                    >
                      <option value="show">Show (Visible)</option>
                      <option value="hide">Hide (Hidden)</option>
                    </select>
                  </div>
                </div>

                <AnimatedInput 
                  label="Section Control (comma-separated)"
                  value={sectionControlInput}
                  onChange={(e) => setSectionControlInput(e.target.value)}
                  placeholder="e.g., 5,5,3"
                  icon={<List className="w-5 h-5" />}
                />
              </div>

              {/* Bulk Links */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300 ml-1">Bulk Links Import</label>
                <div className="relative">
                  <textarea
                    rows={4}
                    value={bulkLinks}
                    onChange={(e) => setBulkLinks(e.target.value)}
                    className="w-full p-4 bg-gray-900/60 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-600 outline-none transition-all"
                    placeholder="Paste multiple links here (comma or newline separated)..."
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <motion.button
                    type="button"
                    onClick={distributeFromBulk}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-lg text-sm font-semibold transition-all"
                  >
                    Distribute Links Into Sections
                  </motion.button>
                  <span className="text-xs text-gray-500">Excess links ignored based on section control.</span>
                </div>
              </div>

              {/* Fields List - FIXED: Uses Textarea + better alignment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                  <List className="w-5 h-5 text-purple-400" />
                  Content Fields
                </h3>
                
                <div className="space-y-3">
                  <AnimatePresence>
                    {fields.map((f, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-start gap-3"
                      >
                        {/* Index Number */}
                        <div className="w-10 h-10 mt-1 rounded-lg bg-gray-800 border border-gray-700 flex flex-shrink-0 items-center justify-center text-sm font-bold text-gray-400 select-none">
                          {idx + 1}
                        </div>
                        
                        {/* Textarea for better text fitting */}
                        <textarea
                          value={f}
                          rows={2}
                          onChange={(e) => updateField(idx, e.target.value)}
                          className="flex-1 px-4 py-3 bg-gray-900/60 border border-gray-700 rounded-xl focus:border-purple-500 text-white placeholder-gray-600 outline-none transition-all resize-y min-h-[50px] text-sm"
                          placeholder="https://video-link or text note"
                        />
                        
                        {/* Delete Button */}
                        <motion.button
                          type="button"
                          onClick={() => removeField(idx)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-3 mt-1 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-xl transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <motion.button
                    type="button"
                    onClick={() => { if (fields.length < maxFields) addField(); }}
                    disabled={fields.length >= maxFields}
                    whileHover={{ scale: fields.length < maxFields ? 1.02 : 1 }}
                    whileTap={{ scale: fields.length < maxFields ? 0.98 : 1 }}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    + Add Field
                  </motion.button>
                  <span className="text-sm text-gray-500">
                    Used: {fields.filter((x) => String(x || "").trim()).length} / {maxFields === Infinity ? '∞' : maxFields}
                  </span>
                </div>
              </div>

              {/* Preview Section */}
              {sectionsPreview.length > 0 && (
                <div className="pt-6 border-t border-gray-800">
                  <h3 className="text-lg font-semibold mb-4 text-gray-300">Live Preview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sectionsPreview.map((arr, sIdx) => {
                      const expected = sectionCounts[sIdx] ?? arr.length;
                      return (
                        <motion.div
                          key={sIdx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: sIdx * 0.1 }}
                          className="rounded-xl border border-gray-700 bg-gray-900/50 overflow-hidden"
                        >
                          <div className="px-4 py-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-gray-700 flex justify-between items-center">
                            <span className="font-medium text-purple-200">Section {sIdx + 1}</span>
                            <span className="text-xs text-gray-400">{arr.length}/{expected}</span>
                          </div>
                          <div className="p-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {arr.map(({ index, value }, i) => (
                              <div key={index} className="flex items-start gap-2">
                                <span className="text-xs font-mono text-gray-500 w-5 mt-1.5">{i + 1}</span>
                                <textarea
                                  rows={1}
                                  value={value}
                                  onChange={(e) => {
                                    const next = [...fields];
                                    next[index] = e.target.value;
                                    setFields(next);
                                  }}
                                  className="flex-1 px-2 py-1 bg-gray-800/50 border border-gray-700 rounded text-xs text-gray-300 focus:text-white outline-none resize-none overflow-hidden"
                                />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sticky Bottom Save Button */}
              <div className="sticky bottom-4 z-20 pt-4">
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save All Changes
                    </>
                  )}
                </motion.button>
              </div>

            </form>
          </AnimatedCard>
        )}
      </div>
    </div>
  );
}
















// "use client";
// import { useEffect, useMemo, useState, useRef } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { auth, db } from "@/lib/firebase";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { ADMIN_EMAILS } from "@/lib/config";
// import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   ArrowLeft, Save, Trash2, Eye, EyeOff, Image, 
//   Video, List, LayoutDashboard, LogOut, Loader2, Link as LinkIcon 
// } from "lucide-react";

// // --- Reusing the Styled Components locally for consistency ---

// const AnimatedCard = ({ children, className = "", delay = 0 }) => (
//   <motion.div
//     initial={{ opacity: 0, y: 20 }}
//     animate={{ opacity: 1, y: 0 }}
//     transition={{ duration: 0.5, delay }}
//     className={`bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl ${className}`}
//   >
//     {children}
//   </motion.div>
// );

// const AnimatedInput = ({ label, value, onChange, type = "text", placeholder, icon }) => (
//   <div className="space-y-2">
//     <label className="text-sm font-medium text-gray-300 ml-1">{label}</label>
//     <div className="relative group">
//       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors">
//         {icon}
//       </div>
//       <input
//         type={type}
//         value={value}
//         onChange={onChange}
//         className="w-full pl-11 pr-4 py-3 bg-gray-900/60 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-600 outline-none transition-all duration-300"
//         placeholder={placeholder}
//       />
//     </div>
//   </div>
// );

// export default function AdminEditPage() {
//   const params = useParams();
//   const router = useRouter();
//   const courseId = params?.id;

//   const [user, setUser] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const redirectedRef = useRef(false);

//   const [loadingDoc, setLoadingDoc] = useState(true);
//   // eslint-disable-next-line no-unused-vars
//   const [course, setCourse] = useState(null);

//   const [courseName, setCourseName] = useState("");
//   const [imageUrl, setImageUrl] = useState("");
//   const [imageUrl2, setImageUrl2] = useState("");
//   const [videoUrl, setVideoUrl] = useState("");
//   const [visibility, setVisibility] = useState("show");
//   const [sectionControlInput, setSectionControlInput] = useState("");
//   const [fields, setFields] = useState([""]);
//   const [bulkLinks, setBulkLinks] = useState("");
//   const [saving, setSaving] = useState(false);

//   // Auth Check
//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (u) => {
//       setIsLoading(false);
//       if (!u && !redirectedRef.current) { 
//         redirectedRef.current = true; 
//         router.replace("/websiteloginpage"); 
//         return; 
//       }
//       if (u && !ADMIN_EMAILS.includes(u.email || "") && !redirectedRef.current) { 
//         redirectedRef.current = true; 
//         router.replace("/websiteDashboard"); 
//         return; 
//       }
//       setUser(u);
//     });
//     return () => unsub();
//   }, [router]);

//   // Load Course Data
//   useEffect(() => {
//     const load = async () => {
//       if (!courseId) return;
//       try {
//         setLoadingDoc(true);
//         const ref = doc(db, "adminContent", String(courseId));
//         const snap = await getDoc(ref);
//         if (!snap.exists()) {
//           setError("Course not found");
//           return;
//         }
//         const data = snap.data();
//         setCourse({ id: snap.id, ...data });
//         setCourseName(data.courseName || "");
//         setImageUrl(data.imageUrl || "");
//         setVisibility(data.visibility || "show");
//         setSectionControlInput(Array.isArray(data.sectionControl) ? data.sectionControl.join(",") : "10");
//         setFields(Array.isArray(data.fields) && data.fields.length ? data.fields.map((v) => String(v || "")) : [""]);
//         setImageUrl2(data.imageUrl2 || "");
//         setVideoUrl(data.videoUrl || "");
//       } catch (e) {
//         console.error("Load course error", e);
//         setError("Failed to load course");
//       } finally {
//         setLoadingDoc(false);
//       }
//     };
//     load();
//   }, [courseId]);

//   // Logic for Sections
//   const sectionCounts = useMemo(() => {
//     return String(sectionControlInput)
//       .split(",")
//       .map((s) => parseInt(s.trim(), 10))
//       .filter((n) => Number.isFinite(n) && n > 0);
//   }, [sectionControlInput]);

//   const maxFields = useMemo(() => {
//     if (!sectionCounts.length) return Infinity;
//     return sectionCounts.reduce((sum, n) => sum + n, 0);
//   }, [sectionCounts]);

//   const sectionsPreview = useMemo(() => {
//     if (!Array.isArray(fields) || fields.length === 0) return [];
//     const clean = fields.map((f) => String(f ?? ""));
//     const out = [];
//     let idx = 0;
//     for (let c of sectionCounts) {
//       const slice = clean
//         .slice(idx, Math.min(idx + c, clean.length))
//         .map((v, i) => ({ index: idx + i, value: v }));
//       out.push(slice);
//       idx += c;
//     }
//     return out;
//   }, [fields, sectionCounts]);

//   const distributeFromBulk = () => {
//     const raw = String(bulkLinks || "");
//     const parsed = raw
//       .split(/[\n,]+/)
//       .map((s) => s.trim())
//       .filter(Boolean);
//     const limit = sectionCounts.length ? sectionCounts.reduce((a, b) => a + b, 0) : parsed.length;
//     const trimmed = parsed.slice(0, limit);
//     if (trimmed.length === 0) return;
//     setFields(trimmed);
//   };

//   const addField = () => setFields((prev) => [...prev, ""]);
//   const updateField = (i, v) => setFields((prev) => prev.map((f, idx) => (idx === i ? v : f)));
//   const removeField = (i) => setFields((prev) => prev.filter((_, idx) => idx !== i));

//   const handleSave = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     try {
//       if (!auth.currentUser) {
//         setError("You are not signed in. Please login again.");
//         return;
//       }
//       setSaving(true);
//       const sectionControl = sectionCounts.length ? sectionCounts : [10];
//       const payload = {
//         courseName: courseName.trim(),
//         imageUrl: imageUrl.trim(),
//         imageUrl2: imageUrl2.trim(),
//         videoUrl: videoUrl.trim(),
//         visibility,
//         sectionControl,
//         fields: fields.map((f) => String(f || "").trim()),
//         updatedAt: serverTimestamp(),
//       };
//       await updateDoc(doc(db, "adminContent", String(courseId)), payload);
//       setSuccess("Changes saved successfully!");
//       setBulkLinks("");
//     } catch (err) {
//       console.error("Update error:", err);
//       setError(`Failed to save: ${err?.message || "Unknown error"}`);
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-black flex items-center justify-center text-purple-400">
//         <Loader2 className="w-10 h-10 animate-spin" />
//       </div>
//     );
//   }
//   if (!user) return null;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
//       {/* Animated Background */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         {[...Array(15)].map((_, i) => (
//           <motion.div
//             key={i}
//             className="absolute rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10"
//             style={{
//               width: `${Math.random() * 200 + 50}px`,
//               height: `${Math.random() * 200 + 50}px`,
//               top: `${Math.random() * 100}%`,
//               left: `${Math.random() * 100}%`,
//             }}
//             animate={{
//               y: [0, -40, 0],
//               opacity: [0.1, 0.3, 0.1],
//             }}
//             transition={{
//               duration: 8 + Math.random() * 10,
//               repeat: Infinity,
//             }}
//           />
//         ))}
//       </div>

//       {/* Modern Navbar */}
//       <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center gap-4">
//               <motion.button
//                 onClick={() => router.push("/adminIndexCourses")}
//                 className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <ArrowLeft className="w-5 h-5" />
//               </motion.button>
//               <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
//                 Edit Course
//               </h1>
//             </div>

//             <div className="flex items-center gap-3">
//               <motion.a
//                 href="/websiteDashboard?adminPreview=1"
//                 className="hidden sm:flex items-center px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <LayoutDashboard className="w-4 h-4 mr-2" />
//                 Dashboard
//               </motion.a>
//               <motion.button
//                 onClick={async () => { await signOut(auth); router.replace("/websiteDashboard"); }}
//                 className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white text-sm transition-all"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <LogOut className="w-4 h-4" />
//               </motion.button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        
//         {/* Messages */}
//         <AnimatePresence>
//           {success && (
//             <motion.div
//               initial={{ opacity: 0, y: -20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="mb-6 p-4 rounded-xl bg-emerald-900/40 border border-emerald-700 text-emerald-200"
//             >
//               {success}
//             </motion.div>
//           )}
//           {error && (
//             <motion.div
//               initial={{ opacity: 0, y: -20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="mb-6 p-4 rounded-xl bg-red-900/40 border border-red-700 text-red-200"
//             >
//               {error}
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {loadingDoc ? (
//           <div className="flex flex-col items-center justify-center h-64">
//             <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
//             <p className="text-gray-400">Loading course data...</p>
//           </div>
//         ) : (
//           <AnimatedCard className="p-6 md:p-8">
//             <form onSubmit={handleSave} className="space-y-8">
              
//               {/* Top Section */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <AnimatedInput 
//                   label="Course Name"
//                   value={courseName}
//                   onChange={(e) => setCourseName(e.target.value)}
//                   icon={<LinkIcon className="w-5 h-5" />}
//                 />
//                 <AnimatedInput 
//                   label="Primary Image URL"
//                   value={imageUrl}
//                   onChange={(e) => setImageUrl(e.target.value)}
//                   icon={<Image className="w-5 h-5" />}
//                 />
//                 <AnimatedInput 
//                   label="Secondary Image URL"
//                   value={imageUrl2}
//                   onChange={(e) => setImageUrl2(e.target.value)}
//                   icon={<Image className="w-5 h-5" />}
//                 />
//                 <div>
//                   <AnimatedInput 
//                     label="Video URL (Optional)"
//                     value={videoUrl}
//                     onChange={(e) => setVideoUrl(e.target.value)}
//                     placeholder="https://... or blob:..."
//                     icon={<Video className="w-5 h-5" />}
//                   />
//                   <p className="text-xs text-gray-500 mt-1 ml-1">Replaces 2nd image if provided.</p>
//                 </div>
//               </div>

//               {/* Controls Section */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
//                 <div>
//                   <label className="block text-sm font-medium mb-2 text-gray-300 ml-1">Visibility</label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
//                       {visibility === 'show' ? <Eye className="w-5 h-5"/> : <EyeOff className="w-5 h-5"/>}
//                     </div>
//                     <select
//                       value={visibility}
//                       onChange={(e) => setVisibility(e.target.value)}
//                       className="w-full pl-11 pr-4 py-3 bg-gray-900/60 border border-gray-700 rounded-xl focus:border-purple-500 text-white outline-none appearance-none"
//                     >
//                       <option value="show">Show (Visible)</option>
//                       <option value="hide">Hide (Hidden)</option>
//                     </select>
//                   </div>
//                 </div>

//                 <AnimatedInput 
//                   label="Section Control (comma-separated)"
//                   value={sectionControlInput}
//                   onChange={(e) => setSectionControlInput(e.target.value)}
//                   placeholder="e.g., 5,5,3"
//                   icon={<List className="w-5 h-5" />}
//                 />
//               </div>

//               {/* Bulk Links */}
//               <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
//                 <label className="block text-sm font-medium mb-3 text-gray-300">Bulk Links (comma or newline separated)</label>
//                 <textarea
//                   rows={4}
//                   value={bulkLinks}
//                   onChange={(e) => setBulkLinks(e.target.value)}
//                   className="w-full p-4 bg-gray-900/60 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-500 outline-none transition-all"
//                   placeholder="https://link1, https://link2&#10;https://link3"
//                 />
//                 <div className="mt-3 flex items-center justify-between">
//                   <motion.button
//                     type="button"
//                     onClick={distributeFromBulk}
//                     whileHover={{ scale: 1.02 }}
//                     whileTap={{ scale: 0.98 }}
//                     className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 rounded-lg text-sm font-semibold transition-all"
//                   >
//                     Distribute Links Into Sections
//                   </motion.button>
//                   <span className="text-xs text-gray-400">Excess links beyond section sizes are ignored.</span>
//                 </div>
//               </div>

//               {/* Fields List */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
//                   <List className="w-5 h-5 text-purple-400" />
//                   Content Fields
//                 </h3>
                
//                 <div className="space-y-3">
//                   <AnimatePresence>
//                     {fields.map((f, idx) => (
//                       <motion.div
//                         key={idx}
//                         initial={{ opacity: 0, x: -10 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         exit={{ opacity: 0, scale: 0.95 }}
//                         className="flex items-center gap-3"
//                       >
//                         <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-sm font-bold text-gray-400">
//                           {idx + 1}
//                         </div>
//                         <input
//                           type="text"
//                           value={f}
//                           onChange={(e) => updateField(idx, e.target.value)}
//                           className="flex-1 px-4 py-3 bg-gray-900/60 border border-gray-700 rounded-xl focus:border-purple-500 text-white placeholder-gray-600 outline-none transition-all"
//                           placeholder="https://video-link or text note"
//                         />
//                         <motion.button
//                           type="button"
//                           onClick={() => removeField(idx)}
//                           whileHover={{ scale: 1.1 }}
//                           whileTap={{ scale: 0.9 }}
//                           className="p-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-xl transition-colors"
//                         >
//                           <Trash2 className="w-5 h-5" />
//                         </motion.button>
//                       </motion.div>
//                     ))}
//                   </AnimatePresence>
//                 </div>

//                 <div className="flex items-center justify-between pt-2">
//                   <motion.button
//                     type="button"
//                     onClick={() => { if (fields.length < maxFields) addField(); }}
//                     disabled={fields.length >= maxFields}
//                     whileHover={{ scale: fields.length < maxFields ? 1.02 : 1 }}
//                     whileTap={{ scale: fields.length < maxFields ? 0.98 : 1 }}
//                     className="px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
//                   >
//                     + Add Field
//                   </motion.button>
//                   <span className="text-sm text-gray-500">
//                     Used: {fields.filter((x) => String(x || "").trim()).length} / {maxFields === Infinity ? '∞' : maxFields}
//                   </span>
//                 </div>
//               </div>

//               {/* Preview Section */}
//               {sectionsPreview.length > 0 && (
//                 <div className="pt-6 border-t border-gray-800">
//                   <h3 className="text-lg font-semibold mb-4 text-gray-300">Live Preview</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {sectionsPreview.map((arr, sIdx) => {
//                       const expected = sectionCounts[sIdx] ?? arr.length;
//                       return (
//                         <motion.div
//                           key={sIdx}
//                           initial={{ opacity: 0, scale: 0.95 }}
//                           animate={{ opacity: 1, scale: 1 }}
//                           transition={{ delay: sIdx * 0.1 }}
//                           className="rounded-xl border border-gray-700 bg-gray-900/50 overflow-hidden"
//                         >
//                           <div className="px-4 py-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-gray-700 flex justify-between items-center">
//                             <span className="font-medium text-purple-200">Section {sIdx + 1}</span>
//                             <span className="text-xs text-gray-400">{arr.length}/{expected}</span>
//                           </div>
//                           <div className="p-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
//                             {arr.map(({ index, value }, i) => (
//                               <div key={index} className="flex items-center gap-2">
//                                 <span className="text-xs font-mono text-gray-500 w-5">{i + 1}</span>
//                                 <input
//                                   type="text"
//                                   value={value}
//                                   onChange={(e) => {
//                                     const next = [...fields];
//                                     next[index] = e.target.value;
//                                     setFields(next);
//                                   }}
//                                   className="flex-1 px-2 py-1 bg-gray-800/50 border border-gray-700 rounded text-xs text-gray-300 focus:text-white outline-none"
//                                 />
//                               </div>
//                             ))}
//                           </div>
//                         </motion.div>
//                       );
//                     })}
//                   </div>
//                 </div>
//               )}

//               {/* Sticky Bottom Save Button */}
//               <div className="sticky bottom-4 z-20 pt-4">
//                 <motion.button
//                   type="submit"
//                   disabled={saving}
//                   whileHover={{ scale: 1.02 }}
//                   whileTap={{ scale: 0.98 }}
//                   className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
//                 >
//                   {saving ? (
//                     <>
//                       <Loader2 className="w-5 h-5 animate-spin" />
//                       Saving Changes...
//                     </>
//                   ) : (
//                     <>
//                       <Save className="w-5 h-5" />
//                       Save All Changes
//                     </>
//                   )}
//                 </motion.button>
//               </div>

//             </form>
//           </AnimatedCard>
//         )}
//       </div>
//     </div>
//   );
// }













// "use client";
// import { useEffect, useMemo, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { auth, db } from "@/lib/firebase";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { ADMIN_EMAILS } from "@/lib/config";
// import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// export default function AdminEditPage() {
//   const params = useParams();
//   const router = useRouter();
//   const courseId = params?.id;

//   const [user, setUser] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const [loadingDoc, setLoadingDoc] = useState(true);
//   const [course, setCourse] = useState(null);

//   const [courseName, setCourseName] = useState("");
//   const [imageUrl, setImageUrl] = useState("");
//   const [imageUrl2, setImageUrl2] = useState("");
//   const [videoUrl, setVideoUrl] = useState("");
//   const [visibility, setVisibility] = useState("show");
//   const [sectionControlInput, setSectionControlInput] = useState("");
//   const [fields, setFields] = useState([""]);
//   const [bulkLinks, setBulkLinks] = useState("");
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (u) => {
//       setIsLoading(false);
//       if (!u) {
//         router.replace("/websiteloginpage");
//         return;
//       }
//       if (!ADMIN_EMAILS.includes(u.email || "")) {
//         router.replace("/websiteDashboard");
//         return;
//       }
//       setUser(u);
//     });
//     return () => unsub();
//   }, [router]);

//   useEffect(() => {
//     const load = async () => {
//       if (!courseId) return;
//       try {
//         setLoadingDoc(true);
//         const ref = doc(db, "adminContent", String(courseId));
//         const snap = await getDoc(ref);
//         if (!snap.exists()) {
//           setError("Course not found");
//           return;
//         }
//         const data = snap.data();
//         setCourse({ id: snap.id, ...data });
//         setCourseName(data.courseName || "");
//         setImageUrl(data.imageUrl || "");
//         setVisibility(data.visibility || "show");
//         setSectionControlInput(Array.isArray(data.sectionControl) ? data.sectionControl.join(",") : "10");
//         setFields(Array.isArray(data.fields) && data.fields.length ? data.fields.map((v) => String(v || "")) : [""]);
//         setImageUrl2(data.imageUrl2 || "");
//         setVideoUrl(data.videoUrl || "");
//       } catch (e) {
//         console.error("Load course error", e);
//         setError("Failed to load course");
//       } finally {
//         setLoadingDoc(false);
//       }
//     };
//     load();
//   }, [courseId]);

//   const sectionCounts = useMemo(() => {
//     return String(sectionControlInput)
//       .split(",")
//       .map((s) => parseInt(s.trim(), 10))
//       .filter((n) => Number.isFinite(n) && n > 0);
//   }, [sectionControlInput]);

//   const maxFields = useMemo(() => {
//     if (!sectionCounts.length) return Infinity;
//     return sectionCounts.reduce((sum, n) => sum + n, 0);
//   }, [sectionCounts]);

//   const sectionsPreview = useMemo(() => {
//     if (!Array.isArray(fields) || fields.length === 0) return [];
//     const clean = fields.map((f) => String(f ?? ""));
//     const out = [];
//     let idx = 0;
//     for (let c of sectionCounts) {
//       const slice = clean
//         .slice(idx, Math.min(idx + c, clean.length))
//         .map((v, i) => ({ index: idx + i, value: v }));
//       out.push(slice);
//       idx += c;
//     }
//     return out;
//   }, [fields, sectionCounts]);

//   const distributeFromBulk = () => {
//     const raw = String(bulkLinks || "");
//     const parsed = raw
//       .split(/[\n,]+/)
//       .map((s) => s.trim())
//       .filter(Boolean);
//     const limit = sectionCounts.length ? sectionCounts.reduce((a, b) => a + b, 0) : parsed.length;
//     const trimmed = parsed.slice(0, limit);
//     if (trimmed.length === 0) return;
//     setFields(trimmed);
//   };

//   const addField = () => setFields((prev) => [...prev, ""]);
//   const updateField = (i, v) => setFields((prev) => prev.map((f, idx) => (idx === i ? v : f)));
//   const removeField = (i) => setFields((prev) => prev.filter((_, idx) => idx !== i));

//   const handleSave = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     try {
//       if (!auth.currentUser) {
//         setError("You are not signed in. Please login again.");
//         return;
//       }
//       setSaving(true);
//       const sectionControl = sectionCounts.length ? sectionCounts : [10];
//       const payload = {
//         courseName: courseName.trim(),
//         imageUrl: imageUrl.trim(),
//         imageUrl2: imageUrl2.trim(),
//         videoUrl: videoUrl.trim(),
//         visibility,
//         sectionControl,
//         fields: fields.map((f) => String(f || "").trim()),
//         updatedAt: serverTimestamp(),
//       };
//       await updateDoc(doc(db, "adminContent", String(courseId)), payload);
//       setSuccess("Changes saved");
//       setBulkLinks("");
//     } catch (err) {
//       console.error("Update error:", err);
//       setError(`Failed to save: ${err?.message || "Unknown error"}`);
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (isLoading) {
//     return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
//   }
//   if (!user) return null;

//   return (
//     <div className="min-h-screen bg-gray-950 text-white">
//       <nav className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur border-b border-gray-800">
//         <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <a href="/adminIndexCourses" className="text-lg font-semibold">Back to Courses</a>
//             <a href="/websiteDashboard?adminPreview=1" className="text-sm px-2 py-1 rounded bg-gray-800 border border-gray-700">Dashboard</a>
//           </div>
//           <div className="flex items-center gap-2">
//             <span className="hidden sm:inline text-xs text-gray-400">{user.email}</span>
//             <button
//               onClick={async () => { await signOut(auth); router.replace("/websiteDashboard"); }}
//               className="px-3 py-1.5 text-sm bg-red-700 rounded border border-red-600"
//             >Logout</button>
//           </div>
//         </div>
//       </nav>

//       <div className="max-w-4xl mx-auto p-4">
//         <h1 className="text-2xl font-bold mb-4">Edit Course</h1>

//         {success && (
//           <div className="bg-green-900/40 border border-green-700 p-3 rounded mb-4">{success}</div>
//         )}
//         {error && (
//           <div className="bg-red-900/40 border border-red-700 p-3 rounded mb-4">{error}</div>
//         )}

//         {loadingDoc ? (
//           <div className="text-sm text-gray-400">Loading course…</div>
//         ) : !course ? (
//           <div className="text-sm text-red-300">No course data.</div>
//         ) : (
//           <form onSubmit={handleSave} className="space-y-4 bg-gray-900/50 border border-gray-800 rounded p-4">
//             <div className="grid sm:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm mb-1">Course Name</label>
//                 <input
//                   type="text"
//                   value={courseName}
//                   onChange={(e) => setCourseName(e.target.value)}
//                   className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm mb-1">Image URL</label>
//                 <input
//                   type="text"
//                   value={imageUrl}
//                   onChange={(e) => setImageUrl(e.target.value)}
//                   className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm mb-1">Second Image URL</label>
//                 <input
//                   type="text"
//                   value={imageUrl2}
//                   onChange={(e) => setImageUrl2(e.target.value)}
//                   className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm mb-1">Video URL (optional)</label>
//                 <input
//                   type="text"
//                   value={videoUrl}
//                   onChange={(e) => setVideoUrl(e.target.value)}
//                   className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
//                   placeholder="https://... or blob:https://..."
//                 />
//                 <p className="text-xs text-gray-400 mt-1">If provided, dashboard renders a video instead of the 2nd image.</p>
//               </div>
//             </div>

//             <div className="grid sm:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm mb-1">Visibility</label>
//                 <select
//                   value={visibility}
//                   onChange={(e) => setVisibility(e.target.value)}
//                   className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
//                 >
//                   <option value="show">show</option>
//                   <option value="hide">hide</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm mb-1">Section Control (comma-separated)</label>
//                 <input
//                   type="text"
//                   value={sectionControlInput}
//                   onChange={(e) => setSectionControlInput(e.target.value)}
//                   className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
//                   placeholder="e.g., 5,5,3"
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm mb-1">Bulk Links (comma or newline separated)</label>
//               <textarea
//                 rows={4}
//                 value={bulkLinks}
//                 onChange={(e) => setBulkLinks(e.target.value)}
//                 className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
//                 placeholder="https://link1, https://link2\nhttps://link3"
//               />
//               <div className="mt-2 flex items-center justify-between">
//                 <button type="button" onClick={distributeFromBulk} className="px-3 py-2 bg-purple-700/50 border border-purple-600 rounded">Distribute Links Into Sections</button>
//                 <span className="text-xs text-gray-400">Excess links beyond section sizes are ignored.</span>
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm mb-2">Fields</label>
//               <div className="space-y-2">
//                 {fields.map((f, idx) => (
//                   <div key={idx} className="flex items-center gap-2">
//                     <span className="min-w-[36px] h-9 px-2 rounded bg-gray-700/70 border border-gray-600 text-gray-200 flex items-center justify-center text-sm font-semibold">
//                       {idx + 1}
//                     </span>
//                     <input
//                       type="text"
//                       value={f}
//                       onChange={(e) => updateField(idx, e.target.value)}
//                       className="flex-1 px-3 py-2 rounded bg-gray-800 border border-gray-700"
//                       placeholder="https://video-link or note"
//                     />
//                     <button type="button" onClick={() => removeField(idx)} className="px-3 py-2 bg-red-700 rounded">Remove</button>
//                   </div>
//                 ))}
//                 <div className="flex items-center justify-between">
//                   <button
//                     type="button"
//                     onClick={() => { if (fields.length < maxFields) addField(); }}
//                     className="px-3 py-2 bg-gray-700 rounded disabled:opacity-50"
//                     disabled={fields.length >= maxFields}
//                   >+ Add Field</button>
//                   <span className="text-xs text-gray-300">Total fields: {fields.filter((x) => String(x || "").trim()).length}</span>
//                 </div>
//               </div>
//             </div>

//             <div>
//               <h3 className="text-sm font-semibold mb-2 text-gray-200">Section Preview</h3>
//               <div className="grid gap-3 sm:grid-cols-2">
//                 {sectionsPreview.map((arr, sIdx) => {
//                   const expected = sectionCounts[sIdx] ?? arr.length;
//                   return (
//                     <div key={sIdx} className="rounded-lg border border-gray-700 bg-gray-900/50">
//                       <div className="px-3 py-2 flex items-center justify-between border-b border-gray-700">
//                         <span className="text-sm font-semibold text-white">Section {sIdx + 1}</span>
//                         <span className="text-xs text-gray-300">{arr.length}/{expected} items</span>
//                       </div>
//                       <ul className="p-3 space-y-1.5">
//                         {arr.map(({ index, value }, i) => (
//                           <li key={index} className="text-xs text-gray-200 flex items-center gap-2">
//                             <span className="w-6 h-6 rounded bg-gray-700/70 border border-gray-600 flex items-center justify-center text-[11px] font-semibold">{i + 1}</span>
//                             <input
//                               type="text"
//                               className="flex-1 px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs"
//                               value={value}
//                               onChange={(e) => {
//                                 const next = [...fields];
//                                 next[index] = e.target.value;
//                                 setFields(next);
//                               }}
//                               placeholder="Edit here"
//                             />
//                           </li>
//                         ))}
//                       </ul>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>

//             <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50">
//               {saving ? "Saving..." : "Save Changes"}
//             </button>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }
