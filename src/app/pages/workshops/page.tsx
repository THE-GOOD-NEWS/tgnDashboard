"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { headerFont } from "@/app/lib/fonts";
import axios from "axios";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { CldUploadWidget } from "next-cloudinary";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaMoneyBillWave,
  FaCheck,
  FaBan,
  FaDownload,
} from "react-icons/fa";
import { MdOutlineWorkspaces } from "react-icons/md";
import { HiOutlinePhoto } from "react-icons/hi2";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types (match model exactly) ─────────────────────────────────────────────
interface ISession {
  _id?: string;
  title: string;
  sessionStartDate: string; // ISO string from API
  startTime: string;        // "HH:MM"
  duration: number;         // minutes
  includes: string[];
  description?: string;
}

interface IAttendance {
  _id?: string;
  requestId?: string;
  name: string;
  email: string;
  phone: string;
  instapayImage?: string;
}

interface IWorkshopAttendanceRequest {
  _id: string;
  workshopId: string | { _id: string; title: string };
  name: string;
  phone: string;
  email: string;
  howDidYouKnow: "TGN" | "Instructor page" | "Ads" | "Friends and Family";
  type: "available" | "waitlist" ;
  instapayImage?: string;
  status: "pending" | "approved" | "rejected" |"archived";
  notes?: string;
  seen: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IWorkshopPackageRequest {
  _id: string;
  packageId: string | { _id: string; title: string; price: number };
  selectedWorkshops: any[];
  name: string;
  phone: string;
  email: string;
  instapayImage: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  seen: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IWorkshopPackage {
  _id: string;
  thumbnail: string;
  title: string;
  price: number;
  maxWorkshops: number;
  isAllWorkshopsIncluded: boolean;
  includedWorkshops: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface IWorkshop {
  _id: string;
  title: string;
  slug: string;
  instructors: string[];
  images: string[];
  location: {
    altText: string;
    link: string;
    moreDescription?: string;
  };
  briefy: string;
  description: string;
  policy?: string;
  startDate: string;
  endDate: string;
  price: number;
  slots: number;
  attendance: IAttendance[];
  availableSessions: ISession[];
  visits: number;
  status: "active" | "draft" | "archived" | "coming soon";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

type ModalMode = "add" | "edit" | "view" | null;
type ActiveTab = "details" | "sessions" | "attendance" | "images";
type PageTab = "workshops" | "requests" | "pkg-requests" | "analytics" | "packages";

// ─── Empty templates ──────────────────────────────────────────────────────────
// ─── Reusable Sub-components ─────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20",
  };
  return (
    <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark flex items-center gap-4">
      <div className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-black dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function StatBar({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-1.5 uppercase tracking-tighter">
        <span>{label}</span>
        <span className="text-gray-400">{count} / {total} ({pct}%)</span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-meta-4 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-1000`} 
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SectionTitle({
  children,
  noPad,
}: {
  children: React.ReactNode;
  noPad?: boolean;
}) {
  return (
    <h3
      className={`${noPad ? "" : "mb-4"} text-xs font-black uppercase tracking-widest text-primary/80`}
    >
      {children}
    </h3>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
        {label}
        {required && <span className="ml-1 text-red-500 font-black">*</span>}
      </label>
      {children}
    </div>
  );
}

function inputCls(readOnly: boolean) {
  return `w-full rounded-xl border px-4 py-2.5 text-sm font-medium outline-none transition
    ${
      readOnly
        ? "border-transparent bg-gray-50 text-gray-700 dark:bg-meta-4 dark:text-gray-300 cursor-default"
        : "border-stroke bg-white text-black focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm dark:border-strokedark dark:bg-boxdark dark:text-white"
    }`;
}

const emptySession = (): ISession => ({
  title: "",
  sessionStartDate: "",
  startTime: "",
  duration: 0,
  includes: [],
  description: "",
});

const emptyWorkshop = (): Partial<IWorkshop> => ({
  title: "",
  slug: "",
  instructors: [],
  images: [],
  location: {
    altText: "",
    link: "",
    moreDescription: "",
  },
  briefy: "",
  description: "",
  policy: "",
  startDate: "",
  endDate: "",
  price: 0,
  slots: 0,
  attendance: [],
  availableSessions: [],
  notes: "",
  visits: 0,
  status: "active",
});

const emptyPackage = (): Partial<IWorkshopPackage> => ({
  thumbnail: "",
  title: "",
  price: 0,
  maxWorkshops: 1,
  isAllWorkshopsIncluded: false,
  includedWorkshops: [],
  description: "",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toInputDate = (iso: string) => (iso ? iso.slice(0, 10) : "");

const autoSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

const fmt = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const statusColors: Record<IWorkshopAttendanceRequest["status"], string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  archived:"bg-gray-100 text-gray-600"
};

// ─── Reusable Tags Input Component ───────────────────────────────────────────
function TagsInput({ 
  value = [], 
  onChange, 
  placeholder, 
  readOnly 
}: { 
  value: string[], 
  onChange: (v: string[]) => void, 
  placeholder?: string, 
  readOnly?: boolean 
}) {
  const [inputValue, setInputValue] = useState("");
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly) return;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !value.includes(newTag)) {
        onChange([...value, newTag]);
      }
      setInputValue("");
    } else if (e.key === 'Backspace' && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    if (readOnly) return;
    const newTags = [...value];
    newTags.splice(index, 1);
    onChange(newTags);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-sm outline-none transition ${readOnly ? "border-transparent bg-gray-50 dark:bg-meta-4 cursor-default" : "border-stroke bg-white focus-within:border-primary dark:border-strokedark dark:bg-boxdark"}`}>
      {value.map((tag, i) => (
        <span key={i} className="flex flex-shrink-0 items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-semibold">
          {tag}
          {!readOnly && (
            <button type="button" onClick={() => removeTag(i)} className="hover:text-red-500 rounded-full hover:bg-red-100 p-0.5 transition">
              <FaTimes size={10} />
            </button>
          )}
        </span>
      ))}
      {!readOnly && (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : "Type & press enter or comma"}
          className="flex-1 bg-transparent outline-none min-w-[150px] dark:text-white text-sm py-0.5"
        />
      )}
    </div>
  );
}

// ─── Reusable Image DnD Component ────────────────────────────────────────────
function ImageUploadAndSort({ 
  images, 
  onChange, 
  readOnly 
}: { 
  images: string[], 
  onChange: (val: string[] | ((prev: string[]) => string[])) => void, 
  readOnly?: boolean 
}) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (readOnly) return;
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index || readOnly) return;
    const newImages = [...images];
    const item = newImages.splice(draggedIdx, 1)[0];
    newImages.splice(index, 0, item);
    onChange(newImages);
    setDraggedIdx(index);
  };

  const removeImg = (index: number) => {
    if (readOnly) return;
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div className="flex flex-col gap-4">
      {!readOnly && (
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "workshops"}
          options={{ multiple: true }}
          onSuccess={(result: any) => {
            if (result?.info?.secure_url) {
              onChange((prev = []) => [...prev, result.info.secure_url]);
            }
          }}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => open()}
              className="w-full rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 py-8 text-center text-sm font-semibold text-primary transition hover:bg-primary/10 dark:border-strokedark dark:text-white"
            >
              <HiOutlinePhoto size={32} className="mx-auto mb-2 opacity-70" />
              Click to Upload Image
            </button>
          )}
        </CldUploadWidget>
      )}

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
          {images.map((url, i) => (
            <div
              key={url}
              draggable={!readOnly}
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={() => setDraggedIdx(null)}
              className={`group relative aspect-square overflow-hidden rounded-xl border border-stroke bg-gray-100 dark:border-strokedark dark:bg-meta-4 shadow-sm transition-all
                ${draggedIdx === i ? "opacity-40 scale-95" : "hover:shadow-md"} 
                ${readOnly ? "" : "cursor-move"}`}
            >
              <img src={url} alt={`Image ${i}`} className="h-full w-full object-cover" />
              {!readOnly && (
                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10">
                  <button
                    type="button"
                    onClick={() => removeImg(i)}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition hover:bg-red-600 hover:scale-110 opacity-0 group-hover:opacity-100"
                  >
                    <FaTimes size={10} />
                  </button>
                  <div className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-md bg-black/50 text-[10px] font-bold text-white backdrop-blur-sm">
                    {i + 1}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-gray-400">No images added</p>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function WorkshopsPage() {
  const [topTab, setTopTab] = useState<PageTab>("workshops");
  const [workshops, setWorkshops] = useState<IWorkshop[]>([]);
  const [allWorkshops, setAllWorkshops] = useState<IWorkshop[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [workshopStatus, setWorkshopStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Analytics filter state
  const [analyticsFilterType, setAnalyticsFilterType] = useState<"all" | "month" | "custom">("all");
  const [analyticsMonth, setAnalyticsMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [analyticsStartDate, setAnalyticsStartDate] = useState<string>("");
  const [analyticsEndDate, setAnalyticsEndDate] = useState<string>("");
  const limit = 10;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [current, setCurrent] = useState<Partial<IWorkshop>>(emptyWorkshop());
  const [activeTab, setActiveTab] = useState<ActiveTab>("details");

  // Packages state
  const [packages, setPackages] = useState<IWorkshopPackage[]>([]);
  const [pkgModalOpen, setPkgModalOpen] = useState(false);
  const [pkgModalMode, setPkgModalMode] = useState<ModalMode>(null);
  const [currentPkg, setCurrentPkg] = useState<Partial<IWorkshopPackage>>(emptyPackage());
  const [pkgDeleteId, setPkgDeleteId] = useState<string | null>(null);

  // Requests state
  const [requests, setRequests] = useState<IWorkshopAttendanceRequest[]>([]);
  const [allRequests, setAllRequests] = useState<IWorkshopAttendanceRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [currentReq, setCurrentReq] = useState<IWorkshopAttendanceRequest | null>(null);

  // Package Requests state
  const [pkgRequests, setPkgRequests] = useState<IWorkshopPackageRequest[]>([]);
  const [pkgRequestsLoading, setPkgRequestsLoading] = useState(false);

  const analyticsData = useMemo(() => {
    if (topTab !== "analytics") return { 
      topRequested: [] as IWorkshop[], 
      topWaitlist: [] as IWorkshop[], 
      topComingSoon: [] as IWorkshop[],
      requestCounts: {} as Record<string, number>, 
      waitlistCounts: {} as Record<string, number>, 
      comingSoonCounts: {} as Record<string, number>,
      filteredRequests: [] as IWorkshopAttendanceRequest[] 
    };
    
    const requestCounts: Record<string, number> = {};
    const waitlistCounts: Record<string, number> = {};
    const comingSoonCounts: Record<string, number> = {};
    
    const filteredRequests = allRequests.filter(req => {
      if (analyticsFilterType === "all") return true;
      const createdAt = new Date(req.createdAt).getTime();
      
      if (analyticsFilterType === "month") {
        const [year, month] = analyticsMonth.split("-").map(Number);
        const date = new Date(req.createdAt);
        return date.getFullYear() === year && (date.getMonth() + 1) === month;
      }
      
      if (analyticsFilterType === "custom") {
        const start = analyticsStartDate ? new Date(analyticsStartDate).setHours(0,0,0,0) : 0;
        const end = analyticsEndDate ? new Date(analyticsEndDate).setHours(23,59,59,999) : Infinity;
        return createdAt >= start && createdAt <= end;
      }
      
      return true;
    });

    filteredRequests.forEach(req => {
      const wId = typeof req.workshopId === 'object' ? req.workshopId._id : req.workshopId;
      requestCounts[wId] = (requestCounts[wId] || 0) + 1;
      if (req.type === 'waitlist') {
        waitlistCounts[wId] = (waitlistCounts[wId] || 0) + 1;
      }
    });

    const topRequested = [...workshops].sort((a,b) => (requestCounts[b._id] || 0) - (requestCounts[a._id] || 0)).slice(0, 5);
    const topWaitlist = [...workshops].sort((a,b) => (waitlistCounts[b._id] || 0) - (waitlistCounts[a._id] || 0)).slice(0, 5);
    const topComingSoon = [...workshops].sort((a,b) => (comingSoonCounts[b._id] || 0) - (comingSoonCounts[a._id] || 0)).slice(0, 5);

    return { topRequested, topWaitlist, topComingSoon, requestCounts, waitlistCounts, comingSoonCounts, filteredRequests };
  }, [topTab, allRequests, workshops, analyticsFilterType, analyticsMonth, analyticsStartDate, analyticsEndDate]);

  // Session accordion
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Attendee manual edit state
  const [attendeeModalOpen, setAttendeeModalOpen] = useState(false);
  const [attendeeMode, setAttendeeMode] = useState<"add" | "edit">("add");
  const [editingAttendeeIdx, setEditingAttendeeIdx] = useState<number | null>(null);
  const [tempAttendee, setTempAttendee] = useState<IAttendance>({ name: "", email: "", phone: "", instapayImage: "" });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchWorkshops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/workshops", {
        params: {
          page,
          limit,
          search: search || undefined,
          all: topTab !== "workshops",
          id: selectedWorkshop || undefined,
          status: workshopStatus || undefined,
        },
      });
      setWorkshops(res.data.data);
      if (topTab === "workshops") setTotal(res.data.total);
      
      // Also fetch all workshops for dropdowns if not already fetched or if needed
      if (allWorkshops.length === 0 || topTab !== "workshops") {
        const allRes = await axios.get("/api/workshops", { params: { all: true } });
        setAllWorkshops(allRes.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, topTab, allWorkshops.length, selectedWorkshop, workshopStatus]);

  useEffect(() => {
    fetchWorkshops();
  }, [fetchWorkshops]);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await axios.get("/api/workshop-packages");
      setPackages(res.data.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const fetchSingleWorkshop = useCallback(async (id: string) => {
    try {
      const res = await axios.get(`/api/workshops/${id}`);
      setCurrent(res.data.data);
    } catch (e) {
      console.error("Error fetching single workshop:", e);
    }
  }, []);

  // ── Fetch Requests ────────────────────────────────────────────────────────
  const fetchRequests = useCallback(async (workshopId?: string) => {
    setRequestsLoading(true);
    try {
      const res = await axios.get("/api/workshop-attendance-requests", {
        params: { workshopId },
      });
      // Filter out requests for workshops that don't exist (where workshopId is null after population)
      const validRequests = res.data.data.filter((req: any) => req.workshopId);
      
      if (workshopId) {
        setRequests(validRequests);
      } else {
        setAllRequests(validRequests);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const fetchPkgRequests = useCallback(async () => {
    setPkgRequestsLoading(true);
    try {
      const res = await axios.get("/api/workshop-package-requests");
      setPkgRequests(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setPkgRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPkgRequests();
  }, [fetchPkgRequests]);

  const exportToExcel = () => {
    const filteredRequests = allRequests.filter((req) => {
      const matchWorkshop = !selectedWorkshop || (typeof req.workshopId === "object" ? req.workshopId._id : req.workshopId) === selectedWorkshop;
      const matchStatus = !selectedStatus || req.status === selectedStatus;
      return matchWorkshop && matchStatus;
    });

    const excelData = filteredRequests.map((req) => ({
      "Workshop Title": typeof req.workshopId === "object" ? req.workshopId.title : "N/A",
      "Requester Name": req.name,
      "Email": req.email,
      "Phone": req.phone,
      "How Did You Know": req.howDidYouKnow,
      "Type": req.type,
      "Status": req.status,
      "Notes/Expectations": req.notes || "",
      "Request Date": new Date(req.createdAt).toLocaleString(),
      "Last Updated": new Date(req.updatedAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Requests");

    const workshop = allWorkshops.find(w => w._id === selectedWorkshop);
    const fileName = selectedWorkshop && workshop
      ? `Requests_${workshop.title.replace(/[^a-z0-9]/gi, '_')}.xlsx`
      : "All_Workshop_Requests.xlsx";

    XLSX.writeFile(workbook, fileName);
  };

  const generateAttendancePDF = async (workshop: IWorkshop) => {
    try {
      const doc = new jsPDF({
        compress: true,
      });
      const primaryColor: [number, number, number] = [91, 28, 30]; // #5B1C1E in RGB
      
      // Load Logo
      try {
        const img = new Image();
        img.src = '/theGoodSpace/10.png';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        // Center the logo at the top
        const logoWidth = 50; // Increased as requested
        const logoHeight = (img.height * logoWidth) / img.width;
        doc.addImage(img, 'PNG', (210 - logoWidth) / 2, 10, logoWidth, logoHeight, undefined, 'FAST');
      } catch (err) {
        console.warn("Logo failed to load for PDF, skipping...", err);
      }
      
      // Header (Pushed down to make room for logo)
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Attendance List", 105, 55, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text("Generated on " + new Date().toLocaleString(), 105, 62, { align: "center" });
      
      // Details Section
      doc.setDrawColor(210);
      doc.line(14, 68, 196, 68);
      
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(workshop.title, 14, 78);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Location: ${workshop.location?.altText || 'N/A'}`, 14, 86);
      doc.text(`Schedule: ${fmt(workshop.startDate)} to ${fmt(workshop.endDate)}`, 14, 91);
      doc.text(`Capacity: ${workshop.slots} slots`, 14, 96);
      doc.text(`Current Attendees: ${workshop.attendance?.length || 0}`, 14, 101);
      
      // Table
      const tableColumn = ["#", "Attendee Name", "Email Address", "Phone Number"];
      const tableRows = (workshop.attendance || []).map((att, index) => [
        index + 1,
        att.name,
        att.email,
        att.phone
      ]);
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 108,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, fontStyle: 'bold', textColor: [255, 255, 255] as [number, number, number] },
        styles: { fontSize: 9, cellPadding: 3.5 },
        alternateRowStyles: { fillColor: [248, 245, 245] },
        margin: { top: 108 }
      });
      
      doc.save(`Attendance_List_${workshop.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    } catch (error) {
      console.error("PDF Generation error:", error);
      alert("Error generating PDF. Please check the console for details.");
    }
  };

  useEffect(() => {
    if (topTab === "requests" || topTab === "analytics") {
      fetchRequests();
    }
  }, [topTab, fetchRequests]);

  useEffect(() => {
    if (modalOpen && current._id) {
      fetchRequests(current._id);
    }
  }, [modalOpen, current._id, fetchRequests]);

  // ── Package Modal helpers ──────────────────────────────────────────────────
  const openAddPkg = () => {
    setCurrentPkg(emptyPackage());
    setPkgModalMode("add");
    setPkgModalOpen(true);
  };

  const openEditPkg = (p: IWorkshopPackage) => {
    setCurrentPkg({ ...p });
    setPkgModalMode("edit");
    setPkgModalOpen(true);
  };
  
  const closePkgModal = () => {
    setPkgModalOpen(false);
    setPkgModalMode(null);
    setCurrentPkg(emptyPackage());
  };
  
  const setPkgField = (key: keyof IWorkshopPackage, value: any) =>
    setCurrentPkg((p) => ({ ...p, [key]: value }));

  const handlePkgSubmit = async () => {
    try {
      if (pkgModalMode === "add") {
        await axios.post("/api/workshop-packages", currentPkg);
      } else if (pkgModalMode === "edit") {
        await axios.put(`/api/workshop-packages/${currentPkg._id}`, currentPkg);
      }
      closePkgModal();
      fetchPackages();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Error saving package");
    }
  };

  const handlePkgDelete = async () => {
    if (!pkgDeleteId) return;
    try {
      await axios.delete(`/api/workshop-packages/${pkgDeleteId}`);
      setPkgDeleteId(null);
      fetchPackages();
    } catch (e) {
      console.error(e);
    }
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setCurrent(emptyWorkshop());
    setModalMode("add");
    setActiveTab("details");
    setModalOpen(true);
    setExpandedSession(null);
  };

  const openEdit = (w: IWorkshop) => {
    setCurrent({ ...w });
    setModalMode("edit");
    setActiveTab("details");
    setModalOpen(true);
    setExpandedSession(null);
  };

  const openView = (w: IWorkshop) => {
    setCurrent({ ...w });
    setModalMode("view");
    setActiveTab("details");
    setModalOpen(true);
    setExpandedSession(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMode(null);
    setCurrent(emptyWorkshop());
  };

  // ── Field helpers ──────────────────────────────────────────────────────────
  const setField = (key: keyof IWorkshop, value: any) =>
    setCurrent((p) => ({ ...p, [key]: typeof value === "function" ? value(p[key]) : value }));

  const setSessionField = (idx: number, key: keyof ISession, value: any) => {
    const sessions = [...(current.availableSessions || [])];
    sessions[idx] = { ...sessions[idx], [key]: value };
    setField("availableSessions", sessions);
  };

  const addSession = () => {
    const sessions = [...(current.availableSessions || []), emptySession()];
    setField("availableSessions", sessions);
    setExpandedSession(sessions.length - 1);
  };

  const removeSession = (idx: number) => {
    const sessions = (current.availableSessions || []).filter(
      (_, i) => i !== idx,
    );
    setField("availableSessions", sessions);
    setExpandedSession(null);
  };

  const updateAttendanceStatus = async (
    requestId: string,
    status: IWorkshopAttendanceRequest["status"],
  ) => {
    try {
      await axios.patch(`/api/workshop-attendance-requests/${requestId}`, {
        status,
      });
      if (current._id) {
        fetchRequests(current._id);
        fetchSingleWorkshop(current._id);
      }
      fetchRequests(); // Always refresh global list
      // Also refresh background list
      fetchWorkshops();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Error updating status");
    }
  };

  const openReqEdit = (req: IWorkshopAttendanceRequest) => {
    setCurrentReq({ ...req });
    setReqModalOpen(true);
  };

  const handleUpdateReq = async () => {
    if (!currentReq?._id) return;
    try {
      await axios.patch(`/api/workshop-attendance-requests/${currentReq._id}`, currentReq);
      setReqModalOpen(false);
      fetchRequests(); // Refresh global list
      if (current._id) fetchRequests(current._id); // Refresh workshop specific list if open
      fetchWorkshops(); // Refresh workshops to sync attendance
    } catch (e: any) {
      alert(e?.response?.data?.error || "Error updating request");
    }
  };

  const markAllSeen = useCallback(async () => {
    try {
      await axios.patch("/api/workshop-attendance-requests", null, { params: { action: "markSeen" } });
      fetchRequests();
    } catch (e) {
      console.error("Error marking as seen:", e);
    }
  }, [fetchRequests]);

  const markAllPkgSeen = useCallback(async () => {
    try {
      await axios.patch("/api/workshop-package-requests", null, { params: { action: "markSeen" } });
      fetchPkgRequests();
    } catch (e) {
      console.error("Error marking package requests as seen:", e);
    }
  }, [fetchPkgRequests]);

  useEffect(() => {
    if (topTab === "requests") {
      markAllSeen();
    } else if (topTab === "pkg-requests") {
      markAllPkgSeen();
    }
  }, [topTab, markAllSeen, markAllPkgSeen]);

  const updatePkgAttendanceStatus = async (
    requestId: string,
    status: "pending" | "approved" | "rejected" |"archived",
  ) => {
    try {
      await axios.patch(`/api/workshop-package-requests/${requestId}`, {
        status,
      });
      fetchPkgRequests(); // Refresh list
      fetchWorkshops(); // Sync attendance
    } catch (e: any) {
      alert(e?.response?.data?.error || "Error updating status");
    }
  };

  // ── Attendee Manual CRUD ──────────────────────────────────────────────────
  const openAddAttendee = () => {
    setTempAttendee({ name: "", email: "", phone: "", instapayImage: "" });
    setAttendeeMode("add");
    setEditingAttendeeIdx(null);
    setAttendeeModalOpen(true);
  };

  const openEditAttendee = (idx: number) => {
    const person = (current.attendance || [])[idx];
    setTempAttendee({ ...person });
    setAttendeeMode("edit");
    setEditingAttendeeIdx(idx);
    setAttendeeModalOpen(true);
  };

  const saveAttendee = () => {
    if (!tempAttendee.name || !tempAttendee.email || !tempAttendee.phone) {
      alert("Name, Email, and Phone are required.");
      return;
    }
    const list = [...(current.attendance || [])];
    if (attendeeMode === "add") {
      list.push(tempAttendee);
    } else if (editingAttendeeIdx !== null) {
      list[editingAttendeeIdx] = tempAttendee;
    }
    setField("attendance", list);
    setAttendeeModalOpen(false);
  };

  const removeAttendee = (idx: number) => {
    if (window.confirm("Are you sure you want to remove this attendee?")) {
      const list = (current.attendance || []).filter((_, i) => i !== idx);
      setField("attendance", list);
    }
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const validateDates = (): string | null => {
    if (!current.startDate || !current.endDate) return null;
    
    // Set hours to 0 to compare just the dates accurately
    const wsStart = new Date(current.startDate);
    wsStart.setHours(0,0,0,0);
    const wsEnd = new Date(current.endDate);
    wsEnd.setHours(23,59,59,999);

    if (wsStart.getTime() > wsEnd.getTime()) {
      return "Workshop Start Date cannot be after End Date.";
    }

    if (current.availableSessions) {
      for (let i = 0; i < current.availableSessions.length; i++) {
        const sess = current.availableSessions[i];
        if (sess.sessionStartDate) {
          const sStart = new Date(sess.sessionStartDate);
          sStart.setHours(12,0,0,0); // mid day to avoid timezone edge cases
          if (sStart.getTime() < wsStart.getTime() || sStart.getTime() > wsEnd.getTime()) {
            return `Session "${sess.title || i+1}" must have a start date between workshop start and end dates (${toInputDate(current.startDate)} and ${toInputDate(current.endDate)}).`;
          }
        }
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const dateError = validateDates();
    if (dateError) {
      alert(dateError);
      return;
    }

    try {
      const payload = { ...current };
      if (!payload.slug && payload.title) {
        payload.slug = autoSlug(payload.title);
      }
      if (modalMode === "add") {
        await axios.post("/api/workshops", payload);
      } else if (modalMode === "edit") {
        await axios.put(`/api/workshops/${current._id}`, payload);
      }
      closeModal();
      fetchWorkshops();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Error saving workshop");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/workshops/${deleteId}`);
      setDeleteId(null);
      fetchWorkshops();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
    }
  };

  const isReadOnly = modalMode === "view";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DefaultLayout>
      <div
        className={`${headerFont.className} min-h-screen bg-gray-50 dark:bg-boxdark p-6`}
      >
        {/* ── Page Header ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white text-2xl shadow">
              <MdOutlineWorkspaces />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">
                The Good Space
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage Workshops, track requests, and analyze performance
              </p>
            </div>
          </div>
          <button
            onClick={() => topTab === "packages" ? openAddPkg() : openAdd()}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:opacity-90 hover:scale-105 active:scale-95"
          >
            <FaPlus />
            {topTab === "packages" ? "New Package" : "New Workshop"}
          </button>
        </div>

        <div className="mb-8 flex overflow-x-auto no-scrollbar border-b border-stroke dark:border-strokedark">
          {(["workshops", "packages", "requests", "pkg-requests", "analytics"] as PageTab[]).map((t) => {
            let unreadCount = 0;
            if (t === "requests") unreadCount = allRequests.filter(r => !r.seen).length;
            if (t === "pkg-requests") unreadCount = pkgRequests.filter(r => !r.seen).length;
            return (
              <button
                key={t}
                onClick={() => setTopTab(t)}
                className={`relative px-8 py-4 text-sm font-bold capitalize transition-all border-b-2 whitespace-nowrap
                  ${topTab === t 
                    ? "border-primary text-primary bg-primary/5" 
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-meta-4"}`}
              >
                {t.replace("-", " ")}
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {topTab === "workshops" && (
          <>
            {/* ── Search ── */}
            <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
              <input
                type="text"
                placeholder="Search workshops…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full max-w-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-boxdark dark:text-white"
              />
              <select
                value={selectedWorkshop}
                onChange={(e) => {
                  setSelectedWorkshop(e.target.value);
                  setPage(1);
                }}
                className="w-full max-w-xs rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-boxdark dark:text-white"
              >
                <option value="">All Workshops</option>
                {allWorkshops.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.title}
                  </option>
                ))}
              </select>

              <select
                value={workshopStatus}
                onChange={(e) => {
                  setWorkshopStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full max-w-[200px] rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-boxdark dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
                <option value="coming soon">Coming Soon</option>
              </select>
              

            </div>
            

            {/* Table block remains same below */}

        {/* ── Table ── */}
        <div className="rounded-2xl border border-stroke bg-white shadow-md dark:border-strokedark dark:bg-boxdark overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-gray-400">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary dark:border-strokedark dark:border-t-primary" />
              <p className="font-medium animate-pulse">Loading workshops...</p>
            </div>
          ) : workshops.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
              <MdOutlineWorkspaces size={56} className="opacity-20 mb-2" />
              <p className="text-base font-medium">No workshops found</p>
              {search && <p className="text-xs">Try adjusting your search criteria</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stroke bg-gray-50 dark:border-strokedark dark:bg-meta-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-4">Title</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Start Date</th>
                    <th className="px-5 py-4">End Date</th>
                    <th className="px-5 py-4 text-center">Slots</th>
                    <th className="px-5 py-4 text-center">Price</th>
                    <th className="px-5 py-4 text-center">Sessions</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark">
                  {workshops.map((w) => (
                    <tr
                      key={w._id}
                      className="group transition hover:bg-gray-50 dark:hover:bg-meta-4"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {w.images && w.images.length > 0 ? (
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-stroke dark:border-strokedark">
                              <img src={w.images[0]} alt={w.title} className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-meta-4">
                              <HiOutlinePhoto size={20} />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-black dark:text-white">
                              {w.title}
                            </div>
                            <div className="text-xs text-gray-400 max-w-[150px] truncate">{w.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {(() => {
                          const s = w.status || "active";
                          const colors: Record<string, string> = {
                            active: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                            draft: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                            archived: "bg-gray-200 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
                            "coming soon": "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                          };
                          const dotColors: Record<string, string> = {
                            active: "bg-green-600",
                            draft: "bg-blue-600",
                            archived: "bg-gray-400",
                            "coming soon": "bg-orange-600",
                          };
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${colors[s] || colors.active}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full animate-pulse ${dotColors[s] || dotColors.active}`}
                              />
                              {s}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {fmt(w.startDate)}
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {fmt(w.endDate)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-medium">
                          <FaUsers size={12} className="text-primary/70" />
                          {w.slots}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
                        {w.price?.toLocaleString() ?? 0} EGP
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                          {(w.availableSessions || []).length}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openView(w)}
                            title="View"
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/40 dark:hover:text-blue-400"
                          >
                            <FaEye size={15} />
                          </button>
                          <button
                            onClick={() => generateAttendancePDF(w)}
                            title="Download Attendance PDF"
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/40 dark:hover:text-green-400"
                          >
                            <FaUsers size={15} />
                          </button>
                          <button
                            onClick={() => openEdit(w)}
                            title="Edit"
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/40 dark:hover:text-amber-400"
                          >
                            <FaEdit size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteId(w._id)}
                            title="Delete"
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-400"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-100 transition dark:border-strokedark dark:hover:bg-meta-4"
                >
                  Prev
                </button>
                <span className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white rounded-lg border shadow-sm dark:border-strokedark dark:bg-meta-4">
                  {page} <span className="text-gray-400 mx-1">/</span> {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-100 transition dark:border-strokedark dark:hover:bg-meta-4"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {topTab === "packages" && (
          <div className="rounded-2xl border border-stroke bg-white shadow-md dark:border-strokedark dark:bg-boxdark overflow-hidden">
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark bg-gray-50 dark:bg-meta-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Workshop Packages</h2>
              <span className="text-xs font-bold text-gray-500">{packages.length} Total Packages</span>
            </div>
            {packages.length === 0 ? (
               <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
                 <MdOutlineWorkspaces size={56} className="opacity-20 mb-2" />
                 <p className="text-base font-medium">No packages found</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6 bg-gray-50 dark:bg-boxdark/50">
                 {packages.map(pkg => (
                    <div key={pkg._id} className="rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-meta-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                       {pkg.thumbnail ? (
                         <div className="h-40 w-full overflow-hidden bg-gray-100 dark:bg-boxdark">
                           <img src={pkg.thumbnail} alt={pkg.title} className="h-full w-full object-cover" />
                         </div>
                       ) : (
                         <div className="h-40 w-full bg-gray-100 dark:bg-boxdark flex items-center justify-center text-gray-400">
                           <HiOutlinePhoto size={40} />
                         </div>
                       )}
                       <div className="p-5 flex-1 flex flex-col">
                          <h3 className="font-bold text-lg text-black dark:text-white mb-1">{pkg.title}</h3>
                          <p className="text-primary font-black text-xl mb-3">{pkg.price?.toLocaleString()} EGP</p>
                          <div className="flex gap-2 flex-wrap mb-4">
                            <span className="px-2.5 py-1 bg-gray-100 dark:bg-boxdark rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300">
                              {pkg.maxWorkshops} Workshops Allowed
                            </span>
                            <span className="px-2.5 py-1 bg-gray-100 dark:bg-boxdark rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300">
                              {pkg.isAllWorkshopsIncluded ? "All Workshops" : `${pkg.includedWorkshops.length} Specific Workshops`}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2 flex-1">{pkg.description}</p>
                          
                          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-stroke dark:border-strokedark">
                             <button onClick={() => openEditPkg(pkg)} className="flex-1 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-boxdark dark:text-gray-300 dark:hover:bg-gray-700 transition">
                               Edit
                             </button>
                             <button onClick={() => setPkgDeleteId(pkg._id)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition">
                               Delete
                             </button>
                          </div>
                       </div>
                    </div>
                 ))}
               </div>
            )}
          </div>
        )}

        {topTab === "requests" && (
          <div className="rounded-2xl border border-stroke bg-white shadow-md dark:border-strokedark dark:bg-boxdark overflow-hidden">
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark bg-gray-50 dark:bg-meta-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Attendance Requests</h2>
              <span className="text-xs font-bold text-gray-500">{allRequests.length} Total Records</span>
            </div>
            {requestsLoading ? (
              <div className="py-20 text-center text-gray-400">Loading all requests...</div>
            ) : allRequests.length === 0 ? (
              <div className="py-20 text-center text-gray-400">No requests found</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="p-4 bg-white dark:bg-boxdark border-b dark:border-strokedark flex flex-col sm:flex-row sm:items-center">
                  <select
                    value={selectedWorkshop}
                    onChange={(e) => {
                      setSelectedWorkshop(e.target.value);
                      setPage(1);
                    }}
                    className="w-full max-w-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-boxdark dark:text-white"
                  >
                    <option value="">Filter by Workshop</option>
                    {allWorkshops.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.title}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setPage(1);
                    }}
                    className="w-full max-w-[200px] rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-boxdark dark:text-white sm:ml-4 mt-4 sm:mt-0"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="archived">Archived</option>
                  </select>
                  
                  <button
                    onClick={exportToExcel}
                    className="mt-4 sm:mt-0 sm:ml-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#107c41] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:opacity-90 hover:scale-105 active:scale-95"
                  >
                    <FaDownload />
                    Export to Excel
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-meta-4 text-left text-[10px] font-black uppercase text-gray-400 border-b dark:border-strokedark">
                      <th className="px-6 py-4">Receipt</th>
                      <th className="px-6 py-4">Requester</th>
                      <th className="px-6 py-4">Program</th>
                      <th className="px-6 py-4">Expected to learn</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-strokedark">
                    {allRequests
                      .filter((req) => {
                        const matchWorkshop = !selectedWorkshop || (typeof req.workshopId === "object" ? req.workshopId._id : req.workshopId) === selectedWorkshop;
                        const matchStatus = !selectedStatus || req.status === selectedStatus;
                        return matchWorkshop && matchStatus;
                      })
                      .map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                        <td className="px-6 py-4">
                          {req.instapayImage ? (
                            <a href={req.instapayImage} target="_blank" rel="noreferrer" className="block h-12 w-12 overflow-hidden rounded-lg border border-stroke dark:border-strokedark shadow-sm hover:scale-110 transition-transform bg-white">
                              <img src={req.instapayImage} alt="Payment" className="h-full w-full object-cover" />
                            </a>
                          ) : (
                             <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-boxdark flex items-center justify-center text-gray-300">
                               <HiOutlinePhoto size={20} />
                             </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-black dark:text-white">{req.name}</div>
                          <div className="text-[10px] text-gray-400">{req.email}</div>
                          <div className="text-[10px] text-gray-400">{req.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="inline-block max-w-[150px] truncate font-bold text-primary">
                               {typeof req.workshopId === 'object' ? req.workshopId.title : 'N/A'}
                            </span>
                            {(() => {
                              const wId = typeof req.workshopId === 'object' ? req.workshopId._id : req.workshopId;
                              const ws = workshops.find(x => x._id === wId);
                              if (!ws) return <span className="text-[10px] text-gray-400 italic">Loading stats...</span>;
                              const filled = ws.attendance?.length || 0;
                              const isFull = filled >= ws.slots;
                              return (
                                <span className={`text-[10px] font-bold ${isFull ? 'text-red-500' : 'text-gray-500 animate-pulse'}`}>
                                  {filled} / {ws.slots} Occupied {isFull && "(FULL)"}
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="max-w-[200px] text-[10px] text-gray-500 line-clamp-2">
                              {req.notes || "—"}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-tighter shadow-sm ${
                            req.type === 'waitlist' ? 'bg-orange-100 text-orange-600 border border-orange-200' : 
                            'bg-blue-100 text-blue-600 border border-blue-200'}`}>
                            {req.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase shadow-sm ${statusColors[req.status]}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] text-gray-400 whitespace-nowrap">
                          {fmt(req.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center justify-end gap-2">
                              {req.status === 'pending'  && (
                                  <>
                                    <button onClick={() => updateAttendanceStatus(req._id, 'approved')} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition" title="Approve"><FaCheck size={12}/></button>
                                    <button onClick={() => updateAttendanceStatus(req._id, 'rejected')} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition" title="Reject"><FaBan size={12}/></button>
                                    <button onClick={() => updateAttendanceStatus(req._id, 'archived')} className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition" title="Archive"><FaEye size={12}/></button>
                                  </>
                                )}
                              <button 
                                onClick={() => openReqEdit(req)}
                                className="p-2 text-gray-400 hover:text-amber-500 transition"
                                title="Edit Request"
                              >
                                <FaEdit size={14} />
                              </button>
                              {/* <button 
                                onClick={() => {
                                  const wId = typeof req.workshopId === 'object' ? req.workshopId._id : req.workshopId;
                                  const found = workshops.find(x => x._id === wId);
                                  if (found) openView(found);
                                  else fetchSingleWorkshop(wId).then(() => setModalOpen(true));
                                }}
                                className="p-2 text-gray-400 hover:text-primary transition"
                                title="View Workshop"
                              >
                                <FaEye size={14} />
                              </button> */}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {topTab === "pkg-requests" && (
          <div className="rounded-2xl border border-stroke bg-white shadow-md dark:border-strokedark dark:bg-boxdark overflow-hidden">
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark bg-gray-50 dark:bg-meta-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Package Requests</h2>
              <span className="text-xs font-bold text-gray-500">{pkgRequests.length} Total Records</span>
            </div>
            {pkgRequestsLoading ? (
              <div className="py-20 text-center text-gray-400">Loading package requests...</div>
            ) : pkgRequests.length === 0 ? (
              <div className="py-20 text-center text-gray-400">No package requests found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-meta-4 text-left text-[10px] font-black uppercase text-gray-400 border-b dark:border-strokedark">
                      <th className="px-6 py-4">Receipt</th>
                      <th className="px-6 py-4">Requester</th>
                      <th className="px-6 py-4">Package</th>
                      <th className="px-6 py-4">Required Workshops & Slots</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-strokedark">
                    {pkgRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                        <td className="px-6 py-4">
                          {req.instapayImage ? (
                            <a href={req.instapayImage} target="_blank" rel="noreferrer" className="block h-12 w-12 overflow-hidden rounded-lg border border-stroke dark:border-strokedark shadow-sm hover:scale-110 transition-transform bg-white">
                              <img src={req.instapayImage} alt="Payment" className="h-full w-full object-cover" />
                            </a>
                          ) : (
                             <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-boxdark flex items-center justify-center text-gray-300">
                               <HiOutlinePhoto size={20} />
                             </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-black dark:text-white">{req.name}</div>
                          <div className="text-[10px] text-gray-400">{req.email}</div>
                          <div className="text-[10px] text-gray-400">{req.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="font-bold text-primary">
                             {typeof req.packageId === 'object' && req.packageId ? req.packageId.title : 'N/A'}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            {req.selectedWorkshops && req.selectedWorkshops.length > 0 ? (
                               req.selectedWorkshops.map((wsObj: any, idx: number) => {
                                 const wId = typeof wsObj === 'object' ? wsObj._id : wsObj;
                                 const ws = workshops.find((x) => x._id === wId);
                                 if (!ws) {
                                   return <span key={idx} className="text-[10px] text-gray-400 italic">• {typeof wsObj === 'object' ? wsObj.title : wId} (Loading stats...)</span>;
                                 }
                                 const filled = ws.attendance?.length || 0;
                                 const isFull = filled >= ws.slots;
                                 return (
                                   <div key={ws._id} className="flex items-center gap-2">
                                     <span className="text-[11px] font-bold text-black dark:text-white line-clamp-1 max-w-[150px]">• {ws.title}</span>
                                     <span className={`text-[10px] font-bold ${isFull ? 'text-red-500' : 'text-gray-500 animate-pulse'}`}>
                                       {filled} / {ws.slots} {isFull && "(FULL)"}
                                     </span>
                                   </div>
                                 );
                               })
                            ) : (
                               <span className="text-[10px] text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase shadow-sm ${statusColors[req.status] || 'bg-gray-100 text-gray-600'}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] text-gray-400 whitespace-nowrap">
                          {fmt(req.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center justify-end gap-2">
                              {req.status === 'pending' && (
                                <>
                                   <button onClick={() => updatePkgAttendanceStatus(req._id, 'approved')} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition" title="Approve"><FaCheck size={12}/></button>
                                   <button onClick={() => updatePkgAttendanceStatus(req._id, 'rejected')} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition" title="Reject"><FaBan size={12}/></button>

                                </>
                              )}
                           </div>
                        </td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {topTab === "analytics" && (
          <div className="space-y-6 printable-area md:print:-pl-72.5 ">
            {/* ── Filter & Export Controls ── */}
            <div className="flex flex-col gap-4 rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark lg:flex-row lg:items-end lg:justify-between no-print">
              {/* <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500">Time Range</label>
                  <select
                    value={analyticsFilterType}
                    onChange={(e) => setAnalyticsFilterType(e.target.value as any)}
                    className="w-40 rounded-xl border border-stroke bg-gray-50 px-4 py-2.5 text-sm font-bold text-black focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-meta-4 dark:text-white"
                  >
                    <option value="all">All Time</option>
                    <option value="month">Specific Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {analyticsFilterType === "month" && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Pick Month</label>
                    <input
                      type="month"
                      value={analyticsMonth}
                      onChange={(e) => setAnalyticsMonth(e.target.value)}
                      className="rounded-xl border border-stroke bg-gray-50 px-4 py-2.5 text-sm font-bold text-black focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-meta-4 dark:text-white"
                    />
                  </div>
                )}

                {analyticsFilterType === "custom" && (
                  <>
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500">Start Date</label>
                      <input
                        type="date"
                        value={analyticsStartDate}
                        onChange={(e) => setAnalyticsStartDate(e.target.value)}
                        className="rounded-xl border border-stroke bg-gray-50 px-4 py-2.5 text-sm font-bold text-black focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-meta-4 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500">End Date</label>
                      <input
                        type="date"
                        value={analyticsEndDate}
                        onChange={(e) => setAnalyticsEndDate(e.target.value)}
                        className="rounded-xl border border-stroke bg-gray-50 px-4 py-2.5 text-sm font-bold text-black focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-meta-4 dark:text-white"
                      />
                    </div>
                  </>
                )}
              </div> */}

              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-2.5 text-sm font-bold text-creamey shadow-md transition hover:bg-opacity-90 active:scale-95"
              >
                <FaDownload />
                Export PDF Report
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard 
                label="Filtered Workshops" 
                value={workshops.length} 
                icon={<MdOutlineWorkspaces className="text-blue-500" size={24}/>}
                color="blue"
              />
              <StatCard 
                label="Filtered Visits" 
                value={workshops.reduce((acc, curr) => acc + (curr.visits || 0), 0)} 
                icon={<FaEye className="text-purple-500" size={24}/>}
                color="purple"
              />
              <StatCard 
                label="Filtered Requests" 
                value={analyticsData.filteredRequests.length} 
                icon={<FaUsers className="text-amber-500" size={24}/>}
                color="amber"
              />
              <StatCard 
                label="Confirmed Attendees" 
                value={workshops.reduce((acc, curr) => acc + (curr.attendance?.length || 0), 0)} 
                icon={<FaCheck className="text-green-500" size={24}/>}
                color="green"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
                <h3 className="font-bold text-lg mb-4">Requests Breakdown</h3>
                <div className="space-y-4">
                  <StatBar label="Approved" count={analyticsData.filteredRequests.filter(r => r.status === 'approved').length} total={analyticsData.filteredRequests.length} color="bg-green-500" />
                  <StatBar label="Pending" count={analyticsData.filteredRequests.filter(r => r.status === 'pending').length} total={analyticsData.filteredRequests.length} color="bg-yellow-500" />
                  <StatBar label="Rejected" count={analyticsData.filteredRequests.filter(r => r.status === 'rejected').length} total={analyticsData.filteredRequests.length} color="bg-red-500" />
                </div>
              </div>

              <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
                <h3 className="font-bold text-lg mb-4">Availability Summary</h3>
                <div className="space-y-4">
                  <StatBar label="Direct Bookings" count={analyticsData.filteredRequests.filter(r => r.type === 'available').length} total={analyticsData.filteredRequests.length} color="bg-blue-500" />
                  <StatBar label="Waitlist Entries" count={analyticsData.filteredRequests.filter(r => r.type === 'waitlist').length} total={analyticsData.filteredRequests.length} color="bg-orange-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
                <h3 className="font-bold text-lg mb-4">Top Requested</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b dark:border-strokedark text-gray-400 font-bold uppercase text-[10px]">
                        <th className="pb-3">Title</th>
                        <th className="pb-3 text-center">Requests</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topRequested.map(w => {
                        const rCount = analyticsData.requestCounts[w._id] || 0;
                        return (
                          <tr key={w._id} className="border-b last:border-0 dark:border-strokedark">
                            <td className="py-3 font-bold truncate max-w-[120px]">{w.title}</td>
                            <td className="py-3 text-center font-black text-primary">{rCount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
                <h3 className="font-bold text-lg mb-4">Top Waitlisted</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b dark:border-strokedark text-gray-400 font-bold uppercase text-[10px]">
                        <th className="pb-3">Title</th>
                        <th className="pb-3 text-center">Waitlist</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topWaitlist.map(w => {
                        const wCount = analyticsData.waitlistCounts[w._id] || 0;
                        return (
                          <tr key={w._id} className="border-b last:border-0 dark:border-strokedark">
                            <td className="py-3 font-bold truncate max-w-[120px]">{w.title}</td>
                            <td className="py-3 text-center font-black text-orange-500">{wCount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
                <h3 className="font-bold text-lg mb-4">Top Coming Soon</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b dark:border-strokedark text-gray-400 font-bold uppercase text-[10px]">
                        <th className="pb-3">Title</th>
                        <th className="pb-3 text-center">Interests</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topComingSoon.map(w => {
                        const csCount = analyticsData.comingSoonCounts[w._id] || 0;
                        return (
                          <tr key={w._id} className="border-b last:border-0 dark:border-strokedark">
                            <td className="py-3 font-bold truncate max-w-[120px]">{w.title}</td>
                            <td className="py-3 text-center font-black text-purple-500">{csCount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark">
                 <h3 className="font-bold text-lg mb-4">Top Visited Workshops</h3>
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b dark:border-strokedark text-gray-400 font-bold uppercase text-[10px]">
                           <th className="pb-3">Title</th>
                           <th className="pb-3 text-center">Visits</th>
                           <th className="pb-3 text-center">Confirmed</th>
                           <th className="pb-3 text-center">Capacity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...workshops].sort((a,b) => (b.visits || 0) - (a.visits || 0)).slice(0, 5).map(w => (
                          <tr key={w._id} className="border-b last:border-0 dark:border-strokedark">
                            <td className="py-3 font-bold">{w.title}</td>
                            <td className="py-3 text-center text-primary font-black">{w.visits || 0}</td>
                            <td className="py-3 text-center font-bold">{w.attendance?.length || 0}</td>
                            <td className="py-3 text-center opacity-50">{w.slots}</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                 </div>
            </div>
            
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            Add / Edit / View Modal
        ══════════════════════════════════════════════════════════════════ */}
        {modalOpen && (
          <div className="fixed md:pl-72.5 inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-6 backdrop-blur-sm sm:items-center">
            <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-boxdark flex flex-col max-h-[90vh]">
              {/* Modal header */}
              <div className="flex items-center justify-between rounded-t-2xl bg-primary px-6 py-4 shrink-0">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {modalMode === "add"
                    ? "New Workshop"
                    : modalMode === "edit"
                      ? "Edit Workshop"
                      : "Workshop Details"}
                </h2>
                <button
                  onClick={closeModal}
                  className="rounded-full p-1.5 text-white/80 transition hover:text-white hover:bg-white/20"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {/* Tab bar */}
              <div className="flex border-b border-stroke dark:border-strokedark shrink-0 overflow-x-auto no-scrollbar">
                {(["details", "images", "sessions", "attendance"] as ActiveTab[]).map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 min-w-[120px] py-3.5 text-sm font-bold capitalize transition border-b-2
                        ${
                          activeTab === tab
                            ? "border-primary text-primary bg-primary/5"
                            : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-meta-4"
                        }`}
                    >
                      {tab === "attendance" ? "Requests" : tab}
                      {tab === "images" && current.images && current.images.length > 0 && (
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${activeTab === tab ? "bg-primary text-white" : "bg-gray-200 text-gray-600 dark:bg-meta-4 dark:text-gray-300"}`}>
                          {current.images.length}
                        </span>
                      )}
                      {tab === "sessions" && current.availableSessions && current.availableSessions.length > 0 && (
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${activeTab === tab ? "bg-primary text-white" : "bg-gray-200 text-gray-600 dark:bg-meta-4 dark:text-gray-300"}`}>
                          {current.availableSessions.length}
                        </span>
                      )}
                      {tab === "attendance" && requests.some(r => r.status === "pending") && (
                        <span className="ml-2 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] text-yellow-900 font-extrabold animate-pulse">
                          {requests.filter((r) => r.status === "pending").length}
                        </span>
                      )}
                    </button>
                  ),
                )}
              </div>

              {/* Modal body */}
              <div className="overflow-y-auto px-6 py-6 flex-1">
                {/* ────────────────── TAB: Details ────────────────── */}
                {activeTab === "details" && (
                  <div className="space-y-6">
                    <SectionTitle>Basic Information</SectionTitle>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field label="Title" required>
                        <input
                          type="text"
                          value={current.title || ""}
                          readOnly={isReadOnly}
                          onChange={(e) => {
                            setField("title", e.target.value);
                            if (modalMode === "add")
                              setField("slug", autoSlug(e.target.value));
                          }}
                          className={inputCls(isReadOnly)}
                        />
                      </Field>
                      <Field label="Slug" required>
                        <input
                          type="text"
                          value={current.slug || ""}
                          readOnly={isReadOnly}
                          onChange={(e) => setField("slug", e.target.value)}
                          className={inputCls(isReadOnly)}
                        />
                      </Field>
                      <Field label="Workshop Status">
                        <select
                          value={current.status || "active"}
                          disabled={isReadOnly}
                          onChange={(e) => setField("status", e.target.value)}
                          className={inputCls(isReadOnly)}
                        >
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                          <option value="coming soon">Coming Soon</option>
                          <option value="archived">Archived</option>
                        </select>
                      </Field>
                      <Field label="Start Date" required>
                        <input
                          type="date"
                          value={toInputDate(current.startDate || "")}
                          readOnly={isReadOnly}
                          onChange={(e) =>
                            setField("startDate", e.target.value)
                          }
                          className={inputCls(isReadOnly)}
                        />
                      </Field>
                      <Field label="End Date" required>
                        <input
                          type="date"
                          value={toInputDate(current.endDate || "")}
                          readOnly={isReadOnly}
                          onChange={(e) => setField("endDate", e.target.value)}
                          className={inputCls(isReadOnly)}
                        />
                      </Field>
                      <Field label="Slots (total capacity)" required>
                        <div className="relative">
                          <FaUsers
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                            size={14}
                          />
                          <input
                            type="number"
                            min={0}
                            value={current.slots ?? 0}
                            readOnly={isReadOnly}
                            onChange={(e) =>
                              setField("slots", Number(e.target.value))
                            }
                            className={`${inputCls(isReadOnly)} pl-10`}
                          />
                        </div>
                      </Field>
                      <Field label="Price (EGP)" required>
                        <div className="relative">
                          <FaMoneyBillWave
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                            size={14}
                          />
                          <input
                            type="number"
                            min={0}
                            value={current.price ?? 0}
                            readOnly={isReadOnly}
                            onChange={(e) =>
                              setField("price", Number(e.target.value))
                            }
                            className={`${inputCls(isReadOnly)} pl-10`}
                          />
                        </div>
                      </Field>
                    </div>

                    <div className="h-px w-full bg-stroke dark:bg-strokedark my-2"></div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field label="Location Label / Alt Text" required>
                        <div className="relative">
                          <FaMapMarkerAlt
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                            size={14}
                          />
                          <input
                            type="text"
                            value={current.location?.altText || ""}
                            readOnly={isReadOnly}
                            onChange={(e) =>
                              setField("location", (p: any) => ({ ...p, altText: e.target.value }))
                            }
                            className={`${inputCls(isReadOnly)} pl-10`}
                            placeholder="e.g. Heliopolis Center"
                          />
                        </div>
                      </Field>
                      <Field label="Location Google Maps Link" required>
                        <input
                          type="text"
                          value={current.location?.link || ""}
                          readOnly={isReadOnly}
                          onChange={(e) =>
                            setField("location", (p: any) => ({ ...p, link: e.target.value }))
                          }
                          className={inputCls(isReadOnly)}
                          placeholder="https://goo.gl/maps/..."
                        />
                      </Field>
                    </div>

                    <Field label="Location Extra Directions (optional)">
                      <textarea
                        rows={2}
                        value={current.location?.moreDescription || ""}
                        readOnly={isReadOnly}
                        onChange={(e) =>
                          setField("location", (p: any) => ({ ...p, moreDescription: e.target.value }))
                        }
                        className={inputCls(isReadOnly)}
                        placeholder="Floor, apartment, or landmarks..."
                      />
                    </Field>

                    {isReadOnly && current.location?.link && (
                      <a
                        href={current.location.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary underline"
                      >
                        <FaMapMarkerAlt size={10} />
                        Open Location Link
                      </a>
                    )}

                    <Field label="Instructors" required>
                      <TagsInput
                        value={current.instructors || []}
                        onChange={(v) => setField("instructors", v)}
                        readOnly={isReadOnly}
                        placeholder="Add an instructor..."
                      />
                    </Field>

                    <Field label="Brief" required>
                      <input
                        type="text"
                        value={current.briefy || ""}
                        readOnly={isReadOnly}
                        onChange={(e) => setField("briefy", e.target.value)}
                        className={inputCls(isReadOnly)}
                        placeholder="A short tagline or summary"
                      />
                    </Field>

                    <Field label="Description" required>
                      <textarea
                        rows={4}
                        value={current.description || ""}
                        readOnly={isReadOnly}
                        onChange={(e) =>
                          setField("description", e.target.value)
                        }
                        className={inputCls(isReadOnly)}
                      />
                    </Field>

                    <Field label="Policy (optional)">
                      <textarea
                        rows={3}
                        value={current.policy || ""}
                        readOnly={isReadOnly}
                        onChange={(e) => setField("policy", e.target.value)}
                        className={inputCls(isReadOnly)}
                      />
                    </Field>

                    <div className="h-px w-full bg-stroke dark:bg-strokedark my-2"></div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                      {/* <div className="sm:col-span-2">
                        <Field label="Internal Notes (only visible to admins)">
                          <textarea
                            rows={2}
                            value={current.notes || ""}
                            readOnly={isReadOnly}
                            onChange={(e) => setField("notes", e.target.value)}
                            className={inputCls(isReadOnly)}
                            placeholder="Any private notes about this workshop..."
                          />
                        </Field>
                      </div> */}
                      <Field label="Total Page Visits">
                        <div className="flex h-[42px] items-center gap-3 rounded-xl border border-transparent bg-gray-50 px-4 py-2 font-bold text-black dark:bg-meta-4 dark:text-white">
                          <FaEye className="text-primary" />
                          {current.visits || 0}
                        </div>
                      </Field>
                    </div>
                  </div>
                )}

                {/* ────────────────── TAB: Images ────────────────── */}
                {activeTab === "images" && (
                  <div className="space-y-4">
                    <SectionTitle noPad>Workshop Gallery</SectionTitle>
                    <p className="text-sm text-gray-500 mb-6">Drag and drop uploaded images to reorder them. The first image will be used as the main thumbnail.</p>
                    <ImageUploadAndSort
                      images={current.images || []}
                      onChange={(v) => setField("images", v)}
                      readOnly={isReadOnly}
                    />
                  </div>
                )}

                {/* ────────────────── TAB: Sessions ────────────────── */}
                {activeTab === "sessions" && (
                  <>
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <SectionTitle noPad>Available Sessions</SectionTitle>
                        <p className="text-sm text-gray-500 mt-1">Manage individual sessions within the workshop timeline.</p>
                      </div>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={addSession}
                          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-opacity-90 active:scale-95"
                        >
                          <FaPlus size={12} /> Add Session
                        </button>
                      )}
                    </div>

                    {(current.availableSessions || []).length === 0 ? (
                      <div className="rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center dark:border-strokedark">
                        <MdOutlineWorkspaces size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <h4 className="text-base font-semibold text-gray-600 dark:text-gray-300">No sessions added yet</h4>
                        {!isReadOnly && <p className="text-sm text-gray-400 mt-1">Click the Add Session button to get started.</p>}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {(current.availableSessions || []).map((sess, idx) => (
                          <div
                            key={idx}
                            className={`overflow-hidden rounded-2xl border transition-all duration-200 ${expandedSession === idx ? "border-primary/50 shadow-md ring-1 ring-primary/20 dark:border-primary/50" : "border-stroke hover:border-gray-300 dark:border-strokedark dark:hover:border-gray-600"}`}
                          >
                            {/* Accordion header */}
                            <div
                              className={`flex cursor-pointer items-center justify-between px-5 py-4 transition ${expandedSession === idx ? "bg-primary/5" : "bg-white dark:bg-meta-4"}`}
                              onClick={() =>
                                setExpandedSession(
                                  expandedSession === idx ? null : idx,
                                )
                              }
                            >
                              <div className="flex items-center gap-4">
                                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-sm ${expandedSession === idx ? "bg-primary text-white" : "bg-gray-100 text-gray-600 dark:bg-boxdark dark:text-gray-300"}`}>
                                  {idx + 1}
                                </span>
                                <div>
                                  <div className="text-sm font-bold text-black dark:text-white mb-0.5">
                                    {sess.title || <span className="text-red-400 italic font-normal">Untitled Session *</span>}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                                    {sess.sessionStartDate ? (
                                      <span className="flex items-center gap-1.5"><FaCalendarAlt className="text-primary/70"/>{fmt(sess.sessionStartDate)}</span>
                                    ) : <span className="italic text-gray-400">No Date</span>}
                                    
                                    {sess.startTime && <span className="flex items-center gap-1.5"><FaClock className="text-primary/70"/>{sess.startTime}</span>}
                                    {sess.duration > 0 && <span className="bg-gray-200 dark:bg-boxdark px-1.5 py-0.5 rounded">{sess.duration} mins</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {!isReadOnly && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeSession(idx);
                                    }}
                                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition dark:hover:bg-red-900/20"
                                    title="Remove Section"
                                  >
                                    <FaTrash size={14} />
                                  </button>
                                )}
                                <div className={`rounded-xl p-1.5 transition ${expandedSession === idx ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500 dark:bg-boxdark dark:text-gray-400"}`}>
                                  {expandedSession === idx ? (
                                    <FaChevronUp size={14} />
                                  ) : (
                                    <FaChevronDown size={14} />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Accordion body */}
                            {expandedSession === idx && (
                              <div className="border-t border-stroke p-5 bg-white dark:border-strokedark dark:bg-meta-4">
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <Field label="Session Title" required>
                                      <input
                                        type="text"
                                        value={sess.title}
                                        readOnly={isReadOnly}
                                        onChange={(e) =>
                                          setSessionField(
                                            idx,
                                            "title",
                                            e.target.value,
                                          )
                                        }
                                        className={inputCls(isReadOnly)}
                                      />
                                    </Field>
                                  </div>
                                  
                                  <Field label="Start Date" required>
                                    <div className="relative">
                                      <FaCalendarAlt
                                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                        size={14}
                                      />
                                      <input
                                        type="date"
                                        value={toInputDate(
                                          sess.sessionStartDate,
                                        )}
                                        readOnly={isReadOnly}
                                        onChange={(e) =>
                                          setSessionField(
                                            idx,
                                            "sessionStartDate",
                                            e.target.value,
                                          )
                                        }
                                        className={`${inputCls(isReadOnly)} pl-10`}
                                      />
                                    </div>
                                  </Field>
                                  <Field label="Start Time">
                                    <div className="relative">
                                      <FaClock
                                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                        size={14}
                                      />
                                      <input
                                        type="time"
                                        value={sess.startTime || ""}
                                        readOnly={isReadOnly}
                                        onChange={(e) =>
                                          setSessionField(
                                            idx,
                                            "startTime",
                                            e.target.value,
                                          )
                                        }
                                        className={`${inputCls(isReadOnly)} pl-10`}
                                      />
                                    </div>
                                  </Field>
                                  <Field label="Duration (minutes)">
                                    <div className="relative">
                                      <FaClock
                                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                        size={14}
                                      />
                                      <input
                                        type="number"
                                        min={0}
                                        value={sess.duration || 0}
                                        readOnly={isReadOnly}
                                        onChange={(e) =>
                                          setSessionField(
                                            idx,
                                            "duration",
                                            Number(e.target.value),
                                          )
                                        }
                                        className={`${inputCls(isReadOnly)} pl-10`}
                                      />
                                    </div>
                                  </Field>
                                </div>
                                <div className="mt-5">
                                  <Field label="Includes (comma-separated points)">
                                    <TagsInput
                                      value={sess.includes || []}
                                      onChange={(v) => setSessionField(idx, "includes", v)}
                                      readOnly={isReadOnly}
                                      placeholder="e.g. Workbook, Certificate"
                                    />
                                  </Field>
                                </div>
                                <div className="mt-2 text-sm text-gray-500">
                                  <Field label="Description (optional)">
                                    <textarea
                                      rows={2}
                                      value={sess.description || ""}
                                      readOnly={isReadOnly}
                                      onChange={(e) =>
                                        setSessionField(
                                          idx,
                                          "description",
                                          e.target.value,
                                        )
                                      }
                                      className={inputCls(isReadOnly)}
                                    />
                                  </Field>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* ────────────────── TAB: Attendance Requests ────────────────── */}
                {activeTab === "attendance" && (
                  <div className="space-y-10">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <SectionTitle noPad>Attendance Requests</SectionTitle>
                        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary shadow-sm border border-primary/20">
                          <FaUsers size={12} />
                          <span>{(current.attendance || []).length} / {current.slots || 0} Slots Filled</span>
                        </div>
                      </div>
                      {requestsLoading ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-12 text-gray-400">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
                          <p className="text-xs">Loading requests...</p>
                        </div>
                      ) : requests.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center dark:border-strokedark">
                          <MdOutlineWorkspaces size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                          <h4 className="text-sm font-medium text-gray-500">No attendance requests yet</h4>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {requests.map((req) => (
                            <div
                              key={req._id}
                              className={`flex flex-col gap-4 rounded-xl border px-5 py-5 transition ${req.status === 'pending' ? 'border-yellow-200 bg-yellow-50/30 dark:border-yellow-900/50 dark:bg-yellow-900/10' : 'border-stroke dark:border-strokedark'}`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                  {req.instapayImage ? (
                                    <a 
                                      href={req.instapayImage} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-stroke dark:border-strokedark shadow-md hover:scale-105 transition-transform bg-white"
                                    >
                                      <img src={req.instapayImage} alt="Payment Proof" className="h-full w-full object-cover" />
                                    </a>
                                  ) : (
                                    <div className="h-20 w-20 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 dark:bg-meta-4 border border-stroke dark:border-strokedark">
                                      <HiOutlinePhoto size={28} />
                                    </div>
                                  )}
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-bold text-black dark:text-white text-base tracking-wide truncate">
                                        {req.name}
                                      </p>
                                      <span className={`text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-tighter shadow-sm ${
                                        req.type === 'waitlist' ? 'bg-orange-100 text-orange-600 border border-orange-200' : 
                                        'bg-blue-100 text-blue-600 border border-blue-200'}`}>
                                        {req.type}
                                      </span>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                        <span className="opacity-70">Email:</span> {req.email}
                                      </p>
                                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                        <span className="opacity-70">Phone:</span> {req.phone}
                                      </p>
                                      <p className="text-[11px] font-medium text-gray-500 flex items-center gap-2">
                                        <span className="opacity-70 italic">Source:</span> {req.howDidYouKnow}
                                      </p>
                                      <p className="text-[10px] text-gray-400 flex items-center gap-1.5 pt-1">
                                        <FaCalendarAlt size={10} />
                                        {fmt(req.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-stroke dark:border-strokedark">
                                  <span
                                    className={`rounded-xl px-4 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm ${statusColors[req.status]}`}
                                  >
                                    {req.status}
                                  </span>
                                  {!isReadOnly && (
                                    <div className="flex items-center gap-1 bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-1">
                                      {req.status !== "approved" &&  (
                                        <button
                                          onClick={() =>
                                            updateAttendanceStatus(req._id, "approved")
                                          }
                                          title="Approve"
                                          className="rounded-md p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 transition dark:hover:bg-green-900/40"
                                        >
                                          <FaCheck size={14} />
                                        </button>
                                      )}
                                      {req.status !== "rejected"  && (
                                        <button
                                          onClick={() =>
                                            updateAttendanceStatus(req._id, "rejected")
                                          }
                                          title="Reject"
                                          className="rounded-md p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition dark:hover:bg-red-900/40"
                                        >
                                          <FaBan size={14} />
                                        </button>
                                      )}
                                      {req.status !== "archived" && (
                                        <button
                                          onClick={() =>
                                            updateAttendanceStatus(req._id, "rejected")
                                          }
                                          title="Archive"
                                          className="rounded-md p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition dark:hover:bg-red-900/40"
                                        >
                                          <FaEye size={14} />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => openReqEdit(req)}
                                        title="Edit Request"
                                        className="rounded-md p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition dark:hover:bg-amber-900/40"
                                      >
                                        <FaEdit size={14} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {req.notes && (
                                <div className="mt-4 border-t border-stroke pt-3 dark:border-strokedark">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Expected to learn:</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-meta-4/40 p-3 rounded-lg border border-stroke dark:border-strokedark">
                                    {req.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-stroke pt-8 dark:border-strokedark">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <SectionTitle noPad>Attendees</SectionTitle>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={openAddAttendee}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary transition hover:bg-primary/20"
                            >
                              <FaPlus size={10} /> Add New
                            </button>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600 dark:bg-meta-4 dark:text-gray-300">
                          <FaCheck size={10} className="text-green-500" />
                          {(current.attendance || []).length} Confirmed
                        </span>
                      </div>
                      
                      {(current.attendance || []).length === 0 ? (
                        <div className="rounded-2xl bg-gray-50 py-10 text-center dark:bg-meta-4">
                          <FaUsers size={24} className="mx-auto mb-2 text-gray-300" />
                          <p className="text-sm text-gray-500">No confirmed attendees yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(current.attendance || []).map((person, idx) => (
                            <div key={idx} className="group relative flex items-center gap-3 rounded-xl border border-stroke bg-white px-4 py-3 dark:border-strokedark dark:bg-boxdark transition hover:border-primary/30 hover:shadow-sm">
                              {person.instapayImage ? (
                                <a 
                                  href={person.instapayImage} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-stroke dark:border-strokedark hover:scale-110 transition-transform"
                                >
                                  <img src={person.instapayImage} alt={person.name} className="h-full w-full object-cover" />
                                </a>
                              ) : (
                                <div className="h-10 w-10 shrink-0 rounded-lg bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold shadow-inner">
                                  {person.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 pr-16 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold truncate text-black dark:text-white">{person.name}</p>
                                </div>
                                <p className="text-[10px] text-gray-500 truncate">{person.email}</p>
                                <p className="text-[10px] text-gray-400 truncate">{person.phone}</p>
                              </div>

                              {!isReadOnly && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => openEditAttendee(idx)}
                                    className="p-1.5 text-gray-400 hover:text-amber-500 transition-colors"
                                    title="Edit"
                                  >
                                    <FaEdit size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeAttendee(idx)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Delete"
                                  >
                                    <FaTrash size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="shrink-0 border-t border-stroke bg-gray-50 dark:border-strokedark dark:bg-meta-4 p-4 px-6 rounded-b-2xl">
                {!isReadOnly ? (
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={closeModal}
                      className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 dark:border-strokedark dark:bg-boxdark dark:text-gray-300 dark:hover:bg-meta-4 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-opacity-90 hover:shadow-lg active:scale-95"
                    >
                      {modalMode === "add" ? "Create Workshop" : "Save Changes"}
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => openEdit(current as IWorkshop)}
                      className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-amber-600 hover:shadow-lg active:scale-95"
                    >
                      <FaEdit size={14} /> Edit Workshop
                    </button>
                    <button
                      onClick={closeModal}
                      className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 dark:border-strokedark dark:bg-boxdark dark:text-gray-300 dark:hover:bg-meta-4 dark:hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            Attendance Request Edit Modal
        ══════════════════════════════════════════════════════════════════ */}
        {reqModalOpen && currentReq && (
          <div className="fixed md:pl-72.5 inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-6 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-boxdark flex flex-col overflow-hidden animate-fade-in-up">
              <div className="flex items-center justify-between bg-amber-500 px-6 py-4">
                <h2 className="text-xl font-bold text-white tracking-wide">Edit Attendance Request</h2>
                <button onClick={() => setReqModalOpen(false)} className="rounded-full p-1.5 text-white/80 transition hover:text-white hover:bg-white/20"><FaTimes /></button>
              </div>
              
              <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 gap-4">
                  <Field label="Requester Name" required>
                    <input
                      type="text"
                      value={currentReq.name}
                      onChange={(e) => setCurrentReq({ ...currentReq, name: e.target.value })}
                      className={inputCls(false)}
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Email Address" required>
                      <input
                        type="email"
                        value={currentReq.email}
                        onChange={(e) => setCurrentReq({ ...currentReq, email: e.target.value })}
                        className={inputCls(false)}
                      />
                    </Field>
                    <Field label="Phone Number" required>
                      <input
                        type="text"
                        value={currentReq.phone}
                        onChange={(e) => setCurrentReq({ ...currentReq, phone: e.target.value })}
                        className={inputCls(false)}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Request Type" required>
                      <select
                        value={currentReq.type}
                        onChange={(e) => setCurrentReq({ ...currentReq, type: e.target.value as any })}
                        className={inputCls(false)}
                      >
                        <option value="available">Direct Booking</option>
                        <option value="waitlist">Waitlist</option>
                        {/* <option value="coming soon">Coming Soon</option> */}
                      </select>
                    </Field>
                    <Field label="Status" required>
                      <select
                        value={currentReq.status}
                        onChange={(e) => setCurrentReq({ ...currentReq, status: e.target.value as any })}
                        className={inputCls(false)}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="Payment Proof (Instapay Image)">
                    <CldUploadWidget
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "workshops"}
                      onSuccess={(result: any) => {
                        if (result?.info?.secure_url) {
                          setCurrentReq(prev => prev ? ({ ...prev, instapayImage: result.info.secure_url }) : null);
                        }
                      }}
                    >
                      {({ open }) => (
                        <div className="flex items-center gap-4">
                          {currentReq.instapayImage ? (
                            <div className="group relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-stroke shadow-sm transition hover:border-amber-500">
                              <img 
                                src={currentReq.instapayImage} 
                                alt="Proof" 
                                className="h-full w-full object-cover" 
                              />
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentReq({ ...currentReq, instapayImage: "" });
                                }}
                                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100 shadow-md"
                              >
                                <FaTimes size={10} />
                              </button>
                              <div className="absolute inset-x-0 bottom-0 bg-black/40 py-1 text-center text-[9px] font-bold text-white backdrop-blur-sm">
                                Change Image
                              </div>
                              <button 
                                type="button" 
                                onClick={() => open()} 
                                className="absolute inset-0 z-10"
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => open()}
                              className="flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 transition hover:border-amber-500/50 hover:bg-amber-50 hover:text-amber-600 dark:border-strokedark dark:bg-meta-4"
                            >
                              <HiOutlinePhoto size={28} />
                              <span className="text-[11px] font-bold">Upload Proof</span>
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-black dark:text-white mb-1">Receipt Image</p>
                            <p className="text-[10px] text-gray-400 leading-relaxed">Update the payment proof for this request. This image is visible to admins and helps verify the transaction.</p>
                          </div>
                        </div>
                      )}
                    </CldUploadWidget>
                  </Field>

                  <Field label="Expected to learn">
                    <textarea
                      rows={4}
                      value={currentReq.notes || ""}
                      onChange={(e) => setCurrentReq({ ...currentReq, notes: e.target.value })}
                      placeholder="Add any specific details or view user message..."
                      className={inputCls(false)}
                    />
                  </Field>
                </div>
              </div>

              <div className="flex gap-3 p-6 bg-gray-50 dark:bg-meta-4/20 border-t dark:border-strokedark">
                <button
                  onClick={() => setReqModalOpen(false)}
                  className="flex-1 rounded-xl border border-stroke py-3 font-semibold text-black dark:border-strokedark dark:text-white hover:bg-gray-100 dark:hover:bg-meta-4"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateReq}
                  className="flex-1 rounded-xl bg-amber-500 py-3 font-bold text-white shadow-lg transition hover:bg-amber-600 active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            Attendee Add/Edit Modal (Nested-like overlay)
        ══════════════════════════════════════════════════════════════════ */}
        {attendeeModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-boxdark border border-stroke dark:border-strokedark">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-black dark:text-white">
                  {attendeeMode === "add" ? "Add New Attendee" : "Edit Attendee"}
                </h3>
                <button 
                   onClick={() => setAttendeeModalOpen(false)}
                   className="text-gray-400 hover:text-black dark:hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <Field label="Full Name" required>
                  <input
                    type="text"
                    value={tempAttendee.name}
                    onChange={(e) => setTempAttendee({ ...tempAttendee, name: e.target.value })}
                    className={inputCls(false)}
                    placeholder="Enter full name"
                  />
                </Field>
                <Field label="Email Address" required>
                  <input
                    type="email"
                    value={tempAttendee.email}
                    onChange={(e) => setTempAttendee({ ...tempAttendee, email: e.target.value })}
                    className={inputCls(false)}
                    placeholder="example@email.com"
                  />
                </Field>
                <Field label="Phone Number" required>
                  <input
                    type="text"
                    value={tempAttendee.phone}
                    onChange={(e) => setTempAttendee({ ...tempAttendee, phone: e.target.value })}
                    className={inputCls(false)}
                    placeholder="e.g. +20 123 456 7890"
                  />
                </Field>
                <Field label="Instapay Image (Proof of Payment)">
                  <CldUploadWidget
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "workshops"}
                    onSuccess={(result: any) => {
                      if (result?.info?.secure_url) {
                        setTempAttendee(prev => ({ ...prev, instapayImage: result.info.secure_url }));
                      }
                    }}
                  >
                    {({ open }) => (
                      <div className="flex items-center gap-4">
                        {tempAttendee.instapayImage ? (
                          <div className="group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-stroke shadow-sm transition hover:border-primary">
                            <img 
                              src={tempAttendee.instapayImage} 
                              alt="Proof" 
                              className="h-full w-full object-cover" 
                            />
                            <button 
                              type="button"
                              onClick={() => setTempAttendee({ ...tempAttendee, instapayImage: "" })}
                              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100"
                            >
                              <FaTimes size={8} />
                            </button>
                            <div className="absolute inset-x-0 bottom-0 bg-black/40 py-0.5 text-center text-[8px] font-bold text-white backdrop-blur-sm">
                              Change
                            </div>
                            <button 
                              type="button" 
                              onClick={() => open()} 
                              className="absolute inset-0 z-10"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => open()}
                            className="flex h-20 w-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary dark:border-strokedark dark:bg-meta-4"
                          >
                            <HiOutlinePhoto size={20} />
                            <span className="text-[10px] font-bold">Upload</span>
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-black dark:text-white mb-0.5">Payment Receipt</p>
                          <p className="text-[10px] text-gray-400">Upload screenshot of Instapay or bank transfer transaction.</p>
                        </div>
                      </div>
                    )}
                  </CldUploadWidget>
                </Field>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setAttendeeModalOpen(false)}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAttendee}
                  className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white shadow-md transition hover:bg-opacity-90 active:scale-95"
                >
                  {attendeeMode === "add" ? "Add Attendee" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            Delete Confirmation
        ══════════════════════════════════════════════════════════════════ */}
        {deleteId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-boxdark border border-stroke dark:border-strokedark transform scale-100 transition-transform">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <FaTrash className="text-red-600" size={24} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-black dark:text-white tracking-wide">
                Delete Workshop?
              </h3>
              <p className="mb-8 text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                This action cannot be undone. All sessions, images, and attendance requests associated with this
                workshop will be permanently removed.
              </p>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-gray-300 dark:hover:bg-boxdark w-full sm:w-auto text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-red-700 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 w-full sm:w-auto text-center"
                >
                  {deleteLoading ? (
                    <span className="flex items-center justify-center gap-2">
                       <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                       Deleting...
                    </span>
                  ) : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            Package Modals
        ══════════════════════════════════════════════════════════════════ */}
        {pkgModalOpen && (
          <div className="fixed md:pl-72.5 inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-6 backdrop-blur-sm sm:items-center">
            <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-boxdark flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between rounded-t-2xl bg-primary px-6 py-4 shrink-0">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {pkgModalMode === "add" ? "New Package" : "Edit Package"}
                </h2>
                <button onClick={closePkgModal} className="rounded-full p-1.5 text-white/80 transition hover:text-white hover:bg-white/20">
                  <FaTimes size={18} />
                </button>
              </div>

              <div className="overflow-y-auto px-6 py-6 flex-1 space-y-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Package Title" required>
                    <input type="text" value={currentPkg.title || ""} onChange={(e) => setPkgField("title", e.target.value)} className={inputCls(false)} placeholder="e.g. 5 Workshops Bundle" />
                  </Field>
                  <Field label="Price (EGP)" required>
                    <div className="relative">
                      <FaMoneyBillWave className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input type="number" min={0} value={currentPkg.price ?? 0} onChange={(e) => setPkgField("price", Number(e.target.value))} className={`${inputCls(false)} pl-10`} />
                    </div>
                  </Field>
                </div>

                 <Field label="Package Description" required>
                    <textarea rows={3} value={currentPkg.description || ""} onChange={(e) => setPkgField("description", e.target.value)} className={inputCls(false)} />
                 </Field>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                   <Field label="Total Allowed Workshops (Max for user)" required>
                      <input type="number" min={1} value={currentPkg.maxWorkshops ?? 1} onChange={(e) => setPkgField("maxWorkshops", Number(e.target.value))} className={inputCls(false)} />
                   </Field>
                </div>

                <div className="border border-stroke dark:border-strokedark rounded-xl p-5 bg-gray-50 dark:bg-meta-4 mt-2">
                   <label className="flex items-center gap-3 cursor-pointer">
                     <input type="checkbox" checked={currentPkg.isAllWorkshopsIncluded || false} onChange={(e) => setPkgField("isAllWorkshopsIncluded", e.target.checked)} className="w-5 h-5 accent-primary" />
                     <span className="font-bold text-sm text-black dark:text-white">Allow choosing from ALL workshops</span>
                   </label>
                   {!currentPkg.isAllWorkshopsIncluded && (
                     <div className="mt-4 animate-fade-in">
                       <Field label="Select Included Workshops">
                         <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                           {allWorkshops.length === 0 ? <span className="text-xs text-gray-500">No workshops available</span> : allWorkshops.map(w => {
                             const isSelected = (currentPkg.includedWorkshops || []).includes(w._id);
                             return (
                               <label key={w._id} className="flex flex-row items-center gap-2 cursor-pointer text-sm">
                                 <input type="checkbox" checked={isSelected} onChange={(e) => {
                                      const arr = [...(currentPkg.includedWorkshops || [])];
                                      if (e.target.checked) arr.push(w._id);
                                      else {
                                         const idx = arr.indexOf(w._id);
                                         if (idx > -1) arr.splice(idx, 1);
                                      }
                                      setPkgField("includedWorkshops", arr);
                                   }}
                                 />
                                 <span>{w.title}</span>
                               </label>
                             );
                           })}
                         </div>
                       </Field>
                     </div>
                   )}
                </div>

                <Field label="Thumbnail Image" required>
                  <CldUploadWidget uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "workshops"} onSuccess={(result: any) => { if (result?.info?.secure_url) setPkgField("thumbnail", result.info.secure_url); }}>
                    {({ open }) => (
                      <div className="flex items-center gap-4">
                        {currentPkg.thumbnail ? (
                          <div className="group relative h-32 w-48 flex-shrink-0 overflow-hidden rounded-xl border border-stroke shadow-sm transition">
                            <img src={currentPkg.thumbnail} alt="Thumbnail" className="h-full w-full object-cover" />
                            <button type="button" onClick={(e) => { e.stopPropagation(); setPkgField("thumbnail", ""); }} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100"><FaTimes size={10} /></button>
                            <button type="button" onClick={() => open()} className="absolute inset-0 z-10" />
                          </div>
                        ) : (
                          <button type="button" onClick={() => open()} className="flex h-32 w-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 transition hover:border-primary"><HiOutlinePhoto size={28} /><span className="text-xs font-bold">Upload Image</span></button>
                        )}
                      </div>
                    )}
                  </CldUploadWidget>
                </Field>
              </div>

              <div className="shrink-0 border-t border-stroke bg-gray-50 dark:border-strokedark dark:bg-meta-4 p-4 px-6 rounded-b-2xl flex justify-end gap-3">
                <button onClick={closePkgModal} className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handlePkgSubmit} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-opacity-90 active:scale-95">Save Package</button>
              </div>
            </div>
          </div>
        )}

        {pkgDeleteId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-boxdark border border-stroke dark:border-strokedark">
              <h3 className="mb-2 text-xl font-bold text-black dark:text-white tracking-wide">Delete Package?</h3>
              <p className="mb-8 text-sm text-gray-500 line-clamp-3">This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setPkgDeleteId(null)} className="rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-semibold hover:bg-gray-50 transition dark:bg-boxdark">Cancel</button>
                <button onClick={handlePkgDelete} className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition">Delete</button>
              </div>
            </div>
          </div>
        )}

      </div>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .printable-area {
            display: block !important;
            padding: 0 !important;
            background: white !important;
          }
          body {
            background: white !important;
          }
          aside, header {
            display: none !important;
          }
          .md\\:pl-72\\.5 {
            padding-left: 0 !important;
          }
          .grid {
            display: block !important;
          }
          .grid > div {
            margin-bottom: 2rem !important;
            page-break-inside: avoid;
          }
          .rounded-2xl {
            border: 1px solid #eee !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </DefaultLayout>
  );
}
