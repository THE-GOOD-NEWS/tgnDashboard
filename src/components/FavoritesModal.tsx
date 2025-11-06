"use client";

import React, { useState, useEffect } from "react";
import { UploadButton } from "@/utils/uploadthing";

interface Favorite {
  _id?: string;
  title: string;
  image: string;
  link: string;
  category: string;
  subCategory: string;
  brand: string;
  price: number;
  maxPrice: number;
}

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Favorite) => void;
  initialData?: Favorite;
  categories?: string[];
  subCategories?: string[];
}

const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories = [],
  subCategories = [],
}) => {
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewSubCategory, setIsNewSubCategory] = useState(false);
  const [formData, setFormData] = useState<Favorite>({
    title: initialData?.title || "",
    image: initialData?.image || "",
    link: initialData?.link || "",
    category: initialData?.category || "",
    subCategory: initialData?.subCategory || "",
    brand: initialData?.brand || "",
    price: initialData?.price || 0,
    maxPrice: initialData?.maxPrice || 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setIsNewCategory(false);
      setIsNewSubCategory(false);
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "priceRange" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  // Map priceRange numbers to readable labels

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-scroll rounded-lg bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">
          {initialData?._id ? "Edit Favorite" : "Add New Favorite"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Image</label>
            {formData.image && (
              <div className="relative mb-2 h-32 w-full">
                <img
                  src={formData.image}
                  alt={formData.title}
                  className="h-full w-auto object-cover"
                />
              </div>
            )}
            <UploadButton
              className="w-[40%] rounded-lg bg-primary"
              endpoint="mediaUploader"
              onClientUploadComplete={(res) => {
                if (res && res.length > 0) {
                  setFormData((prev) => ({
                    ...prev,
                    image: res[0].url,
                  }));
                }
              }}
              onUploadError={(error: Error) => {
                console.error("Upload error:", error);
              }}
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Link</label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Category</label>
            {isNewCategory ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2"
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
                  className="w-full rounded-md border px-3 py-2"
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
                  className="w-[40%] text-sm text-blue-500 hover:text-blue-700"
                >
                  Add new category
                </button>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">
              Subcategory
            </label>
            {isNewSubCategory ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2"
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
                  className="w-full rounded-md border px-3 py-2"
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
                  className="w-[40%] text-sm text-blue-500 hover:text-blue-700"
                >
                  Add new subcategory
                </button>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Brand</label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Price</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">
              Max Price
            </label>
            <input
              type="number"
              name="maxPrice"
              value={formData.maxPrice}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
              min="0"
              step="1"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-white"
            >
              {initialData?._id ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FavoritesModal;
