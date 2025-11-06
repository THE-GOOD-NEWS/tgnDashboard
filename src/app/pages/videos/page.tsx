"use client";
import AddVideoModal from "@/components/AddVideoModal";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import VideoComponent from "@/components/VideoComponent";
import { Video } from "@/interfaces/interfaces";
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";

const VideosPage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addModalisOpen, setAddModalisOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      // Updated to fetch videos with likes and comments data
      const res = await axios.get(
        `/api/videos?page=${page}&search=${searchQuery}&includeDetails=true`,
      );
      console.log("Videos data with likes and comments:", res.data);
      setVideos(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    // Only reset to first page when search query changes
    if (searchQuery) {
      setPage(1);
    }
    fetchVideos();
  }, [fetchVideos, searchQuery]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <DefaultLayout>
      <div className="flex h-auto min-h-screen w-full flex-col items-center justify-between gap-4 overflow-hidden bg-backgroundColor px-2 py-2 md:px-4  md:py-4">
        <div className="flex h-full w-full flex-col items-center space-y-4">
          <div className="flex w-full flex-col-reverse items-center justify-between gap-4 md:flex-row">
            <div className="w-full md:w-64">
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex w-full flex-col gap-2 text-primary underline md:w-auto md:flex-row md:items-center md:justify-end md:gap-4">
              <button
                className="rounded-2xl bg-primary px-4 py-2 text-sm text-creamey hover:cursor-pointer"
                onClick={() => setAddModalisOpen(true)}
              >
                ADD NEW VIDEO
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Loading videos...</div>
            </div>
          ) : videos.length > 0 ? (
            videos.map((video) => (
              <VideoComponent
                key={video._id}
                setVideos={setVideos}
                video={video}
              />
            ))
          ) : (
            <div className="flex items-center justify-center py-8">
              <h1 className="text-lg text-gray-500">No videos found</h1>
            </div>
          )}
        </div>

        <AddVideoModal
          isModalOpen={addModalisOpen}
          setModalOpen={setAddModalisOpen}
          setVideos={setVideos}
          isPublic={isPublic}
          setIsPublic={setIsPublic}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center gap-4">
            <button
              className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || isLoading}
            >
              Previous
            </button>

            <span className="text-lg">
              Page {page} of {totalPages}
            </span>

            <button
              className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || isLoading}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default VideosPage;
