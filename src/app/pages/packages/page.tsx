"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Ipackage } from "@/interfaces/interfaces";
import PackageComponent from "@/components/PackageComponent";
import PackageModal from "@/components/PackageModal";
import { headerFont } from "@/app/lib/fonts";
import { IoAdd } from "react-icons/io5";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

const PackagesPage = () => {
  const [packages, setPackages] = useState<(Ipackage & { _id: string })[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<
    (Ipackage & { _id: string }) | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/packages?all=true");
      setPackages(response.data.data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPackage = () => {
    setSelectedPackage(undefined);
    setIsModalOpen(true);
  };

  const handleEditPackage = (packageItem: Ipackage & { _id: string }) => {
    setSelectedPackage(packageItem);
    setIsModalOpen(true);
  };

  const filteredPackages = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex min-h-[calc(100vh-124px)] w-full items-center justify-center">
          <div className="text-xl">Loading packages...</div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="min-h-[calc(100vh-124px)] w-full p-4">
        <div className="mb-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-primary/60 bg-creamey px-4 py-2 placeholder:text-primary/50 focus:outline-none focus:ring-2 focus:ring-primaryLight"
              />
            </div>

            <button
              onClick={handleAddPackage}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-white transition-colors hover:bg-secondary"
            >
              <IoAdd className="h-5 w-5" />
              Add Package
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredPackages.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              {searchTerm
                ? "No packages found matching your search."
                : "No packages available."}
            </div>
          ) : (
            filteredPackages.map((packageItem) => (
              <PackageComponent
                key={packageItem._id}
                package={packageItem}
                setPackages={setPackages}
              />
            ))
          )}
        </div>

        <PackageModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPackage(undefined);
          }}
          package={selectedPackage}
          setPackages={setPackages}
        />
      </div>
    </DefaultLayout>
  );
};

export default PackagesPage;
