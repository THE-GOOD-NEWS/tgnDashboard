"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { thirdFont } from "@/app/lib/fonts";
import Image from "next/image";

interface Blog {
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
  publishedAt?: string;
  viewCount: number;
  featured: boolean;
  createdAt: string;
  readingTime: number;
  formattedPublishDate?: string;
}

const BlogListPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [featuredBlogs, setFeaturedBlogs] = useState<Blog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        status: "published",
        ...(search && { search }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedTag && { tag: selectedTag }),
      });

      const response = await axios.get(`/api/blogs?${params}`);
      setBlogs(response.data.data);
      setTotalPages(response.data.totalPages);

      // Extract unique categories and tags
      const categories = new Set<string>();
      const tags = new Set<string>();

      response.data.data.forEach((blog: Blog) => {
        blog.categories.forEach((cat) => categories.add(cat));
        blog.tags.forEach((tag) => tags.add(tag));
      });

      setAllCategories(Array.from(categories));
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedBlogs = async () => {
    try {
      const response = await axios.get(
        "/api/blogs?status=published&featured=true&all=true",
      );
      setFeaturedBlogs(response.data.data.slice(0, 3)); // Show top 3 featured blogs
    } catch (error) {
      console.error("Error fetching featured blogs:", error);
    }
  };

  useEffect(() => {
    fetchBlogs();
    if (page === 1) {
      fetchFeaturedBlogs();
    }
  }, [page, search, selectedCategory, selectedTag]);

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "");
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedTag("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1
              className={`${thirdFont.className} mb-4 text-4xl font-bold text-gray-900`}
            >
              Our Blog
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              Discover insights, stories, and updates from our team
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Featured Blogs Section */}
        {featuredBlogs.length > 0 && page === 1 && (
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Featured Posts
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredBlogs.map((blog) => (
                <div
                  key={blog._id}
                  className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg"
                >
                  {blog.featuredImage && (
                    <div className="aspect-video w-full bg-gray-200">
                      <Image
                        fill
                        src={blog.featuredImage}
                        alt={blog.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="mb-3 flex items-center">
                      <span className="rounded bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        Featured
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 hover:text-blue-600">
                      <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                    </h3>
                    <p className="mb-4 text-gray-600">
                      {truncateText(stripHtml(blog.excerpt), 120)}
                    </p>
                    {/* <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        {blog.author.imageURL && (
                          <img
                            src={blog.author.imageURL}
                            alt={blog.author.username}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                        )}
                        <span>
                          {blog.author.firstName && blog.author.lastName
                            ? `${blog.author.firstName} ${blog.author.lastName}`
                            : blog.author.username}
                        </span>
                      </div>
                      <span>{blog.readingTime} min read</span>
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search blogs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {allCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(search || selectedCategory || selectedTag) && (
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Blog List */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading blogs...</p>
          </div>
        ) : blogs.length > 0 ? (
          <div className="space-y-8">
            {blogs.map((blog) => (
              <article
                key={blog._id}
                className="overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="md:flex">
                  {blog.featuredImage && (
                    <div className="md:w-1/3">
                      <div className="aspect-video w-full bg-gray-200">
                        <Image
                          fill
                          src={blog.featuredImage}
                          alt={blog.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div
                    className={`p-6 ${blog.featuredImage ? "md:w-2/3" : "w-full"}`}
                  >
                    <div className="mb-3 flex items-center">
                      {blog.featured && (
                        <span className="mr-2 rounded bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                          Featured
                        </span>
                      )}
                      {blog.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {blog.categories
                            .slice(0, 2)
                            .map((category, index) => (
                              <span
                                key={index}
                                className="rounded bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                              >
                                {category}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    <h2 className="mb-3 text-2xl font-bold text-gray-900 hover:text-blue-600">
                      <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                    </h2>

                    <p className="mb-4 leading-relaxed text-gray-600">
                      {truncateText(stripHtml(blog.excerpt), 200)}
                    </p>

                    {blog.tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {blog.tags.slice(0, 4).map((tag, index) => (
                          <span
                            key={index}
                            className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        {/* <div className="flex items-center">
                          {blog.author.imageURL && (
                            <img
                              src={blog.author.imageURL}
                              alt={blog.author.username}
                              className="w-6 h-6 rounded-full mr-2"
                            />
                          )}
                          <span>
                            {blog.author.firstName && blog.author.lastName
                              ? `${blog.author.firstName} ${blog.author.lastName}`
                              : blog.author.username}
                          </span>
                        </div> */}
                        <span>•</span>
                        <span>
                          {formatDate(blog.publishedAt || blog.createdAt)}
                        </span>
                        <span>•</span>
                        <span>{blog.readingTime} min read</span>
                      </div>
                      <div className="flex items-center">
                        <span>{blog.viewCount} views</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-lg text-gray-600">No blogs found.</p>
            {(search || selectedCategory || selectedTag) && (
              <button
                onClick={clearFilters}
                className="mt-4 font-medium text-blue-600 hover:text-blue-800"
              >
                Clear filters to see all blogs
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      page === pageNum
                        ? "border border-blue-600 bg-blue-600 text-white"
                        : "border border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogListPage;
