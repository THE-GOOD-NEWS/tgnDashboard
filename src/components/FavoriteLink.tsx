"use client";

import React from "react";
import Link from "next/link";

interface FavoriteLinkProps {
  id: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}

export default function FavoriteLink({
  id,
  href,
  className,
  children,
}: FavoriteLinkProps) {
  const handleClick = async () => {
    try {
      await fetch(`/api/favorites/click/${id}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error tracking click:", error);
    }
  };

  return (
    <Link href={href} target="_blank" onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}