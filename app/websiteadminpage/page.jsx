"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ADMIN_EMAILS } from "@/lib/config";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Save, Trash2, Eye, EyeOff, Edit2, Image, Video, List, Settings, LogOut, Home, BookOpen } from "lucide-react";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedInput from "@/components/ui/AnimatedInput";
import AnimatedCard from "@/components/ui/AnimatedCard";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function WebsiteAdminPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const redirectedRef = useRef(false);

  // Simple admin gate + redirect if not admin
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setIsLoading(false);
      if (!u && !redirectedRef.current) { redirectedRef.current = true; router.replace("/websiteloginpage"); return; }
      const isAdmin = ADMIN_EMAILS.includes(u?.email || "");
      if (u && !isAdmin && !redirectedRef.current) { redirectedRef.current = true; router.replace("/websiteDashboard"); return; }
      setUser(u || null);
    });
    return () => unsub();
  }, [router]);

  // Subscribe to courses list (latest first) after admin user is set
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "adminContent"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setCourses(list);
    });
    return () => unsub();
  }, [user]);

  const [courseName, setCourseName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrl2, setImageUrl2] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [visibility, setVisibility] = useState("show");
  const [sectionControlInput, setSectionControlInput] = useState("10");
  const [fields, setFields] = useState([""]);
  const [bulkLinks, setBulkLinks] = useState("");
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const addField = () => setFields((prev) => [...prev, ""]);
  const updateField = (i, v) => setFields((prev) => prev.map((f, idx) => (idx === i ? v : f)));
  const removeField = (i) => setFields((prev) => prev.filter((_, idx) => idx !== i));

  // Parse section counts and build a live preview of how fields will be grouped
  const sectionCounts = useMemo(() => {
    return sectionControlInput
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
      const slice = clean.slice(idx, Math.min(idx + c, clean.length)).map((v, i) => ({ index: idx + i, value: v }));
      out.push(slice);
      idx += c;
    }
    // Do not create extra containers beyond section control
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

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const sectionControl = sectionControlInput
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0);

    const cleanFields = fields.map((f) => String(f || "").trim());

    if (!courseName.trim()) {
      setError("Course name is required");
      return;
    }
    // All fields optional: no minimum required

    try {
      if (!auth.currentUser) {
        setError("You are not signed in. Please login again.");
        return;
      }
      setSaving(true);
      const docRef = await addDoc(collection(db, "adminContent"), {
        courseName: courseName.trim(),
        imageUrl: imageUrl.trim(),
        imageUrl2: imageUrl2.trim(),
        videoUrl: videoUrl.trim(),
        visibility,
        sectionControl: sectionControl.length ? sectionControl : [10],
        fields: cleanFields,
        createdAt: serverTimestamp(),
        createdBy: user?.uid || "unknown",
      });
      setSuccess(`Course created successfully (ID: ${docRef.id})`);
      setCourseName("");
      setImageUrl("");
      setImageUrl2("");
      setVideoUrl("");
      setVisibility("show");
      setSectionControlInput("10");
      setFields([""]);
    } catch (err) {
      console.error("Create course error:", err);
      const code = err?.code ? ` [${err.code}]` : "";
      const msg = err?.message || "Unknown error";
      setError(`Failed to create course${code}: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (course) => {
    try {
      setError("");
      setSuccess("");
      const next = course.visibility === "show" ? "hide" : "show";
      await updateDoc(doc(db, "adminContent", course.id), {
        visibility: next,
        updatedAt: serverTimestamp(),
      });
      setSuccess(`Visibility updated to ${next}`);
    } catch (err) {
      console.error("Toggle visibility error:", err);
      setError(`Failed to update visibility: ${err?.message || "Unknown error"}`);
    }
  };

  const quickRename = async (course) => {
    const name = prompt("Rename course", course.courseName || "");
    if (name == null) return;
    try {
      setError("");
      setSuccess("");
      await updateDoc(doc(db, "adminContent", course.id), {
        courseName: String(name).trim(),
        updatedAt: serverTimestamp(),
      });
      setSuccess("Course name updated");
    } catch (err) {
      console.error("Rename error:", err);
      setError(`Failed to rename: ${err?.message || "Unknown error"}`);
    }
  };

  const deleteCourse = async (id) => {
    if (!confirm("Delete this course?")) return;
    try {
      setDeletingId(id);
      setError("");
      setSuccess("");
      await deleteDoc(doc(db, "adminContent", id));
      setSuccess("Course deleted");
    } catch (err) {
      console.error("Delete error:", err);
      setError(`Failed to delete: ${err?.message || "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <LoadingScreen isLoading={true} message="Loading Admin Panel..." />;
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10"
            style={{
              width: `${Math.random() * 150 + 50}px`,
              height: `${Math.random() * 150 + 50}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Modern Navbar */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </motion.div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-3">
              <motion.a
                href="#create"
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create
              </motion.a>
              <motion.a
                href="/adminIndexCourses"
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                All Courses
              </motion.a>
              <motion.a
                href="/websiteDashboard?adminPreview=1"
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Home className="w-4 h-4 inline mr-2" />
                Dashboard
              </motion.a>
              <motion.button
                onClick={async () => { await signOut(auth); window.location.href = "/websiteDashboard"; }}
                className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-4 h-4 inline mr-2" />
                Logout
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              className="bg-emerald-900/40 backdrop-blur-sm border border-emerald-700 p-4 rounded-xl mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <p className="text-emerald-200">{success}</p>
            </motion.div>
          )}
          {error && (
            <motion.div
              className="bg-red-900/40 backdrop-blur-sm border border-red-700 p-4 rounded-xl mb-6 whitespace-pre-wrap"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <p className="text-red-200">{error}</p>
              {error.includes('permission-denied') && (
                <div className="text-xs text-red-200 mt-2">
                  Hint: Check Firestore security rules to allow authenticated admins to write to "adminContent".
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Course Form */}
        <AnimatedCard variant="glow" className="mb-12" id="create">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-600/20 rounded-xl">
                <Plus className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create New Course</h2>
                <p className="text-sm text-gray-400">Add a new course to your platform</p>
              </div>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-6">
              {/* Course Name */}
              <AnimatedInput
                label="Course Name"
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g., JavaScript Mastery"
                icon={<BookOpen className="w-5 h-5" />}
              />

              {/* Image URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatedInput
                  label="Primary Image URL"
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  icon={<Image className="w-5 h-5" />}
                />
                <AnimatedInput
                  label="Secondary Image URL"
                  type="text"
                  value={imageUrl2}
                  onChange={(e) => setImageUrl2(e.target.value)}
                  placeholder="https://..."
                  icon={<Image className="w-5 h-5" />}
                />
              </div>

              {/* Video URL */}
              <AnimatedInput
                label="Video URL (Optional)"
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://... or blob:https://..."
                icon={<Video className="w-5 h-5" />}
              />

              {/* Visibility & Section Control */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Visibility</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-900/80 border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 text-white outline-none transition-all"
                  >
                    <option value="show">Show (Visible)</option>
                    <option value="hide">Hide (Hidden)</option>
                  </select>
                </div>

                <AnimatedInput
                  label="Section Control (comma-separated)"
                  type="text"
                  value={sectionControlInput}
                  onChange={(e) => setSectionControlInput(e.target.value)}
                  placeholder="e.g., 5,5,3"
                  icon={<List className="w-5 h-5" />}
                />
              </div>

              {/* Bulk Links Paste */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Bulk Links (comma or newline separated)</label>
                <textarea
                  rows={4}
                  value={bulkLinks}
                  onChange={(e) => setBulkLinks(e.target.value)}
                  placeholder="https://link1, https://link2\nhttps://link3"
                  className="w-full px-4 py-3 rounded-xl bg-gray-900/80 border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 text-white placeholder-gray-500 outline-none transition-all"
                />
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={distributeFromBulk}
                    className="px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 font-semibold transition-all"
                  >
                    Distribute Links Into Sections
                  </button>
                  <span className="text-xs text-gray-400">Excess links beyond section sizes are ignored.</span>
                </div>
              </div>

              {/* Fields Section */}
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-300">
                  Course Content Fields
                </label>
                <div className="space-y-3">
                  {fields.map((f, idx) => (
                    <motion.div
                      key={idx}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-400">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={f}
                        onChange={(e) => updateField(idx, e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-gray-900/80 border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 text-white placeholder-gray-500 outline-none transition-all"
                        placeholder={idx === 0 ? "https://video-link or note" : "Add more..."}
                      />
                      <motion.button
                        type="button"
                        onClick={() => removeField(idx)}
                        className="p-3 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </motion.div>
                  ))}

                  <div className="flex items-center justify-between pt-2">
                    <motion.button
                      type="button"
                      onClick={() => { if (fields.length < maxFields) addField(); }}
                      disabled={fields.length >= maxFields}
                      className="px-6 py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      whileHover={{ scale: fields.length < maxFields ? 1.05 : 1 }}
                      whileTap={{ scale: fields.length < maxFields ? 0.95 : 1 }}
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Field
                    </motion.button>
                    <span className="text-sm text-gray-400">
                      Total: {fields.filter((x) => String(x || "").trim()).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section Preview */}
              {sectionsPreview.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-300">Section Preview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sectionsPreview.map((arr, sIdx) => {
                      const expected = sectionCounts[sIdx] ?? arr.length;
                      const missing = Math.max(0, expected - arr.length);
                      return (
                        <motion.div
                          key={sIdx}
                          className="rounded-xl border border-gray-700 bg-gray-900/50 overflow-hidden"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: sIdx * 0.1 }}
                        >
                          <div className="px-4 py-3 bg-purple-600/10 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white">Section {sIdx + 1}</span>
                              <span className="text-xs text-gray-400">{arr.length}/{expected} items</span>
                            </div>
                          </div>
                          <ul className="p-3 space-y-2">
                            {arr.map(({ index, value }, i) => (
                              <li key={index} className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-400">
                                  {i + 1}
                                </span>
                                <input
                                  type="text"
                                  className="flex-1 px-2 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-white"
                                  value={value}
                                  onChange={(e) => {
                                    const next = [...fields];
                                    next[index] = e.target.value;
                                    setFields(next);
                                  }}
                                  placeholder="Edit here"
                                />
                              </li>
                            ))}
                            {missing > 0 && (
                              <li className="text-xs text-amber-400 pl-8">
                                +{missing} more field{missing > 1 ? "s" : ""} needed
                              </li>
                            )}
                          </ul>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <AnimatedButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={saving}
                  icon={<Save className="w-5 h-5" />}
                >
                  Create Course
                </AnimatedButton>
              </div>
            </form>
          </div>
        </AnimatedCard>

        {/* Courses List */}
        <div id="courses">
          <motion.div
            className="flex items-center gap-3 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="p-3 bg-cyan-600/20 rounded-xl">
              <List className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">All Courses</h2>
              <p className="text-sm text-gray-400">{courses.length} course{courses.length !== 1 ? 's' : ''} total</p>
            </div>
          </motion.div>

          {courses.length === 0 ? (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-gray-400 text-lg">No courses yet. Create your first one above!</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {courses.map((c, index) => {
                const created = c.createdAt?.seconds
                  ? new Date(c.createdAt.seconds * 1000)
                  : c.createdAt instanceof Date
                  ? c.createdAt
                  : null;
                const createdStr = created ? created.toLocaleString() : "—";

                return (
                  <AnimatedCard key={c.id} delay={index * 0.05} variant="hover" enableHoverLift={false}>
                    <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Thumbnail */}
                      <div className="relative w-full sm:w-32 h-20 rounded-xl overflow-hidden bg-gray-800 border border-gray-700 flex-shrink-0">
                        {c.imageUrl ? (
                          <img
                            src={c.imageUrl}
                            alt={c.courseName || "course"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                            No image
                          </div>
                        )}
                        {/* Visibility Badge */}
                        <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-semibold ${c.visibility === "show" ? "bg-emerald-600/90 text-white" : "bg-gray-800/90 text-gray-300"}`}>
                          {c.visibility === "show" ? <Eye className="w-3 h-3 inline mr-1" /> : <EyeOff className="w-3 h-3 inline mr-1" />}
                          {c.visibility || "show"}
                        </div>
                      </div>

                      {/* Course Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white mb-1 truncate">
                          {c.courseName || "(untitled)"}
                        </h3>
                        <p className="text-sm text-gray-400 mb-2">
                          Created: {createdStr}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {c.sectionControl && (
                            <span className="px-2 py-1 rounded-lg bg-purple-600/20 border border-purple-500/30 text-xs text-purple-400">
                              {c.sectionControl.length} sections
                            </span>
                          )}
                          {c.fields && (
                            <span className="px-2 py-1 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-xs text-cyan-400">
                              {c.fields.length} fields
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <motion.a
                          // href={`/admin/edit/${c.id}`}
                          href={`/admineditpage/${c.id}`}

                          className="px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 text-blue-400 hover:text-white text-sm font-semibold transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit2 className="w-4 h-4 inline mr-1" />
                          Edit
                        </motion.a>

                        <motion.button
                          onClick={() => quickRename(c)}
                          className="px-3 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white text-sm font-semibold transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Rename
                        </motion.button>

                        <motion.button
                          onClick={() => toggleVisibility(c)}
                          className="px-3 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600 border border-amber-500/30 hover:border-amber-500 text-amber-400 hover:text-white text-sm font-semibold transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {c.visibility === "show" ? <EyeOff className="w-4 h-4 inline mr-1" /> : <Eye className="w-4 h-4 inline mr-1" />}
                          Toggle
                        </motion.button>

                        <motion.button
                          onClick={() => deleteCourse(c.id)}
                          disabled={deletingId === c.id}
                          className="px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white text-sm font-semibold disabled:opacity-50 transition-all"
                          whileHover={{ scale: deletingId !== c.id ? 1.05 : 1 }}
                          whileTap={{ scale: deletingId !== c.id ? 0.95 : 1 }}
                        >
                          <Trash2 className="w-4 h-4 inline mr-1" />
                          {deletingId === c.id ? "Deleting..." : "Delete"}
                        </motion.button>
                      </div>
                    </div>
                  </AnimatedCard>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



















// "use client";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { auth, db } from "@/lib/firebase";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { ADMIN_EMAILS } from "@/lib/config";
// import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
// import { useRouter } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import { Plus, Save, Trash2, Eye, EyeOff, Edit2, Image, Video, List, Settings, LogOut, Home, BookOpen } from "lucide-react";
// import AnimatedButton from "@/components/ui/AnimatedButton";
// import AnimatedInput from "@/components/ui/AnimatedInput";
// import AnimatedCard from "@/components/ui/AnimatedCard";
// import LoadingScreen from "@/components/ui/LoadingScreen";

// export default function WebsiteAdminPage() {
//   const [user, setUser] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const router = useRouter();
//   const redirectedRef = useRef(false);

//   // Simple admin gate + redirect if not admin
//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (u) => {
//       setIsLoading(false);
//       if (!u && !redirectedRef.current) { redirectedRef.current = true; router.replace("/websiteloginpage"); return; }
//       const isAdmin = ADMIN_EMAILS.includes(u?.email || "");
//       if (u && !isAdmin && !redirectedRef.current) { redirectedRef.current = true; router.replace("/websiteDashboard"); return; }
//       setUser(u || null);
//     });
//     return () => unsub();
//   }, [router]);

//   // Subscribe to courses list (latest first) after admin user is set
//   useEffect(() => {
//     if (!user) return;
//     const q = query(collection(db, "adminContent"), orderBy("createdAt", "desc"));
//     const unsub = onSnapshot(q, (snap) => {
//       const list = [];
//       snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
//       setCourses(list);
//     });
//     return () => unsub();
//   }, [user]);

//   const [courseName, setCourseName] = useState("");
//   const [imageUrl, setImageUrl] = useState("");
//   const [imageUrl2, setImageUrl2] = useState("");
//   const [videoUrl, setVideoUrl] = useState("");
//   const [visibility, setVisibility] = useState("show");
//   const [sectionControlInput, setSectionControlInput] = useState("10");
//   const [fields, setFields] = useState([""]);
//   const [bulkLinks, setBulkLinks] = useState("");
//   const [saving, setSaving] = useState(false);
//   const [courses, setCourses] = useState([]);
//   const [deletingId, setDeletingId] = useState(null);

//   const addField = () => setFields((prev) => [...prev, ""]);
//   const updateField = (i, v) => setFields((prev) => prev.map((f, idx) => (idx === i ? v : f)));
//   const removeField = (i) => setFields((prev) => prev.filter((_, idx) => idx !== i));

//   // Parse section counts and build a live preview of how fields will be grouped
//   const sectionCounts = useMemo(() => {
//     return sectionControlInput
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
//       const slice = clean.slice(idx, Math.min(idx + c, clean.length)).map((v, i) => ({ index: idx + i, value: v }));
//       out.push(slice);
//       idx += c;
//     }
//     // Do not create extra containers beyond section control
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

//   const handleCreateCourse = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");

//     const sectionControl = sectionControlInput
//       .split(",")
//       .map((s) => parseInt(s.trim(), 10))
//       .filter((n) => Number.isFinite(n) && n > 0);

//     const cleanFields = fields.map((f) => String(f || "").trim());

//     if (!courseName.trim()) {
//       setError("Course name is required");
//       return;
//     }
//     // All fields optional: no minimum required

//     try {
//       if (!auth.currentUser) {
//         setError("You are not signed in. Please login again.");
//         return;
//       }
//       setSaving(true);
//       const docRef = await addDoc(collection(db, "adminContent"), {
//         courseName: courseName.trim(),
//         imageUrl: imageUrl.trim(),
//         imageUrl2: imageUrl2.trim(),
//         videoUrl: videoUrl.trim(),
//         visibility,
//         sectionControl: sectionControl.length ? sectionControl : [10],
//         fields: cleanFields,
//         createdAt: serverTimestamp(),
//         createdBy: user?.uid || "unknown",
//       });
//       setSuccess(`Course created successfully (ID: ${docRef.id})`);
//       setCourseName("");
//       setImageUrl("");
//       setImageUrl2("");
//       setVideoUrl("");
//       setVisibility("show");
//       setSectionControlInput("10");
//       setFields([""]);
//     } catch (err) {
//       console.error("Create course error:", err);
//       const code = err?.code ? ` [${err.code}]` : "";
//       const msg = err?.message || "Unknown error";
//       setError(`Failed to create course${code}: ${msg}`);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const toggleVisibility = async (course) => {
//     try {
//       setError("");
//       setSuccess("");
//       const next = course.visibility === "show" ? "hide" : "show";
//       await updateDoc(doc(db, "adminContent", course.id), {
//         visibility: next,
//         updatedAt: serverTimestamp(),
//       });
//       setSuccess(`Visibility updated to ${next}`);
//     } catch (err) {
//       console.error("Toggle visibility error:", err);
//       setError(`Failed to update visibility: ${err?.message || "Unknown error"}`);
//     }
//   };

//   const quickRename = async (course) => {
//     const name = prompt("Rename course", course.courseName || "");
//     if (name == null) return;
//     try {
//       setError("");
//       setSuccess("");
//       await updateDoc(doc(db, "adminContent", course.id), {
//         courseName: String(name).trim(),
//         updatedAt: serverTimestamp(),
//       });
//       setSuccess("Course name updated");
//     } catch (err) {
//       console.error("Rename error:", err);
//       setError(`Failed to rename: ${err?.message || "Unknown error"}`);
//     }
//   };

//   const deleteCourse = async (id) => {
//     if (!confirm("Delete this course?")) return;
//     try {
//       setDeletingId(id);
//       setError("");
//       setSuccess("");
//       await deleteDoc(doc(db, "adminContent", id));
//       setSuccess("Course deleted");
//     } catch (err) {
//       console.error("Delete error:", err);
//       setError(`Failed to delete: ${err?.message || "Unknown error"}`);
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   if (isLoading) {
//     return <LoadingScreen isLoading={true} message="Loading Admin Panel..." />;
//   }
//   if (!user) return null;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
//       {/* Animated Background */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         {[...Array(20)].map((_, i) => (
//           <motion.div
//             key={i}
//             className="absolute rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10"
//             style={{
//               width: `${Math.random() * 150 + 50}px`,
//               height: `${Math.random() * 150 + 50}px`,
//               top: `${Math.random() * 100}%`,
//               left: `${Math.random() * 100}%`,
//             }}
//             animate={{
//               y: [0, -30, 0],
//               opacity: [0.1, 0.3, 0.1],
//             }}
//             transition={{
//               duration: 5 + Math.random() * 5,
//               repeat: Infinity,
//               delay: Math.random() * 2,
//             }}
//           />
//         ))}
//       </div>

//       {/* Modern Navbar */}
//       <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             {/* Logo */}
//             <motion.div
//               className="flex items-center gap-3"
//               initial={{ opacity: 0, x: -20 }}
//               animate={{ opacity: 1, x: 0 }}
//             >
//               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
//                 <Settings className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
//                   Admin Panel
//                 </h1>
//                 <p className="text-xs text-gray-400">{user.email}</p>
//               </div>
//             </motion.div>

//             {/* Nav Links */}
//             <div className="hidden md:flex items-center gap-3">
//               <motion.a
//                 href="#create"
//                 className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <Plus className="w-4 h-4 inline mr-2" />
//                 Create
//               </motion.a>
//               <motion.a
//                 href="/adminIndexCourses"
//                 className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <BookOpen className="w-4 h-4 inline mr-2" />
//                 All Courses
//               </motion.a>
//               <motion.a
//                 href="/websiteDashboard?adminPreview=1"
//                 className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <Home className="w-4 h-4 inline mr-2" />
//                 Dashboard
//               </motion.a>
//               <motion.button
//                 onClick={async () => { await signOut(auth); window.location.href = "/websiteDashboard"; }}
//                 className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white transition-all"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <LogOut className="w-4 h-4 inline mr-2" />
//                 Logout
//               </motion.button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
//         {/* Success/Error Messages */}
//         <AnimatePresence>
//           {success && (
//             <motion.div
//               className="bg-emerald-900/40 backdrop-blur-sm border border-emerald-700 p-4 rounded-xl mb-6"
//               initial={{ opacity: 0, y: -20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//             >
//               <p className="text-emerald-200">{success}</p>
//             </motion.div>
//           )}
//           {error && (
//             <motion.div
//               className="bg-red-900/40 backdrop-blur-sm border border-red-700 p-4 rounded-xl mb-6 whitespace-pre-wrap"
//               initial={{ opacity: 0, y: -20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//             >
//               <p className="text-red-200">{error}</p>
//               {error.includes('permission-denied') && (
//                 <div className="text-xs text-red-200 mt-2">
//                   Hint: Check Firestore security rules to allow authenticated admins to write to "adminContent".
//                 </div>
//               )}
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Create Course Form */}
//         <AnimatedCard variant="glow" className="mb-12" id="create">
//           <div className="p-6">
//             <div className="flex items-center gap-3 mb-6">
//               <div className="p-3 bg-purple-600/20 rounded-xl">
//                 <Plus className="w-6 h-6 text-purple-400" />
//               </div>
//               <div>
//                 <h2 className="text-2xl font-bold text-white">Create New Course</h2>
//                 <p className="text-sm text-gray-400">Add a new course to your platform</p>
//               </div>
//             </div>

//             <form onSubmit={handleCreateCourse} className="space-y-6">
//               {/* Course Name */}
//               <AnimatedInput
//                 label="Course Name"
//                 type="text"
//                 value={courseName}
//                 onChange={(e) => setCourseName(e.target.value)}
//                 placeholder="e.g., JavaScript Mastery"
//                 icon={<BookOpen className="w-5 h-5" />}
//               />

//               {/* Image URLs */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <AnimatedInput
//                   label="Primary Image URL"
//                   type="text"
//                   value={imageUrl}
//                   onChange={(e) => setImageUrl(e.target.value)}
//                   placeholder="https://..."
//                   icon={<Image className="w-5 h-5" />}
//                 />
//                 <AnimatedInput
//                   label="Secondary Image URL"
//                   type="text"
//                   value={imageUrl2}
//                   onChange={(e) => setImageUrl2(e.target.value)}
//                   placeholder="https://..."
//                   icon={<Image className="w-5 h-5" />}
//                 />
//               </div>

//               {/* Video URL */}
//               <AnimatedInput
//                 label="Video URL (Optional)"
//                 type="text"
//                 value={videoUrl}
//                 onChange={(e) => setVideoUrl(e.target.value)}
//                 placeholder="https://... or blob:https://..."
//                 icon={<Video className="w-5 h-5" />}
//               />

//               {/* Visibility & Section Control */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium mb-2 text-gray-300">Visibility</label>
//                   <select
//                     value={visibility}
//                     onChange={(e) => setVisibility(e.target.value)}
//                     className="w-full px-4 py-3 rounded-xl bg-gray-900/80 border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 text-white outline-none transition-all"
//                   >
//                     <option value="show">Show (Visible)</option>
//                     <option value="hide">Hide (Hidden)</option>
//                   </select>
//                 </div>

//                 <AnimatedInput
//                   label="Section Control (comma-separated)"
//                   type="text"
//                   value={sectionControlInput}
//                   onChange={(e) => setSectionControlInput(e.target.value)}
//                   placeholder="e.g., 5,5,3"
//                   icon={<List className="w-5 h-5" />}
//                 />
//               </div>

//               {/* Bulk Links Paste */}
//               <div>
//                 <label className="block text-sm font-medium mb-2 text-gray-300">Bulk Links (comma or newline separated)</label>
//                 <textarea
//                   rows={4}
//                   value={bulkLinks}
//                   onChange={(e) => setBulkLinks(e.target.value)}
//                   placeholder="https://link1, https://link2\nhttps://link3"
//                   className="w-full px-4 py-3 rounded-xl bg-gray-900/80 border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 text-white placeholder-gray-500 outline-none transition-all"
//                 />
//                 <div className="mt-2 flex items-center justify-between">
//                   <button
//                     type="button"
//                     onClick={distributeFromBulk}
//                     className="px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 font-semibold transition-all"
//                   >
//                     Distribute Links Into Sections
//                   </button>
//                   <span className="text-xs text-gray-400">Excess links beyond section sizes are ignored.</span>
//                 </div>
//               </div>

//               {/* Fields Section */}
//               <div>
//                 <label className="block text-sm font-medium mb-3 text-gray-300">
//                   Course Content Fields
//                 </label>
//                 <div className="space-y-3">
//                   {fields.map((f, idx) => (
//                     <motion.div
//                       key={idx}
//                       className="flex items-center gap-3"
//                       initial={{ opacity: 0, x: -20 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: idx * 0.05 }}
//                     >
//                       <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-400">
//                         {idx + 1}
//                       </div>
//                       <input
//                         type="text"
//                         value={f}
//                         onChange={(e) => updateField(idx, e.target.value)}
//                         className="flex-1 px-4 py-3 rounded-xl bg-gray-900/80 border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 text-white placeholder-gray-500 outline-none transition-all"
//                         placeholder={idx === 0 ? "https://video-link or note" : "Add more..."}
//                       />
//                       <motion.button
//                         type="button"
//                         onClick={() => removeField(idx)}
//                         className="p-3 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white transition-all"
//                         whileHover={{ scale: 1.05 }}
//                         setBulkLinks("");
//                         whileTap={{ scale: 0.95 }}
//                       >
//                         <Trash2 className="w-5 h-5" />
//                       </motion.button>
//                     </motion.div>
//                   ))}

//                   <div className="flex items-center justify-between pt-2">
//                     <motion.button
//                       type="button"
//                       onClick={() => { if (fields.length < maxFields) addField(); }}
//                       disabled={fields.length >= maxFields}
//                       className="px-6 py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
//                       whileHover={{ scale: fields.length < maxFields ? 1.05 : 1 }}
//                       whileTap={{ scale: fields.length < maxFields ? 0.95 : 1 }}
//                     >
//                       <Plus className="w-4 h-4 inline mr-2" />
//                       Add Field
//                     </motion.button>
//                     <span className="text-sm text-gray-400">
//                       Total: {fields.filter((x) => String(x || "").trim()).length}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {/* Section Preview */}
//               {sectionsPreview.length > 0 && (
//                 <div>
//                   <h3 className="text-lg font-semibold mb-4 text-gray-300">Section Preview</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {sectionsPreview.map((arr, sIdx) => {
//                       const expected = sectionCounts[sIdx] ?? arr.length;
//                       const missing = Math.max(0, expected - arr.length);
//                       return (
//                         <motion.div
//                           key={sIdx}
//                           className="rounded-xl border border-gray-700 bg-gray-900/50 overflow-hidden"
//                           initial={{ opacity: 0, scale: 0.9 }}
//                           animate={{ opacity: 1, scale: 1 }}
//                           transition={{ delay: sIdx * 0.1 }}
//                         >
//                           <div className="px-4 py-3 bg-purple-600/10 border-b border-gray-700">
//                             <div className="flex items-center justify-between">
//                               <span className="font-semibold text-white">Section {sIdx + 1}</span>
//                               <span className="text-xs text-gray-400">{arr.length}/{expected} items</span>
//                             </div>
//                           </div>
//                           <ul className="p-3 space-y-2">
//                             {arr.map(({ index, value }, i) => (
//                               <li key={index} className="flex items-center gap-2">
//                                 <span className="w-6 h-6 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-400">
//                                   {i + 1}
//                                 </span>
//                                 <input
//                                   type="text"
//                                   className="flex-1 px-2 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-white"
//                                   value={value}
//                                   onChange={(e) => {
//                                     const next = [...fields];
//                                     next[index] = e.target.value;
//                                     setFields(next);
//                                   }}
//                                   placeholder="Edit here"
//                                 />
//                               </li>
//                             ))}
//                             {missing > 0 && (
//                               <li className="text-xs text-amber-400 pl-8">
//                                 +{missing} more field{missing > 1 ? "s" : ""} needed
//                               </li>
//                             )}
//                           </ul>
//                         </motion.div>
//                       );
//                     })}
//                   </div>
//                 </div>
//               )}

//               {/* Submit Button */}
//               <div className="pt-4">
//                 <AnimatedButton
//                   type="submit"
//                   variant="primary"
//                   size="lg"
//                   isLoading={saving}
//                   icon={<Save className="w-5 h-5" />}
//                 >
//                   Create Course
//                 </AnimatedButton>
//               </div>
//             </form>
//           </div>
//         </AnimatedCard>

//         {/* Courses List */}
//         <div id="courses">
//           <motion.div
//             className="flex items-center gap-3 mb-6"
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//           >
//             <div className="p-3 bg-cyan-600/20 rounded-xl">
//               <List className="w-6 h-6 text-cyan-400" />
//             </div>
//             <div>
//               <h2 className="text-2xl font-bold text-white">All Courses</h2>
//               <p className="text-sm text-gray-400">{courses.length} course{courses.length !== 1 ? 's' : ''} total</p>
//             </div>
//           </motion.div>

//           {courses.length === 0 ? (
//             <motion.div
//               className="text-center py-20"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//             >
//               <p className="text-gray-400 text-lg">No courses yet. Create your first one above!</p>
//             </motion.div>
//           ) : (
//             <div className="space-y-4">
//               {courses.map((c, index) => {
//                 const created = c.createdAt?.seconds
//                   ? new Date(c.createdAt.seconds * 1000)
//                   : c.createdAt instanceof Date
//                   ? c.createdAt
//                   : null;
//                 const createdStr = created ? created.toLocaleString() : "—";

//                 return (
//                   <AnimatedCard key={c.id} delay={index * 0.05} variant="hover" enableHoverLift={false}>
//                     <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
//                       {/* Thumbnail */}
//                       <div className="relative w-full sm:w-32 h-20 rounded-xl overflow-hidden bg-gray-800 border border-gray-700 flex-shrink-0">
//                         {c.imageUrl ? (
//                           <img
//                             src={c.imageUrl}
//                             alt={c.courseName || "course"}
//                             className="w-full h-full object-cover"
//                           />
//                         ) : (
//                           <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
//                             No image
//                           </div>
//                         )}
//                         {/* Visibility Badge */}
//                         <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-semibold ${c.visibility === "show" ? "bg-emerald-600/90 text-white" : "bg-gray-800/90 text-gray-300"}`}>
//                           {c.visibility === "show" ? <Eye className="w-3 h-3 inline mr-1" /> : <EyeOff className="w-3 h-3 inline mr-1" />}
//                           {c.visibility || "show"}
//                         </div>
//                       </div>

//                       {/* Course Info */}
//                       <div className="flex-1 min-w-0">
//                         <h3 className="text-lg font-bold text-white mb-1 truncate">
//                           {c.courseName || "(untitled)"}
//                         </h3>
//                         <p className="text-sm text-gray-400 mb-2">
//                           Created: {createdStr}
//                         </p>
//                         <div className="flex flex-wrap gap-2">
//                           {c.sectionControl && (
//                             <span className="px-2 py-1 rounded-lg bg-purple-600/20 border border-purple-500/30 text-xs text-purple-400">
//                               {c.sectionControl.length} sections
//                             </span>
//                           )}
//                           {c.fields && (
//                             <span className="px-2 py-1 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-xs text-cyan-400">
//                               {c.fields.length} fields
//                             </span>
//                           )}
//                         </div>
//                       </div>

//                       {/* Action Buttons */}
//                       <div className="flex flex-wrap gap-2">
//                         <motion.a
//                           href={`/admin/edit/${c.id}`}
//                           className="px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 text-blue-400 hover:text-white text-sm font-semibold transition-all"
//                           whileHover={{ scale: 1.05 }}
//                           whileTap={{ scale: 0.95 }}
//                         >
//                           <Edit2 className="w-4 h-4 inline mr-1" />
//                           Edit
//                         </motion.a>

//                         <motion.button
//                           onClick={() => quickRename(c)}
//                           className="px-3 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white text-sm font-semibold transition-all"
//                           whileHover={{ scale: 1.05 }}
//                           whileTap={{ scale: 0.95 }}
//                         >
//                           Rename
//                         </motion.button>

//                         <motion.button
//                           onClick={() => toggleVisibility(c)}
//                           className="px-3 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600 border border-amber-500/30 hover:border-amber-500 text-amber-400 hover:text-white text-sm font-semibold transition-all"
//                           whileHover={{ scale: 1.05 }}
//                           whileTap={{ scale: 0.95 }}
//                         >
//                           {c.visibility === "show" ? <EyeOff className="w-4 h-4 inline mr-1" /> : <Eye className="w-4 h-4 inline mr-1" />}
//                           Toggle
//                         </motion.button>

//                         <motion.button
//                           onClick={() => deleteCourse(c.id)}
//                           disabled={deletingId === c.id}
//                           className="px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white text-sm font-semibold disabled:opacity-50 transition-all"
//                           whileHover={{ scale: deletingId !== c.id ? 1.05 : 1 }}
//                           whileTap={{ scale: deletingId !== c.id ? 0.95 : 1 }}
//                         >
//                           <Trash2 className="w-4 h-4 inline mr-1" />
//                           {deletingId === c.id ? "Deleting..." : "Delete"}
//                         </motion.button>
//                       </div>
//                     </div>
//                   </AnimatedCard>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
