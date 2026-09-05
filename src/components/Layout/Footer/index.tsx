import Link from "next/link";
import Logo from "../Header/Logo";
import { Icon } from "@iconify/react/dist/iconify.js";

const adminLinks = [
  { label: "Admin Dashboard", href: "/admin", icon: "tabler:layout-dashboard" },
  { label: "Quiz Manager", href: "/admin/quiz", icon: "tabler:clipboard-list" },
  { label: "Prompt Manager", href: "/admin/prompts", icon: "tabler:edit" },
  { label: "Article Manager", href: "/admin/articles", icon: "tabler:news" },
  { label: "Flashcard Manager", href: "/admin/flashcards", icon: "tabler:cards" },
  { label: "Notes Manager", href: "/admin/notes", icon: "tabler:notebook" },
  { label: "PYQ Manager", href: "/admin/pyq", icon: "tabler:archive" },
];

const studentLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Daily MCQs", href: "/quiz" },
  { label: "Answer Writing", href: "/answer-writing" },
  { label: "Study Hub", href: "/study" },
  { label: "Articles", href: "/articles" },
];

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-900">
      {/* Top gradient bar */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent" />

      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-6 pt-16 pb-8">

        {/* Top Grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 mb-12">

          {/* Brand */}
          <div className="flex flex-col gap-5">
            <Logo />
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              A minimalist, distraction-free UPSC prep platform — daily quizzes, mains writing, editorials, and study guides.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: "tabler:brand-twitter", href: "#" },
                { icon: "tabler:brand-instagram", href: "#" },
                { icon: "tabler:brand-youtube", href: "#" },
              ].map((s, i) => (
                <Link
                  key={i}
                  href={s.href}
                  className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:border-neutral-900 dark:hover:border-white hover:text-neutral-900 dark:hover:text-white transition-all duration-200"
                >
                  <Icon icon={s.icon} className="text-base" />
                </Link>
              ))}
            </div>
          </div>

          {/* Student Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-5">
              Study Portal
            </h3>
            <ul className="flex flex-col gap-2.5">
              {studentLinks.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-5 flex items-center gap-1.5">
              <Icon icon="tabler:shield" className="text-sm" />
              Admin Panel
            </h3>
            <ul className="flex flex-col gap-2.5">
              {adminLinks.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors group"
                  >
                    <Icon icon={item.icon} className="text-sm opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-5">
              Contact
            </h3>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <Icon icon="tabler:map-pin" className="text-base mt-0.5 text-neutral-400 shrink-0" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">New Delhi, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Icon icon="tabler:mail" className="text-base text-neutral-400 shrink-0" />
                <a href="mailto:info@upscprep.in" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors">
                  info@upscprep.in
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Icon icon="tabler:phone" className="text-base text-neutral-400 shrink-0" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">+91 98765 43210</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-neutral-100 dark:border-neutral-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-400 dark:text-neutral-600">
            &copy; {new Date().getFullYear()} UPSC Prep Portal. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/" className="text-xs text-neutral-400 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="text-xs text-neutral-400 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
