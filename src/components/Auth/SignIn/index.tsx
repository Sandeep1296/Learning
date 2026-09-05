"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import SocialSignIn from "../SocialSignIn";
import Loader from "@/components/Common/Loader";
import { Icon } from "@iconify/react/dist/iconify.js";

const Signin = () => {
  const router = useRouter();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginUser = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const callback = await signIn("credentials", { ...loginData, redirect: false });
    if (callback?.error) {
      toast.error(callback.error);
      setLoading(false);
      return;
    }
    if (callback?.ok) {
      toast.success("Login successful");
      setLoading(false);
      router.push("/");
    }
  };

  return (
    <>
      <SocialSignIn />

      <div className="relative my-5 flex items-center">
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
        <span className="mx-3 text-xs font-medium text-neutral-400 dark:text-neutral-600 uppercase tracking-widest whitespace-nowrap">
          or email
        </span>
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <form onSubmit={loginUser} className="flex flex-col gap-3.5">
        <div>
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 tracking-wide">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={loginData.email}
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            required
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white outline-none transition placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-900 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-800"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 tracking-wide">Password</label>
            <Link href="/forgot-password" className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline underline-offset-2 transition-colors">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
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
          {loading ? <Loader /> : "Sign In"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
        New here?{" "}
        <button
          type="button"
          onClick={() => {
            const evt = new CustomEvent("open-signup-modal");
            window.dispatchEvent(evt);
          }}
          className="font-medium text-neutral-900 dark:text-white underline underline-offset-2 hover:no-underline transition-all"
        >
          Create an account
        </button>
      </p>
    </>
  );
};

export default Signin;