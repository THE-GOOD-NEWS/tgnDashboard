"use client";

import React, { useState, useEffect, useRef } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import {
  MdQrCodeScanner,
  MdCheckCircle,
  MdWarning,
  MdError,
  MdCameraAlt,
  MdRefresh,
  MdPerson,
  MdLocationOn,
  MdAccessTime,
  MdArrowBack,
  MdUploadFile,
  MdCameraswitch,
} from "react-icons/md";
import { FaBarcode } from "react-icons/fa";
import Link from "next/link";
import toast from "react-hot-toast";

interface ICheckInResult {
  success: boolean;
  alreadyCheckedIn?: boolean;
  attendeeName?: string;
  attendeeEmail?: string;
  attendeePhone?: string;
  workshopTitle?: string;
  location?: string;
  startDate?: string;
  checkedInAt?: string;
  message?: string;
  error?: string;
}

interface IRecentScan {
  token: string;
  name: string;
  workshop: string;
  time: string;
  status: "success" | "already";
}


export default function WorkshopScannerPage() {
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ICheckInResult | null>(null);
  const [recentScans, setRecentScans] = useState<IRecentScan[]>([]);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [lastScannedText, setLastScannedText] = useState<string>("");

  const scannerRef = useRef<any>(null);
  const isProcessingScanRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Play audio sound on scan
  const playSound = (type: "success" | "already" | "error") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "already") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio context might be restricted before user interaction
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.error(e);
      }
      scannerRef.current = null;
    }
    setScannerActive(false);
  };

  // Check in handler
  const handleCheckIn = async (tokenOrUrl: string) => {
    if (!tokenOrUrl || loading) return;

    let token = tokenOrUrl.trim();
    setLastScannedText(token);

    // If scanned text is a full URL e.g. https://.../api/workshop-checkin?token=TGN-1234
    try {
      if (token.startsWith("http://") || token.startsWith("https://")) {
        const url = new URL(token);
        const urlToken = url.searchParams.get("token") || url.searchParams.get("code");
        if (urlToken && urlToken.trim()) token = urlToken.trim();
      }
    } catch {}

    if (token.includes("token=")) {
      const match = token.match(/token=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) token = match[1];
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/workshop-checkin", { token });
      const data: ICheckInResult = res.data;
      setResult(data);

      if (data.alreadyCheckedIn) {
        playSound("already");
        toast(
          (t) => (
            <span className="flex items-center gap-2">
              ⚠️ <b>{data.attendeeName}</b> is already checked in!
            </span>
          ),
          { icon: "⚠️" }
        );
      } else {
        playSound("success");
        toast.success(`Checked in: ${data.attendeeName}!`);
      }

      // Automatically stop the camera when attendee is verified
      if (data.success) {
        await stopCamera();
      }

      setRecentScans((prev) => [
        {
          token,
          name: data.attendeeName || "Attendee",
          workshop: data.workshopTitle || "Workshop",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          status: data.alreadyCheckedIn ? "already" : "success",
        },
        ...prev.slice(0, 9),
      ]);

      setManualCode("");
    } catch (err: any) {
      playSound("error");
      const errMsg = err?.response?.data?.error || "Check-in failed. Invalid token.";
      setResult({
        success: false,
        error: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async (facingMode?: "environment" | "user") => {
    const targetFacing = facingMode || cameraFacing;
    setCameraError(null);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }

      setScannerActive(true);

      // Brief tick to ensure the DOM node is rendered
      await new Promise((resolve) => setTimeout(resolve, 100));

      const qrScanner = new Html5Qrcode("reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
        ],
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });
      scannerRef.current = qrScanner;

      // Use standard facingMode constraint
      await qrScanner.start(
        { facingMode: targetFacing },
        {
          fps: 20,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          if (!isProcessingScanRef.current) {
            isProcessingScanRef.current = true;
            handleCheckIn(decodedText).finally(() => {
              setTimeout(() => {
                isProcessingScanRef.current = false;
              }, 1200); // 1.2s rapid cooldown
            });
          }
        },
        () => {
          // ignore scan errors per frame
        }
      );

      // iOS Safari video compatibility safeguards
      setTimeout(() => {
        const videoElement = document.querySelector("#reader video") as HTMLVideoElement | null;
        if (videoElement) {
          videoElement.setAttribute("playsinline", "true");
          videoElement.setAttribute("webkit-playsinline", "true");
          videoElement.setAttribute("autoplay", "true");
          videoElement.setAttribute("muted", "true");
          videoElement.muted = true;
          videoElement.playsInline = true;
          if (videoElement.paused) {
            videoElement.play().catch(() => {});
          }
        }
      }, 150);
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError(
        err?.message || "Failed to start camera. Please ensure camera permissions are allowed."
      );
      setScannerActive(false);
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }
    }
  };

  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    if (scannerActive) {
      await stopCamera();
      setTimeout(() => {
        startCamera(nextFacing);
      }, 200);
    }
  };

  // Image Upload Scanner
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setCameraError(null);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

      let fileScanner = scannerRef.current;
      if (!fileScanner) {
        fileScanner = new Html5Qrcode("reader-file-temp", {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });
      }

      const decodedText = await fileScanner.scanFile(file, true);
      toast.success("QR Code detected from image!");
      await handleCheckIn(decodedText);
    } catch (err: any) {
      console.error("File scan error:", err);
      toast.error("No valid QR code found in the uploaded image.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch {}
      }
    };
  }, []);

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-boxdark p-4 sm:p-6 lg:p-8">
        {/* Top bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/pages/workshops"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm border border-stroke hover:bg-gray-100 dark:bg-boxdark-2 dark:border-strokedark dark:text-white transition"
            >
              <MdArrowBack size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                <MdQrCodeScanner className="text-primary text-3xl" />
                Workshop QR & Barcode Scanner
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Scan attendee entry passes or enter token codes to activate attendance
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden file input for QR image upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl bg-white border border-stroke dark:border-strokedark dark:bg-boxdark px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm transition hover:bg-gray-50 dark:hover:bg-meta-4 active:scale-95"
            >
              <MdUploadFile size={18} className="text-primary" />
              Upload QR Image
            </button>

            {!scannerActive ? (
              <button
                onClick={() => startCamera()}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 hover:scale-105 active:scale-95"
              >
                <MdCameraAlt size={18} />
                Start Camera Scanner
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-600 hover:scale-105 active:scale-95"
              >
                <MdRefresh size={18} />
                Stop Camera
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Main scanner column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Camera Viewport */}
            <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                  <MdCameraAlt className="text-primary" /> Live Camera Stream
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-meta-4 dark:hover:bg-opacity-80 px-3 py-1.5 rounded-lg border border-stroke dark:border-strokedark text-xs font-semibold text-gray-700 dark:text-gray-200 transition active:scale-95 shadow-sm"
                    title="Switch between Front and Back camera"
                  >
                    <MdCameraswitch className="text-primary text-sm" />
                    <span>{cameraFacing === "environment" ? "Back Camera" : "Front Camera"}</span>
                  </button>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      scannerActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-meta-4 dark:text-gray-400"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        scannerActive ? "bg-green-500 animate-pulse" : "bg-gray-400"
                      }`}
                    />
                    {scannerActive ? "Scanner Active" : "Camera Standby"}
                  </span>
                </div>
              </div>

              {/* Viewport Box */}
              <div
                className={`relative w-full rounded-xl overflow-hidden border-2 ${
                  scannerActive
                    ? "border-primary shadow-inner bg-black"
                    : "bg-black/5 dark:bg-black/50 flex items-center justify-center border-dashed border-gray-300 dark:border-strokedark"
                }`}
                style={scannerActive ? { minHeight: "380px" } : { minHeight: "320px" }}
              >
                {/* Dedicated empty DOM node for html5-qrcode
                    - Must have an explicit height so the library's internal
                      video element can size itself properly.
                    - Do NOT use flex centering on the parent when active;
                      html5-qrcode uses absolute positioning internally and
                      flex fights with it, squishing the video to 0 height. */}
                <div
                  id="reader"
                  style={scannerActive ? { width: "100%", minHeight: "380px" } : undefined}
                  className={scannerActive ? "block" : "hidden"}
                />

                {/* Hidden container for file scan fallback */}
                <div id="reader-file-temp" className="hidden" />

                {/* Laser animation indicator overlay when camera is running */}
                {scannerActive && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <div className="relative w-64 h-64 border-2 border-primary/50 rounded-2xl">
                      {/* Corner markers */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                      {/* Animated scanning line */}
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-pulse top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="mt-3 text-xs font-semibold text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                      Align QR code within frame
                    </p>
                  </div>
                )}

                {/* React placeholder shown when camera is standby - outside #reader */}
                {!scannerActive && (
                  <div className="text-center p-8">
                    <MdQrCodeScanner
                      size={64}
                      className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
                    />
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Camera scanner is currently off
                    </p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                      Click below to activate your camera and scan QR codes in real-time, or upload an image.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-primary/90 transition"
                      >
                        <MdCameraAlt size={16} /> Turn On Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-meta-4 px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition"
                      >
                        <MdUploadFile size={16} /> Upload Image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 dark:bg-red-900/20 dark:text-red-300">
                  <MdError size={16} className="shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {scannerActive && (
                <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-1.5">
                  <span>💡</span>
                  <span>Tip: If attendee phone screen is at maximum brightness, hold screen at a slight angle or 15–20 cm away.</span>
                </p>
              )}
            </div>

            {/* Manual Code Entry */}
            <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
              <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2 mb-3">
                <FaBarcode className="text-primary" /> Manual Pass Code / Token Entry
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCheckIn(manualCode);
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. TGN-4A9B2C or paste QR link / code..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-mono outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-meta-4 dark:text-white"
                  />
                  {manualCode && (
                    <button
                      type="button"
                      onClick={() => setManualCode("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!manualCode.trim() || loading}
                  className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <MdCheckCircle size={18} />
                  )}
                  Check In
                </button>
              </form>
            </div>
          </div>

          {/* Right column: Scan feedback card & recent scans */}
          <div className="lg:col-span-5 space-y-6">
            {/* Scan Status Badge / Result Card */}
            <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
              <h2 className="text-base font-bold text-black dark:text-white mb-4">
                Scan Verification Result
              </h2>

              {!result ? (
                <div className="text-center py-12 px-4 border border-dashed border-gray-200 dark:border-strokedark rounded-xl">
                  <MdQrCodeScanner
                    size={48}
                    className="mx-auto text-gray-300 dark:text-gray-600 mb-2"
                  />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Awaiting scan...
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Point camera at attendee QR code or upload QR image
                  </p>
                </div>
              ) : result.error ? (
                <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-center dark:bg-red-900/20 dark:border-red-900/40">
                  <MdError size={48} className="mx-auto text-red-500 mb-2" />
                  <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
                    Check-in Failed
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">{result.error}</p>
                  {lastScannedText && (
                    <p className="text-[10px] font-mono text-gray-400 mt-2 truncate">
                      Scanned: {lastScannedText}
                    </p>
                  )}
                </div>
              ) : (
                <div
                  className={`p-5 rounded-2xl border ${
                    result.alreadyCheckedIn
                      ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/40"
                      : "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900/40"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {result.alreadyCheckedIn ? (
                      <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow">
                        <MdWarning />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-2xl shadow">
                        <MdCheckCircle />
                      </div>
                    )}
                    <div>
                      <span
                        className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          result.alreadyCheckedIn
                            ? "bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200"
                            : "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200"
                        }`}
                      >
                        {result.alreadyCheckedIn ? "Already Checked In" : "Attendance Activated"}
                      </span>
                      <h3 className="text-lg font-black text-black dark:text-white mt-0.5">
                        {result.attendeeName}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs border-t border-gray-200/60 dark:border-strokedark pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <MdPerson /> Workshop
                      </span>
                      <span className="font-bold text-black dark:text-white text-right max-w-[200px] truncate">
                        {result.workshopTitle}
                      </span>
                    </div>
                    {result.location && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <MdLocationOn /> Venue
                        </span>
                        <span className="font-medium text-black dark:text-white">
                          {result.location}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <MdAccessTime /> Time
                      </span>
                      <span className="font-mono text-black dark:text-white">
                        {result.checkedInAt
                          ? new Date(result.checkedInAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : "Now"}
                      </span>
                    </div>
                    {result.attendeePhone && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Phone</span>
                        <span className="font-medium text-black dark:text-white">
                          {result.attendeePhone}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Scan Next Attendee button */}
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      startCamera();
                    }}
                    className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition active:scale-95"
                  >
                    <MdCameraAlt size={16} />
                    Scan Next Attendee
                  </button>
                </div>
              )}
            </div>

            {/* Recent Check-ins List */}
            <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-black dark:text-white">
                  Session Scans ({recentScans.length})
                </h2>
                {recentScans.length > 0 && (
                  <button
                    onClick={() => setRecentScans([])}
                    className="text-xs text-gray-400 hover:text-red-500 transition"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {recentScans.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  No attendees scanned in this session yet
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-strokedark max-h-[300px] overflow-y-auto">
                  {recentScans.map((scan, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-black dark:text-white flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              scan.status === "success" ? "bg-green-500" : "bg-amber-500"
                            }`}
                          />
                          {scan.name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[180px]">
                          {scan.workshop}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[11px] text-gray-500">{scan.time}</span>
                        <p
                          className={`text-[10px] font-semibold ${
                            scan.status === "success" ? "text-green-600" : "text-amber-600"
                          }`}
                        >
                          {scan.status === "success" ? "Checked in" : "Already in"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
