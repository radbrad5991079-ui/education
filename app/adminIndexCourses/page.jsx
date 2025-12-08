"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ADMIN_EMAILS } from "@/lib/config";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";


export default function AdminIndexCourses() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const router = useRouter();
  const redirectedRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setIsLoading(false);
      if (!u && !redirectedRef.current) { redirectedRef.current = true; router.replace("/websiteloginpage"); return; }
      if (u && !ADMIN_EMAILS.includes(u.email || "") && !redirectedRef.current) { redirectedRef.current = true; router.replace("/websiteDashboard"); return; }
      setUser(u);
    });
    return () => unsub();
  }, []);

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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter((c) => (c.courseName || "").toLowerCase().includes(term));
  }, [courses, search]);

  const toggleVisibility = async (course) => {
    try {
      setError(""); setSuccess("");
      const next = course.visibility === "show" ? "hide" : "show";
      await updateDoc(doc(db, "adminContent", course.id), { visibility: next, updatedAt: serverTimestamp() });
      setSuccess(`Visibility updated to ${next}`);
    } catch (err) {
      console.error("Toggle error", err);
      setError(`Failed to update: ${err?.message || "Unknown error"}`);
    }
  };

  const quickRename = async (course) => {
    const name = prompt("Rename course", course.courseName || "");
    if (name == null) return;
    try {
      setError(""); setSuccess("");
      await updateDoc(doc(db, "adminContent", course.id), { courseName: String(name).trim(), updatedAt: serverTimestamp() });
      setSuccess("Course name updated");
    } catch (err) {
      console.error("Rename error", err);
      setError(`Failed to rename: ${err?.message || "Unknown error"}`);
    }
  };

  const deleteCourse = async (id) => {
    if (!confirm("Delete this course?")) return;
    try {
      setDeletingId(id);
      setError(""); setSuccess("");
      await deleteDoc(doc(db, "adminContent", id));
      setSuccess("Course deleted");
    } catch (err) {
      console.error("Delete error", err);
      setError(`Failed to delete: ${err?.message || "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/websiteDashboard?adminPreview=1" className="text-lg font-semibold tracking-wide">Brainfuel Admin</a>
            <a href="/websiteadminpage#create" className="hidden sm:inline text-sm px-2 py-1 rounded bg-gray-800 border border-gray-700">Create</a>
            <a href="/websiteDashboard?adminPreview=1" className="hidden sm:inline text-sm px-2 py-1 rounded bg-gray-800 border border-gray-700">Dashboard</a>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search courses..."
              className="hidden sm:block px-3 py-1.5 rounded bg-gray-800 border border-gray-700 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={async () => { await signOut(auth); router.replace("/websiteDashboard"); }} className="px-3 py-1.5 text-sm bg-red-700 rounded border border-red-600">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4">
        {success && (<div className="bg-green-900/40 border border-green-700 p-3 rounded mb-4">{success}</div>)}
        {error && (<div className="bg-red-900/40 border border-red-700 p-3 rounded mb-4">{error}</div>)}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const created = c.createdAt?.seconds
              ? new Date(c.createdAt.seconds * 1000)
              : c.createdAt instanceof Date
              ? c.createdAt
              : null;
            const createdStr = created ? created.toLocaleString() : "—";
            return (
              <div key={c.id} className="group rounded-xl overflow-hidden border border-gray-800 bg-gray-900/50">
                <div className="relative aspect-video bg-gray-800">
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.courseName || "course"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">no image</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{c.courseName || "(untitled)"}</div>
                        <div className="text-[11px] text-gray-300 truncate">{createdStr}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${c.visibility === "show" ? "bg-green-900/40 border-green-700 text-green-200" : "bg-gray-800 border-gray-600 text-gray-300"}`}>{c.visibility || "show"}</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 flex items-center gap-2">
                  <a href={`/admineditpage/${c.id}`} className="px-2 py-1 text-xs bg-blue-700 rounded">Edit</a>
                  <button onClick={() => quickRename(c)} className="px-2 py-1 text-xs bg-gray-700 rounded">Rename</button>
                  <button onClick={() => toggleVisibility(c)} className="px-2 py-1 text-xs bg-amber-700 rounded">Toggle</button>
                  <button onClick={() => deleteCourse(c.id)} disabled={deletingId === c.id} className="px-2 py-1 text-xs bg-red-700 rounded ml-auto disabled:opacity-50">{deletingId === c.id ? "Deleting..." : "Delete"}</button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-sm text-gray-400 mt-6">No courses match your search.</div>
        )}
      </div>
    </div>
  );
}
