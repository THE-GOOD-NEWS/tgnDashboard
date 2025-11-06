"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import axios from "axios";
import RichTextEditor from "./RichTextEditor";
import { UploadButton } from "../utils/uploadthing";
import type { OurFileRouter } from "../app/api/uploadthing/core";

interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  tikTokVideoUrl?: string;
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

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface BlogModalProps {
  type: "edit" | "delete" | "add" | "view";
  blog: Blog | null;
  closeModal: () => void;
  refreshData: () => void;
}

const BlogModal: React.FC<BlogModalProps> = ({
  type,
  blog,
  closeModal,
  refreshData,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    tikTokVideoUrl: "",
    // author: "",
    status: "draft" as "draft" | "published" | "archived",
    tags: [] as string[],
    categories: [] as string[],
    metaTitle: "",
    metaDescription: "",
    featured: false,
  });

  const [tagInput, setTagInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch users for author selection
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/api/users?all=true");
        setUsers(response.data.data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();

    // Populate form data if editing
    if (blog && (type === "edit" || type === "view")) {
      setFormData({
        title: blog.title,
        slug: blog.slug,
        content: blog.content,
        excerpt: blog.excerpt,
        featuredImage: blog.featuredImage || "",
        tikTokVideoUrl: blog.tikTokVideoUrl || "",
        // author: blog.author._id,
        status: blog.status,
        tags: blog.tags,
        categories: blog.categories,
        metaTitle: blog.metaTitle || "",
        metaDescription: blog.metaDescription || "",
        featured: blog.featured,
      });
    }
  }, [blog, type]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type: inputType } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        inputType === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({ ...prev, content }));
    if (errors.content) {
      setErrors((prev) => ({ ...prev, content: "" }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const addCategory = () => {
    if (
      categoryInput.trim() &&
      !formData.categories.includes(categoryInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, categoryInput.trim()],
      }));
      setCategoryInput("");
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter(
        (category) => category !== categoryToRemove,
      ),
    }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }

    if (!formData.excerpt.trim()) {
      newErrors.excerpt = "Excerpt is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
      };

      if (type === "add") {
        alert("add");
        await axios.post("/api/blogs", submitData);
      } else if (type === "edit" && blog) {
        await axios.put(`/api/blogs?id=${blog._id}`, submitData);
      }

      refreshData();
      closeModal();
    } catch (error: any) {
      console.error("Error saving blog:", error);
      if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!blog) return;

    setLoading(true);
    try {
      await axios.delete("/api/blogs", {
        data: { blogId: blog._id },
      });
      refreshData();
      closeModal();
    } catch (error) {
      console.error("Error deleting blog:", error);
    } finally {
      setLoading(false);
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "");
  };

  if (type === "delete") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 md:pl-72.5"
        onClick={closeModal}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-lg "
        >
          <h2 className="mb-4 text-xl font-bold text-red-600">Delete Blog</h2>
          <p className="mb-6">
            Are you sure you want to delete &ldquo;{blog?.title}&rdquo;? This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={closeModal}
              className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === "view" && blog) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:pl-72.5"
        onClick={closeModal}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-lg "
        >
          <div className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{blog.title}</h2>
              <button
                onClick={closeModal}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              {/* <div><strong>Author:</strong> {blog.author.firstName && blog.author.lastName ? `${blog.author.firstName} ${blog.author.lastName}` : blog.author.username}</div> */}
              <div>
                <strong>Status:</strong>{" "}
                <span
                  className={`rounded px-2 py-1 text-xs ${blog.status === "published" ? "bg-green-100 text-green-800" : blog.status === "draft" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {blog.status}
                </span>
              </div>
              <div>
                <strong>Views:</strong> {blog.viewCount}
              </div>
              <div>
                <strong>Reading Time:</strong> {blog.readingTime} min
              </div>
              <div>
                <strong>Featured:</strong> {blog.featured ? "Yes" : "No"}
              </div>
              <div>
                <strong>Created:</strong>{" "}
                {new Date(blog.createdAt).toLocaleDateString()}
              </div>
            </div>

            {blog.tags.length > 0 && (
              <div className="mb-4">
                <strong>Tags:</strong>
                <div className="mt-2 flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {blog.categories.length > 0 && (
              <div className="mb-4">
                <strong>Categories:</strong>
                <div className="mt-2 flex flex-wrap gap-2">
                  {blog.categories.map((category, index) => (
                    <span
                      key={index}
                      className="rounded bg-purple-100 px-2 py-1 text-sm text-purple-800"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <strong>Excerpt:</strong>
              <p className="mt-2 text-gray-700">{blog.excerpt}</p>
            </div>

            <div>
              <strong>Content:</strong>
              <div
                className="prose blog-content mt-2 max-w-none"
                // Add style to images so they float left and text wraps beside
                dangerouslySetInnerHTML={{
                  __html: blog.content.replace(
                    /<img /g,
                    '<img style="float:left;max-width:320px;margin:30px 16px 8px 0;display:inline-block;" ',
                  ),
                }}
              />
              <style jsx global>{`
                .blog-content ol {
                  list-style-type: decimal;
                  padding-top: 3em;
                  margin-left: 1.5em;
                  padding-left: 1em;
                }
                .blog-content ul {
                  list-style-type: disc;
                  margin-left: 1.5em;
                  padding-left: 1em;
                }
              `}</style>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:pl-72.5"
      onClick={closeModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-lg "
      >
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {type === "add" ? "Add New Blog" : "Edit Blog"}
            </h2>
            <button
              onClick={closeModal}
              className="text-2xl text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          {errors.general && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Enter blog title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Auto-generated from title"
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author *
                </label>
                <select
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.author ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Author</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.username}
                    </option>
                  ))}
                </select>
                {errors.author && <p className="text-red-500 text-sm mt-1">{errors.author}</p>}
              </div> */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Featured Image
              </label>

              {/* Image Preview */}
              {formData.featuredImage && (
                <div className="relative mb-4 aspect-video w-full bg-gray-500">
                  <Image
                    fill
                    src={formData.featuredImage}
                    alt="Featured image preview"
                    className=" object-cover"
                  />
                </div>
              )}
            </div>
            <div className="mt-2 flex gap-2">
              {blog?.featuredImage && (
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, featuredImage: "" }))
                  }
                  className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                >
                  Remove Image
                </button>
              )}
              {type === "edit" && (
                <UploadButton
                  endpoint="mediaUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) {
                      setFormData((prev) => ({
                        ...prev,
                        featuredImage: res[0].url,
                      }));
                    }
                  }}
                  onUploadError={(error: Error) => {
                    console.error("Upload error:", error);
                    alert(`Upload failed: ${error.message}`);
                  }}
                  appearance={{
                    button:
                      "px-3 py-1 border border-gray-300 rounded bg-blue-500 text-sm text-white hover:bg-blue-600",
                    allowedContent: "hidden",
                  }}
                />
              )}
            </div>

            {/* Upload Button */}
            {!formData.featuredImage && (
              <UploadButton
                endpoint="mediaUploader"
                onClientUploadComplete={(res) => {
                  if (res && res[0]) {
                    setFormData((prev) => ({
                      ...prev,
                      featuredImage: res[0].url,
                    }));
                  }
                }}
                onUploadError={(error: Error) => {
                  console.error("Upload error:", error);
                  alert(`Upload failed: ${error.message}`);
                }}
                appearance={{
                  button:
                    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-500 text-white hover:bg-blue-600",
                  allowedContent: "text-sm text-gray-600 mt-2",
                }}
              />
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Excerpt *
              </label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                rows={3}
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.excerpt ? "border-red-500" : "border-gray-300"}`}
                placeholder="Brief description of the blog post"
              />
              {errors.excerpt && (
                <p className="mt-1 text-sm text-red-500">{errors.excerpt}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Content *
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={handleContentChange}
                height="400px"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-500">{errors.content}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                TikTok Video URL
              </label>
              <input
                type="url"
                name="tikTokVideoUrl"
                value={formData.tikTokVideoUrl}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.tiktok.com/@username/video/..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Add a TikTok video URL to display after the blog
                content
              </p>
            </div>

            <div>
              {/* Show images in content with remove buttons and preview with float style */}
              {(() => {
                const extractImagesFromContent = (content: string) => {
                  return content.match(/<img[^>]*src=\"[^\"]*\"[^>]*>/g) || [];
                };
                const images = extractImagesFromContent(formData.content);
                if (images.length === 0) return null;
                return (
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-semibold text-gray-500">
                      Images in Content:
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {images.map((imgTag, idx) => {
                        const srcMatch = imgTag.match(/src=\"([^\"]*)\"/);
                        const src = srcMatch ? srcMatch[1] : "";
                        return (
                          <div key={idx} className="flex flex-col items-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt=""
                              style={{
                                float: "left",
                                maxWidth: 320,
                                margin: "0 16px 8px 0",
                                display: "inline-block",
                              }}
                              className="rounded border object-cover"
                            />
                            <button
                              type="button"
                              className="mt-1 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  content: prev.content.replace(imgTag, ""),
                                }))
                              }
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {/* Live preview of content with styled images */}
                    <div className="prose mt-6 max-w-none border-t pt-4">
                      <div className="mb-2 text-xs font-semibold text-gray-500">
                        Live Preview:
                      </div>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: formData.content.replace(
                            /<img /g,
                            '<img style="float:left;max-width:320px;margin:0 16px 8px 0;display:inline-block;" ',
                          ),
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tags
                </label>
                <div className="mb-2 flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a tag"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-sm text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Categories
                </label>
                <div className="mb-2 flex gap-2">
                  <input
                    type="text"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addCategory())
                    }
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a category"
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    className="rounded-lg bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.categories.map((category, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 rounded bg-purple-100 px-2 py-1 text-sm text-purple-800"
                    >
                      {category}
                      <button
                        type="button"
                        onClick={() => removeCategory(category)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SEO title (max 60 characters)"
                  maxLength={60}
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Featured Blog
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Meta Description
              </label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleInputChange}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SEO description (max 160 characters)"
                maxLength={160}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : type === "add"
                    ? "Create Blog"
                    : "Update Blog"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BlogModal;
