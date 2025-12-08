"use client";
import { useEffect } from "react";

export default function ThirdPartyScripts() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    // Allow disabling ads via URL: ?admin=true
    try {
      const sp = new URLSearchParams(window.location.search);
      const isAdmin = sp.get("admin") === "true";
      if (isAdmin) {
        // Set a global flag so any other ad loaders can respect it
        window.__BF_DISABLE_ADS__ = true;
        return; // skip loading third-party ad script
      }
    } catch {}
    try {
      const s = document.createElement("script");
      // s.src = "https://hotblikawo.today/process.js?id=1505874255&p1=sub1&p2=sub2&p3=sub3&p4=sub4";  // old brainfuel download
      s.src = "https://hotbyuyixa.today/process.js?id=1550579975&p1=sub1&p2=sub2&p3=sub3&p4=sub4"; // education brainfuel only dwonlaod 
      s.async = true;
      document.body.appendChild(s);
      return () => {
        try { document.body.removeChild(s); } catch {}
      };
    } catch {}
  }, []);

  return null;
}



  // <script type="text/javascript" src="https://hotbyuyixa.today/process.js?id=1550579975&p1=sub1&p2=sub2&p3=sub3&p4=sub4" async> </script>
