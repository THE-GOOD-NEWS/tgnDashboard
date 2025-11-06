"use client";
import { thirdFont } from "@/app/lib/fonts";
import CategoryModal from "@/components/CategoryModal";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { Category, SubCategory } from "@/interfaces/interfaces";
import axios from "axios";
import React, { useEffect, useState } from "react";

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalType, setModalType] = useState<
    "edit" | "delete" | "add" | "addSub" | "editSub" | "deleteSub" | null
  >(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>({
    _id: "",
    categoryName: "",
    description: "",
    imageURL: "",
  });
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory>({
    _id: "",
    subCategoryName: "",
    description: "",
    categoryID: {} as Category,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, subCategoriesRes] = await Promise.all([
          axios.get(`/api/categories`),
          axios.get(`/api/subcategories`),
        ]);
        setCategories(categoriesRes.data.data);
        setSubCategories(subCategoriesRes.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [page]);

  const openModal = (
    type: "edit" | "delete" | "add" | "addSub" | "editSub" | "deleteSub",
    category?: Category,
    subCategory?: SubCategory,
  ) => {
    setModalType(type);
    if (category) {
      setSelectedCategory(category);
    }
    if (subCategory) {
      setSelectedSubCategory(subCategory);
    }
  };

  return (
    <DefaultLayout>
      <div className="flex h-auto min-h-screen w-full flex-col items-center justify-start gap-4 overflow-hidden bg-backgroundColor px-1 py-2 md:px-2 md:py-4">
        <div className="flex w-[97%] justify-between text-primary">
          <button
              className="border-[1px] rounded-2xl bg-secondary px-4 py-2 text-sm text-creamey"
              onClick={() => openModal("add")}>
            ADD NEW CATEGORY
          </button>
          <button
                          className="border-[1px] rounded-2xl bg-secondary text-sm px-4 py-2 text-creamey"

            onClick={() => openModal("addSub")}
          >
            ADD NEW SUBCATEGORY
          </button>
        </div>

        {/* Categories Table */}
        {categories.length > 0 && (
          <div className="w-[97%] text-center pt-10">
            <h2 className={`${thirdFont.className} text-secondary mb-4 text-3xl font-semibold`}>Categories</h2>
            <table className="w-full rounded border border-gray-300 text-left">
              <thead className="bg-secondary text-creamey text-sm">
                <tr>
                  <th className="border p-2">#</th>
                  <th className="border p-2">Category Name</th>
                  <th className="border p-2">Description</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {categories.map((category, index) => (
                  <tr key={category._id} className="text-sm hover:bg-gray-50">
                    <td className="border p-2">
                      {(page - 1) * 10 + index + 1}
                    </td>
                    <td className="border p-2">{category.categoryName}</td>
                    <td className="border p-2">{category.description}</td>
                    <td className="space-x-2 border p-2">
                      <button
                        onClick={() => openModal("edit", category)}
                        className="text-blue-600 underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openModal("delete", category)}
                        className="text-red-600 underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Subcategories Table */}
        {subCategories.length > 0 && (
          <div className="mt-8 w-[97%] text-center">
            <h2 className={`${thirdFont.className} text-secondary mb-4 text-3xl font-semibold`}>Subcategories</h2>
            <table className="w-full rounded border border-gray-300 text-left">
              <thead className="bg-secondary text-creamey text-sm">
                <tr>
                  <th className="border p-2">#</th>
                  <th className="border p-2">Subcategory Name</th>
                  <th className="border p-2">Description</th>
                  <th className="border p-2">Category</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {subCategories.map((subCategory, index) => (
                  <tr
                    key={subCategory._id}
                    className="text-sm hover:bg-gray-50"
                  >
                    <td className="border p-2">
                      {(page - 1) * 10 + index + 1}
                    </td>
                    <td className="border p-2">
                      {subCategory.subCategoryName}
                    </td>
                    <td className="border p-2">{subCategory.description}</td>
                    <td className="border p-2">
                      {subCategory?.categoryID?._id 
                        ? categories.find(
                            (cat) => cat._id === subCategory.categoryID._id,
                          )?.categoryName || "N/A"
                        : "Category Deleted"}
                    </td>
                    <td className="space-x-2 border p-2">
                      <button
                        onClick={() =>
                          openModal("editSub", undefined, subCategory)
                        }
                        className="text-blue-600 underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          openModal("deleteSub", undefined, subCategory)
                        }
                        className="text-red-600 underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-4 flex items-center gap-4">
          <button
            className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-lg">
            Page {page} of {totalPages}
          </span>
          <button
            className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>

        {/* Modal */}
        {modalType && (
          <CategoryModal
            type={modalType}
            category={selectedCategory}
            subCategory={selectedSubCategory}
            categories={categories}
            closeModal={() => {
              setModalType(null);
            }}
            refreshData={() => {
              Promise.all([
                axios.get(`/api/categories?page=${page}`),
                axios.get(`/api/subcategories?page=${page}`),
              ]).then(([categoriesRes, subCategoriesRes]) => {
                setCategories(categoriesRes.data.data);
                setSubCategories(subCategoriesRes.data.data);
              });
            }}
          />
        )}
      </div>
    </DefaultLayout>
  );
};

export default CategoriesPage;
