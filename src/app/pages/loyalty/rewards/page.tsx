"use client";
import React, { useState } from "react";
import RoyaltyPointsTable from "@/app/components/RewardsTable";
import AddRoyaltyPointModal from "@/app/components/AddRewardModal";
import { ILoyaltyBonus } from "@/interfaces/interfaces";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Link from "next/link";

const RoyaltyPointsPage = () => {
  const [royaltyPoints, setRoyaltyPoints] = useState<ILoyaltyBonus[]>([]);
  const [refresh, setRefresh] = useState(0);

  // Handler to add new loyalty point to the table
  const handleRoyaltyPointAdded = (royaltyPoint: ILoyaltyBonus) => {
    setRoyaltyPoints((prev) => [royaltyPoint, ...prev]);
    setRefresh((r) => r + 1); // force table refresh if needed
  };

  return (
    <DefaultLayout>
      <div className="px-2 py-4 md:px-4 md:py-8">
        <div className="flex w-full justify-between">
          <Link
            className="text-primary underline hover:cursor-pointer"
            href={"/pages/loyalty/transactions"}
          >
            Transactions
          </Link>
          <h1 className="mb-4 text-2xl font-bold text-primary">
            Manage Loyalty Bonuses
          </h1>
          <AddRoyaltyPointModal onRoyaltyPointAdded={handleRoyaltyPointAdded} />
        </div>
        <RoyaltyPointsTable key={refresh} />
      </div>
    </DefaultLayout>
  );
};
export default RoyaltyPointsPage;
