"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Logo from "./Logo";
import Signin from "@/components/Auth/SignIn";
import SignUp from "@/components/Auth/SignUp";
import AdminSignin from "@/components/Auth/AdminSignIn";
import AdminSignUp from "@/components/Auth/AdminSignUp";
import { Icon } from "@iconify/react/dist/iconify.js";

type ModalMode = "student-signin" | "student-signup" | "admin-signin" | "admin-signup";

const Header: React.FC = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [navbarOpen, setNavbarOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => setSticky(window.scrollY >= 80);

  const handleClickOutside = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      setModalMode(null);
    }
    if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && navbarOpen) {
      setNavbarOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    const handleExternalOpen = (e: Event) => {
      const mode = (e as CustomEvent).detail as ModalMode;
      if (mode) setModalMode(mode);
    };
    window.addEventListener("open-header-modal", handleExternalOpen);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("open-header-modal", handleExternalOpen);
    };
  }, [navbarOpen, modalMode]);

  useEffect(() => {
    document.body.style.overflow = (modalMode || navbarOpen) ? "hidden" : "";
  }, [modalMode, navbarOpen]);

  const isAdmin = session?.user && (session.user as any).role === "admin";

  const navigationItems = status === "authenticated"
    ? [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Quizzes", href: "/quiz" },
        { label: "Answer Writing", href: "/answer-writing" },
        { label: "Study Hub", href: "/study" },
        { label: "Articles", href: "/articles" },
        ...(isAdmin ? [{ label: "Admin", href: "/admin" }] : []),
      ]
    : [
        { label: "Home", href: "/" },
        { label: "Courses", href: "/#courses" },
        { label: "Mentors", href: "/#mentor" },
        { label: "Testimonials", href: "/#testimonial" },
        { label: "Docs", href: "/documentation" },
      ];

  const isAdminModal = modalMode === "admin-signin" || modalMode === "admin-signup";

  const modalContent = {
    "student-signin": {
      title: "Welcome back",
      subtitle: "Sign in to continue your UPSC prep",
      component: <Signin />,
    },
    "student-signup": {
      title: "Create an account",
      subtitle: "Join thousands of UPSC aspirants",
      component: <SignUp />,
    },
    "admin-signin": {
      title: "Admin Access",
      subtitle: "Restricted to system administrators",
      component: <AdminSignin />,
    },
    "admin-signup": {
      title: "Register Admin",
      subtitle: "Create a new admin account",
      component: <AdminSignUp />,
    },
  };

  return (
    <header
      className={`fixed top-0 z-40 w-full transition-all duration-300 ${
        sticky
          ? "border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl shadow-sm py-3"
          : "border-b border-transparent bg-white dark:bg-neutral-950 py-4"
      }`}
    >
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md flex items-center justify-between px-6">
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex flex-grow items-center gap-7 justify-center">
          {navigationItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={index}
                href={item.href}
                className={`text-sm font-medium tracking-tight transition-colors duration-200 ${
                  isActive
                    ? "text-neutral-950 dark:text-white font-semibold"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="block h-0.5 w-full bg-gradient-to-r from-neutral-800 to-neutral-400 dark:from-white dark:to-neutral-400 rounded-full mt-0.5" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full border-2 border-neutral-200 dark:border-neutral-800 animate-spin border-t-neutral-900 dark:border-t-white" />
          ) : status === "authenticated" ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {isAdmin ? "Admin" : "Student"}
                </span>
              </div>
              <span className="hidden sm:inline text-sm font-medium text-neutral-900 dark:text-white max-w-[120px] truncate">
                {session?.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <button
                className="hidden sm:flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm font-medium transition-colors px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900"
                onClick={() => setModalMode("admin-signin")}
              >
                <Icon icon="tabler:shield" className="text-base" />
                <span className="hidden md:inline">Admin</span>
              </button>
              <button
                className="bg-white text-neutral-900 border border-neutral-200 dark:bg-neutral-900 dark:text-white dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200"
                onClick={() => setModalMode("student-signin")}
              >
                Sign In
              </button>
              <button
                className="bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm"
                onClick={() => setModalMode("student-signup")}
              >
                Sign Up
              </button>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setNavbarOpen(!navbarOpen)}
            className="block lg:hidden p-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <Icon icon={navbarOpen ? "tabler:x" : "tabler:menu-2"} className="text-xl" />
          </button>
        </div>
      </div>

      {/* ============ AUTH MODAL ============ */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
          <div
            ref={modalRef}
            className={`relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
              isAdminModal
                ? "bg-neutral-950 dark:bg-white border-neutral-800 dark:border-neutral-200"
                : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
            }`}
            style={{ animation: "modalIn 0.18s cubic-bezier(0.34,1.56,0.64,1)" }}
          >
            {/* Close */}
            <button
              onClick={() => setModalMode(null)}
              className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors z-10 ${
                isAdminModal
                  ? "bg-neutral-800 dark:bg-neutral-200 text-neutral-400 dark:text-neutral-600 hover:text-white dark:hover:text-neutral-950"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Icon icon="tabler:x" className="text-sm" />
            </button>

            {/* Tab switcher — Student / Admin */}
            <div className="flex border-b border-neutral-100 dark:border-neutral-900">
              <button
                onClick={() => setModalMode("student-signin")}
                className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
                  !isAdminModal
                    ? "text-neutral-900 dark:text-white border-b-2 border-neutral-900 dark:border-white"
                    : "text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400"
                }`}
              >
                Student
              </button>
              <button
                onClick={() => setModalMode("admin-signin")}
                className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors ${
                  isAdminModal
                    ? "text-neutral-900 dark:text-white border-b-2 border-neutral-900 dark:border-white"
                    : "text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400"
                }`}
              >
                <Icon icon="tabler:shield" className="text-sm" />
                Admin
              </button>
            </div>

            {/* Modal body */}
            <div className="p-8">
              {/* Sign In / Sign Up toggle */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => setModalMode(isAdminModal ? "admin-signin" : "student-signin")}
                  className={`text-sm font-medium pb-0.5 transition-colors border-b-2 ${
                    (modalMode === "student-signin" || modalMode === "admin-signin")
                      ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
                      : "border-transparent text-neutral-400 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-400"
                  }`}
                >
                  Sign In
                </button>
                <span className="text-neutral-200 dark:text-neutral-700">|</span>
                <button
                  onClick={() => setModalMode(isAdminModal ? "admin-signup" : "student-signup")}
                  className={`text-sm font-medium pb-0.5 transition-colors border-b-2 ${
                    (modalMode === "student-signup" || modalMode === "admin-signup")
                      ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
                      : "border-transparent text-neutral-400 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-400"
                  }`}
                >
                  {isAdminModal ? "Register" : "Sign Up"}
                </button>
              </div>

              {/* Subtitle */}
              <p className={`text-center text-xs mb-6 tracking-wide ${
                isAdminModal ? "text-neutral-500 dark:text-neutral-400" : "text-neutral-500 dark:text-neutral-400"
              }`}>
                {modalMode && modalContent[modalMode].subtitle}
              </p>

              {/* Form */}
              <div className={isAdminModal ? "text-white dark:text-neutral-950" : ""}>
                {modalMode && modalContent[modalMode].component}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      {navbarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setNavbarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        ref={mobileMenuRef}
        className={`lg:hidden fixed top-0 right-0 h-full w-72 bg-white dark:bg-neutral-950 shadow-2xl border-l border-neutral-100 dark:border-neutral-900 transform transition-transform duration-300 ${
          navbarOpen ? "translate-x-0" : "translate-x-full"
        } z-50 p-6 flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-center justify-between mb-8">
            <Logo />
            <button
              onClick={() => setNavbarOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
            >
              <Icon icon="tabler:x" className="text-sm" />
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {navigationItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => setNavbarOpen(false)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium tracking-tight transition-colors ${
                    isActive
                      ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-neutral-100 dark:border-neutral-900 pt-6">
          {status === "authenticated" ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{isAdmin ? "Admin" : "Student"}</span>
              </div>
              <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{session?.user?.name}</span>
              <button
                onClick={() => { setNavbarOpen(false); signOut({ callbackUrl: "/" }); }}
                className="w-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 py-2.5 rounded-full text-sm font-semibold"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setNavbarOpen(false); setModalMode("admin-signin"); }}
                className="w-full flex items-center justify-center gap-2 border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 py-2.5 rounded-full text-sm font-medium"
              >
                <Icon icon="tabler:shield" className="text-base" /> Admin Access
              </button>
              <button
                onClick={() => { setNavbarOpen(false); setModalMode("student-signin"); }}
                className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white py-2.5 rounded-full text-sm font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => { setNavbarOpen(false); setModalMode("student-signup"); }}
                className="w-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 py-2.5 rounded-full text-sm font-semibold"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </header>
  );
};

export default Header;
