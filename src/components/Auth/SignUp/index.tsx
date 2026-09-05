"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SocialSignUp from "../SocialSignUp";
import { useState } from "react";
import Loader from "@/components/Common/Loader";
import { Icon } from "@iconify/react/dist/iconify.js";

const SignUp = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const value = Object.fromEntries(data.entries());

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Registration failed");
        setLoading(false);
        return;
      }
      toast.success("Account created! Please sign in.");
      setLoading(false);
      router.push("/");
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <SocialSignUp />

      <div className="relative my-5 flex items-center">
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
        <span className="mx-3 text-xs font-medium text-neutral-400 dark:text-neutral-600 uppercase tracking-widest whitespace-nowrap">
          or email
        </span>
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 tracking-wide">Full Name</label>
          <input
            type="text"
            name="name"
            placeholder="Your name"
            required
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white outline-none transition placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-900 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-800"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 tracking-wide">Email</label>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white outline-none transition placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-900 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-800"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 tracking-wide">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Min. 8 characters"
              required
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 pr-11 text-sm text-neutral-900 dark:text-white outline-none transition placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-900 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-800"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
              <Icon icon={showPassword ? "tabler:eye-off" : "tabler:eye"} className="text-lg" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-950 dark:from-white dark:to-neutral-200 hover:from-neutral-700 hover:to-neutral-900 dark:hover:from-neutral-100 dark:hover:to-white px-6 py-3 text-sm font-semibold text-white dark:text-neutral-950 transition-all duration-200 disabled:opacity-50 mt-1 shadow-md"
        >
          {loading ? <Loader /> : "Create Account"}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-neutral-400 dark:text-neutral-500">
        By signing up, you agree to our{" "}
        <a href="/#" className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors">Privacy Policy</a>
        {" "}&amp;{" "}
        <a href="/#" className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors">Terms</a>.
      </p>
    </>
  );
};

export default SignUp;
