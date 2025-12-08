"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ADMIN_EMAILS } from "@/lib/config";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function AdminEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id;

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loadingDoc, setLoadingDoc] = useState(true);
  const [course, setCourse] = useState(null);

  const [courseName, setCourseName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrl2, setImageUrl2] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [visibility, setVisibility] = useState("show");
  const [sectionControlInput, setSectionControlInput] = useState("");
  const [fields, setFields] = useState([""]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setIsLoading(false);
      if (!u) {
        router.replace("/websiteloginpage");
        return;
      }
      if (!ADMIN_EMAILS.includes(u.email || "")) {
        router.replace("/websiteDashboard");
        return;
      }
      setUser(u);
    });
    return () => unsub();
  }, [router]);

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
      setSuccess("Changes saved");
    } catch (err) {
      console.error("Update error:", err);
      setError(`Failed to save: ${err?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/adminIndexCourses" className="text-lg font-semibold">Back to Courses</a>
            <a href="/websiteDashboard?adminPreview=1" className="text-sm px-2 py-1 rounded bg-gray-800 border border-gray-700">Dashboard</a>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-gray-400">{user.email}</span>
            <button
              onClick={async () => { await signOut(auth); router.replace("/websiteDashboard"); }}
              className="px-3 py-1.5 text-sm bg-red-700 rounded border border-red-600"
            >Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Edit Course</h1>

        {success && (
          <div className="bg-green-900/40 border border-green-700 p-3 rounded mb-4">{success}</div>
        )}
        {error && (
          <div className="bg-red-900/40 border border-red-700 p-3 rounded mb-4">{error}</div>
        )}

        {loadingDoc ? (
          <div className="text-sm text-gray-400">Loading course…</div>
        ) : !course ? (
          <div className="text-sm text-red-300">No course data.</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 bg-gray-900/50 border border-gray-800 rounded p-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Course Name</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Image URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Second Image URL</label>
                <input
                  type="text"
                  value={imageUrl2}
                  onChange={(e) => setImageUrl2(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Video URL (optional)</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
                  placeholder="https://... or blob:https://..."
                />
                <p className="text-xs text-gray-400 mt-1">If provided, dashboard renders a video instead of the 2nd image.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
                >
                  <option value="show">show</option>
                  <option value="hide">hide</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Section Control (comma-separated)</label>
                <input
                  type="text"
                  value={sectionControlInput}
                  onChange={(e) => setSectionControlInput(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700"
                  placeholder="e.g., 5,5,3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Fields</label>
              <div className="space-y-2">
                {fields.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="min-w-[36px] h-9 px-2 rounded bg-gray-700/70 border border-gray-600 text-gray-200 flex items-center justify-center text-sm font-semibold">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={f}
                      onChange={(e) => updateField(idx, e.target.value)}
                      className="flex-1 px-3 py-2 rounded bg-gray-800 border border-gray-700"
                      placeholder="https://video-link or note"
                    />
                    <button type="button" onClick={() => removeField(idx)} className="px-3 py-2 bg-red-700 rounded">Remove</button>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { if (fields.length < maxFields) addField(); }}
                    className="px-3 py-2 bg-gray-700 rounded disabled:opacity-50"
                    disabled={fields.length >= maxFields}
                  >+ Add Field</button>
                  <span className="text-xs text-gray-300">Total fields: {fields.filter((x) => String(x || "").trim()).length}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-200">Section Preview</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {sectionsPreview.map((arr, sIdx) => {
                  const expected = sectionCounts[sIdx] ?? arr.length;
                  return (
                    <div key={sIdx} className="rounded-lg border border-gray-700 bg-gray-900/50">
                      <div className="px-3 py-2 flex items-center justify-between border-b border-gray-700">
                        <span className="text-sm font-semibold text-white">Section {sIdx + 1}</span>
                        <span className="text-xs text-gray-300">{arr.length}/{expected} items</span>
                      </div>
                      <ul className="p-3 space-y-1.5">
                        {arr.map(({ index, value }, i) => (
                          <li key={index} className="text-xs text-gray-200 flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-gray-700/70 border border-gray-600 flex items-center justify-center text-[11px] font-semibold">{i + 1}</span>
                            <input
                              type="text"
                              className="flex-1 px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs"
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
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
