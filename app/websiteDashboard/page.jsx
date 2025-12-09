"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { ADMIN_EMAILS } from "@/lib/config";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Settings, BookOpen, TrendingUp, Sparkles, 
  LogOut, LayoutDashboard, PlayCircle, Layers, ArrowRight,
  Crown, Lock 
} from "lucide-react";

// --- Inline UI Components ---

const GlassCard = ({ children, className = "", onClick }) => (
  <motion.div
    onClick={onClick}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ scale: 1.02, y: -5 }}
    className={`bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all duration-300 cursor-pointer ${className}`}
  >
    {children}
  </motion.div>
);

const Badge = ({ icon: Icon, label }) => (
  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400 text-xs font-medium">
    {Icon && <Icon className="w-3.5 h-3.5" />}
    {label}
  </span>
);

const LoadingSpinner = () => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center text-purple-400 gap-4">
    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
    <p className="animate-pulse text-sm font-medium">Loading Dashboard...</p>
  </div>
);

// --- Logic Hook ---

const useAuthBasic = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const isAdmin = ADMIN_EMAILS.includes(u.email || "");
      const allowPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("adminPreview") === "1";
      
      if (isAdmin && !allowPreview && !hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        router.replace("/websiteadminpage");
        return;
      }
      setUser(u);
      setIsLoading(false);
    });
    return () => unsub();
  }, [router]);

  return { user, isLoading };
};

export default function WebsiteDashboardPage() {
  const { user, isLoading } = useAuthBasic();
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Fetch Courses
  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, "adminContent"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        const filtered = list.filter(c => c.visibility !== 'hide'); 
        setCourses(filtered);
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
      router.replace("/websiteDashboard");
    } catch {
      await signOut(auth);
      router.replace("/websiteDashboard");
    }
  };

  const grouped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? courses.filter((c) => (c.courseName || "").toLowerCase().includes(term))
      : courses;
    
    return list.map((c) => {
      const sections = Array.isArray(c.sectionControl) ? c.sectionControl : [10];
      const fields = Array.isArray(c.fields) ? c.fields : [];
      return { 
        ...c, 
        totalSections: sections.length,
        totalLectures: fields.length 
      };
    });
  }, [courses, search]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white selection:bg-purple-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* --- Navbar --- */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                CoursePlatform
              </span>
            </div>

            <div className="flex items-center gap-3">
              {user && ADMIN_EMAILS.includes(user.email || "") && (
                <a
                  href="/websiteadminpage"
                  className="hidden sm:flex items-center px-4 py-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-sm font-medium hover:bg-purple-500/20 transition-all"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </a>
              )}
              
              {user ? (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              ) : (
                <a
                  href="/websiteloginpage"
                  className="px-5 py-2 rounded-lg bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-all"
                >
                  Sign In
                </a>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        
        {/* Hero Section */}
        <section className="py-16 md:py-20 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Unlock Your Potential</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Master New Skills <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Build Your Future
              </span>
            </h1>
            
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Discover amazing courses and expand your knowledge with our modern learning platform.
            </p>

            <div className="pt-4 flex justify-center gap-4">
              <a href="#courses" className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-900/20">
                Explore Courses
              </a>
              {!user && (
                <a href="/websiteloginpage" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all border border-gray-700">
                  Sign In
                </a>
              )}
            </div>
          </motion.div>
        </section>

        {/* Stats Grid - "Total Courses" REMOVED, Grid updated to 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <GlassCard className="p-6 cursor-default">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-500/10 rounded-xl">
                <TrendingUp className="w-8 h-8 text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Status</p>
                <p className="text-2xl font-bold text-white">{user ? "Online" : "Guest"}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 cursor-default">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-xl">
                <Sparkles className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">New Content</p>
                <p className="text-2xl font-bold text-white">Weekly</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Search & Header */}
        <div id="courses" className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-purple-400" />
            Explore Courses
          </h2>
          
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-11 pr-4 py-3 bg-gray-900/60 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-900/20 border border-red-500/30 text-red-200 p-4 rounded-xl mb-8"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Course Grid */}
        {grouped.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-gray-800">
            <div className="inline-block p-4 rounded-full bg-gray-800/50 mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white">No courses found</h3>
            <p className="text-gray-400 mt-2">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {grouped.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="h-full"
                >
                  <GlassCard 
                    className="h-full flex flex-col"
                    onClick={() => router.push(`/course/${course.id}`)}
                  >
                    <div className="relative aspect-video bg-gray-800 overflow-hidden">
                      {course.imageUrl ? (
                        <img 
                          src={course.imageUrl} 
                          alt={course.courseName}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <BookOpen className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
                      <div className="absolute bottom-3 left-3">
                        <Badge icon={Layers} label={`${course.totalSections} Sections`} />
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-purple-400 transition-colors">
                        {course.courseName || "Untitled Course"}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">
                        {course.fields?.[0] || "Start learning today. Click to access course content."}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-700/50 mt-auto">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <PlayCircle className="w-4 h-4 text-pink-400" />
                          <span>{course.totalLectures} Lessons</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-purple-500 hover:text-white transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* --- Premium Content Section --- */}
        <div className="mt-24 mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
              Premium Content
            </h2>
          </div>

          <GlassCard className="relative p-8 overflow-hidden group cursor-not-allowed hover:shadow-none hover:scale-100">
            {/* Dark Overlay for "Locked" feel */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 to-black/80 z-0" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Lock className="w-8 h-8 text-amber-500" />
                  Exclusive Masterclasses
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Advanced techniques and insider secrets are being prepared. 
                  <span className="text-amber-400/80"> Premium content are hiding and coming future very soon.</span>
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Coming Soon
                </div>
              </div>
              
              {/* Decorative button */}
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-10" />
                <button disabled className="px-8 py-4 bg-gray-800/50 border border-gray-700 text-gray-500 rounded-xl font-bold flex items-center gap-2 backdrop-blur-md">
                  <Lock className="w-4 h-4" />
                  Stay Tuned
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

      </div>

      {/* --- Footer --- */}
      <footer className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-xl py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} CoursePlatform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}











// "use client";
// import { useEffect, useMemo, useState, useRef } from "react";
// import { auth, db } from "@/lib/firebase";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { useRouter } from "next/navigation";
// import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
// import { ADMIN_EMAILS } from "@/lib/config";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   Search, Settings, BookOpen, TrendingUp, Sparkles, 
//   LogOut, LayoutDashboard, PlayCircle, Layers, ArrowRight 
// } from "lucide-react";

// // --- Inline UI Components for Perfect Alignment ---

// const GlassCard = ({ children, className = "", onClick }) => (
//   <motion.div
//     onClick={onClick}
//     initial={{ opacity: 0, y: 20 }}
//     whileInView={{ opacity: 1, y: 0 }}
//     viewport={{ once: true }}
//     whileHover={{ scale: 1.02, y: -5 }}
//     className={`bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all duration-300 cursor-pointer ${className}`}
//   >
//     {children}
//   </motion.div>
// );

// const Badge = ({ icon: Icon, label }) => (
//   <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400 text-xs font-medium">
//     {Icon && <Icon className="w-3.5 h-3.5" />}
//     {label}
//   </span>
// );

// const LoadingSpinner = () => (
//   <div className="min-h-screen bg-black flex flex-col items-center justify-center text-purple-400 gap-4">
//     <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
//     <p className="animate-pulse text-sm font-medium">Loading Dashboard...</p>
//   </div>
// );

// // --- Logic Hooks ---

// const useAuthBasic = () => {
//   const [user, setUser] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const router = useRouter();
//   const hasRedirectedRef = useRef(false);

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (u) => {
//       if (!u) {
//         setUser(null);
//         setIsLoading(false);
//         return;
//       }
//       const isAdmin = ADMIN_EMAILS.includes(u.email || "");
//       const allowPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("adminPreview") === "1";
      
//       if (isAdmin && !allowPreview && !hasRedirectedRef.current) {
//         hasRedirectedRef.current = true;
//         router.replace("/websiteadminpage");
//         return;
//       }
//       setUser(u);
//       setIsLoading(false);
//     });
//     return () => unsub();
//   }, [router]);

//   return { user, isLoading };
// };

// export default function WebsiteDashboardPage() {
//   const { user, isLoading } = useAuthBasic();
//   const router = useRouter();
//   const [courses, setCourses] = useState([]);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");

//   // Fetch Courses
//   useEffect(() => {
//     const fetch = async () => {
//       try {
//         const q = query(collection(db, "adminContent"), orderBy("createdAt", "desc"));
//         const snap = await getDocs(q);
//         const list = [];
//         snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
//         // Only show visible courses unless user is admin previewing
//         const filtered = list.filter(c => c.visibility !== 'hide'); 
//         setCourses(filtered);
//       } catch (e) {
//         setError("Failed to load courses");
//         console.error(e);
//       }
//     };
//     fetch();
//   }, []);

//   const handleLogout = async () => {
//     try {
//       if (user) {
//         const userRef = doc(db, "users", user.uid);
//         await updateDoc(userRef, { isOnline: false, lastActive: new Date() });
//       }
//       await signOut(auth);
//       router.replace("/websiteDashboard");
//     } catch {
//       await signOut(auth);
//       router.replace("/websiteDashboard");
//     }
//   };

//   // Grouping / Search Logic
//   const grouped = useMemo(() => {
//     const term = search.trim().toLowerCase();
//     const list = term
//       ? courses.filter((c) => (c.courseName || "").toLowerCase().includes(term))
//       : courses;
    
//     return list.map((c) => {
//       const sections = Array.isArray(c.sectionControl) ? c.sectionControl : [10];
//       const fields = Array.isArray(c.fields) ? c.fields : [];
//       return { 
//         ...c, 
//         totalSections: sections.length,
//         totalLectures: fields.length 
//       };
//     });
//   }, [courses, search]);

//   if (isLoading) {
//     return <LoadingSpinner />;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white selection:bg-purple-500/30">
      
//       {/* Background Ambience */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
//         <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
//         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
//       </div>

//       {/* --- Navbar --- */}
//       <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             {/* Logo */}
//             <div className="flex items-center gap-2">
//               <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
//                 <BookOpen className="w-5 h-5 text-white" />
//               </div>
//               <span className="text-lg font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
//                 CoursePlatform
//               </span>
//             </div>

//             {/* Right Actions */}
//             <div className="flex items-center gap-3">
//               {user && ADMIN_EMAILS.includes(user.email || "") && (
//                 <a
//                   href="/websiteadminpage"
//                   className="hidden sm:flex items-center px-4 py-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-sm font-medium hover:bg-purple-500/20 transition-all"
//                 >
//                   <Settings className="w-4 h-4 mr-2" />
//                   Admin
//                 </a>
//               )}
              
//               {user ? (
//                 <button
//                   onClick={handleLogout}
//                   className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
//                 >
//                   <LogOut className="w-5 h-5" />
//                 </button>
//               ) : (
//                 <a
//                   href="/websiteloginpage"
//                   className="px-5 py-2 rounded-lg bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-all"
//                 >
//                   Sign In
//                 </a>
//               )}
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* --- Main Content --- */}
//       <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        
//         {/* Hero Section */}
//         <section className="py-16 md:py-20 text-center">
//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="max-w-3xl mx-auto space-y-6"
//           >
//             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium">
//               <Sparkles className="w-4 h-4" />
//               <span>Unlock Your Potential</span>
//             </div>
            
//             <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
//               Master New Skills <br />
//               <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
//                 Build Your Future
//               </span>
//             </h1>
            
//             <p className="text-lg text-gray-400 max-w-2xl mx-auto">
//               Discover amazing courses and expand your knowledge with our modern learning platform.
//             </p>

//             <div className="pt-4 flex justify-center gap-4">
//               <a href="#courses" className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-900/20">
//                 Explore Courses
//               </a>
//               {!user && (
//                 <a href="/websiteloginpage" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all border border-gray-700">
//                   Sign In
//                 </a>
//               )}
//             </div>
//           </motion.div>
//         </section>

//         {/* Stats Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
//           <GlassCard className="p-6 cursor-default">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-blue-500/10 rounded-xl">
//                 <BookOpen className="w-8 h-8 text-blue-400" />
//               </div>
//               <div>
//                 <p className="text-sm text-gray-400">Total Courses</p>
//                 <p className="text-2xl font-bold text-white">{courses.length}</p>
//               </div>
//             </div>
//           </GlassCard>

//           <GlassCard className="p-6 cursor-default">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-pink-500/10 rounded-xl">
//                 <TrendingUp className="w-8 h-8 text-pink-400" />
//               </div>
//               <div>
//                 <p className="text-sm text-gray-400">Active Status</p>
//                 <p className="text-2xl font-bold text-white">{user ? "Online" : "Guest"}</p>
//               </div>
//             </div>
//           </GlassCard>

//           <GlassCard className="p-6 cursor-default">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-cyan-500/10 rounded-xl">
//                 <Sparkles className="w-8 h-8 text-cyan-400" />
//               </div>
//               <div>
//                 <p className="text-sm text-gray-400">New Content</p>
//                 <p className="text-2xl font-bold text-white">Weekly</p>
//               </div>
//             </div>
//           </GlassCard>
//         </div>

//         {/* Search & Header */}
//         <div id="courses" className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
//           <h2 className="text-2xl font-bold text-white flex items-center gap-2">
//             <LayoutDashboard className="w-6 h-6 text-purple-400" />
//             Explore Courses
//           </h2>
          
//           <div className="relative w-full md:w-96 group">
//             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors">
//               <Search className="w-5 h-5" />
//             </div>
//             <input
//               type="text"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               placeholder="Search courses..."
//               className="w-full pl-11 pr-4 py-3 bg-gray-900/60 border border-gray-700 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-500 outline-none transition-all"
//             />
//           </div>
//         </div>

//         {/* Error State */}
//         <AnimatePresence>
//           {error && (
//             <motion.div
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: 'auto' }}
//               className="bg-red-900/20 border border-red-500/30 text-red-200 p-4 rounded-xl mb-8"
//             >
//               {error}
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Course Grid */}
//         {grouped.length === 0 ? (
//           <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-gray-800">
//             <div className="inline-block p-4 rounded-full bg-gray-800/50 mb-4">
//               <Search className="w-8 h-8 text-gray-500" />
//             </div>
//             <h3 className="text-xl font-bold text-white">No courses found</h3>
//             <p className="text-gray-400 mt-2">Try adjusting your search terms.</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             <AnimatePresence>
//               {grouped.map((course, index) => (
//                 <motion.div
//                   key={course.id}
//                   initial={{ opacity: 0, scale: 0.95 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   transition={{ delay: index * 0.05 }}
//                   className="h-full"
//                 >
//                   <GlassCard 
//                     className="h-full flex flex-col"
//                     onClick={() => router.push(`/course/${course.id}`)}
//                   >
//                     {/* Card Image */}
//                     <div className="relative aspect-video bg-gray-800 overflow-hidden">
//                       {course.imageUrl ? (
//                         <img 
//                           src={course.imageUrl} 
//                           alt={course.courseName}
//                           className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
//                         />
//                       ) : (
//                         <div className="w-full h-full flex items-center justify-center bg-gray-800">
//                           <BookOpen className="w-12 h-12 text-gray-600" />
//                         </div>
//                       )}
//                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
//                       <div className="absolute bottom-3 left-3">
//                         <Badge icon={Layers} label={`${course.totalSections} Sections`} />
//                       </div>
//                     </div>

//                     {/* Card Content */}
//                     <div className="p-5 flex flex-col flex-1">
//                       <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-purple-400 transition-colors">
//                         {course.courseName || "Untitled Course"}
//                       </h3>
                      
//                       <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">
//                         {course.fields?.[0] || "Start learning today. Click to access course content."}
//                       </p>

//                       <div className="flex items-center justify-between pt-4 border-t border-gray-700/50 mt-auto">
//                         <div className="flex items-center gap-2 text-sm text-gray-400">
//                           <PlayCircle className="w-4 h-4 text-pink-400" />
//                           <span>{course.totalLectures} Lessons</span>
//                         </div>
//                         <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-purple-500 hover:text-white transition-colors">
//                           <ArrowRight className="w-4 h-4" />
//                         </div>
//                       </div>
//                     </div>
//                   </GlassCard>
//                 </motion.div>
//               ))}
//             </AnimatePresence>
//           </div>
//         )}
//       </div>

//       {/* --- Footer --- */}
//       <footer className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-xl py-8">
//         <div className="max-w-7xl mx-auto px-4 text-center">
//           <p className="text-gray-500 text-sm">
//             © {new Date().getFullYear()} CoursePlatform. All rights reserved.
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// }





















// "use client";
// import { useEffect, useMemo, useState, useRef } from "react";
// import { auth, db } from "@/lib/firebase";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { useRouter } from "next/navigation";
// import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
// import { ADMIN_EMAILS } from "@/lib/config";
// import { motion } from "framer-motion";
// import { Search, Settings, BookOpen, TrendingUp, Sparkles } from "lucide-react";
// import AnimatedNavbar from "@/components/ui/AnimatedNavbar";
// import AnimatedFooter from "@/components/ui/AnimatedFooter";
// import CourseCard from "@/components/ui/CourseCard";
// import LoadingScreen from "@/components/ui/LoadingScreen";
// import HeroSection from "@/components/ui/HeroSection";

// const useAuthBasic = () => {
//   const [user, setUser] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const router = useRouter();
//   const hasRedirectedRef = useRef(false);
//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (u) => {
//       if (!u) {
//         setUser(null);
//         setIsLoading(false);
//         return;
//       }
//       const isAdmin = ADMIN_EMAILS.includes(u.email || "");
//       const allowPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("adminPreview") === "1";
//       if (isAdmin && !allowPreview && !hasRedirectedRef.current) {
//         hasRedirectedRef.current = true;
//         router.replace("/websiteadminpage");
//         return;
//       }
//       setUser(u);
//       setIsLoading(false);
//     });
//     return () => unsub();
//   }, []);
//   return { user, isLoading };
// };

// export default function WebsiteDashboardPage() {
//   const { user, isLoading } = useAuthBasic();
//   const router = useRouter();
//   const [courses, setCourses] = useState([]);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");

//   useEffect(() => {
//     const fetch = async () => {
//       try {
//         const q = query(collection(db, "adminContent"), orderBy("createdAt", "desc"));
//         const snap = await getDocs(q);
//         const list = [];
//         snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
//         setCourses(list);
//       } catch (e) {
//         setError("Failed to load courses");
//         console.error(e);
//       }
//     };
//     fetch();
//   }, []);

//   const handleLogout = async () => {
//     try {
//       if (user) {
//         const userRef = doc(db, "users", user.uid);
//         await updateDoc(userRef, { isOnline: false, lastActive: new Date() });
//       }
//       await signOut(auth);
//       router.replace("/websiteDashboard");
//     } catch {
//       await signOut(auth);
//       router.replace("/websiteDashboard");
//     }
//   };

//   // Navbar menu items
//   const menuItems = [
//     { label: "Dashboard", href: "/websiteDashboard", icon: <BookOpen className="w-5 h-5" /> },
//   ];

//   // Add admin menu items if user is admin
//   if (user && ADMIN_EMAILS.includes(user.email || "")) {
//     menuItems.push(
//       { label: "Admin Panel", href: "/websiteadminpage", icon: <Settings className="w-5 h-5" /> },
//       { label: "Manage Courses", href: "/adminIndexCourses", icon: <BookOpen className="w-5 h-5" /> }
//     );
//   }

//   // Footer links
//   const footerLinks = [
//     {
//       title: "Resources",
//       items: [
//         { label: "All Courses", href: "/websiteDashboard" },
//         { label: "Categories", href: "#" },
//         { label: "Popular", href: "#" },
//       ],
//     },
//     {
//       title: "Support",
//       items: [
//         { label: "Help Center", href: "#" },
//         { label: "Contact Us", href: "#" },
//         { label: "FAQ", href: "#" },
//       ],
//     },
//   ];

//   const grouped = useMemo(() => {
//     const term = search.trim().toLowerCase();
//     const list = term
//       ? courses.filter((c) => (c.courseName || "").toLowerCase().includes(term))
//       : courses;
//     return list.map((c) => {
//       const sections = Array.isArray(c.sectionControl) ? c.sectionControl : [10];
//       const fields = Array.isArray(c.fields) ? c.fields : [];
//       const result = [];
//       let idx = 0;
//       for (let s = 0; s < sections.length; s++) {
//         const count = sections[s] || 0;
//         result.push(fields.slice(idx, idx + count));
//         idx += count;
//       }
//       if (idx < fields.length) {
//         result.push(fields.slice(idx));
//       }
//       return { course: c, sections: result };
//     });
//   }, [courses, search]);

//   if (isLoading) {
//     return <LoadingScreen isLoading={true} message="Loading your dashboard..." />;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
//       {/* Animated Background Elements */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         {[...Array(30)].map((_, i) => (
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
//               scale: [1, 1.2, 1],
//             }}
//             transition={{
//               duration: 5 + Math.random() * 5,
//               repeat: Infinity,
//               delay: Math.random() * 2,
//             }}
//           />
//         ))}
//       </div>

//       {/* Animated Navbar */}
//       <AnimatedNavbar
//         user={user}
//         onLogout={handleLogout}
//         menuItems={menuItems}
//       />

//       {/* Main Content */}
//       <div className="relative z-10">
//         {/* Hero Section */}
//         <HeroSection
//           title="Your Learning Dashboard"
//           subtitle="Discover amazing courses and expand your knowledge"
//           ctaButtons={[
//             { label: "Explore Courses", href: "#courses", variant: "primary" },
//             ...(user
//               ? []
//               : [{ label: "Sign In", href: "/websiteloginpage", variant: "secondary" }]),
//           ]}
//         />

//         {/* Main Container */}
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
//           {/* Error Message */}
//           {error && (
//             <motion.div
//               className="bg-red-900/40 backdrop-blur-sm border border-red-700 p-4 rounded-xl mb-8"
//               initial={{ opacity: 0, y: -20 }}
//               animate={{ opacity: 1, y: 0 }}
//             >
//               <p className="text-red-200">{error}</p>
//             </motion.div>
//           )}

//           {/* Stats Cards */}
//           <motion.div
//             className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2 }}
//           >
//             {/* <motion.div
//               className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 hover:border-purple-500/50 transition-all"
//               whileHover={{ scale: 1.02, y: -5 }}
//             >
//               <div className="flex items-center gap-4">
//                 <div className="p-3 bg-purple-600/30 rounded-xl">
//                   <BookOpen className="w-8 h-8 text-purple-400" />
//                 </div>
//                 <div>
//                   <p className="text-gray-400 text-sm">Total Courses</p>
//                   <p className="text-3xl font-bold text-white">{courses.length}</p>
//                 </div>
//               </div>
//             </motion.div> */}

//             <motion.div
//               className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-6 hover:border-pink-500/50 transition-all"
//               whileHover={{ scale: 1.02, y: -5 }}
//             >
//               <div className="flex items-center gap-4">
//                 <div className="p-3 bg-pink-600/30 rounded-xl">
//                   <TrendingUp className="w-8 h-8 text-pink-400" />
//                 </div>
//                 <div>
//                   <p className="text-gray-400 text-sm">Active Learning</p>
//                   <p className="text-3xl font-bold text-white">{user ? "In Progress" : "Sign In"}</p>
//                 </div>
//               </div>
//             </motion.div>

//             <motion.div
//               className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all"
//               whileHover={{ scale: 1.02, y: -5 }}
//             >
//               <div className="flex items-center gap-4">
//                 <div className="p-3 bg-cyan-600/30 rounded-xl">
//                   <Sparkles className="w-8 h-8 text-cyan-400" />
//                 </div>
//                 <div>
//                   <p className="text-gray-400 text-sm">New Content</p>
//                   <p className="text-3xl font-bold text-white">Weekly</p>
//                 </div>
//               </div>
//             </motion.div>
//           </motion.div>

//           {/* Search Section */}
//           <motion.div
//             className="mb-12"
//             id="courses"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.3 }}
//           >
//             <div className="relative max-w-2xl mx-auto">
//               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//               <input
//                 type="text"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Search courses by name..."
//                 className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-900/80 backdrop-blur-xl border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 text-white placeholder-gray-500 outline-none transition-all"
//               />
//             </div>
//           </motion.div>

//           {/* Featured Section */}
//           <section className="mb-16">
//             <motion.div
//               className="flex items-center gap-3 mb-8"
//               initial={{ opacity: 0, x: -20 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ delay: 0.4 }}
//             >
//               <Sparkles className="w-6 h-6 text-purple-400" />
//               <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
//                 Featured Courses
//               </h2>
//             </motion.div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {grouped.slice(0, 6).map(({ course }, index) => (
//                 <CourseCard
//                   key={course.id}
//                   course={course}
//                   delay={index * 0.1}
//                   onClick={() => router.push(`/course/${course.id}`)}
//                 />
//               ))}
//             </div>

//             {grouped.length === 0 && (
//               <motion.div
//                 className="text-center py-20"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//               >
//                 <p className="text-gray-400 text-lg">No courses found. Try adjusting your search.</p>
//               </motion.div>
//             )}
//           </section>

//           {/* All Courses Section */}
//           {grouped.length > 6 && (
//             <section>
//               <motion.h2
//                 className="text-3xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.5 }}
//               >
//                 All Courses
//               </motion.h2>

//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {grouped.slice(6).map(({ course }, index) => (
//                   <CourseCard
//                     key={course.id}
//                     course={course}
//                     delay={(index + 6) * 0.05}
//                     onClick={() => router.push(`/course/${course.id}`)}
//                   />
//                 ))}
//               </div>
//             </section>
//           )}
//         </div>
//       </div>

//       {/* Animated Footer */}
//       <AnimatedFooter links={footerLinks} />
//     </div>
//   );
// }
