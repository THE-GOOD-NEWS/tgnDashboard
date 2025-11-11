"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { headerFont } from "@/app/lib/fonts";
import React, { useEffect, useState } from "react";
import axios from "axios";

interface ArticleCategory {
  _id: string;
  titleEn: string;
  titleAr: string;
  slug: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

type ModalType = "add" | "edit" | "delete" | null;

const ArticleCategoriesPage = () => {
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selected, setSelected] = useState<ArticleCategory | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await axios.get(`/api/article-categories?${params}`);
      setCategories(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error("Error fetching article categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter]);

  const openModal = (type: ModalType, category?: ArticleCategory) => {
    setModalType(type);
    setSelected(category || null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelected(null);
  };

  const refreshData = () => fetchCategories();

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <DefaultLayout>
      <div className="flex h-auto min-h-screen w-full flex-col items-center justify-start gap-4 overflow-hidden bg-backgroundColor px-1 py-2 md:px-2 md:py-4">
        {/* Header */}
        <div className="flex w-[97%] items-center justify-between text-primary">
          <h1 className={`${headerFont.className} text-3xl font-semibold text-secondary`}>
            Article Categories
          </h1>
          <button
            className="rounded-2xl border-[1px] bg-secondary px-4 py-2 text-sm text-creamey hover:bg-opacity-90"
            onClick={() => openModal("add")}
          >
            ADD NEW CATEGORY
          </button>
        </div>

        {/* Filters */}
        <div className="flex w-[97%] items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid w-[97%] grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Categories</h3>
            <p className="text-2xl font-bold text-secondary">{total}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="text-lg font-semibold text-gray-700">Active</h3>
            <p className="text-2xl font-bold text-green-600">
              {categories.filter((c) => c.status === "active").length}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="text-lg font-semibold text-gray-700">Inactive</h3>
            <p className="text-2xl font-bold text-gray-600">
              {categories.filter((c) => c.status === "inactive").length}
            </p>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="w-[97%] py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-secondary"></div>
            <p className="mt-2 text-gray-600">Loading categories...</p>
          </div>
        ) : categories.length > 0 ? (
          <div className="w-[97%] text-center">
            <div className="overflow-x-auto">
              <table className="w-full rounded border border-gray-300 bg-white text-left">
                <thead className="bg-secondary text-sm text-creamey">
                  <tr>
                    <th className="border p-3">#</th>
                    <th className="border p-3">English Title</th>
                    <th className="border p-3">Arabic Title</th>
                    <th className="border p-3">Slug</th>
                    <th className="border p-3">Status</th>
                    <th className="border p-3">Created</th>
                    <th className="border p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category, index) => (
                    <tr key={category._id} className="text-sm hover:bg-gray-50">
                      <td className="border p-3">{(page - 1) * 10 + index + 1}</td>
                      <td className="border p-3">{truncateText(category.titleEn, 100)}</td>
                      <td className="border p-3">{truncateText(category.titleAr, 100)}</td>
                      <td className="border p-3">{category.slug}</td>
                      <td className="border p-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(category.status)}`}>
                          {category.status.charAt(0).toUpperCase() + category.status.slice(1)}
                        </span>
                      </td>
                      <td className="border p-3">{new Date(category.createdAt).toLocaleDateString()}</td>
                      <td className="space-x-2 border p-3">
                        <button
                          onClick={() => openModal("edit", category)}
                          className="text-green-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openModal("delete", category)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="w-[97%] py-8 text-center">
            <p className="text-gray-600">No categories found.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center gap-4">
            <button
              className="rounded bg-secondary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-lg">
              Page {page} of {totalPages}
            </span>
            <button
              className="rounded bg-secondary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}

        {/* Modal */}
        {modalType && (
          <ArticleCategoryModal
            type={modalType as Exclude<ModalType, null>}
            category={selected || undefined}
            closeModal={closeModal}
            refreshData={refreshData}
          />
        )}
      </div>
    </DefaultLayout>
  );
};

export default ArticleCategoriesPage;

// Lightweight modal for add/edit/delete
const ArticleCategoryModal = ({
  type,
  category,
  closeModal,
  refreshData,
}: {
  type: "add" | "edit" | "delete";
  category?: ArticleCategory;
  closeModal: () => void;
  refreshData: () => void;
}) => {
  const [titleEn, setTitleEn] = useState<string>(category?.titleEn || "");
  const [titleAr, setTitleAr] = useState<string>(category?.titleAr || "");
  const [slug, setSlug] = useState<string>(category?.slug || "");
  const [status, setStatus] = useState<"active" | "inactive">(
    (category?.status as any) || "active"
  );
  const [saving, setSaving] = useState(false);
  const isDelete = type === "delete";

  const handleSubmit = async () => {
    try {
      setSaving(true);
      if (type === "add") {
        await axios.post("/api/article-categories", {
          titleEn,
          titleAr,
          status,
        });
      } else if (type === "edit" && category?._id) {
        await axios.put(`/api/article-categories?id=${category._id}`, {
          titleEn,
          titleAr,
          slug,
          status,
        });
      } else if (type === "delete" && category?._id) {
        await axios.delete("/api/article-categories", {
          data: { categoryId: category._id },
        });
      }
      closeModal();
      refreshData();
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[95%] max-w-lg rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-secondary">
          {isDelete
            ? "Delete Category"
            : type === "edit"
            ? "Edit Category"
            : "Add New Category"}
        </h2>
        {isDelete ? (
          <p className="text-gray-700">
            Are you sure you want to delete
            {" "}
            <span className="font-semibold">{category?.titleEn}</span>?
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700">English Title</label>
              <input
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Arabic Title</label>
              <input
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Slug (optional)</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated from English title if left blank"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={closeModal}
            className="rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded bg-secondary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : isDelete ? "Delete" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};