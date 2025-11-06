"use client";
import { GoPackage } from "react-icons/go";
import { BsCollection } from "react-icons/bs";
import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SidebarItem from "@/components/Sidebar/SidebarItem";
import ClickOutside from "@/components/ClickOutside";
import useLocalStorage from "@/hooks/useLocalStorage";
import { BsHandbag } from "react-icons/bs";
import { GiClothes, GiThreeFriends } from "react-icons/gi";
import { BiMailSend } from "react-icons/bi";
import { MdOutlineLoyalty, MdPlaylistPlay } from "react-icons/md";
import { IoStarSharp } from "react-icons/io5";

import { CiVideoOn } from "react-icons/ci";
import { LiaShippingFastSolid } from "react-icons/lia";
import { lifeyFont, thirdFont } from "@/app/lib/fonts";
import { FiLogOut } from "react-icons/fi";
import { RiCoupon3Line } from "react-icons/ri";
import { TiUserAddOutline } from "react-icons/ti";
import { PiBooks, PiBooksLight } from "react-icons/pi";
import { LuNotebookPen } from "react-icons/lu";
import { FiKey } from "react-icons/fi";

import { TfiNotepad } from "react-icons/tfi";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const menuGroups = [
  {
    name: "MENU",
    menuItems: [
      {
        icon: (
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.10322 0.956299H2.53135C1.5751 0.956299 0.787598 1.7438 0.787598 2.70005V6.27192C0.787598 7.22817 1.5751 8.01567 2.53135 8.01567H6.10322C7.05947 8.01567 7.84697 7.22817 7.84697 6.27192V2.72817C7.8751 1.7438 7.0876 0.956299 6.10322 0.956299ZM6.60947 6.30005C6.60947 6.5813 6.38447 6.8063 6.10322 6.8063H2.53135C2.2501 6.8063 2.0251 6.5813 2.0251 6.30005V2.72817C2.0251 2.44692 2.2501 2.22192 2.53135 2.22192H6.10322C6.38447 2.22192 6.60947 2.44692 6.60947 2.72817V6.30005Z"
              fill=""
            />
            <path
              d="M15.4689 0.956299H11.8971C10.9408 0.956299 10.1533 1.7438 10.1533 2.70005V6.27192C10.1533 7.22817 10.9408 8.01567 11.8971 8.01567H15.4689C16.4252 8.01567 17.2127 7.22817 17.2127 6.27192V2.72817C17.2127 1.7438 16.4252 0.956299 15.4689 0.956299ZM15.9752 6.30005C15.9752 6.5813 15.7502 6.8063 15.4689 6.8063H11.8971C11.6158 6.8063 11.3908 6.5813 11.3908 6.30005V2.72817C11.3908 2.44692 11.6158 2.22192 11.8971 2.22192H15.4689C15.7502 2.22192 15.9752 2.44692 15.9752 2.72817V6.30005Z"
              fill=""
            />
            <path
              d="M6.10322 9.92822H2.53135C1.5751 9.92822 0.787598 10.7157 0.787598 11.672V15.2438C0.787598 16.2001 1.5751 16.9876 2.53135 16.9876H6.10322C7.05947 16.9876 7.84697 16.2001 7.84697 15.2438V11.7001C7.8751 10.7157 7.0876 9.92822 6.10322 9.92822ZM6.60947 15.272C6.60947 15.5532 6.38447 15.7782 6.10322 15.7782H2.53135C2.2501 15.7782 2.0251 15.5532 2.0251 15.272V11.7001C2.0251 11.4188 2.2501 11.1938 2.53135 11.1938H6.10322C6.38447 11.1938 6.60947 11.4188 6.60947 11.7001V15.272Z"
              fill=""
            />
            <path
              d="M15.4689 9.92822H11.8971C10.9408 9.92822 10.1533 10.7157 10.1533 11.672V15.2438C10.1533 16.2001 10.9408 16.9876 11.8971 16.9876H15.4689C16.4252 16.9876 17.2127 16.2001 17.2127 15.2438V11.7001C17.2127 10.7157 16.4252 9.92822 15.4689 9.92822ZM15.9752 15.272C15.9752 15.5532 15.7502 15.7782 15.4689 15.7782H11.8971C11.6158 15.7782 11.3908 15.5532 11.3908 15.272V11.7001C11.3908 11.4188 11.6158 11.1938 11.8971 11.1938H15.4689C15.7502 11.1938 15.9752 11.4188 15.9752 11.7001V15.272Z"
              fill=""
            />
          </svg>
        ),
        label: "Overview",
        route: "/",
      },
      {
        icon: <GoPackage />,
        label: "Orders",
        route: "/pages/orders",
      },
      {
        icon: <MdPlaylistPlay />,
        label: "Playslists",
        route: "/pages/playlists",
      },
      {
        icon: <CiVideoOn />,

        label: "Videos",
        route: "/pages/videos",
      },
      {
        icon: <BsHandbag />,
        label: "Products",
        route: "/pages/products",
      },
      {
        icon: <GiClothes />,
        label: "Categories",
        route: "/pages/categories",
      },
      {
        icon: <BsCollection />,
        label: "Collections",
        route: "/pages/collections",
      },
      {
        icon: <IoStarSharp />,
        label: "Favorites",
        route: "/pages/favorites",
      },
      {
        icon: <MdOutlineLoyalty />,
        label: "Loyalty",
        route: "/pages/loyalty/rewards",
      },
      {
        icon: <GiThreeFriends />,
        label: "Partners",
        route: "/pages/partners",
      },
      {
        icon: <BsCollection />,

        label: "Banners & Popups",
        route: "/pages/banners",
      },
      {
        icon: <PiBooks />,

        label: "Blogs",
        route: "/pages/blogs",
      },
      {
        icon: <RiCoupon3Line />,
        label: "Discounts",
        route: "/discounts",
      },
      {
        icon: <LuNotebookPen />,
        label: "Packages",
        route: "/pages/packages",
      },
      {
        icon: (
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.0002 7.79065C11.0814 7.79065 12.7689 6.1594 12.7689 4.1344C12.7689 2.1094 11.0814 0.478149 9.0002 0.478149C6.91895 0.478149 5.23145 2.1094 5.23145 4.1344C5.23145 6.1594 6.91895 7.79065 9.0002 7.79065ZM9.0002 1.7719C10.3783 1.7719 11.5033 2.84065 11.5033 4.16252C11.5033 5.4844 10.3783 6.55315 9.0002 6.55315C7.62207 6.55315 6.49707 5.4844 6.49707 4.16252C6.49707 2.84065 7.62207 1.7719 9.0002 1.7719Z"
              fill=""
            />
            <path
              d="M10.8283 9.05627H7.17207C4.16269 9.05627 1.71582 11.5313 1.71582 14.5406V16.875C1.71582 17.2125 1.99707 17.5219 2.3627 17.5219C2.72832 17.5219 3.00957 17.2407 3.00957 16.875V14.5406C3.00957 12.2344 4.89394 10.3219 7.22832 10.3219H10.8564C13.1627 10.3219 15.0752 12.2063 15.0752 14.5406V16.875C15.0752 17.2125 15.3564 17.5219 15.7221 17.5219C16.0877 17.5219 16.3689 17.2407 16.3689 16.875V14.5406C16.2846 11.5313 13.8377 9.05627 10.8283 9.05627Z"
              fill=""
            />
          </svg>
        ),
        label: "Users",
        route: "/pages/users",
      },
      {
        icon: <TiUserAddOutline />,
        label: "Subscriptions",
        route: "/pages/subscriptions",
      },
      {
        icon: (
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 24 24"
          >
            <path
              d="M5 12H19M5 12L9 8M5 12L9 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M12 4V20M12 4L16 8M12 4L8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        ),
        label: "Analytics",
        route: "/pages/analytics/subscriptions",
      },
      {
        icon: <BiMailSend />,
        label: "Newsletters",
        route: "/pages/newsletters",
      },
      {
        icon: (
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16.3125 0H1.6875C0.759375 0 0 0.759375 0 1.6875V16.3125C0 17.2406 0.759375 18 1.6875 18H16.3125C17.2406 18 18 17.2406 18 16.3125V1.6875C18 0.759375 17.2406 0 16.3125 0ZM16.3125 16.3125H1.6875V1.6875H16.3125V16.3125Z"
              fill=""
            />
            <path d="M3.375 3.375H14.625V5.0625H3.375V3.375Z" fill="" />
            <path d="M3.375 6.75H14.625V8.4375H3.375V6.75Z" fill="" />
            <path d="M3.375 10.125H14.625V11.8125H3.375V10.125Z" fill="" />
            <path d="M3.375 13.5H9.5625V15.1875H3.375V13.5Z" fill="" />
          </svg>
        ),
        label: "Interactions",
        route: "/interactions",
      },
      {
        icon: <LiaShippingFastSolid />,
        label: "Shipping",
        route: "/pages/shipping",
      },
      {
        icon: <FiKey />,
        label: "Logins",
        route: "/pages/logins",
      },
      {
        icon: <FiLogOut />,
        label: "Logout",
        route: "/api/auth/logout",
      },
    ],
  },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const [pageName, setPageName] = useLocalStorage("selectedMenu", "dashboard");

  return (
    <ClickOutside onClick={() => setSidebarOpen(false)}>
      <aside
        className={`fixed left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-primary duration-300 ease-linear dark:bg-boxdark lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* <!-- SIDEBAR HEADER --> */}
        <div className="flex items-center justify-center gap-2 border-b border-white bg-primary px-6 py-5.5 lg:py-6.5">
          <Link href="/">
            <Image
              width={176}
              height={32}
              src={"/logo/WifeyforLifeyPrimaryLogowithSloganCream.png"}
              alt="Logo"
              priority
            />
          </Link>

          {/* <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            className="block lg:hidden"
          >
            <svg
              className="fill-current"
              width="20"
              height="18"
              viewBox="0 0 20 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
                fill=""
              />
            </svg>
          </button> */}
        </div>
        {/* <!-- SIDEBAR HEADER --> */}

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          {/* <!-- Sidebar Menu --> */}
          <nav
            className={`${thirdFont.className} mt-5 px-4 py-4 lg:mt-9 lg:px-6`}
          >
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <ul className="mb-6 flex flex-col gap-2">
                  {group.menuItems.map((menuItem, menuIndex) => (
                    <SidebarItem
                      key={menuIndex}
                      item={menuItem}
                      pageName={pageName}
                      setPageName={setPageName}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          {/* <!-- Sidebar Menu --> */}
        </div>
      </aside>
    </ClickOutside>
  );
};

export default Sidebar;
