"use client";
import { headerFont } from "@/app/lib/fonts";
import ArticleBlocksModal from "@/components/ArticleBlocksModal";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Article {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  // author: {
  //   _id: string;
  //   username: string;
  //   firstName?: string;
  //   lastName?: string;
  //   email: string;
  //   imageURL?: string;
  // };
  status: "draft" | "published" | "archived";
  tags: string[];
  categories: string[];
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: string;
  viewCount: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  readingTime: number;
  formattedPublishDate?: string;
}

const ArticlesPage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<
    "edit" | "delete" | "add" | "view" | null
  >(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await axios.get(`/api/articles?${params}`);
      setArticles(response.data.data);
      setTotalPages(response.data.totalPages);
      setTotalArticles(response.data.total);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, search, statusFilter]);

  const openModal = (
    type: "edit" | "delete" | "add" | "view",
    article?: Article,
  ) => {
    setModalType(type);
    setSelectedArticle(article || null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedArticle(null);
  };

  const refreshData = () => {
    fetchArticles();
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: "bg-yellow-100 text-yellow-800",
      published: "bg-green-100 text-green-800",
      archived: "bg-gray-100 text-gray-800",
    };
    return (
      statusColors[status as keyof typeof statusColors] ||
      "bg-gray-100 text-gray-800"
    );
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "");
  };

  return (
    <DefaultLayout>
      <div className="flex h-auto min-h-screen w-full flex-col items-center justify-start gap-4 overflow-hidden bg-backgroundColor px-1 py-2 md:px-2 md:py-4">
        {/* Header */}
        <div className="flex w-[97%] items-center justify-between text-primary">
          <h1
            className={`${headerFont.className} text-3xl font-semibold text-secondary`}
          >
            Article Management
          </h1>
          <button
            className="rounded-2xl border-[1px] bg-secondary px-4 py-2 text-sm text-creamey hover:bg-opacity-90"
            onClick={() => openModal("add")}
          >
            ADD NEW ARTICLE
          </button>
        </div>

        {/* Filters */}
        <div className="flex w-[97%] items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search articles..."
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
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid w-[97%] grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="text-lg font-semibold text-gray-700">
              Total Articles
            </h3>
            <p className="text-2xl font-bold text-secondary">{totalArticles}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="text-lg font-semibold text-gray-700">Published</h3>
            <p className="text-2xl font-bold text-green-600">
              {
                articles.filter((article) => article.status === "published")
                  .length
              }
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="text-lg font-semibold text-gray-700">Drafts</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {articles.filter((article) => article.status === "draft").length}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="text-lg font-semibold text-gray-700">Featured</h3>
            <p className="text-2xl font-bold text-blue-600">
              {articles.filter((article) => article.featured).length}
            </p>
          </div>
        </div>

        {/* Articles Table */}
        {loading ? (
          <div className="w-[97%] py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-secondary"></div>
            <p className="mt-2 text-gray-600">Loading articles...</p>
          </div>
        ) : articles.length > 0 ? (
          <div className="w-[97%] text-center">
            <div className="overflow-x-auto">
              <table className="w-full rounded border border-gray-300 bg-white text-left">
                <thead className="bg-secondary text-sm text-creamey">
                  <tr>
                    <th className="border p-3">#</th>
                    <th className="border p-3">Title</th>
                    <th className="border p-3">Status</th>
                    <th className="border p-3">Featured</th>
                    <th className="border p-3">Views</th>
                    <th className="border p-3">Created</th>
                    <th className="border p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article, index) => (
                    <tr key={article._id} className="text-sm hover:bg-gray-50">
                      <td className="border p-3">
                        {(page - 1) * 10 + index + 1}
                      </td>
                      <td className="border p-3">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {truncateText(article.title, 150)}
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            {truncateText(stripHtml(article.excerpt), 1000)}
                          </div>
                        </div>
                      </td>
                      {/* <td className="border p-3">
                        <div className="flex items-center gap-2">
                          {article.author.imageURL && (
                            <img
                              src={article.author.imageURL}
                              alt={article.author.username}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span>
                            {article.author.firstName && article.author.lastName
                              ? `${article.author.firstName} ${article.author.lastName}`
                              : article.author.username}
                          </span>
                        </div>
                      </td> */}
                      <td className="border p-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(article.status)}`}
                        >
                          {article.status.charAt(0).toUpperCase() +
                            article.status.slice(1)}
                        </span>
                      </td>
                      <td className="border p-3 text-center">
                        {article.featured ? (
                          <span className="text-yellow-500">⭐</span>
                        ) : (
                          <span className="text-gray-300">☆</span>
                        )}
                      </td>
                      <td className="border p-3 text-center">
                        {article.viewCount}
                      </td>
                      <td className="border p-3">
                        {new Date(article.createdAt).toLocaleDateString()}
                      </td>
                      <td className="space-x-2 border p-3">
                        <Link
                          href={`/article/${article.slug}`}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => openModal("edit", article)}
                          className="text-green-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openModal("delete", article)}
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
            <p className="text-gray-600">No articles found.</p>
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
          <ArticleBlocksModal
            type={modalType}
            article={selectedArticle}
            closeModal={closeModal}
            refreshData={refreshData}
          />
        )}
      </div>
    </DefaultLayout>
  );
};

export default ArticlesPage;
