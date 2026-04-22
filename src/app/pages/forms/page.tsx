"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { headerFont } from "@/app/lib/fonts";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FaPlay, FaDownload, FaTrash, FaStar, FaEye, FaEdit } from "react-icons/fa";

type FormType =
  | "join_team"
  | "contact"
  | "partner"
  | "share_news"
  | "join_good_project"
  | "testimonial"
  | "be_facilitator";

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

  contactNumber?: string;
  contactMethod?: string[];
  story?: string;
  mediaUrls?: string[];

  projectName?: string;
  faculty?: string;
  university?: string;
  academicYear?: string;
  graduationMonth?: string;
  graduationDate?: Date | string;
  aboutProject?: string;
  projectCategory?: string;
  projectLogoUrl?: string;
  teamPhotoUrl?: string;
  projectPageLink?: string;
  companyName?: string;
  role?: string;
  campaignPurpose?: string;
  professionalismRating?: number;
  clarityRating?: number;
  adaptabilityRating?: number;
  responsivenessRating?: number;
  overallRating?: number;
  continueWorkingRating?: number;
  recommendRating?: number;
  testimonialComment?: string;
  agreeToShare?: boolean;
  instagramHandle?: string;
  expertiseArea?: string;
  currentRole?: string;
  yearsOfExperience?: string;
  workshopTitle?: string;
  learningOutcomes?: string;
  formatPreference?: string;
  sessionLength?: string;
  numberOfDays?: string;
  hasFacilitateBefore?: boolean;
  previousWorkshopDetails?: string;
  portfolioUrl?: string;
  documentationComfort?: string;
  additionalInfo?: string;
  teamInstagramLinks?: string[];
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
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
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
  const [extraFilters, setExtraFilters] = useState<Record<string, string>>({});

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
        {
          label: "First Interest",
          compute: (s) => s.interestedFields?.[0] || "",
        },
        {
          label: "Second Interest",
          compute: (s) => s.interestedFields?.[1] || "",
        },
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
        { key: "contactNumber", label: "Contact Number" },
        { key: "contactMethod", label: "Preferred Contact Methods" },
      ];
    }
    if (type === "join_good_project") {
      return [
        ...common,

        { key: "projectName", label: "Project Name" },
        { key: "faculty", label: "Faculty" },
        { key: "university", label: "University" },
        { key: "academicYear", label: "Academic Year" },
        { key: "graduationMonth", label: "Graduation Month" },
        { key: "graduationDate", label: "Graduation Date" },
        { key: "aboutProject", label: "About Project" },
        { key: "projectCategory", label: "Project Category" },
        { key: "projectLogoUrl", label: "Project Logo Link" },
        { key: "teamPhotoUrl", label: "Team Photo Link" },
        { key: "projectPageLink", label: "Project Page Link" },
        {
          label: "Team Instagram Links",
          compute: (s) => (s.teamInstagramLinks || []).join("; "),
        },
      ];
    }
    if (type === "testimonial") {
      return [
        ...common,
        { key: "companyName", label: "Company Name" },
        { key: "role", label: "Role" },
        { key: "campaignPurpose", label: "Campaign Purpose" },
        { key: "professionalismRating", label: "Professionalism Rating" },
        { key: "clarityRating", label: "Clarity Rating" },
        { key: "adaptabilityRating", label: "Adaptability Rating" },
        { key: "responsivenessRating", label: "Responsiveness Rating" },
        { key: "overallRating", label: "Overall Rating" },
        { key: "continueWorkingRating", label: "Continue Working Rating" },
        { key: "recommendRating", label: "Recommend Rating" },
        { key: "testimonialComment", label: "Testimonial Comment" },
        { key: "agreeToShare", label: "Agree To Share" },
      ];
    }
    if (type === "be_facilitator") {
      return [
        ...common,
        { key: "instagramHandle", label: "Instagram Handle" },
        { key: "expertiseArea", label: "Expertise Area" },
        { key: "currentRole", label: "Current Role" },
        { key: "yearsOfExperience", label: "Years of Experience" },
        { key: "workshopTitle", label: "Workshop Title" },
        { key: "learningOutcomes", label: "Learning Outcomes" },
        { key: "formatPreference", label: "Format Preference" },
        { key: "sessionLength", label: "Session Length" },
        { key: "numberOfDays", label: "Number of Days" },
        { key: "hasFacilitateBefore", label: "Has Facilitated Before" },
        { key: "previousWorkshopDetails", label: "Previous Workshop Details" },
        { key: "portfolioUrl", label: "Portfolio/CV Link" },
        { key: "documentationComfort", label: "Documentation Comfort" },
        { key: "additionalInfo", label: "Additional Info" },
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
  const StarRating = ({
    value = 0,
    onChange,
    readOnly = false,
  }: {
    value?: number;
    onChange?: (n: number) => void;
    readOnly?: boolean;
  }) => {
    const v = Math.max(0, Math.min(5, value || 0));
    const stars = [1, 2, 3, 4, 5];
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {stars.map((i) =>
            readOnly ? (
              <span
                key={i}
                className={i <= v ? "text-yellow-400" : "text-gray-300"}
              >
                <FaStar />
              </span>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => onChange?.(i)}
                className="text-base"
                aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
                title={`${i} / 5`}
              >
                <FaStar
                  className={i <= v ? "text-yellow-400" : "text-gray-300"}
                />
              </button>
            ),
          )}
        </div>
        <span className="text-xs text-gray-500">{v}/5</span>
      </div>
    );
  };
  const handleExport = async () => {
    if (!filterType) return;
    try {
      setExporting(true);
      // Fetch ALL records for the selected form type (no pagination)
      const res = await axios.get("/api/form-submissions", {
        params: {
          formType: filterType,
          limit: 999999, // Large number to get all records
          search,
          status: filterStatus || undefined,
          ...extraFilters,
        },
      });
      const allRecords = res.data.data as FormSubmission[];
      const cols = columnsForType(filterType as FormType, allRecords);
      const rows = allRecords.map((s) =>
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
          sortBy,
          sortOrder,
          ...extraFilters,
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
  }, [page, limit, search, filterType, filterStatus, sortBy, sortOrder, extraFilters]);

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
          <textarea
            value={value || ""}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded border p-2 min-h-[120px]"
          />
        </div>
      );
    }

    let displayValue = value || "";
    if (inputType === "date" && value) {
      try {
        displayValue = new Date(value).toISOString().split("T")[0];
      } catch (e) {
        displayValue = value;
      }
    }

    return (
      <div className="mb-3">
        <label className="mb-1 block text-sm font-medium">{label}</label>
        <input
          type={inputType}
          value={displayValue}
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
              {renderField("contactNumber", "Contact Number")}
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
    if (current.formType === "join_good_project") {
      return (
        <>
          {modalType === "view" ? (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Project Name
                  </label>
                  <input
                    value={current.projectName || ""}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Faculty
                  </label>
                  <input
                    value={current.faculty || ""}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    University
                  </label>
                  <input
                    value={current.university || ""}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Academic Year
                  </label>
                  <input
                    value={current.academicYear || ""}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Graduation Month
                  </label>
                  <input
                    value={current.graduationMonth || ""}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Graduation Date
                  </label>
                  <input
                    value={
                      current.graduationDate
                        ? new Date(current.graduationDate).toLocaleDateString()
                        : ""
                    }
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  About Project
                </label>
                <textarea
                  value={current.aboutProject || ""}
                  readOnly
                  className="w-full rounded border p-2 min-h-[120px]"
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Project Category
                </label>
                <input
                  value={current.projectCategory || ""}
                  readOnly
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Project Logo Link
                </label>
                {current.projectLogoUrl ? (
                  <a
                    href={current.projectLogoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    {current.projectLogoUrl}
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">No logo</p>
                )}
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Team Photo Link
                </label>
                {current.teamPhotoUrl ? (
                  <a
                    href={current.teamPhotoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    {current.teamPhotoUrl}
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">No photo</p>
                )}
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Project Page Link
                </label>
                {current.projectPageLink ? (
                  <a
                    href={current.projectPageLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    {current.projectPageLink}
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">No page link</p>
                )}
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Team Instagram Links
                </label>
                {Array.isArray(current.teamInstagramLinks) &&
                current.teamInstagramLinks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {current.teamInstagramLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-600 hover:bg-blue-200"
                      >
                        Link {idx + 1}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No instagram links</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

                {renderField("projectName", "Project Name")}
                {renderField("faculty", "Faculty")}
                {renderField("university", "University")}
                {renderField("academicYear", "Academic Year")}
                {renderField("graduationMonth", "Graduation Month")}
                {renderField("graduationDate", "Graduation Date", "date")}
              </div>
              {renderField("aboutProject", "About Project", "textarea")}
              {renderField("projectCategory", "Project Category")}
              {renderField("projectLogoUrl", "Project Logo Link")}
              {renderField("teamPhotoUrl", "Team Photo Link")}
              {renderField("projectPageLink", "Project Page Link")}
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Team Instagram Links (Comma separated)
                </label>
                <input
                  type="text"
                  value={(current.teamInstagramLinks || []).join(", ")}
                  onChange={(e) =>
                    setCurrent((prev) => ({
                      ...prev,
                      teamInstagramLinks: e.target.value
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
    if (current.formType === "testimonial") {
      return (
        <>
          {modalType === "view" ? (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Company Name
                  </label>
                  <input
                    value={current.companyName || ""}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Role</label>
                  <input
                    value={current.role || ""}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Campaign Purpose
                  </label>
                  <input
                    value={current.campaignPurpose || ""}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Professionalism Rating
                  </label>
                  <StarRating
                    value={
                      typeof current.professionalismRating === "number"
                        ? current.professionalismRating
                        : 0
                    }
                    readOnly
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Clarity Rating
                  </label>
                  <StarRating
                    value={
                      typeof current.clarityRating === "number"
                        ? current.clarityRating
                        : 0
                    }
                    readOnly
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Adaptability Rating
                  </label>
                  <StarRating
                    value={
                      typeof current.adaptabilityRating === "number"
                        ? current.adaptabilityRating
                        : 0
                    }
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Responsiveness Rating
                  </label>
                  <StarRating
                    value={
                      typeof current.responsivenessRating === "number"
                        ? current.responsivenessRating
                        : 0
                    }
                    readOnly
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Overall Rating
                  </label>
                  <StarRating
                    value={
                      typeof current.overallRating === "number"
                        ? current.overallRating
                        : 0
                    }
                    readOnly
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Continue Working Rating
                  </label>
                  <StarRating
                    value={
                      typeof current.continueWorkingRating === "number"
                        ? current.continueWorkingRating
                        : 0
                    }
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Recommend Rating
                  </label>
                  <StarRating
                    value={
                      typeof current.recommendRating === "number"
                        ? current.recommendRating
                        : 0
                    }
                    readOnly
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Agree To Share
                  </label>
                  <input
                    value={
                      typeof current.agreeToShare === "boolean"
                        ? current.agreeToShare
                          ? "Yes"
                          : "No"
                        : ""
                    }
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">
                  Testimonial Comment
                </label>
                <textarea
                  value={current.testimonialComment || ""}
                  readOnly
                  className="w-full rounded border p-2"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {renderField("companyName", "Company Name")}
                {renderField("role", "Role")}
                {renderField("campaignPurpose", "Campaign Purpose")}
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Professionalism Rating
                  </label>
                  <StarRating
                    value={
                      typeof current.professionalismRating === "number"
                        ? current.professionalismRating
                        : 0
                    }
                    onChange={(n) =>
                      setCurrent((prev) => ({
                        ...prev,
                        professionalismRating: n,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Clarity Rating
                  </label>
                  <StarRating
                    value={
                      typeof current.clarityRating === "number"
                        ? current.clarityRating
                        : 0
                    }
                    onChange={(n) =>
                      setCurrent((prev) => ({
                        ...prev,
                        clarityRating: n,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Adaptability Rating
                  </label>
                  <StarRating
                    value={
                      typeof current.adaptabilityRating === "number"
                        ? current.adaptabilityRating
                        : 0
                    }
                    onChange={(n) =>
                      setCurrent((prev) => ({
                        ...prev,
                        adaptabilityRating: n,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Responsiveness Rating
                  </label>
                  <StarRating
                    value={
                      typeof current.responsivenessRating === "number"
                        ? current.responsivenessRating
                        : 0
                    }
                    onChange={(n) =>
                      setCurrent((prev) => ({
                        ...prev,
                        responsivenessRating: n,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Overall Rating
                  </label>
                  <StarRating
                    value={
                      typeof current.overallRating === "number"
                        ? current.overallRating
                        : 0
                    }
                    onChange={(n) =>
                      setCurrent((prev) => ({
                        ...prev,
                        overallRating: n,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Continue Working Rating
                  </label>
                  <StarRating
                    value={
                      typeof current.continueWorkingRating === "number"
                        ? current.continueWorkingRating
                        : 0
                    }
                    onChange={(n) =>
                      setCurrent((prev) => ({
                        ...prev,
                        continueWorkingRating: n,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Recommend Rating
                  </label>
                  <StarRating
                    value={
                      typeof current.recommendRating === "number"
                        ? current.recommendRating
                        : 0
                    }
                    onChange={(n) =>
                      setCurrent((prev) => ({
                        ...prev,
                        recommendRating: n,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Agree To Share
                  </label>
                  <select
                    value={
                      typeof current.agreeToShare === "boolean"
                        ? current.agreeToShare
                          ? "true"
                          : "false"
                        : ""
                    }
                    onChange={(e) =>
                      setCurrent((prev) => ({
                        ...prev,
                        agreeToShare: e.target.value === "true",
                      }))
                    }
                    className="w-full rounded border p-2"
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
              {renderField(
                "testimonialComment",
                "Testimonial Comment",
                "textarea",
              )}
            </>
          )}
        </>
      );
    }
    if (current.formType === "be_facilitator") {
      return (
        <>
          {modalType === "view" ? (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Instagram Handle
                  </label>
                  <input
                    value={current.instagramHandle || ""}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Expertise Area
                  </label>
                  <input
                    value={current.expertiseArea || ""}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Current Role
                  </label>
                  <input
                    value={current.currentRole || ""}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Years of Experience
                  </label>
                  <input
                    value={current.yearsOfExperience || ""}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
              </div>

              <div className="mb-3 mt-4 border-t pt-4">
                <h3 className="mb-2 font-semibold text-secondary">Workshop Details</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">
                      Workshop Title
                    </label>
                    <input
                      value={current.workshopTitle || ""}
                      readOnly
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">
                      Learning Outcomes
                    </label>
                    <textarea
                      value={current.learningOutcomes || ""}
                      readOnly
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Format Preference
                    </label>
                    <input
                      value={current.formatPreference || ""}
                      readOnly
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Session Length
                    </label>
                    <input
                      value={current.sessionLength || ""}
                      readOnly
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Number of Days
                    </label>
                    <input
                      value={current.numberOfDays || ""}
                      readOnly
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3 mt-4 border-t pt-4">
                <h3 className="mb-2 font-semibold text-secondary">Previous Experience</h3>
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium">
                    Has Facilitated Before
                  </label>
                  <input
                    value={current.hasFacilitateBefore ? "Yes" : "No"}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium">
                    Previous Workshop Details
                  </label>
                  <textarea
                    value={current.previousWorkshopDetails || ""}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
              </div>

              <div className="mb-3 mt-4 border-t pt-4">
                <h3 className="mb-2 font-semibold text-secondary">Additional Info</h3>
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium">
                    Portfolio/CV Link
                  </label>
                  {current.portfolioUrl ? (
                    <a
                      href={current.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline"
                    >
                      {current.portfolioUrl}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">No link provided</p>
                  )}
                </div>
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium">
                    Documentation Comfort
                  </label>
                  <input
                    value={current.documentationComfort || ""}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium">
                    Additional Info
                  </label>
                  <textarea
                    value={current.additionalInfo || ""}
                    readOnly
                    className="w-full rounded border p-2"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {renderField("instagramHandle", "Instagram Handle")}
                {renderField("expertiseArea", "Expertise Area")}
                {renderField("currentRole", "Current Role")}
                {renderField("yearsOfExperience", "Years of Experience")}
              </div>
              <div className="mb-3 mt-4 border-t pt-4">
                <h3 className="mb-2 font-semibold text-secondary">Workshop Details</h3>
                {renderField("workshopTitle", "Workshop Title")}
                {renderField("learningOutcomes", "Learning Outcomes", "textarea")}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {renderField("formatPreference", "Format Preference")}
                  {renderField("sessionLength", "Session Length")}
                  {renderField("numberOfDays", "Number of Days")}
                </div>
              </div>
              <div className="mb-3 mt-4 border-t pt-4">
                <h3 className="mb-2 font-semibold text-secondary">Previous Experience</h3>
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium">
                    Has Facilitated Before
                  </label>
                  <select
                    value={
                      typeof current.hasFacilitateBefore === "boolean"
                        ? current.hasFacilitateBefore
                          ? "true"
                          : "false"
                        : ""
                    }
                    onChange={(e) =>
                      setCurrent((prev) => ({
                        ...prev,
                        hasFacilitateBefore: e.target.value === "true",
                      }))
                    }
                    className="w-full rounded border p-2"
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                {renderField(
                  "previousWorkshopDetails",
                  "Previous Workshop Details",
                  "textarea",
                )}
              </div>
              <div className="mb-3 mt-4 border-t pt-4">
                <h3 className="mb-2 font-semibold text-secondary">Additional Info</h3>
                {renderField("portfolioUrl", "Portfolio/CV Link")}
                {renderField("documentationComfort", "Documentation Comfort")}
                {renderField("additionalInfo", "Additional Info", "textarea")}
              </div>
            </>
          )}
        </>
      );
    }
    return null;
  };

  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: string }) => {
    const isActive = sortBy === sortKey;
    return (
      <th
        className={`cursor-pointer border p-2 transition-colors hover:bg-secondary/90 ${
          isActive ? "bg-secondary/90" : ""
        }`}
        onClick={() => {
          setPage(1);
          if (isActive) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
          } else {
            setSortBy(sortKey);
            setSortOrder("desc");
          }
        }}
      >
        <div className="flex items-center justify-between gap-1">
          <span>{label}</span>
          <div className="flex flex-col text-[8px] leading-[1]">
            <span className={isActive && sortOrder === "asc" ? "text-white" : "text-white/30"}>▲</span>
            <span className={isActive && sortOrder === "desc" ? "text-white" : "text-white/30"}>▼</span>
          </div>
        </div>
      </th>
    );
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

        <div className="flex w-[97%] flex-wrap gap-2">
          {[
            { label: "All", value: "" },
            { label: "Join Team", value: "join_team" },
            { label: "Contact", value: "contact" },
            { label: "Partner", value: "partner" },
            { label: "Share News", value: "share_news" },
            { label: "Join Good Project", value: "join_good_project" },
            { label: "Testimonials", value: "testimonial" },
            { label: "Be a Facilitator", value: "be_facilitator" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setFilterType(tab.value as FormType | "");
                setPage(1);
                setExtraFilters({});
              }}
              className={`rounded-t-lg px-6 py-2 text-sm font-medium transition-all ${
                filterType === tab.value
                  ? "bg-white text-secondary shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-auto rounded-b rounded-tr bg-white p-4 shadow">
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4 lg:grid-cols-6">
            <div className="md:col-span-2 lg:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, phone"
                className="w-full rounded border px-3 py-2"
              />
            </div>
            {/* <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</label>
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
                <option value="join_good_project">Join Good Project</option>
                <option value="testimonial">Testimonials</option>
                <option value="be_facilitator">Be a Facilitator</option>
              </select>
            </div> */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded border px-3 py-2"
              >
                <option value="createdAt">Date</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="formType">Type</option>
                {filterType === "join_good_project" && (
                  <option value="graduationDate">Graduation Date</option>
                )}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as "asc" | "desc");
                  setPage(1);
                }}
                className="w-full rounded border px-3 py-2"
              >
                <option value="desc">Newest/Descending</option>
                <option value="asc">Oldest/Ascending</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
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
              <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Limit</label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full rounded border px-3 py-2"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {filterType && (
            <div className="mb-6 border-t pt-4">
              <h3 className="mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
                {filterType.replace(/_/g, " ")} Filters
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filterType === "join_team" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Resume As</label>
                      <input
                        value={extraFilters.resumeAs || ""}
                        onChange={(e) => setExtraFilters({ ...extraFilters, resumeAs: e.target.value })}
                        placeholder="Filter by role..."
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Experience</label>
                      <input
                        value={extraFilters.experience || ""}
                        onChange={(e) => setExtraFilters({ ...extraFilters, experience: e.target.value })}
                        placeholder="Filter by experience..."
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                )}
                {filterType === "contact" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Subject</label>
                    <input
                      value={extraFilters.subject || ""}
                      onChange={(e) => setExtraFilters({ ...extraFilters, subject: e.target.value })}
                      placeholder="Filter by subject..."
                      className="w-full rounded border px-3 py-2 text-sm"
                    />
                  </div>
                )}
                {filterType === "partner" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Business Name</label>
                      <input
                        value={extraFilters.businessName || ""}
                        onChange={(e) => setExtraFilters({ ...extraFilters, businessName: e.target.value })}
                        placeholder="Filter by business..."
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Industry</label>
                      <input
                        value={extraFilters.industry || ""}
                        onChange={(e) => setExtraFilters({ ...extraFilters, industry: e.target.value })}
                        placeholder="Filter by industry..."
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                )}
                {filterType === "join_good_project" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">University</label>
                      <input
                        value={extraFilters.university || ""}
                        onChange={(e) => setExtraFilters({ ...extraFilters, university: e.target.value })}
                        placeholder="Filter by university..."
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Faculty</label>
                      <input
                        value={extraFilters.faculty || ""}
                        onChange={(e) => setExtraFilters({ ...extraFilters, faculty: e.target.value })}
                        placeholder="Filter by faculty..."
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Project Category</label>
                      <input
                        value={extraFilters.projectCategory || ""}
                        onChange={(e) => setExtraFilters({ ...extraFilters, projectCategory: e.target.value })}
                        placeholder="Filter by category..."
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Academic Year</label>
                      <input
                        value={extraFilters.academicYear || ""}
                        onChange={(e) => setExtraFilters({ ...extraFilters, academicYear: e.target.value })}
                        placeholder="Filter by year..."
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Graduation Month</label>
                      <input
                        value={extraFilters.graduationMonth || ""}
                        onChange={(e) => setExtraFilters({ ...extraFilters, graduationMonth: e.target.value })}
                        placeholder="Filter by month..."
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                )}
                {filterType === "testimonial" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Company</label>
                      <input
                        value={extraFilters.companyName || ""}
                        onChange={(e) => setExtraFilters({ ...extraFilters, companyName: e.target.value })}
                        placeholder="Filter by company..."
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Min Rating</label>
                      <select
                        value={extraFilters.minOverallRating || ""}
                        onChange={(e) => setExtraFilters({ ...extraFilters, minOverallRating: e.target.value })}
                        className="w-full rounded border px-3 py-2 text-sm"
                      >
                        <option value="">Any Rating</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4+ Stars</option>
                        <option value="3">3+ Stars</option>
                        <option value="2">2+ Stars</option>
                        <option value="1">1+ Stars</option>
                      </select>
                    </div>
                  </>
                )}
                {filterType === "be_facilitator" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Expertise</label>
                      <input
                        value={extraFilters.expertiseArea || ""}
                        onChange={(e) => setExtraFilters({ ...extraFilters, expertiseArea: e.target.value })}
                        placeholder="Filter by expertise..."
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Format</label>
                      <input
                        value={extraFilters.formatPreference || ""}
                        onChange={(e) => setExtraFilters({ ...extraFilters, formatPreference: e.target.value })}
                        placeholder="Filter by format..."
                        className="w-full rounded border px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="mb-4 flex flex-col md:flex-row md:items-end gap-3 px-1">
            <button
              onClick={handleExport}
              disabled={!filterType || exporting}
              className="rounded bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50 hover:bg-green-700 transition-colors flex items-center gap-2"
              title={!filterType ? "Select a form type to export" : undefined}
            >
              <FaDownload className="text-xs" />
              {exporting ? "Exporting..." : "Export to Excel (CSV)"}
            </button>
          </div>

          <div className="">
            <table className="w-full rounded border border-gray-200 text-left">
              <thead className="bg-secondary text-creamey">
                <tr>
                  <th className="border p-2 w-10">#</th>
                  {!filterType && <SortableHeader label="Type" sortKey="formType" />}
                  <SortableHeader label="Status" sortKey="status" />
                  <SortableHeader label="Name" sortKey="name" />
                  <SortableHeader label="Email" sortKey="email" />
                  {filterType === "join_team" && <SortableHeader label="Role" sortKey="resumeAs" />}
                  {filterType === "join_good_project" && (
                    <>
                      <th className="border p-2">Project</th>
                      <th className="border p-2">Month</th>
                      <SortableHeader label="Grad. Date" sortKey="graduationDate" />
                    </>
                  )}
                  {filterType === "testimonial" && <SortableHeader label="Rating" sortKey="overallRating" />}
                  <SortableHeader label="Created" sortKey="createdAt" />
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
                      {!filterType && <td className="border p-2">{item.formType}</td>}
                      <td className="border p-2">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            updateStatusInline(
                              item._id,
                              e.target.value as StatusType,
                            )
                          }
                          className="rounded border px-2 py-1 text-sm"
                        >
                          <option value="pending">pending</option>
                          <option value="reviewed">reviewed</option>
                          <option value="archived">archived</option>
                        </select>
                      </td>
                      <td className="border p-2">{item.name || "-"}</td>
                      <td className="border p-2">{item.email || "-"}</td>
                      {filterType === "join_team" && <td className="border p-2">{item.resumeAs || "-"}</td>}
                      {filterType === "join_good_project" && (
                        <>
                          <td className="border p-2">{item.projectName || "-"}</td>
                          <td className="border p-2">{item.graduationMonth || "-"}</td>
                          <td className="border p-2">
                            {item.graduationDate
                              ? new Date(item.graduationDate).toLocaleDateString()
                              : "-"}
                          </td>
                        </>
                      )}
                      {filterType === "testimonial" && (
                        <td className="border p-2">
                          <div className="flex items-center gap-1 text-yellow-400">
                            <FaStar className="text-[10px]" />
                            <span className="text-xs font-semibold text-gray-700">{item.overallRating || 0}</span>
                          </div>
                        </td>
                      )}
                      <td className="border p-2">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="border p-2">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openView(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50 text-pink-400 transition-colors hover:bg-blue-100"
                            title="View"
                          >
                            <FaEye className="text-sm" />
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100"
                            title="Edit"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            onClick={() => deleteSubmission(item._id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                            title="Delete"
                          >
                            <FaTrash className="text-sm" />
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
                      <option value="join_good_project">
                        Join Good Project
                      </option>
                      <option value="testimonial">Testimonials</option>
                      <option value="be_facilitator">Be a Facilitator</option>
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
