"use client";
import React, { useState, useEffect } from "react";
import { Playlist, Video } from "@/interfaces/interfaces";
import axios from "axios";
import { UploadButton } from "@/utils/uploadthing";
import Image from "next/image";

interface AddPlaylistModalProps {
  isModalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
}

const AddPlaylistModal: React.FC<AddPlaylistModalProps> = ({
  isModalOpen,
  setModalOpen,
  setPlaylists,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    category: "",
    tags: [] as string[],
    isPublic: true,
    videos: [] as string[],
    featured: false,
  });
  const [availableVideos, setAvailableVideos] = useState<Video[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      fetchAvailableVideos();
    }
  }, [isModalOpen]);

  const fetchAvailableVideos = async () => {
    setIsLoadingVideos(true);
    try {
      const response = await axios.get("/api/videos?all=true");
      setAvailableVideos(response.data.data);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleVideoSelection = (videoId: string) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.includes(videoId)
        ? prev.videos.filter((id) => id !== videoId)
        : [...prev.videos, videoId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/playlists", formData);
      setPlaylists((prev) => [response.data.data, ...prev]);
      setModalOpen(false);
      setFormData({
        title: "",
        description: "",
        thumbnailUrl: "",
        category: "",
        tags: [],
        isPublic: true,
        videos: [],
        featured: false,
      });
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert("Failed to create playlist");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 md:pl-72.5">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Playlist</h2>
          <button
            onClick={() => setModalOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags.join(", ")}
              onChange={handleTagsChange}
              placeholder="tag1, tag2, tag3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div> */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Thumbnail Image *
            </label>
            <div className="flex flex-col gap-2">
              {formData.thumbnailUrl && (
                <Image
                  width={80}
                  height={60}
                  src={formData.thumbnailUrl}
                  alt="Thumbnail Preview"
                  className="mt-2 h-30 w-40 rounded border border-gray-300 object-cover"
                />
              )}
              <UploadButton
                className="flex w-fit rounded-2xl bg-primary px-2"
                endpoint="mediaUploader"
                onClientUploadComplete={(res) => {
                  if (res && res.length > 0) {
                    setFormData((prev) => ({
                      ...prev,
                      thumbnailUrl: res[0].url,
                    }));
                  }
                }}
                onUploadError={(error: Error) => {
                  alert(`ERROR! ${error.message}`);
                }}
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Public Playlist
            </label>
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleInputChange}
              className="ml-6 mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Featured
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select Videos ({formData.videos.length} selected)
            </label>
            {isLoadingVideos ? (
              <div className="py-4 text-center">Loading videos...</div>
            ) : availableVideos.length > 0 ? (
              <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto rounded-md border border-gray-300 p-2 md:grid-cols-2 lg:grid-cols-3">
                {availableVideos.map((video) => (
                  <div
                    key={video._id}
                    className={`flex cursor-pointer items-center space-x-2 rounded p-2 ${
                      formData.videos.includes(video._id || "")
                        ? "border border-primary bg-primary/10"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => handleVideoSelection(video._id || "")}
                  >
                    <input
                      onClick={(e) => e.stopPropagation()}
                      type="checkbox"
                      checked={formData.videos.includes(video._id || "")}
                      onChange={() => handleVideoSelection(video._id || "")}
                      className="mr-2"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-900">
                        {video.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500">
                No videos available. Please create some videos first.
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Playlist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlaylistModal;
