"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { headerFont, subHeaderFont } from "../lib/fonts";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "/api/auth/login",
        {
          username,
          password,
        },
        {
          withCredentials: true,
        },
      );

      if (response.status === 200) {
        // Use router.push for client-side navigation
        router.push("/");
      }
    } catch (error: any) {
      setError(
        error.response?.data?.error || "Login failed. Please try again.",
      );
      setLoading(false);
    } finally {
    }
  };

  return (
    <div className=" flex min-h-screen items-center justify-center bg-accent/70">
      {/* <div className="flex min-h-screen items-center justify-center bg-black/30 px-4  py-12 backdrop-blur-[3px] sm:px-6 lg:px-8"> */}
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white px-6 py-8 shadow-2xl md:px-12 md:py-16">
        <div>
          <h2
            className={`${subHeaderFont.className} mt-6 text-center text-4xl font-bold tracking-normal text-black`}
          >
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm ">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="text-center text-sm text-red-500">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-creamey hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
      {/* </div> */}
    </div>
  );
}
