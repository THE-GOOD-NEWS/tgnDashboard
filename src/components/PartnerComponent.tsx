"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Partner } from "@/app/models/partnersModel";
import PartnerModal from "./PartnerModal";

const PartnerComponent = () => {
  const [partners, setPartners] = useState<(Partner & { _id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "view">("add");
  const [selectedPartner, setSelectedPartner] = useState<
    (Partner & { _id: string }) | undefined
  >(undefined);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/partners");
      setPartners(response.data.data);

      // Extract unique categories and subcategories for filters
      const categorySet = new Set(
        response.data.data
          .map((p: Partner) => p.category || "")
          .filter(Boolean),
      );
      const subCategorySet = new Set(
        response.data.data
          .map((p: Partner) => p.subCategory || "")
          .filter(Boolean),
      );
      const uniqueCategories = Array.from(categorySet) as string[];
      const uniqueSubCategories = Array.from(subCategorySet) as string[];

      setCategories(uniqueCategories);
      setSubCategories(uniqueSubCategories);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch partners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleAddPartner = () => {
    setSelectedPartner(undefined);
    setModalType("add");
    setModalOpen(true);
  };

  const handleEditPartner = (partner: Partner & { _id: string }) => {
    setSelectedPartner(partner);
    setModalType("edit");
    setModalOpen(true);
  };

  const handleViewPartner = (partner: Partner & { _id: string }) => {
    setSelectedPartner(partner);
    setModalType("view");
    setModalOpen(true);
  };

  const handleDeletePartner = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this partner?")) {
      try {
        await axios.delete(`/api/partners?id=${id}`);
        fetchPartners();
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to delete partner");
      }
    }
  };

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      (partner.brand?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (partner.offer?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter
      ? (partner.category || "") === categoryFilter
      : true;
    const matchesSubCategory = subCategoryFilter
      ? (partner.subCategory || "") === subCategoryFilter
      : true;

    return matchesSearch && matchesCategory && matchesSubCategory;
  });

  return (
    <div className="rounded-sm border border-stroke bg-creamey px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
        {/* <h4 className="text-xl font-semibold text-creamey">
          Partners
        </h4> */}
        <button
          onClick={handleAddPartner}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          Add New Partner
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by brand or offer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2"
          />
        </div>
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-gray-300 p-2"
          >
            <option value="">All Categories</option>
            {categories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={subCategoryFilter}
            onChange={(e) => setSubCategoryFilter(e.target.value)}
            className="rounded-md border border-gray-300 p-2"
          >
            <option value="">All Sub Categories</option>
            {subCategories.map((subCategory, index) => (
              <option key={index} value={subCategory}>
                {subCategory}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-500">
          {error}
        </div>
      )}

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-primary text-left dark:bg-meta-4">
              <th className="min-w-[120px] px-4 py-4 font-medium text-creamey">
                Image
              </th>
              <th className="min-w-[120px] px-4 py-4 font-medium text-creamey">
                Brand
              </th>
              <th className="min-w-[120px] px-4 py-4 font-medium text-creamey">
                Category
              </th>
              <th className="min-w-[120px] px-4 py-4 font-medium text-creamey">
                Sub Category
              </th>
              {/* <th className="min-w-[150px] px-4 py-4 font-medium text-creamey">
                Offer
              </th> */}
              <th className="min-w-[100px] px-4 py-4 font-medium text-creamey">
                Discount
              </th>
              <th className="px-4 py-4 font-medium text-creamey">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredPartners.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center">
                  No partners found
                </td>
              </tr>
            ) : (
              filteredPartners.map((partner) => (
                <tr key={partner._id}>
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-strokedark">
                    {partner.imagePath ? (
                      <img
                        src={partner.imagePath}
                        alt={partner.brand || "Partner image"}
                        className="h-12 w-auto object-contain"
                      />
                    ) : (
                      <span className="text-gray-400">No image</span>
                    )}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-strokedark">
                    {partner.brand || "-"}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-strokedark">
                    {partner.category || "-"}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-strokedark">
                    {partner.subCategory || "-"}
                  </td>
                  {/* <td className="border-b border-[#eee] px-4 py-4 dark:border-strokedark">
                    {partner.offer || "-"}
                  </td> */}
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-strokedark">
                    {partner.discount || "-"}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-4 dark:border-strokedark">
                    <div className="flex items-center space-x-3.5">
                      <button
                        onClick={() => handleViewPartner(partner)}
                        className="hover:text-primary"
                      >
                        <svg
                          className="fill-current"
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.20624 8.99981 3.20624C14.5686 3.20624 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.85605 8.99999C2.4748 10.0406 4.89356 13.5562 8.99981 13.5562C13.1061 13.5562 15.5248 10.0406 16.1436 8.99999C15.5248 7.95936 13.1061 4.44374 8.99981 4.44374C4.89356 4.44374 2.4748 7.95936 1.85605 8.99999Z"
                            fill=""
                          />
                          <path
                            d="M9 11.3906C7.67812 11.3906 6.60938 10.3219 6.60938 9C6.60938 7.67813 7.67812 6.60938 9 6.60938C10.3219 6.60938 11.3906 7.67813 11.3906 9C11.3906 10.3219 10.3219 11.3906 9 11.3906ZM9 7.875C8.38125 7.875 7.875 8.38125 7.875 9C7.875 9.61875 8.38125 10.125 9 10.125C9.61875 10.125 10.125 9.61875 10.125 9C10.125 8.38125 9.61875 7.875 9 7.875Z"
                            fill=""
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditPartner(partner)}
                        className="hover:text-primary"
                      >
                        <svg
                          className="fill-current"
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M16.8754 11.6719C16.5379 11.6719 16.2285 11.9531 16.2285 12.3187V14.8219C16.2285 15.075 16.0316 15.2719 15.7785 15.2719H2.22227C1.96914 15.2719 1.77227 15.075 1.77227 14.8219V2.17185C1.77227 1.91872 1.96914 1.72185 2.22227 1.72185H4.72539C5.06289 1.72185 5.35227 1.41185 5.35227 1.07435C5.35227 0.736848 5.06289 0.426848 4.72539 0.426848H2.22227C1.2441 0.426848 0.451172 1.24185 0.451172 2.17185V14.8219C0.451172 15.7781 1.2441 16.5938 2.22227 16.5938H15.7785C16.7566 16.5938 17.5496 15.7781 17.5496 14.8219V12.3187C17.5496 11.9812 17.2691 11.6719 16.8754 11.6719Z"
                            fill=""
                          />
                          <path
                            d="M8.55074 12.3469C8.66324 12.4594 8.83199 12.5156 9.00074 12.5156C9.05699 12.5156 9.14199 12.4875 9.19824 12.4594L16.3896 5.24059L14.2646 3.11559L7.07324 10.3344C6.79699 10.6107 6.79699 11.0625 7.07324 11.3107L8.55074 12.3469Z"
                            fill=""
                          />
                          <path
                            d="M16.5921 1.28128C15.4202 0.109375 13.5077 0.109375 12.3358 1.28128L11.6155 2.00159L13.7686 4.1547L14.4889 3.43439C14.9358 2.98752 15.1921 2.40002 15.1921 1.78439C15.1921 1.16877 14.9358 0.581268 14.4889 0.134393L16.5921 1.28128Z"
                            fill=""
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeletePartner(partner._id)}
                        className="hover:text-red-500"
                      >
                        <svg
                          className="fill-current"
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502ZM7.67852 1.9969C7.67852 1.85627 7.79102 1.74377 7.93164 1.74377H10.0973C10.2379 1.74377 10.3504 1.85627 10.3504 1.9969V2.47502H7.70664V1.9969H7.67852ZM4.02227 3.96565C4.02227 3.85315 4.10664 3.74065 4.24727 3.74065H13.7535C13.866 3.74065 13.9785 3.82502 13.9785 3.96565V4.8094C13.9785 4.9219 13.8941 5.0344 13.7535 5.0344H4.24727C4.13477 5.0344 4.02227 4.95002 4.02227 4.8094V3.96565ZM11.7285 16.2563H6.27227C5.79414 16.2563 5.40039 15.8906 5.37227 15.3844L4.95039 6.2719H13.0785L12.6566 15.3844C12.6004 15.8625 12.2066 16.2563 11.7285 16.2563Z"
                            fill=""
                          />
                          <path
                            d="M9.00039 9.11255C8.66289 9.11255 8.35352 9.3938 8.35352 9.75942V13.3313C8.35352 13.6688 8.63477 13.9782 9.00039 13.9782C9.33789 13.9782 9.64727 13.6969 9.64727 13.3313V9.75942C9.64727 9.3938 9.33789 9.11255 9.00039 9.11255Z"
                            fill=""
                          />
                          <path
                            d="M10.8789 9.67504C10.5414 9.64692 10.2602 9.90004 10.232 10.2375L10.0039 13.2375C9.97577 13.5469 10.1852 13.8563 10.4664 13.8563C10.4664 13.8563 10.4664 13.8563 10.4945 13.8563C10.8039 13.8563 11.0414 13.6188 11.0695 13.3094L11.2977 10.3094C11.3258 9.90004 11.0977 9.70317 10.8789 9.67504Z"
                            fill=""
                          />
                          <path
                            d="M7.11365 9.67504C6.89553 9.70317 6.66741 9.90004 6.69553 10.3094L6.92365 13.3094C6.95178 13.6188 7.18928 13.8563 7.4986 13.8563C7.52673 13.8563 7.52673 13.8563 7.55485 13.8563C7.86423 13.8281 8.0636 13.5469 8.03548 13.2375L7.8074 10.2375C7.77928 9.90004 7.49803 9.64692 7.11365 9.67504Z"
                            fill=""
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <PartnerModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          partner={selectedPartner}
          type={modalType}
          onSuccess={fetchPartners}
          categories={categories}
          subCategories={subCategories}
        />
      )}
    </div>
  );
};

export default PartnerComponent;
