"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { ADMIN_EMAILS } from "@/lib/config";
import { motion } from "framer-motion";
import { Search, Settings, BookOpen, TrendingUp, Sparkles } from "lucide-react";
import AnimatedNavbar from "@/components/ui/AnimatedNavbar";
import AnimatedFooter from "@/components/ui/AnimatedFooter";
import CourseCard from "@/components/ui/CourseCard";
import LoadingScreen from "@/components/ui/LoadingScreen";
import HeroSection from "@/components/ui/HeroSection";

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
  }, []);
  return { user, isLoading };
};

export default function WebsiteDashboardPage() {
  const { user, isLoading } = useAuthBasic();
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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
      router.replace("/websiteDashboard");
    } catch {
      await signOut(auth);
      router.replace("/websiteDashboard");
    }
  };

  // Navbar menu items
  const menuItems = [
    { label: "Dashboard", href: "/websiteDashboard", icon: <BookOpen className="w-5 h-5" /> },
  ];

  // Add admin menu items if user is admin
  if (user && ADMIN_EMAILS.includes(user.email || "")) {
    menuItems.push(
      { label: "Admin Panel", href: "/websiteadminpage", icon: <Settings className="w-5 h-5" /> },
      { label: "Manage Courses", href: "/adminIndexCourses", icon: <BookOpen className="w-5 h-5" /> }
    );
  }

  // Footer links
  const footerLinks = [
    {
      title: "Resources",
      items: [
        { label: "All Courses", href: "/websiteDashboard" },
        { label: "Categories", href: "#" },
        { label: "Popular", href: "#" },
      ],
    },
    {
      title: "Support",
      items: [
        { label: "Help Center", href: "#" },
        { label: "Contact Us", href: "#" },
        { label: "FAQ", href: "#" },
      ],
    },
  ];

  const grouped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? courses.filter((c) => (c.courseName || "").toLowerCase().includes(term))
      : courses;
    return list.map((c) => {
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
  }, [courses, search]);

  if (isLoading) {
    return <LoadingScreen isLoading={true} message="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
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
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Animated Navbar */}
      <AnimatedNavbar
        user={user}
        onLogout={handleLogout}
        menuItems={menuItems}
      />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <HeroSection
          title="Your Learning Dashboard"
          subtitle="Discover amazing courses and expand your knowledge"
          ctaButtons={[
            { label: "Explore Courses", href: "#courses", variant: "primary" },
            ...(user
              ? []
              : [{ label: "Sign In", href: "/websiteloginpage", variant: "secondary" }]),
          ]}
        />

        {/* Main Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* Error Message */}
          {error && (
            <motion.div
              className="bg-red-900/40 backdrop-blur-sm border border-red-700 p-4 rounded-xl mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-red-200">{error}</p>
            </motion.div>
          )}

          {/* Stats Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* <motion.div
              className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 hover:border-purple-500/50 transition-all"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600/30 rounded-xl">
                  <BookOpen className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Courses</p>
                  <p className="text-3xl font-bold text-white">{courses.length}</p>
                </div>
              </div>
            </motion.div> */}

            <motion.div
              className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-6 hover:border-pink-500/50 transition-all"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-600/30 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-pink-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Active Learning</p>
                  <p className="text-3xl font-bold text-white">{user ? "In Progress" : "Sign In"}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-600/30 rounded-xl">
                  <Sparkles className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">New Content</p>
                  <p className="text-3xl font-bold text-white">Weekly</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Search Section */}
          <motion.div
            className="mb-12"
            id="courses"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses by name..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-900/80 backdrop-blur-xl border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 text-white placeholder-gray-500 outline-none transition-all"
              />
            </div>
          </motion.div>

          {/* Featured Section */}
          <section className="mb-16">
            <motion.div
              className="flex items-center gap-3 mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Featured Courses
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {grouped.slice(0, 6).map(({ course }, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  delay={index * 0.1}
                  onClick={() => router.push(`/course/${course.id}`)}
                />
              ))}
            </div>

            {grouped.length === 0 && (
              <motion.div
                className="text-center py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-gray-400 text-lg">No courses found. Try adjusting your search.</p>
              </motion.div>
            )}
          </section>

          {/* All Courses Section */}
          {grouped.length > 6 && (
            <section>
              <motion.h2
                className="text-3xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                All Courses
              </motion.h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grouped.slice(6).map(({ course }, index) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    delay={(index + 6) * 0.05}
                    onClick={() => router.push(`/course/${course.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Animated Footer */}
      <AnimatedFooter links={footerLinks} />
    </div>
  );
}
