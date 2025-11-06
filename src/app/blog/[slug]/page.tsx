"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { thirdFont } from "@/app/lib/fonts";
import TikTokEmbed from '@/components/TikTokEmbed';

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
      if (response.data.data.categories.length > 0 || response.data.data.tags.length > 0) {
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
        all: "true"
      });

      const response = await axios.get(`/api/blogs?${params}`);
      const allBlogs = response.data.data;

      // Filter related blogs based on categories and tags
      const related = allBlogs
        .filter((b: Blog) => b._id !== currentBlog._id)
        .filter((b: Blog) => {
          const hasCommonCategory = b.categories.some(cat => 
            currentBlog.categories.includes(cat)
          );
          const hasCommonTag = b.tags.some(tag => 
            currentBlog.tags.includes(tag)
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {error || "Blog not found"}
          </h1>
          <p className="text-gray-600 mb-8">
            The blog post you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-gray-700">Blog</Link>
            <span>/</span>
            <span className="text-gray-900">{blog.title}</span>
          </nav>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Article Header */}
        <header className="mb-8">
          {/* Categories */}
          {blog.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {blog.categories.map((category, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className={`${thirdFont.className} text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight`}>
            {blog.title}
          </h1>

          {/* Excerpt */}
          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            {blog.excerpt}
          </p>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
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
                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
          )}
        </header>

        {/* Article Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div 
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>

        {/* TikTok Video */}
        {blog.tikTokVideoUrl && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Featured Video</h3>
            <div className="flex justify-center">
              <TikTokEmbed url={blog.tikTokVideoUrl} />
            </div>
          </div>
        )}

        {/* Tags */}
        {blog.tags.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full hover:bg-gray-200 cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Author Bio */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Related Posts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <article key={relatedBlog._id} className="group">
                  <Link href={`/blog/${relatedBlog.slug}`}>
                    {relatedBlog.featuredImage && (
                      <div className="mb-4">
                        <img
                          src={relatedBlog.featuredImage}
                          alt={relatedBlog.title}
                          className="w-full h-40 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                        />
                      </div>
                    )}
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {relatedBlog.title}
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">
                      {truncateText(stripHtml(relatedBlog.excerpt), 100)}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>{formatDate(relatedBlog.publishedAt || relatedBlog.createdAt)}</span>
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
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            ← Back to Blog
          </Link>
        </div>
      </article>
    </div>
  );
};

export default BlogDetailPage;