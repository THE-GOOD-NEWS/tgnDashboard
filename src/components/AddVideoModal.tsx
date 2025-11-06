"use client";
import React, { useState } from "react";
import { Video } from "@/interfaces/interfaces";
import axios from "axios";
import { UploadButton } from "@/utils/uploadthing";

interface AddVideoModalProps {
  isModalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setVideos: React.Dispatch<React.SetStateAction<Video[]>>;
  isPublic?: boolean;
  setIsPublic?: React.Dispatch<React.SetStateAction<boolean>>;
}

const AddVideoModal: React.FC<AddVideoModalProps> = ({
  isModalOpen,
  setModalOpen,
  setVideos,
  isPublic,
  setIsPublic,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    thumbnailUrl: "",
    tags: [] as string[],
    isPublic: isPublic ?? false,
    playlistHint: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      if (name === "isPublic" && setIsPublic) setIsPublic(checked);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  // Sync formData.isPublic with prop when modal opens
  React.useEffect(() => {
    if (isModalOpen && typeof isPublic === "boolean") {
      setFormData((prev) => ({ ...prev, isPublic }));
    }
  }, [isModalOpen, isPublic]);

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/videos", formData);
      setVideos((prev) => [response.data.data, ...prev]);
      setModalOpen(false);
      setFormData({
        title: "",
        description: "",
        url: "",
        thumbnailUrl: "",

        tags: [],
        isPublic: false,
        playlistHint: "",
      });
    } catch (error) {
      console.error("Error creating video:", error);
      alert("Failed to create video");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div 
    onClick={()=>setModalOpen(false)}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 max-md:pt-16 md:pl-72.5">
      <div 
      onClick={(e)=>e.stopPropagation()}
      className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6  max-md:max-h-[80vh]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Video</h2>
          <button
            onClick={() => setModalOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1  gap-4">
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

          <div className="grid grid-cols-1  gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                VDO ID
              </label>
              <input
                type="text"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-1  gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                playlistHint
              </label>
              <input
                type="text"
                name="playlistHint"
                value={formData.playlistHint}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
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
              Thumbnail URL *
            </label>
            <input
              type="url"
              name="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-gray-500">
              Or upload an image using the button below
            </p>
            <div className="mt-2">
              <UploadButton
                className="w-fit rounded-2xl bg-primary p-2 text-creamey"
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
            <label className="text-sm font-medium text-gray-700">Public</label>
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
              {isSubmitting ? "Creating..." : "Create Video"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVideoModal;
