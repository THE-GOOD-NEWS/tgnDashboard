"use client";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userRole");
    }
    return null;
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (userRole === "guestWriter" && (!pathname || !pathname.startsWith("/pages/articles"))) {
      router.replace("/pages/articles");
    }
  }, [userRole, pathname, router]);

  useEffect(() => {
    axios
      .get("/api/auth/me")
      .then((res) => {
        const role = res.data?.user?.role;
        if (role) {
          setUserRole(role);
          if (typeof window !== "undefined") {
            localStorage.setItem("userRole", role);
          }
          if (role === "guestWriter" && (!pathname || !pathname.startsWith("/pages/articles"))) {
            router.replace("/pages/articles");
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching user profile in DefaultLayout:", err);
      });
  }, [pathname, router]);

  return (
    <>
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className="flex">
        {/* <!-- ===== Sidebar Start ===== --> */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          userRole={userRole}
        />
        {/* <!-- ===== Sidebar End ===== --> */}

        {/* <!-- ===== Content Area Start ===== --> */}
        <div className="relative flex flex-1 flex-col lg:ml-72.5">
          {/* <!-- ===== Header Start ===== --> */}
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          {/* <!-- ===== Header End ===== --> */}

          {/* <!-- ===== Main Content Start ===== --> */}
          <main className="bg-creamey">
            <div className="mx-auto bg-creamey max-w-screen-2xl ">
              {children}
            </div>
          </main>
          {/* <!-- ===== Main Content End ===== --> */}
        </div>
        {/* <!-- ===== Content Area End ===== --> */}
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </>
  );
}
