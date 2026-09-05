"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import Loader from "@/components/Common/Loader";
import { Icon } from "@iconify/react/dist/iconify.js";

const AdminSignUp = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const value = Object.fromEntries(data.entries());

    try {
      const res = await fetch("/api/admin-register", {
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
      toast.success("Admin account created. Please sign in.");
      setLoading(false);
      router.push("/");
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Shield badge */}
      <div className="flex justify-center mb-5">
        <div className="w-12 h-12 rounded-2xl bg-neutral-950 dark:bg-white flex items-center justify-center shadow-lg">
          <Icon icon="tabler:shield-plus" className="text-2xl text-white dark:text-neutral-950" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 tracking-wide">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            placeholder="Admin name"
            required
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white outline-none transition placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-900 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-800"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 tracking-wide">
            Admin Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="admin@example.com"
            required
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white outline-none transition placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-900 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-800"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 tracking-wide">
            Secret Key
          </label>
          <input
            type="password"
            name="secretKey"
            placeholder="Admin registration key"
            required
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-900 dark:text-white outline-none transition placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-900 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-800"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 tracking-wide">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Min. 8 characters"
              required
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 pr-11 text-sm text-neutral-900 dark:text-white outline-none transition placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-900 dark:focus:border-white focus:bg-white dark:focus:bg-neutral-800"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              <Icon icon={showPassword ? "tabler:eye-off" : "tabler:eye"} className="text-lg" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 px-6 py-3 text-sm font-semibold text-white dark:text-neutral-950 transition-all duration-200 disabled:opacity-50 mt-2 shadow-lg"
        >
          {loading ? <Loader /> : (
            <>
              <Icon icon="tabler:shield-plus" className="text-base" />
              Register Admin Account
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-neutral-400 dark:text-neutral-500">
        Requires a valid admin secret key. Contact the system owner.
      </p>
    </>
  );
};

export default AdminSignUp;
