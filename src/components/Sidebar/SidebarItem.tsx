import React from "react";
import Link from "next/link";
import SidebarDropdown from "@/components/Sidebar/SidebarDropdown";
import { usePathname, useRouter } from "next/navigation";
import { subHeaderFont, headerFont } from "@/app/lib/fonts";
import axios from "axios";

const SidebarItem = ({ item, pageName, setPageName }: any) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = async (e: React.MouseEvent) => {
    // Handle logout regardless of label casing or route
    if (
      item.label?.toLowerCase() === "logout" ||
      item.route === "/api/auth/logout"
    ) {
      e.preventDefault();
      try {
        await axios.post("/api/auth/logout");
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        // Use Next.js router for SPA navigation
        router.replace("/login");
        // Fallback to hard navigation in case router is blocked
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.replace("/login");
          }
        }, 50);
      }
      return;
    }

    const updatedPageName =
      pageName !== item.label.toLowerCase() ? item.label.toLowerCase() : "";
    setPageName(updatedPageName);
  };

  const isActive = (item: any) => {
    if (item.route === pathname) return true;
    if (item.children) {
      return item.children.some((child: any) => isActive(child));
    }
    return false;
  };

  const isItemActive = isActive(item);

  return (
    <>
      <li>
        <Link
          href={item.route}
          onClick={handleClick}
          // Disable prefetch to ensure no accidental requests to API routes
          prefetch={false}
          className={`${headerFont.className} ${isItemActive ? "rounded-lg border-4 border-white bg-black  text-white " : ""} group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-white duration-300 ease-in-out hover:bg-backgroundColor hover:text-primary dark:hover:bg-meta-4`}
        >
          {item.icon}
          {item.label}
          {item.children && (
            <svg
              className={`top-1/ absolute right-4 -translate-y-1/2 fill-current ${
                pageName === item.label.toLowerCase() && "rotate-180"
              }`}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                fill=""
              />
            </svg>
          )}
        </Link>

        {item.children && (
          <div
            className={`translate transform overflow-hidden ${
              pageName !== item.label.toLowerCase() && "hidden"
            }`}
          >
            <SidebarDropdown item={item.children} />
          </div>
        )}
      </li>
    </>
  );
};

export default SidebarItem;
