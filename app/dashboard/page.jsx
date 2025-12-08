"use client";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { ADMIN_EMAILS } from "@/lib/config";

const useAuthBasic = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const isAdmin = ADMIN_EMAILS.includes(u.email || "");
      const allowPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("adminPreview") === "1";
      if (isAdmin && !allowPreview) {
        window.location.href = "/websiteadminpage";
        return;
      }
      setUser(u);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);
  return { user, isLoading };
};

export default function DashboardPage() {
  const { user, isLoading } = useAuthBasic();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, "adminContent"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setCourses(list);
      } catch (e) {
        setError("Failed to load courses");
        console.error(e);
      }
    };
    fetch();
  }, []);

  const handleLogout = async () => {
    try {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { isOnline: false, lastActive: new Date() });
      }
      await signOut(auth);
      window.location.href = "/websiteDashboard";
    } catch {
      await signOut(auth);
      window.location.href = "/websiteDashboard";
    }
  };

  const grouped = useMemo(() => {
    return courses.map((c) => {
      const sections = Array.isArray(c.sectionControl) ? c.sectionControl : [10];
      const fields = Array.isArray(c.fields) ? c.fields : [];
      const result = [];
      let idx = 0;
      for (let s = 0; s < sections.length; s++) {
        const count = sections[s] || 0;
        result.push(fields.slice(idx, idx + count));
        idx += count;
      }
      if (idx < fields.length) {
        result.push(fields.slice(idx));
      }
      return { course: c, sections: result };
    });
  }, [courses]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">Loading...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center">📥</div>
            <div>
              <h1 className="text-2xl font-bold">Downloads Dashboard</h1>
              <p className="text-xs text-gray-400">{user ? user.email : "Guest"}</p>
            </div>
          </div>
          <div>
            {user ? (
              <button onClick={handleLogout} className="px-3 py-2 bg-red-600 rounded text-white">Logout</button>
            ) : (
              <a href="/login" className="px-3 py-2 bg-green-600 rounded text-white">Login</a>
            )}
          </div>
        </header>

        {error && (
          <div className="bg-indigo-900/50 border border-indigo-700 p-3 rounded mb-4">{error}</div>
        )}

        {/* Netflix-style rows */}
        <div className="space-y-8">
          {grouped.map(({ course, sections }) => (
            <section key={course.id}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">{course.courseName || "Untitled Course"}</h2>
                <span className="text-xs text-gray-400">{sections.reduce((a,b)=>a+b.length,0)} items</span>
              </div>
              <div className="overflow-x-auto">
                <div className="flex gap-3 min-w-full">
                  <div className="w-64 flex-shrink-0 rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
                    <div className="aspect-video">
                      <img src={course.imageUrl || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80"} alt={course.courseName || "Course"} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-300">Browse sections to download parts.</p>
                    </div>
                  </div>
                  {/* sections cards */}
                  {sections.map((fields, sIdx) => (
                    <div key={sIdx} className="w-64 flex-shrink-0 rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">Section {sIdx + 1}</span>
                          <span className="text-xs text-gray-400">{fields.length} items</span>
                        </div>
                        <div className="space-y-2">
                          {fields
                            .map((f, vIdx) => ({ f, vIdx }))
                            .filter(({ f }) => typeof f === "string" && f.trim())
                            .map(({ f, vIdx }) => {
                              const isLink = f.startsWith("http");
                              const label = `Download Section ${sIdx + 1} • Part ${1} • Video ${vIdx + 1}`;
                              return (
                                <a
                                  key={vIdx}
                                  href={isLink ? f : "#"}
                                  target={isLink ? "_blank" : undefined}
                                  rel={isLink ? "noopener noreferrer" : undefined}
                                  className={`block px-3 py-2 rounded border text-xs ${isLink ? "border-blue-500 text-blue-100 hover:bg-blue-500/20" : "border-gray-600 text-gray-300"}`}
                                >
                                  {isLink ? label : f}
                                </a>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
