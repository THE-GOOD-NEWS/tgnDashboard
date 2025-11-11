"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { compressImage } from "@/utils/imageCompression";

type ModalType = "add" | "edit" | "delete" | "view";

type BlockLayout = "img-left" | "img-block";
type BlockType = "text" | "image" | "imageText";

interface BlockItem {
  id: string;
  type: BlockType;
  textHtml?: string;
  imageUrl?: string;
  caption?: string;
  alt?: string;
  layout?: BlockLayout; // img-left = image beside text, img-block = image above text
}

interface ArticleBlocksModalProps {
  type: ModalType;
  article?: any | null;
  closeModal: () => void;
  refreshData: () => void;
}

// Dynamically import ReactQuill (text-only toolbar, no images)
const ReactQuill: any = dynamic(
  async () => {
    const RQ = (await import("react-quill")).default as any;
    const Forwarded = React.forwardRef(function Forwarded(
      props: any,
      ref: any,
    ) {
      return <RQ ref={ref} {...props} />;
    });
    Forwarded.displayName = "ForwardedQuill";
    return Forwarded;
  },
  { ssr: false },
);
import "react-quill/dist/quill.snow.css";

const textEditorModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      [{ size: ["small", false, "large"] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["link"],
      ["blockquote", "code-block"],
      ["clean"],
    ],
  },
};

const textEditorFormats = [
  "header",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "list",
  "indent",
  "align",
  "link",
  "blockquote",
  "code-block",
];

const ArticleBlocksModal: React.FC<ArticleBlocksModalProps> = ({
  type,
  article,
  closeModal,
  refreshData,
}) => {
  const isEdit = type === "edit";
  const isDelete = type === "delete";
  const isView = type === "view";

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    "draft",
  );
  const [featured, setFeatured] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<string | undefined>(
    undefined,
  );
  const [tikTokVideoUrl, setTikTokVideoUrl] = useState<string | undefined>(
    undefined,
  );
  const [excerpt, setExcerpt] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [categoriesInput, setCategoriesInput] = useState("");
  const [metaTitle, setMetaTitle] = useState<string | undefined>(undefined);
  const [metaDescription, setMetaDescription] = useState<string | undefined>(
    undefined,
  );
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (article && (isEdit || isView)) {
      setTitle(article.title || "");
      setSlug(article.slug || "");
      setStatus((article.status as any) || "draft");
      setFeatured(!!article.featured);
      setFeaturedImage(article.featuredImage);
      setTikTokVideoUrl(article.tikTokVideoUrl);
      setExcerpt(article.excerpt || "");
      setTagsInput(
        (Array.isArray(article.tags) ? article.tags : []).join(", "),
      );
      setCategoriesInput(
        (Array.isArray(article.categories) ? article.categories : []).join(
          ", ",
        ),
      );
      setMetaTitle(article.metaTitle);
      setMetaDescription(article.metaDescription);
      const incomingBlocks: BlockItem[] = Array.isArray(article.blocks)
        ? article.blocks.map((b: any, idx: number) => ({
            id: `${idx}-${Date.now()}`,
            ...b,
          }))
        : article.content
          ? [{ id: `0-${Date.now()}`, type: "text", textHtml: article.content }]
          : [];
      setBlocks(incomingBlocks);
    }
  }, [article, isEdit, isView]);

  const toArray = (value: string) =>
    value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const addBlock = (type: BlockType, layout?: BlockLayout) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setBlocks((prev) => [
      ...prev,
      {
        id,
        type,
        layout: layout ?? (type === "imageText" ? "img-block" : undefined),
        textHtml: type === "text" ? "<p></p>" : undefined,
      },
    ]);
  };

  const updateBlock = (id: string, updates: Partial<BlockItem>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const newArr = [...prev];
      const swapWith = direction === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= newArr.length) return prev;
      const temp = newArr[idx];
      newArr[idx] = newArr[swapWith];
      newArr[swapWith] = temp;
      return newArr;
    });
  };

  const uploadImage = async (): Promise<string | undefined> => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      return new Promise((resolve) => {
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return resolve(undefined);
          const processed = await compressImage(file);
          const { uploadFiles } = genUploader<OurFileRouter>();
          const res: any[] = await uploadFiles("mediaUploader", {
            files: [processed],
          });
          const url = res?.[0]?.url || res?.[0]?.fileUrl || undefined;
          resolve(url);
        };
        input.click();
      });
    } catch (err) {
      console.error("Image upload failed", err);
      return undefined;
    }
  };

  const handleSave = async () => {
    if (isDelete) return;
    setSaving(true);
    try {
      // Serialize blocks' text into a content HTML fallback for compatibility
      const contentHtml = blocks
        .map((b) => (b.type === "image" ? "" : b.textHtml || ""))
        .filter((s) => s && s.trim().length)
        .join("\n<hr/>\n");

      const payload: any = {
        title,
        slug: slug || generateSlug(title),
        status,
        featured,
        featuredImage,
        tikTokVideoUrl,
        excerpt,
        tags: toArray(tagsInput),
        categories: toArray(categoriesInput),
        metaTitle,
        metaDescription,
        blocks: blocks.map(({ id, ...rest }) => rest),
        // content: contentHtml || "<p></p>",
      };

      if (isEdit && article?._id) {
        await axios.put(`/api/articles?id=${article._id}`, payload);
      } else {
        await axios.post(`/api/articles`, payload);
      }

      refreshData();
      closeModal();
    } catch (error: any) {
      console.error("Failed to save article", error);
      alert(error?.response?.data?.error || "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!article?._id) return;
    setSaving(true);
    try {
      await axios.delete(`/api/articles`, { data: { articleId: article._id } });
      refreshData();
      closeModal();
    } catch (error: any) {
      console.error("Failed to delete article", error);
      alert(error?.response?.data?.error || "Failed to delete article");
    } finally {
      setSaving(false);
    }
  };

  const Header = (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-800">
        {isDelete
          ? "Delete Article"
          : isEdit
            ? "Edit Article"
            : isView
              ? "View Article"
              : "Add New Article"}
      </h2>
      <button
        onClick={closeModal}
        className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
      >
        Close
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 md:pl-72.5">
      <div className="max-h-[90vh] w-[95%] max-w-5xl overflow-y-auto rounded-lg bg-white p-4 shadow-lg">
        {Header}

        {isDelete ? (
          <div className="space-y-4">
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{article?.title}</span>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={closeModal}
                className="rounded bg-gray-200 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : isView ? (
          <div className="space-y-3">
            {featuredImage && (
              <img
                src={featuredImage}
                alt="Featured"
                className="h-auto w-full rounded"
              />
            )}
            <h3 className="text-lg font-bold">{title}</h3>
            {/* Render blocks */}
            <div className="space-y-6">
              {blocks.map((b) => (
                <div key={b.id} className="rounded border p-3">
                  {b.type === "text" && (
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: b.textHtml || "" }}
                    />
                  )}
                  {b.type === "image" && (
                    <figure>
                      {b.imageUrl && (
                        <img
                          src={b.imageUrl}
                          alt={b.alt || ""}
                          className="mx-auto h-auto w-full rounded"
                        />
                      )}
                      {b.caption && (
                        <figcaption className="mt-2 text-center text-sm text-gray-600">
                          {b.caption}
                        </figcaption>
                      )}
                    </figure>
                  )}
                  {b.type === "imageText" && (
                    <div
                      className={
                        b.layout === "img-left"
                          ? "grid grid-cols-1 gap-4 md:grid-cols-2"
                          : "space-y-3"
                      }
                    >
                      <div>
                        {b.imageUrl && (
                          <img
                            src={b.imageUrl}
                            alt={b.alt || ""}
                            className="h-auto w-full rounded"
                          />
                        )}
                        {b.caption && (
                          <div className="mt-2 text-center text-sm text-gray-600">
                            {b.caption}
                          </div>
                        )}
                      </div>
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: b.textHtml || "" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            {/* Basics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  placeholder="auto-generated if empty"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="featured"
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                />
                <label htmlFor="featured" className="text-sm text-gray-700">
                  Featured
                </label>
              </div>
            </div>

            {/* Featured image & TikTok */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Featured Image
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={featuredImage || ""}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    className="w-full rounded border px-3 py-2"
                    placeholder="Image URL"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const url = await uploadImage();
                      if (url) setFeaturedImage(url);
                    }}
                    className="rounded bg-secondary px-3 py-2 text-white"
                  >
                    Upload
                  </button>
                </div>
                {featuredImage && (
                  <img
                    src={featuredImage}
                    alt="Featured"
                    className="mt-2 h-24 w-auto rounded"
                  />
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  TikTok Video URL
                </label>
                <input
                  value={tikTokVideoUrl || ""}
                  onChange={(e) => setTikTokVideoUrl(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  placeholder="https://www.tiktok.com/@user/video/123..."
                />
              </div>
            </div>

            {/* Excerpt, tags, categories, meta */}
            <div>
              <label className="mb-1 block text-sm text-gray-700">
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full rounded border px-3 py-2"
                rows={3}
                placeholder="Short summary (optional)"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Tags (comma separated)
                </label>
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Categories (comma separated)
                </label>
                <input
                  value={categoriesInput}
                  onChange={(e) => setCategoriesInput(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Meta Title
                </label>
                <input
                  value={metaTitle || ""}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Meta Description
                </label>
                <input
                  value={metaDescription || ""}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                />
              </div>
            </div>

            {/* Blocks Builder */}
            <div className="rounded border p-3">
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addBlock("text")}
                  className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
                >
                  + Text Block
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("imageText", "img-left")}
                  className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
                >
                  + Image beside text
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("imageText", "img-block")}
                  className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
                >
                  + Image above text
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("image", "img-block")}
                  className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
                >
                  + Image only
                </button>
              </div>

              {blocks.length === 0 ? (
                <p className="text-sm text-gray-600">No blocks added yet.</p>
              ) : (
                <div className="space-y-4">
                  {blocks.map((b) => (
                    <div key={b.id} className="rounded border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {b.type === "text" && "Text Block"}
                          {b.type === "image" && "Image Block"}
                          {b.type === "imageText" &&
                            (b.layout === "img-left"
                              ? "Image beside text"
                              : "Image above text")}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => moveBlock(b.id, "up")}
                            className="rounded bg-gray-100 px-2 py-1 text-xs"
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(b.id, "down")}
                            className="rounded bg-gray-100 px-2 py-1 text-xs"
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(b.id)}
                            className="rounded bg-red-100 px-2 py-1 text-xs text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {b.type !== "text" && (
                        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-sm text-gray-700">
                              Image URL
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                value={b.imageUrl || ""}
                                onChange={(e) =>
                                  updateBlock(b.id, {
                                    imageUrl: e.target.value,
                                  })
                                }
                                className="w-full rounded border px-3 py-2"
                                placeholder="https://..."
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  const url = await uploadImage();
                                  if (url) updateBlock(b.id, { imageUrl: url });
                                }}
                                className="rounded bg-secondary px-3 py-2 text-white"
                              >
                                Upload
                              </button>
                            </div>
                            {b.imageUrl && (
                              <img
                                src={b.imageUrl}
                                alt={b.alt || ""}
                                className="mt-2 h-24 w-auto rounded"
                              />
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-sm text-gray-700">
                              Alt text
                            </label>
                            <input
                              value={b.alt || ""}
                              onChange={(e) =>
                                updateBlock(b.id, { alt: e.target.value })
                              }
                              className="w-full rounded border px-3 py-2"
                            />
                            <label className="mb-1 mt-2 block text-sm text-gray-700">
                              Caption
                            </label>
                            <input
                              value={b.caption || ""}
                              onChange={(e) =>
                                updateBlock(b.id, { caption: e.target.value })
                              }
                              className="w-full rounded border px-3 py-2"
                            />
                            {b.type === "imageText" && (
                              <div className="mt-2">
                                <label className="mb-1 block text-sm text-gray-700">
                                  Layout
                                </label>
                                <select
                                  value={b.layout || "img-block"}
                                  onChange={(e) =>
                                    updateBlock(b.id, {
                                      layout: e.target.value as BlockLayout,
                                    })
                                  }
                                  className="w-full rounded border px-3 py-2"
                                >
                                  <option value="img-left">
                                    Image beside text
                                  </option>
                                  <option value="img-block">
                                    Image above text
                                  </option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {b.type !== "image" && (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Text
                          </label>
                          <ReactQuill
                            theme="snow"
                            value={b.textHtml || ""}
                            onChange={(val: string) =>
                              updateBlock(b.id, { textHtml: val })
                            }
                            modules={textEditorModules}
                            formats={textEditorFormats}
                            placeholder={"Write block text here..."}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-secondary px-4 py-2 text-white disabled:opacity-50"
              >
                {saving
                  ? isEdit
                    ? "Saving..."
                    : "Creating..."
                  : isEdit
                    ? "Save Changes"
                    : "Create Article"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="rounded bg-gray-200 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ArticleBlocksModal;
