"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { headerFont } from "@/app/lib/fonts";
import axios from "axios";
import Image from "next/image";
import React, { useEffect, useState } from "react";

type FormSubmission = {
  _id: string;
  name?: string;
  email?: string;
  cvUrl?: string;
};

const isImage = (url: string) =>
  /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(url);
const isVideo = (url: string) =>
  /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(url);
const isPDF = (url: string) => /\.pdf$/i.test(url);
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

export default function CvViewerPage({
  params,
}: {
  params: { id: string };
}) {
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/form-submissions/${params.id}`);
        setSubmission(res.data.data);
      } catch (e: any) {
        setError("Failed to load submission");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [params.id]);

  return (
    <DefaultLayout>
      <div className="flex h-auto min-h-screen w-full flex-col gap-4 bg-backgroundColor px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className={`${headerFont.className} text-2xl text-secondary`}>
            CV Viewer
          </h1>
          {submission?.cvUrl ? (
            <a
              href={downloadHref(submission.cvUrl)}
              download
              className="rounded bg-primary px-4 py-2 text-white"
            >
              Download
            </a>
          ) : null}
        </div>
        <div className="rounded bg-white p-4 shadow">
          {loading ? (
            <div className="p-4">Loading...</div>
          ) : error ? (
            <div className="p-4">{error}</div>
          ) : !submission?.cvUrl ? (
            <div className="p-4">No CV</div>
          ) : isImage(submission.cvUrl) ? (
            <div className="relative mx-auto h-[75vh] max-w-5xl overflow-hidden rounded border">
              <Image
                src={submission.cvUrl}
                alt=""
                fill
                className="object-contain"
              />
            </div>
          ) : isVideo(submission.cvUrl) ? (
            <div className="mx-auto max-w-5xl">
              <video
                controls
                className="h-[75vh] w-full rounded border"
                src={submission.cvUrl}
              />
            </div>
          ) : isPDF(submission.cvUrl) ? (
            <div className="mx-auto max-w-5xl">
              <iframe
                src={submission.cvUrl}
                className="h-[75vh] w-full rounded border"
              />
            </div>
          ) : (
            <div className="p-4">
              <a
                href={downloadHref(submission.cvUrl)}
                download
                className="rounded bg-primary px-4 py-2 text-white"
              >
                Download
              </a>
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
}

