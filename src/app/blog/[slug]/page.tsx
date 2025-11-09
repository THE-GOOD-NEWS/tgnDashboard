"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { headerFont } from "@/app/lib/fonts";
import TikTokEmbed from "@/components/TikTokEmbed";

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
  readingTime: number;
  formattedPublishDate?: string;
}

const BlogDetailPage = () => {
  const params = useParams();
  const slug = params?.slug as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    setLoading(true);
    try {
      // Fetch the blog post
      const response = await axios.get(`/api/blogs/${slug}`);
      setBlog(response.data.data);

      // Increment view count
      await axios.patch(`/api/blogs/${slug}`, { action: "increment_view" });

      // Fetch related blogs (same categories or tags)
      if (
        response.data.data.categories.length > 0 ||
        response.data.data.tags.length > 0
      ) {
        fetchRelatedBlogs(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching blog:", error);
      if (error.response?.status === 404) {
        setError("Blog post not found");
      } else {
        setError("Failed to load blog post");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async (currentBlog: Blog) => {
    try {
      // Get blogs with similar categories or tags
      const params = new URLSearchParams({
        status: "published",
        all: "true",
      });

      const response = await axios.get(`/api/blogs?${params}`);
      const allBlogs = response.data.data;

      // Filter related blogs based on categories and tags
      const related = allBlogs
        .filter((b: Blog) => b._id !== currentBlog._id)
        .filter((b: Blog) => {
          const hasCommonCategory = b.categories.some((cat) =>
            currentBlog.categories.includes(cat),
          );
          const hasCommonTag = b.tags.some((tag) =>
            currentBlog.tags.includes(tag),
          );
          return hasCommonCategory || hasCommonTag;
        })
        .slice(0, 3);

      setRelatedBlogs(related);
    } catch (error) {
      console.error("Error fetching related blogs:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "");
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            {error || "Blog not found"}
          </h1>
          <p className="mb-8 text-gray-600">
            The blog post you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-gray-700">
              Blog
            </Link>
            <span>/</span>
            <span className="text-gray-900">{blog.title}</span>
          </nav>
        </div>
      </div>

      <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Article Header */}
        <header className="mb-8">
          {/* Categories */}
          {blog.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {blog.categories.map((category, index) => (
                <span
                  key={index}
                  className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1
            className={`${headerFont.className} mb-4 text-4xl font-bold leading-tight text-gray-900 md:text-5xl`}
          >
            {blog.title}
          </h1>

          {/* Excerpt */}
          <p className="mb-6 text-xl leading-relaxed text-gray-600">
            {blog.excerpt}
          </p>

          {/* Meta Information */}
          <div className="mb-6 flex flex-wrap items-center gap-6 text-sm text-gray-500">
            {/* <div className="flex items-center">
              {blog.author.imageURL && (
                <img
                  src={blog.author.imageURL}
                  alt={blog.author.username}
                  className="w-10 h-10 rounded-full mr-3"
                />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {blog.author.firstName && blog.author.lastName
                    ? `${blog.author.firstName} ${blog.author.lastName}`
                    : blog.author.username}
                </p>
                <p className="text-gray-500">Author</p>
              </div>
            </div> */}
            <div className="flex items-center space-x-4">
              <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
              <span>•</span>
              <span>{blog.readingTime} min read</span>
              <span>•</span>
              <span>{blog.viewCount} views</span>
            </div>
          </div>

          {/* Featured Image */}
          {blog.featuredImage && (
            <div className="mb-8">
              <img
                src={blog.featuredImage}
                alt={blog.title}
                className="h-64 w-full rounded-lg object-cover shadow-lg md:h-96"
              />
            </div>
          )}
        </header>

        {/* Article Content */}
        <div className="mb-8 rounded-lg bg-white p-8 shadow-sm">
          <div
            className="prose prose-lg prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 max-w-none"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>

        {/* TikTok Video */}
        {blog.tikTokVideoUrl && (
          <div className="mb-8 rounded-lg bg-white p-8 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">
              Featured Video
            </h3>
            <div className="flex justify-center">
              <TikTokEmbed url={blog.tikTokVideoUrl} />
            </div>
          </div>
        )}

        {/* Tags */}
        {blog.tags.length > 0 && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="cursor-pointer rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Author Bio */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          {/* <div className="flex items-start space-x-4">
            {blog.author.imageURL && (
              <img
                src={blog.author.imageURL}
                alt={blog.author.username}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {blog.author.firstName && blog.author.lastName
                  ? `${blog.author.firstName} ${blog.author.lastName}`
                  : blog.author.username}
              </h3>
              <p className="text-gray-600 mb-2">Author</p>
              <p className="text-gray-700">
                Connect with {blog.author.firstName || blog.author.username} for more insights and updates.
              </p>
            </div>
          </div> */}
        </div>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-2xl font-bold text-gray-900">
              Related Posts
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {relatedBlogs.map((relatedBlog) => (
                <article key={relatedBlog._id} className="group">
                  <Link href={`/blog/${relatedBlog.slug}`}>
                    {relatedBlog.featuredImage && (
                      <div className="mb-4">
                        <img
                          src={relatedBlog.featuredImage}
                          alt={relatedBlog.title}
                          className="h-40 w-full rounded-lg object-cover transition-opacity group-hover:opacity-90"
                        />
                      </div>
                    )}
                    <h4 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                      {relatedBlog.title}
                    </h4>
                    <p className="mb-3 text-sm text-gray-600">
                      {truncateText(stripHtml(relatedBlog.excerpt), 100)}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>
                        {formatDate(
                          relatedBlog.publishedAt || relatedBlog.createdAt,
                        )}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{relatedBlog.readingTime} min read</span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            ← Back to Blog
          </Link>
        </div>
      </article>
    </div>
  );
};

export default BlogDetailPage;
