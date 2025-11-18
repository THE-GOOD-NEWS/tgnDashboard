"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { headerFont } from "@/app/lib/fonts";
import TikTokEmbed from "@/components/TikTokEmbed";

interface Article {
  _id: string;
  title: string;
  titleAR?: string;
  slug: string;
  content?: string;
  blocks?: ContentBlock[];
  excerpt: string;
  excerptAR?: string;
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
  categories: Array<
    string | { _id: string; titleEn: string; titleAr?: string; slug: string }
  >;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: string;
  viewCount: number;
  featured: boolean;
  createdAt: string;
  readingTime: number;
  formattedPublishDate?: string;
}

type BlockLayout = "img-left" | "img-block";
interface ContentBlock {
  type: "text" | "image" | "imageText" | "carousel";
  textHtml?: string;
  arabicContent?: string;
  imageUrl?: string;
  caption?: string;
  alt?: string;
  layout?: BlockLayout;
  images?: { imageUrl: string; alt?: string; caption?: string }[];
}

const ArticleDetailPage = () => {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isArabic, setIsArabic] = useState(false);

  const Carousel: React.FC<{
    images: { imageUrl: string; alt?: string; caption?: string }[];
    altFallback?: string;
  }> = ({ images, altFallback }) => {
    const [index, setIndex] = useState(0);
    const count = images.length;
    if (!count) return null;
    const current = images[Math.max(0, Math.min(index, count - 1))];
    const prev = () => setIndex((p) => (p - 1 + count) % count);
    const next = () => setIndex((p) => (p + 1) % count);
    return (
      <div className="relative  space-y-2" key={`carousel-${index}`}>
        {current?.imageUrl && (
          <div className="relative  h-[50vh] w-full overflow-hidden rounded-lg bg-gray-100 md:h-[75vh]">
            <img
              src={current.imageUrl}
              alt={current.alt || altFallback || "Image"}
              className="h-full w-full object-contain"
            />
          </div>
        )}
        {current?.caption && (
          <p className="text-sm text-gray-500">{current.caption}</p>
        )}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            className="rounded bg-gray-100 px-3 py-1 text-sm"
          >
            Prev
          </button>
          <span className="text-xs text-gray-500">
            {index + 1} / {count}
          </span>
          <button
            type="button"
            onClick={next}
            className="rounded bg-gray-100 px-3 py-1 text-sm"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      // Fetch the article post

      const response = await axios.get(`/api/articles/${slug}`);
      setArticle(response.data.data);

      // Increment view count
      await axios.patch(`/api/articles/${slug}`, { action: "increment_view" });

      // Fetch related articles (same categories or tags)
      if (
        response.data.data.categories.length > 0 ||
        response.data.data.tags.length > 0
      ) {
        fetchRelatedArticles(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching article:", error);
      if (error.response?.status === 404) {
        setError("Article post not found");
      } else {
        setError("Failed to load article post");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedArticles = async (currentArticle: Article) => {
    try {
      // Get articles with similar categories or tags
      const params = new URLSearchParams({
        status: "published",
        all: "true",
      });

      const response = await axios.get(`/api/articles?${params}`);
      const allArticles = response.data.data;

      // Filter related articles based on categories and tags
      const getCategoryIds = (cats: any[]) =>
        (Array.isArray(cats) ? cats : [])
          .map((c: any) => (typeof c === "string" ? c : c?._id))
          .filter(Boolean);
      const currentCatIds = getCategoryIds(currentArticle.categories);

      const related = allArticles
        .filter((b: Article) => b._id !== currentArticle._id)
        .filter((b: Article) => {
          const bCatIds = getCategoryIds(b.categories);
          const hasCommonCategory = bCatIds.some((id: string) =>
            currentCatIds.includes(id),
          );
          const hasCommonTag = b.tags.some((tag) =>
            currentArticle.tags.includes(tag),
          );
          return hasCommonCategory || hasCommonTag;
        })
        .slice(0, 3);

      setRelatedArticles(related);
    } catch (error) {
      console.error("Error fetching related articles:", error);
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

  const renderBlock = (block: ContentBlock, index: number) => {
    if (block.type === "text") {
      const htmlVal =
        isArabic && block.arabicContent && block.arabicContent.trim().length
          ? block.arabicContent
          : block.textHtml;
      return (
        <div
          key={index}
          className="prose prose-lg prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 max-w-none"
        >
          <div dangerouslySetInnerHTML={{ __html: htmlVal || "" }} />
        </div>
      );
    }

    if (block.type === "image") {
      return (
        <figure key={index} className="space-y-2">
          {block.imageUrl && (
            <img
              src={block.imageUrl}
              alt={
                block.alt ||
                (isArabic
                  ? article?.titleAR || article?.title
                  : article?.title) ||
                "Image"
              }
              className="w-full rounded-lg object-cover shadow"
            />
          )}
          {block.caption && (
            <figcaption className="text-sm text-gray-500">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    if (block.type === "imageText") {
      const layout = block.layout || "img-block";
      if (layout === "img-left") {
        return (
          <div key={index} className="grid items-start gap-6 md:grid-cols-2">
            <div className="prose prose-lg prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 max-w-none">
              {(() => {
                const htmlVal =
                  isArabic &&
                  block.arabicContent &&
                  block.arabicContent.trim().length
                    ? block.arabicContent
                    : block.textHtml;
                return (
                  <div dangerouslySetInnerHTML={{ __html: htmlVal || "" }} />
                );
              })()}
            </div>
            <div>
              {block.imageUrl && (
                <img
                  src={block.imageUrl}
                  alt={
                    block.alt ||
                    (isArabic
                      ? article?.titleAR || article?.title
                      : article?.title) ||
                    "Image"
                  }
                  className="w-full rounded-lg object-cover shadow"
                />
              )}
              {block.caption && (
                <p className="mt-2 text-sm text-gray-500">{block.caption}</p>
              )}
            </div>
          </div>
        );
      }

      // img-block: image above text
      return (
        <div key={index} className="space-y-4">
          {block.imageUrl && (
            <img
              src={block.imageUrl}
              alt={
                block.alt ||
                (isArabic
                  ? article?.titleAR || article?.title
                  : article?.title) ||
                "Image"
              }
              className="w-full rounded-lg object-cover shadow"
            />
          )}
          {block.caption && (
            <p className="text-sm text-gray-500">{block.caption}</p>
          )}
          <div className="prose prose-lg prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 max-w-none">
            {(() => {
              const htmlVal =
                isArabic &&
                block.arabicContent &&
                block.arabicContent.trim().length
                  ? block.arabicContent
                  : block.textHtml;
              return (
                <div dangerouslySetInnerHTML={{ __html: htmlVal || "" }} />
              );
            })()}
          </div>
        </div>
      );
    }

    if (block.type === "carousel") {
      const altFallback =
        (isArabic ? article?.titleAR || article?.title : article?.title) ||
        "Image";
      return (
        <div key={index} className=" space-y-2">
          <Carousel images={block.images || []} altFallback={altFallback} />
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading article post...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            {error || "Article not found"}
          </h1>
          <p className="mb-8 text-gray-600">
            The article post you&apos;re looking for doesn&apos;t exist or has
            been removed.
          </p>
          <Link
            href="/article"
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
          >
            Back to Article
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isArabic ? "rtl" : "ltr"}>
      {/* Breadcrumb */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span>/</span>
            <Link href="/pages/articles" className="hover:text-gray-700">
              Articles
            </Link>
            <span>/</span>
            <span className="text-gray-900">{article.title}</span>
          </nav>
        </div>
      </div>

      <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Article Header */}
        <header className="mb-8">
          <div className="mb-4 flex justify-end gap-2">
            <button
              onClick={() => setIsArabic(false)}
              className={`rounded px-3 py-1 text-sm ${!isArabic ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
            >
              EN
            </button>
            <button
              onClick={() => setIsArabic(true)}
              className={`rounded px-3 py-1 text-sm ${isArabic ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
            >
              AR
            </button>
          </div>
          {/* Categories */}
          {article.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {article.categories.map((category, index) => {
                const label =
                  typeof category === "string"
                    ? category
                    : isArabic && category.titleAr
                      ? category.titleAr
                      : category.titleEn;
                return (
                  <span
                    key={index}
                    className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Title */}
          <h1
            className={`${headerFont.className} mb-4 text-4xl font-bold leading-tight text-gray-900 md:text-5xl`}
          >
            {isArabic && article.titleAR ? article.titleAR : article.title}
          </h1>

          {/* Excerpt */}

          {/* Meta Information */}
          <div className="mb-6 flex flex-wrap items-center gap-6 text-sm text-gray-500">
            {/* <div className="flex items-center">
              {article.author.imageURL && (
                <img
                  src={article.author.imageURL}
                  alt={article.author.username}
                  className="w-10 h-10 rounded-full mr-3"
                />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {article.author.firstName && article.author.lastName
                    ? `${article.author.firstName} ${article.author.lastName}`
                    : article.author.username}
                </p>
                <p className="text-gray-500">Author</p>
              </div>
            </div> */}
            <div className="flex items-center space-x-4">
              <span>
                {formatDate(article.publishedAt || article.createdAt)}
              </span>
              <span>•</span>
              <span>{article.viewCount} views</span>
            </div>
          </div>

          {/* Featured Image */}
          {article.featuredImage && (
            <div className="mb-8">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="h-64 w-full rounded-lg object-cover shadow-lg md:h-96"
              />
            </div>
          )}
          <p className="mb-6 text-xl leading-relaxed text-gray-600">
            {isArabic && article.excerptAR
              ? article.excerptAR
              : article.excerpt}
          </p>
        </header>

        {/* Article Content (blocks-first, content fallback) */}
        <div className="mb-8 rounded-lg bg-white p-8 shadow-sm">
          {Array.isArray(article.blocks) && article.blocks.length > 0 ? (
            <div className="space-y-10">
              {article.blocks.map((block, idx) => renderBlock(block, idx))}
            </div>
          ) : (
            <div
              className="prose prose-lg prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 max-w-none"
              dangerouslySetInnerHTML={{
                __html: (isArabic ? article.content : article.content) || "",
              }}
            />
          )}
        </div>

        {/* TikTok Video */}
        {article.tikTokVideoUrl && (
          <div className="mb-8 rounded-lg bg-white p-8 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">
              Featured Video
            </h3>
            <div className="flex justify-center">
              <TikTokEmbed url={article.tikTokVideoUrl} />
            </div>
          </div>
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
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
            {article.author.imageURL && (
              <img
                src={article.author.imageURL}
                alt={article.author.username}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {article.author.firstName && article.author.lastName
                  ? `${article.author.firstName} ${article.author.lastName}`
                  : article.author.username}
              </h3>
              <p className="text-gray-600 mb-2">Author</p>
              <p className="text-gray-700">
                Connect with {article.author.firstName || article.author.username} for more insights and updates.
              </p>
            </div>
          </div> */}
        </div>

        {/* Related Posts */}
        {relatedArticles.length > 0 && (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-2xl font-bold text-gray-900">
              Related Posts
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {relatedArticles.map((relatedArticle) => (
                <article key={relatedArticle._id} className="group">
                  <Link href={`/article/${relatedArticle.slug}`}>
                    {relatedArticle.featuredImage && (
                      <div className="mb-4">
                        <img
                          src={relatedArticle.featuredImage}
                          alt={relatedArticle.title}
                          className="h-40 w-full rounded-lg object-cover transition-opacity group-hover:opacity-90"
                        />
                      </div>
                    )}
                    <h4 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                      {relatedArticle.title}
                    </h4>
                    <p className="mb-3 text-sm text-gray-600">
                      {truncateText(stripHtml(relatedArticle.excerpt), 100)}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>
                        {formatDate(
                          relatedArticle.publishedAt ||
                            relatedArticle.createdAt,
                        )}
                      </span>
                      <span className="mx-2">•</span>
                      {/* <span>{relatedArticle.readingTime} min read</span> */}
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
            href="/pages/articles"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            ← Back to Articles
          </Link>
        </div>
      </article>
    </div>
  );
};

export default ArticleDetailPage;
