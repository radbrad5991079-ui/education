import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Simple base64url decode
function b64urlDecode(str) {
  try {
    const pad = (s) => s + "===".slice((s.length + 3) % 4);
    const norm = pad(str.replace(/-/g, "+").replace(/_/g, "/"));
    return Buffer.from(norm, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const { p, id, i } = req.query;
  let docId = id;
  let index = i !== undefined ? Number(i) : undefined;

  if (p && (!docId || index === undefined)) {
    const decoded = b64urlDecode(String(p));
    if (!decoded || !decoded.includes(":")) {
      return res.status(400).json({ error: "Invalid payload" });
    }
    const parts = decoded.split(":");
    docId = parts[0];
    index = Number(parts[1]);
  }

  if (!docId || !Number.isFinite(index) || index < 0) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  try {
    const ref = doc(db, "adminContent", docId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return res.status(404).json({ error: "Not found" });
    const data = snap.data();
    const fields = Array.isArray(data.fields) ? data.fields : [];
    if (index >= fields.length) return res.status(400).json({ error: "Out of range" });
    const url = String(fields[index] || "").trim();
    if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: "Not a URL" });
    // Redirect without exposing the target in the page
    res.setHeader("Cache-Control", "no-store");
    return res.redirect(302, url);
  } catch (e) {
    console.error("secure-redirect error", e);
    return res.status(500).json({ error: "Server error" });
  }
}
