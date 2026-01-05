"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { headerFont } from "@/app/lib/fonts";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FaPlay, FaDownload, FaTrash } from "react-icons/fa";

type FormType = "join_team" | "contact" | "partner" | "share_news";
type StatusType = "pending" | "reviewed" | "archived";

type FormSubmission = {
  _id: string;
  formType: FormType;
  status: StatusType;
  name?: string;
  email?: string;
  phoneNumber?: string;
  interestedFields?: string[];
  experience?: string;
  workStyle?: string[];
  cvUrl?: string;
  resumeAs?: string;
  notes?: string;
  subject?: string;
  message?: string;
  businessName?: string;
  industry?: string;
  collaborationIdea?: string;
  campaignDetails?: string;
  socialMediaAccounts?: string;
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;
  contactMethod?: string[];
  story?: string;
  mediaUrls?: string[];
  createdAt: string;
  updatedAt: string;
};

type ModalType = "add" | "edit" | "view" | null;

const emptySubmission: Partial<FormSubmission> = {
  formType: "contact",
  status: "pending",
};

export default function FormsPage() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FormType | "">("");
  const [filterStatus, setFilterStatus] = useState<StatusType | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [current, setCurrent] =
    useState<Partial<FormSubmission>>(emptySubmission);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerType, setViewerType] = useState<
    "image" | "video" | "pdf" | "unknown" | null
  >(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerList, setViewerList] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number>(0);
  const [exporting, setExporting] = useState(false);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  type ColumnDef = {
    label: string;
    key?: keyof FormSubmission;
    compute?: (s: FormSubmission) => string;
  };
  const columnsForType = (
    type: FormType,
    items: FormSubmission[],
  ): ColumnDef[] => {
    const common: ColumnDef[] = [
      { key: "formType", label: "Form Type" },
      { key: "status", label: "Status" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phoneNumber", label: "Phone" },
      { key: "createdAt", label: "Created At" },
      { key: "updatedAt", label: "Updated At" },
    ];
    if (type === "join_team") {
      return [
        ...common,
        { key: "resumeAs", label: "Resume As" },
        { key: "interestedFields", label: "Interested Fields" },
        { key: "experience", label: "Experience" },
        { key: "workStyle", label: "Work Style" },
        { key: "cvUrl", label: "CV Link" },
        { key: "notes", label: "Notes" },
      ];
    }
    if (type === "contact") {
      return [
        ...common,
        { key: "subject", label: "Subject" },
        { key: "message", label: "Message" },
      ];
    }
    if (type === "partner") {
      return [
        ...common,
        { key: "businessName", label: "Business Name" },
        { key: "industry", label: "Industry" },
        { key: "collaborationIdea", label: "Collaboration Idea" },
        { key: "campaignDetails", label: "Campaign Details" },
        { key: "socialMediaAccounts", label: "Social Media Accounts" },
        { key: "contactName", label: "Contact Name" },
        { key: "contactNumber", label: "Contact Number" },
        { key: "contactEmail", label: "Contact Email" },
        { key: "contactMethod", label: "Preferred Contact Methods" },
      ];
    }
    const maxMedia =
      items.reduce((m, s) => Math.max(m, (s.mediaUrls || []).length), 0) || 0;
    const mediaCols: ColumnDef[] = Array.from({ length: maxMedia }).map(
      (_, i) => ({
        label: `Media Link ${i + 1}`,
        compute: (s) =>
          Array.isArray(s.mediaUrls) && s.mediaUrls[i] ? s.mediaUrls[i] : "",
      }),
    );
    return [...common, { key: "story", label: "Story" }, ...mediaCols];
  };
  const formatCell = (val: any) => {
    if (val === null || val === undefined) return "";
    if (Array.isArray(val)) return val.join("; ");
    if (typeof val === "string") {
      const needsQuotes =
        val.includes(",") || val.includes("\n") || val.includes('"');
      const escaped = val.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    }
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (val instanceof Date) return val.toISOString();
    return String(val);
  };
  const handleExport = async () => {
    if (!filterType) return;
    try {
      setExporting(true);
      const filtered = submissions.filter((s) => s.formType === filterType);
      const cols = columnsForType(filterType as FormType, filtered);
      const rows = filtered.map((s) =>
        cols.map((c) => {
          let v: any;
          if (c.compute) {
            v = c.compute(s);
          } else if (c.key) {
            v =
              c.key === "createdAt" || c.key === "updatedAt"
                ? new Date((s as any)[c.key]).toISOString()
                : (s as any)[c.key];
          } else {
            v = "";
          }
          return formatCell(v);
        }),
      );
      const header = cols.map((c) => c.label).join(",");
      const body = rows.map((r) => r.join(",")).join("\r\n");
      const csv = "\ufeff" + header + "\r\n" + body;
      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.href = url;
      a.download = `forms_${filterType}_${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/form-submissions", {
        params: {
          page,
          limit,
          search,
          formType: filterType || undefined,
          status: filterStatus || undefined,
        },
      });
      setSubmissions(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, filterType, filterStatus]);

  const openAdd = () => {
    setModalType("add");
    setCurrent(emptySubmission);
    setModalOpen(true);
  };

  const openEdit = (item: FormSubmission) => {
    setModalType("edit");
    setCurrent({ ...item });
    setModalOpen(true);
  };

  const openView = (item: FormSubmission) => {
    setModalType("view");
    setCurrent({ ...item });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setCurrent(emptySubmission);
  };

  const createSubmission = async () => {
    try {
      const payload = { ...current };
      const res = await axios.post("/api/form-submissions", payload);
      setModalOpen(false);
      await fetchSubmissions();
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const updateSubmission = async () => {
    try {
      const id = current._id as string;
      const payload = { ...current };
      const res = await axios.put(`/api/form-submissions/${id}`, payload);
      setModalOpen(false);
      await fetchSubmissions();
      return res.data;
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSubmission = async (id: string) => {
    try {
      await axios.delete(`/api/form-submissions/${id}`);
      await fetchSubmissions();
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatusInline = async (id: string, status: StatusType) => {
    try {
      await axios.put(`/api/form-submissions/${id}`, { status });
      await fetchSubmissions();
    } catch (e) {
      console.error(e);
    }
  };
  const removeMediaUrl = async (url: string) => {
    try {
      setCurrent((prev) => ({
        ...prev,
        mediaUrls: (prev.mediaUrls || []).filter((u) => u !== url),
      }));
      await axios.delete("/api/uploadthing", { data: { url } });
    } catch (e) {
      console.error(e);
    }
  };

  const renderField = (
    key: keyof FormSubmission,
    label: string,
    inputType: string = "text",
  ) => {
    const value = current[key] as any;
    const setValue = (val: any) =>
      setCurrent((prev) => ({
        ...prev,
        [key]: val,
      }));

    if (Array.isArray(value)) {
      return (
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium">{label}</label>
          {/* <input
            type="text"
            value={(value || []).join(",")}
            onChange={(e) =>
              setValue(e.target.value.split(",").map((s) => s.trim()))
            }
            className="w-full rounded border p-2"
          /> */}
        </div>
      );
    }

    if (inputType === "textarea") {
      return (
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium">{label}</label>
          {/* <textarea
            value={value || ""}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded border p-2"
          /> */}
        </div>
      );
    }

    return (
      <div className="mb-3">
        <label className="mb-1 block text-sm font-medium">{label}</label>
        <input
          type={inputType}
          value={value || ""}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded border p-2"
        />
      </div>
    );
  };

  const isImage = (url: string) =>
    /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(fileNameFromUrl(url));
  const isVideo = (url: string) =>
    /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(fileNameFromUrl(url));
  const isPDF = (url: string) => /\.pdf$/i.test(fileNameFromUrl(url));
  const fileNameFromUrl = (url: string) => {
    try {
      const u = new URL(url);
      return u.pathname.split("/").pop() || url;
    } catch {
      const parts = url.split("/");
      return parts[parts.length - 1] || url;
    }
  };
  const downloadHref = (url: string) =>
    `/api/media/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(
      fileNameFromUrl(url),
    )}`;
  const loadViewerType = (url: string) => {
    setViewerLoading(true);
    axios
      .get("/api/media/info", { params: { url } })
      .then((res) => {
        const ct = (res.data?.contentType || "") as string;
        const t = ct.toLowerCase();
        if (t.startsWith("image/")) setViewerType("image");
        else if (t.startsWith("video/")) setViewerType("video");
        else if (t === "application/pdf") setViewerType("pdf");
        else setViewerType("unknown");
      })
      .catch(() => {
        setViewerType("unknown");
      })
      .finally(() => {
        setViewerLoading(false);
      });
  };
  const openViewer = (url: string) => {
    let list: string[] = [];
    if (Array.isArray(current.mediaUrls) && current.mediaUrls.length > 0) {
      list = current.mediaUrls;
    } else if (current.cvUrl) {
      list = [current.cvUrl];
    } else {
      list = [url];
    }
    const idx = Math.max(0, list.indexOf(url));
    setViewerList(list);
    setViewerIndex(idx === -1 ? 0 : idx);
    setViewerUrl(url);
    setViewerType(null);
    setViewerOpen(true);
    loadViewerType(url);
  };
  const closeViewerOverlay = () => {
    setViewerOpen(false);
    setViewerUrl(null);
    setViewerType(null);
    setViewerLoading(false);
    setViewerList([]);
    setViewerIndex(0);
  };
  const goPrev = () => {
    if (!viewerList.length) return;
    const nextIdx = (viewerIndex - 1 + viewerList.length) % viewerList.length;
    const nextUrl = viewerList[nextIdx];
    setViewerIndex(nextIdx);
    setViewerUrl(nextUrl);
    setViewerType(null);
    loadViewerType(nextUrl);
  };
  const goNext = () => {
    if (!viewerList.length) return;
    const nextIdx = (viewerIndex + 1) % viewerList.length;
    const nextUrl = viewerList[nextIdx];
    setViewerIndex(nextIdx);
    setViewerUrl(nextUrl);
    setViewerType(null);
    loadViewerType(nextUrl);
  };
  const MediaPreview = ({ url }: { url: string }) => {
    if (isImage(url)) {
      return (
        <div className="space-y-2">
          <div
            className="relative h-40 w-full cursor-pointer overflow-hidden rounded border"
            onClick={() => openViewer(url)}
          >
            <Image src={url} alt="" fill className="object-contain" />
          </div>
          <a
            href={downloadHref(url)}
            download
            className="rounded bg-primary px-3 py-1 text-xs text-white"
          >
            Download {fileNameFromUrl(url)}
          </a>
        </div>
      );
    }
    if (isVideo(url)) {
      return (
        <div className="space-y-2">
          <div
            className="relative h-40 w-full cursor-pointer overflow-hidden rounded border bg-black"
            onClick={() => openViewer(url)}
          >
            <video
              className="h-full w-full object-cover opacity-60"
              src={url}
              preload="metadata"
              muted
              playsInline
            />
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="rounded-full bg-black/70 p-2 text-white">
                <FaPlay />
              </div>
            </div>
          </div>
          <a
            href={downloadHref(url)}
            download
            className="rounded bg-primary px-3 py-1 text-xs text-white"
          >
            Download {fileNameFromUrl(url)}
          </a>
        </div>
      );
    }
    return (
      <a
        href={downloadHref(url)}
        download
        className="rounded bg-primary px-3 py-1 text-xs text-white"
      >
        Download {fileNameFromUrl(url)}
      </a>
    );
  };
  const MediaPreviewList = ({ urls }: { urls: string[] }) => {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {urls.map((u) => (
          <div key={u} className="rounded border p-2">
            <MediaPreview url={u} />
          </div>
        ))}
      </div>
    );
  };
  const MediaThumb = ({ url }: { url: string }) => {
    const [type, setType] = useState<
      "image" | "video" | "pdf" | "unknown" | null
    >(null);
    useEffect(() => {
      let cancelled = false;
      axios
        .get("/api/media/info", { params: { url } })
        .then((res) => {
          if (cancelled) return;
          const ct = (res.data?.contentType || "") as string;
          const t = ct.toLowerCase();
          if (t.startsWith("image/")) setType("image");
          else if (t.startsWith("video/")) setType("video");
          else if (t === "application/pdf") setType("pdf");
          else setType("unknown");
        })
        .catch(() => {
          if (!cancelled) setType(null);
        });
      return () => {
        cancelled = true;
      };
    }, [url]);

    if (type === "image" || (!type && isImage(url))) {
      return (
        <div
          className="relative h-28 w-full cursor-pointer overflow-hidden rounded border bg-white"
          onClick={() => openViewer(url)}
        >
          <Image src={url} alt="" fill className="object-cover" />
        </div>
      );
    }
    if (type === "video" || (!type && isVideo(url))) {
      return (
        <div
          className="relative h-28 w-full cursor-pointer overflow-hidden rounded border bg-black"
          onClick={() => openViewer(url)}
        >
          <video
            className="h-full w-full object-cover opacity-60"
            src={url}
            preload="metadata"
            muted
            playsInline
          />
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-full bg-black/70 p-2 text-white">
              <FaPlay />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div
        className="relative h-28 w-full cursor-pointer overflow-hidden rounded border bg-white"
        onClick={() => openViewer(url)}
      >
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${url})` }}
        />
      </div>
    );
  };
  const MediaThumbList = ({
    urls,
    onDelete,
  }: {
    urls: string[];
    onDelete?: (url: string) => void;
  }) => {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {urls.map((u) => (
          <div key={u} className="relative space-y-2">
            <MediaThumb url={u} />
            {onDelete ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(u);
                }}
                className="absolute right-1 top-0 rounded-full bg-red-500 p-1 text-sm text-white shadow hover:bg-red-600"
                title="Delete"
              >
                <FaTrash />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  const formSpecificFields = () => {
    if (current.formType === "join_team") {
      return (
        <>
          {modalType === "view" ? (
            <>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">CV</label>
                {current.cvUrl ? (
                  <a
                    href={current.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    pdf
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">No CV</p>
                )}
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Resume As
                </label>
                <input
                  value={current.resumeAs || ""}
                  readOnly
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Interested Fields
                </label>
                <input
                  value={(current.interestedFields || []).join(", ")}
                  readOnly
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Experience
                </label>
                <input
                  value={current.experience || ""}
                  readOnly
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Work Style
                </label>
                <input
                  value={(current.workStyle || []).join(", ")}
                  readOnly
                  className="w-full rounded border p-2"
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Interested Fields
                </label>
                <input
                  type="text"
                  value={(current.interestedFields || []).join(", ")}
                  onChange={(e) =>
                    setCurrent((prev) => ({
                      ...prev,
                      interestedFields: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="w-full rounded border p-2"
                />
              </div>
              {renderField("experience", "Experience")}
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Work Style
                </label>
                <input
                  type="text"
                  value={(current.workStyle || []).join(", ")}
                  onChange={(e) =>
                    setCurrent((prev) => ({
                      ...prev,
                      workStyle: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="w-full rounded border p-2"
                />
              </div>
              {current.cvUrl ? (
                <div className="mb-3">
                  <a
                    href={current.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    pdf
                  </a>
                </div>
              ) : null}
              {renderField("resumeAs", "Resume As")}
              {renderField("notes", "Notes", "textarea")}
            </>
          )}
        </>
      );
    }
    if (current.formType === "contact") {
      return (
        <>
          {renderField("subject", "Subject")}
          {renderField("message", "Message", "textarea")}
        </>
      );
    }
    if (current.formType === "partner") {
      return (
        <>
          {modalType === "view" ? (
            <>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Business Name
                </label>
                <input
                  value={current.businessName || ""}
                  readOnly
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Industry
                </label>
                <input
                  value={current.industry || ""}
                  readOnly
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Collaboration Idea
                </label>
                <textarea
                  value={current.collaborationIdea || ""}
                  readOnly
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Campaign Details
                </label>
                <textarea
                  value={current.campaignDetails || ""}
                  readOnly
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Social Media Accounts
                </label>
                <input
                  value={current.socialMediaAccounts || ""}
                  readOnly
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Contact Name
                </label>
                <input
                  value={current.contactName || ""}
                  readOnly
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Contact Number
                </label>
                <input
                  value={current.contactNumber || ""}
                  readOnly
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Contact Email
                </label>
                <input
                  value={current.contactEmail || ""}
                  readOnly
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Preferred Contact Methods
                </label>
                <input
                  value={(current.contactMethod || []).join(", ")}
                  readOnly
                  className="w-full rounded border p-2"
                />
              </div>
            </>
          ) : (
            <>
              {renderField("businessName", "Business Name")}
              {renderField("industry", "Industry")}
              {renderField(
                "collaborationIdea",
                "Collaboration Idea",
                "textarea",
              )}
              {renderField("campaignDetails", "Campaign Details", "textarea")}
              {renderField("socialMediaAccounts", "Social Media Accounts")}
              {renderField("contactName", "Contact Name")}
              {renderField("contactNumber", "Contact Number")}
              {renderField("contactEmail", "Contact Email")}
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Preferred Contact Methods
                </label>
                <input
                  type="text"
                  value={(current.contactMethod || []).join(", ")}
                  onChange={(e) =>
                    setCurrent((prev) => ({
                      ...prev,
                      contactMethod: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="w-full rounded border p-2"
                />
              </div>
            </>
          )}
        </>
      );
    }
    if (current.formType === "share_news") {
      return (
        <>
          {renderField("story", "Story", "textarea")}
          {modalType === "view" ? (
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">Media</label>
              {Array.isArray(current.mediaUrls) &&
              current.mediaUrls.length > 0 ? (
                <MediaThumbList urls={current.mediaUrls} />
              ) : (
                <p className="text-sm text-gray-500">No media</p>
              )}
            </div>
          ) : (
            <>
              {renderField("mediaUrls", "Media")}
              {Array.isArray(current.mediaUrls) &&
              current.mediaUrls.length > 0 ? (
                <div className="mt-2">
                  <MediaThumbList
                    urls={current.mediaUrls}
                    onDelete={removeMediaUrl}
                  />
                </div>
              ) : null}
            </>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <DefaultLayout>
      <div className="flex h-auto min-h-screen w-full flex-col items-center gap-4 bg-backgroundColor px-2 py-4">
        <div className="flex w-[97%] items-center justify-between">
          <h1 className={`${headerFont.className} text-2xl text-secondary`}>
            Forms
          </h1>
          <button
            onClick={openAdd}
            className="rounded-2xl bg-secondary px-4 py-2 text-sm text-creamey"
          >
            ADD NEW SUBMISSION
          </button>
        </div>

        <div className="w-[97%] rounded bg-white p-4 shadow">
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <div className="md:col-span-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, phone"
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType((e.target.value || "") as FormType | "")
                }
                className="w-full rounded border px-3 py-2"
              >
                <option value="">All Types</option>
                <option value="join_team">Join Team</option>
                <option value="contact">Contact</option>
                <option value="partner">Partner</option>
                <option value="share_news">Share News</option>
              </select>
              <button
                onClick={handleExport}
                disabled={!filterType || exporting}
                className="mt-2 w-full rounded bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                title={!filterType ? "Select a form type to export" : undefined}
              >
                Export to Excel
              </button>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus((e.target.value || "") as StatusType | "")
                }
                className="w-full rounded border px-3 py-2"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full rounded border px-3 py-2"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full rounded border border-gray-200 text-left">
              <thead className="bg-secondary text-creamey">
                <tr>
                  <th className="border p-2">#</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Phone</th>
                  <th className="border p-2">Created</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-4 text-center" colSpan={8}>
                      Loading...
                    </td>
                  </tr>
                ) : submissions.length === 0 ? (
                  <tr>
                    <td className="p-4 text-center" colSpan={8}>
                      No submissions
                    </td>
                  </tr>
                ) : (
                  submissions.map((item, idx) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="border p-2">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="border p-2">{item.formType}</td>
                      <td className="border p-2">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            updateStatusInline(
                              item._id,
                              e.target.value as StatusType,
                            )
                          }
                          className="rounded border px-2 py-1"
                        >
                          <option value="pending">pending</option>
                          <option value="reviewed">reviewed</option>
                          <option value="archived">archived</option>
                        </select>
                      </td>
                      <td className="border p-2">{item.name || "-"}</td>
                      <td className="border p-2">{item.email || "-"}</td>
                      <td className="border p-2">{item.phoneNumber || "-"}</td>
                      <td className="border p-2">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="border p-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openView(item)}
                            className="rounded bg-primary px-2 py-1 text-xs text-white"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className="rounded bg-secondary px-2 py-1 text-xs text-creamey"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteSubmission(item._id)}
                            className="rounded bg-red-500 px-2 py-1 text-xs text-white"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border px-3 py-1 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded border px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 md:pl-72.5"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded bg-white p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {modalType === "add"
                  ? "Add Submission"
                  : modalType === "edit"
                    ? "Edit Submission"
                    : "View Submission"}
              </h2>
              <button onClick={closeModal} className="text-gray-500">
                ✕
              </button>
            </div>

            {modalType === "view" ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Type
                    </label>
                    <input
                      value={current.formType || ""}
                      readOnly
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Status
                    </label>
                    <input
                      value={current.status || ""}
                      readOnly
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>
                {current.formType !== "partner" && (
                  <>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Name
                        </label>
                        <input
                          value={current.name || ""}
                          readOnly
                          className="w-full rounded border p-2"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Email
                        </label>
                        <input
                          value={current.email || ""}
                          readOnly
                          className="w-full rounded border p-2"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Phone
                        </label>
                        <input
                          value={current.phoneNumber || ""}
                          readOnly
                          className="w-full rounded border p-2"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="mt-2">{formSpecificFields()}</div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (modalType === "add") createSubmission();
                  else updateSubmission();
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Type
                    </label>
                    <select
                      value={current.formType || "contact"}
                      onChange={(e) =>
                        setCurrent((prev) => ({
                          ...prev,
                          formType: e.target.value as FormType,
                        }))
                      }
                      className="w-full rounded border p-2"
                    >
                      <option value="join_team">Join Team</option>
                      <option value="contact">Contact</option>
                      <option value="partner">Partner</option>
                      <option value="share_news">Share News</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Status
                    </label>
                    <select
                      value={current.status || "pending"}
                      onChange={(e) =>
                        setCurrent((prev) => ({
                          ...prev,
                          status: e.target.value as StatusType,
                        }))
                      }
                      className="w-full rounded border p-2"
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                {current.formType !== "partner" && (
                  <>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {renderField("name", "Name")}
                      {renderField("email", "Email")}
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {renderField("phoneNumber", "Phone")}
                    </div>
                  </>
                )}
                <div className="mt-2">{formSpecificFields()}</div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded border px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-primary px-4 py-2 text-white"
                  >
                    {modalType === "add" ? "Create" : "Update"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {viewerOpen && (
        <div
          className="fixed inset-0 z-50 flex  items-center justify-center bg-black bg-opacity-40 md:pl-72.5"
          onClick={closeViewerOverlay}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded bg-white p-6 sm:h-[85vh] md:h-[90vh]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Preview</h2>
              <button onClick={closeViewerOverlay} className="text-gray-600">
                ✕
              </button>
            </div>
            {viewerUrl ? (
              <div className="min-h-0 flex-1">
                {viewerType === "image" ||
                (!viewerType && isImage(viewerUrl)) ? (
                  <div className="relative h-full w-full overflow-hidden rounded border">
                    <img
                      src={viewerUrl}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : viewerType === "video" ||
                  (!viewerType && isVideo(viewerUrl)) ? (
                  <video
                    controls
                    className="h-full w-full rounded border"
                    src={viewerUrl}
                  />
                ) : viewerType === "pdf" ||
                  (!viewerType && isPDF(viewerUrl)) ? (
                  <iframe
                    src={viewerUrl}
                    className="h-full w-full rounded border"
                  />
                ) : (
                  <div className="h-full w-full rounded border" />
                )}
              </div>
            ) : null}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {viewerList.length > 1 && (
                  <>
                    <button
                      onClick={goPrev}
                      className="rounded border px-3 py-1"
                    >
                      Prev
                    </button>
                    <span className="text-sm">
                      {viewerIndex + 1} / {viewerList.length}
                    </span>
                    <button
                      onClick={goNext}
                      className="rounded border px-3 py-1"
                    >
                      Next
                    </button>
                  </>
                )}
              </div>
              <a
                href={viewerUrl ? downloadHref(viewerUrl) : "#"}
                download
                className="inline-flex items-center justify-center rounded-full border p-2 hover:bg-gray-100"
                title="Download"
              >
                <FaDownload />
              </a>
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
}
