// "use client";
// import { useEffect } from "react";

// export default function ThirdPartyScripts() {
//   useEffect(() => {
//     // ---------------------------------------------------------
//     // 1. Monetag Verification Meta Tag
//     // ---------------------------------------------------------
//     if (!document.querySelector('meta[name="monetag"]')) {
//       try {
//         const meta = document.createElement("meta");
//         meta.name = "monetag";
//         meta.content = "a3db752e3b9c2b9df03ac72e177cba36";
//         document.head.appendChild(meta);
//       } catch (e) {
//         console.error("Monetag meta tag error:", e);
//       }
//     }

//     // ---------------------------------------------------------
//     // 2. Checks (Production & Admin Bypass)
//     // ---------------------------------------------------------
//     if (process.env.NODE_ENV !== "production") return;

//     try {
//       const sp = new URLSearchParams(window.location.search);
//       const isAdmin = sp.get("admin") === "true";
//       if (isAdmin) {
//         window.__BF_DISABLE_ADS__ = true;
//         return; // Sab ads rok do
//       }
//     } catch {}

//     // Variables to hold script references for cleanup
//     let script1 = null;
//     let script2 = null;

//     // ---------------------------------------------------------
//     // 3. Script 1: Hotbyuyixa (Old Script)
//     // ---------------------------------------------------------
//     try {
//       const s1 = document.createElement("script");
//       s1.src = "https://hotbyuyixa.today/process.js?id=1550579975&p1=sub1&p2=sub2&p3=sub3&p4=sub4";
//       s1.async = true;
//       document.body.appendChild(s1);
//       script1 = s1;
//     } catch (e) {
//       console.error("Script 1 error:", e);
//     }

//     // ---------------------------------------------------------
//     // 4. Script 2: Giriudog (NEW SCRIPT ADDED HERE)
//     // ---------------------------------------------------------
//     try {
//       const s2 = document.createElement("script");
//       s2.src = "//wwr.giriudog.com/?tag=793e9f46";
//       // data-cfasync='false' ko attribute ke taur par set karna zaroori hai
//       s2.setAttribute("data-cfasync", "false"); 
//       // Ads ke liye async true rakhna behtar hota hai taaki site slow na ho
//       s2.async = true; 
//       document.body.appendChild(s2);
//       script2 = s2;
//     } catch (e) {
//       console.error("Script 2 error:", e);
//     }

//     // ---------------------------------------------------------
//     // 5. Cleanup Function
//     // ---------------------------------------------------------
//     return () => {
//       try {
//         if (script1 && document.body.contains(script1)) {
//           document.body.removeChild(script1);
//         }
//         if (script2 && document.body.contains(script2)) {
//           document.body.removeChild(script2);
//         }
//       } catch {}
//     };
//   }, []);

//   return null;
// }





// ======================= House.partner ============================

// "use client";
// import { useEffect } from "react";

// export default function ThirdPartyScripts() {
//   useEffect(() => {
//     if (process.env.NODE_ENV !== "production") return;
//     // Allow disabling ads via URL: ?admin=true
//     try {
//       const sp = new URLSearchParams(window.location.search);
//       const isAdmin = sp.get("admin") === "true";
//       if (isAdmin) {
//         // Set a global flag so any other ad loaders can respect it
//         window.__BF_DISABLE_ADS__ = true;
//         return; // skip loading third-party ad script
//       }
//     } catch {}
//     try {
//       const s = document.createElement("script");
//       // s.src = "https://hotblikawo.today/process.js?id=1505874255&p1=sub1&p2=sub2&p3=sub3&p4=sub4";  // old brainfuel download
//       s.src = "https://hotbyuyixa.today/process.js?id=1550579975&p1=sub1&p2=sub2&p3=sub3&p4=sub4"; // education brainfuel only dwonlaod 
//       s.async = true;
//       document.body.appendChild(s);
//       return () => {
//         try { document.body.removeChild(s); } catch {}
//       };
//     } catch {}
//   }, []);

//   return null;
// }













  // <script type="text/javascript" src="https://hotbyuyixa.today/process.js?id=1550579975&p1=sub1&p2=sub2&p3=sub3&p4=sub4" async> </script>

  // <meta name="monetag" content="a3db752e3b9c2b9df03ac72e177cba36"></meta>
