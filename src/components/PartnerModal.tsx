"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Partner } from "@/app/models/partnersModel";
import { UploadButton } from "@/utils/uploadthing";

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner?: Partner & { _id: string };
  type: "add" | "edit" | "view";
  onSuccess: () => void;
  categories?: string[];
  subCategories?: string[];
}

const PartnerModal: React.FC<PartnerModalProps> = ({
  isOpen,
  onClose,
  partner,
  type,
  onSuccess,
  categories = [],
  subCategories = [],
}) => {
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewSubCategory, setIsNewSubCategory] = useState(false);
  const [formData, setFormData] = useState<Partial<Partner>>({
    category: "",
    subCategory: "",
    brand: "",
    offer: "",
    discount: "",
    code: "",
    link: "",
    bookingMethod: "",
    imagePath: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (partner && (type === "edit" || type === "view")) {
      setFormData({
        category: partner.category || "",
        subCategory: partner.subCategory || "",
        brand: partner.brand || "",
        offer: partner.offer || "",
        discount: partner.discount || "",
        code: partner.code || "",
        link: partner.link || "",
        bookingMethod: partner.bookingMethod || "",
        imagePath: partner.imagePath || "",
      });
    } else {
      // Reset form for add mode
      setFormData({
        category: "",
        subCategory: "",
        brand: "",
        offer: "",
        discount: "",
        code: "",
        link: "",
        bookingMethod: "",
        imagePath: "",
      });
    }
  }, [partner, type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev || {}, [name]: value }));
  };

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, imagePath: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (type === "add") {
        await axios.post("/api/partners", formData);
      } else if (type === "edit" && partner) {
        await axios.put("/api/partners", { _id: partner._id, ...formData });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:pl-72.5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-lg"
      >
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {type === "add" ? "Add New Partner" : type === "edit" ? "Edit Partner" : "View Partner"}
            </h2>
            <button
              onClick={onClose}
              className="text-2xl text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category*
                </label>
                {type === "view" ? (
                  <input
                    type="text"
                    value={formData.category}
                    className="w-full rounded-md border border-gray-300 p-2"
                    disabled
                  />
                ) : isNewCategory ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 p-2"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsNewCategory(false)}
                      className="text-sm text-blue-500 hover:text-blue-700"
                    >
                      Use existing category
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 p-2"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat, index) => (
                        <option key={index} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsNewCategory(true)}
                      className="text-sm text-blue-500 hover:text-blue-700"
                    >
                      Add new category
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Sub Category*
                </label>
                {type === "view" ? (
                  <input
                    type="text"
                    value={formData.subCategory}
                    className="w-full rounded-md border border-gray-300 p-2"
                    disabled
                  />
                ) : isNewSubCategory ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 p-2"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsNewSubCategory(false)}
                      className="text-sm text-blue-500 hover:text-blue-700"
                    >
                      Use existing subcategory
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <select
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 p-2"
                      required
                    >
                      <option value="">Select a subcategory</option>
                      {subCategories.map((subCat, index) => (
                        <option key={index} value={subCat}>
                          {subCat}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsNewSubCategory(true)}
                      className="text-sm text-blue-500 hover:text-blue-700"
                    >
                      Add new subcategory
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Brand*
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                  disabled={type === "view"}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Offer*
                </label>
                <input
                  type="text"
                  name="offer"
                  value={formData.offer}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                  disabled={type === "view"}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Discount
                </label>
                <input
                  type="text"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 p-2"
                  disabled={type === "view"}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Code
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 p-2"
                  disabled={type === "view"}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Link*
                </label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                  disabled={type === "view"}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Booking Method*
                </label>
                <input
                  type="text"
                  name="bookingMethod"
                  value={formData.bookingMethod}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                  disabled={type === "view"}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Partner Image*
              </label>
              {type !== "view" ? (
                <UploadButton
                  endpoint="mediaUploader"
                  onClientUploadComplete={(res: any) => {
                    if (res && res.length > 0) {
                      handleImageUpload(res[0].url);
                    }
                  }}
                  onUploadError={(error: Error) => {
                    alert(`ERROR! ${error.message}`);
                  }}
                />
              ) : null}
              {formData.imagePath && (
                <div className="mt-2">
                  <img
                    src={formData.imagePath}
                    alt="Partner"
                    className="h-40 w-auto object-contain"
                  />
                </div>
              )}
            </div>

            {type !== "view" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="mr-2 rounded-md bg-gray-200 px-4 py-2 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-white"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Partner"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default PartnerModal;