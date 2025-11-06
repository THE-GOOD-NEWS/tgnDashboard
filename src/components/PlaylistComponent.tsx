"use client";
import React, { useState, useEffect } from "react";
import { Playlist, Video } from "@/interfaces/interfaces";
import axios from "axios";
import Image from "next/image";
import { UploadButton } from "@/utils/uploadthing";
import { useDrag, useDrop } from "react-dnd";

interface PlaylistComponentProps {
  playlist: Playlist;
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
}

const PlaylistComponent: React.FC<PlaylistComponentProps> = ({
  playlist,
  setPlaylists,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: playlist.title,
    description: Array.isArray(playlist.description)
      ? playlist.description
      : playlist.description
        ? [playlist.description]
        : [],
    thumbnailUrl: playlist.thumbnailUrl,
    category: playlist.category || "",
    tags: playlist.tags || [],
    isPublic: playlist.isPublic,
    videos: Array.isArray(playlist.videos)
      ? playlist.videos.map((v) =>
          typeof v === "object" && v !== null ? v._id : v,
        )
      : [],
    featured:
      typeof playlist.featured === "boolean" ? playlist.featured : false,
  });
  const [availableVideos, setAvailableVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchAvailableVideos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

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

  const handleSave = async () => {
    try {
      const response = await axios.put(
        `/api/playlists?playlistID=${playlist._id}`,
        formData,
      );
      setPlaylists((prev) =>
        prev.map((p) => (p._id === playlist._id ? response.data.data : p)),
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating playlist:", error);
      alert("Failed to update playlist");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;

    setIsDeleting(true);
    try {
      await axios.delete("/api/playlists", {
        data: { playlistID: playlist._id },
      });
      setPlaylists((prev) => prev.filter((p) => p._id !== playlist._id));
    } catch (error) {
      console.error("Error deleting playlist:", error);
      alert("Failed to delete playlist");
    } finally {
      setIsDeleting(false);
    }
  };

  const getVideoCount = () => {
    if (Array.isArray(playlist.videos)) {
      return playlist.videos.length;
    }
    return 0;
  };

  const getVideos = (): Video[] => {
    if (Array.isArray(playlist.videos)) {
      return playlist.videos.filter(
        (video) => typeof video === "object" && video !== null,
      ) as Video[];
    }
    return [];
  };

  const handleVideoSelection = (videoId: string) => {
    setFormData((prev) => ({
      ...prev,
      videos: (prev.videos as string[]).includes(videoId)
        ? (prev.videos as string[]).filter((id) => id !== videoId)
        : [...(prev.videos as string[]), videoId],
    }));
  };

  // Drag-and-drop item type
  const ItemTypes = { VIDEO: "video" };

  // Helper to get selected video objects in order
  const selectedVideoObjects = (formData.videos as string[])
    .map((id) => availableVideos.find((v) => v._id === id))
    .filter(Boolean) as Video[];

  // Drag-and-drop logic for selected videos
  const moveVideo = (from: number, to: number) => {
    setFormData((prev) => {
      const updated = [...(prev.videos as string[])];
      const [removed] = updated.splice(from, 1);
      updated.splice(to, 0, removed);
      return { ...prev, videos: updated };
    });
  };

  const DraggableVideo = ({
    video,
    index,
  }: {
    video: Video;
    index: number;
  }) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const [, drop] = useDrop({
      accept: ItemTypes.VIDEO,
      hover(item: { index: number }) {
        if (item.index !== index) {
          moveVideo(item.index, index);
          item.index = index;
        }
      },
    });
    const [{ isDragging }, drag] = useDrag({
      type: ItemTypes.VIDEO,
      item: { index },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    });
    drag(drop(ref));
    return (
      <div
        ref={ref}
        className={`mb-1 flex cursor-move items-center space-x-2 rounded border border-gray-200 bg-white p-2 ${isDragging ? "opacity-50" : ""}`}
        style={{ opacity: isDragging ? 0.5 : 1 }}
      >
        <input
          type="checkbox"
          checked={true}
          onChange={() => handleVideoSelection(video._id || "")}
          className="mr-2"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-gray-900">{video.title}</p>
        </div>
        <button
          type="button"
          className="ml-2 text-xs text-red-500"
          onClick={() => handleVideoSelection(video._id || "")}
        >
          Remove
        </button>
      </div>
    );
  };

  if (isEditing) {
    return (
      <div
        onClick={() => setIsEditing(false)}
        className="fixed inset-0 z-20 flex h-full w-full items-center justify-center bg-black/30 md:pl-72.5"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="mb-4 max-h-[90vh] overflow-y-scroll rounded-md bg-white p-6 shadow-md"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="rounded-md-md w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-secondary">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="rounded-md-md w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-secondary">
                Description Points
              </label>
              {formData.description.map((point, idx) => (
                <div key={idx} className="mb-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => {
                      const newDesc = [...formData.description];
                      newDesc[idx] = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        description: newDesc,
                      }));
                    }}
                    className="flex-1 rounded border px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        description: prev.description.filter(
                          (_, i) => i !== idx,
                        ),
                      }));
                    }}
                    className="text-xs text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    description: [...prev.description, ""],
                  }))
                }
                className="mt-2 rounded bg-primary px-2 py-1 text-white"
              >
                Add Point
              </button>
            </div>

            {/* Thumbnail upload and preview */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-secondary">
                Thumbnail Image
              </label>
              <div className="flex flex-col gap-2">
                {formData.thumbnailUrl && (
                  <Image
                    width={80}
                    height={60}
                    src={formData.thumbnailUrl}
                    alt="Thumbnail Preview"
                    className=" mt-2 h-30 w-40 rounded border border-gray-300 object-cover"
                  />
                )}
                <UploadButton
                  className="flex w-fit rounded-md bg-primary px-2"
                  endpoint="mediaUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res.length > 0) {
                      setFormData((prev) => ({
                        ...prev,
                        thumbnailUrl: res[0].url,
                      }));
                    }
                  }}
                  onUploadError={(error) => {
                    alert(`ERROR! ${error.message}`);
                  }}
                />
              </div>
            </div>

            <div className="flex items-center md:col-span-2">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm font-medium text-secondary">
                Public Playlist
              </label>
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="ml-6 mr-2"
              />
              <label className="text-sm font-medium text-secondary">
                Featured
              </label>
            </div>

            {/* Video selection UI */}
            <div className="mt-4 md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-secondary">
                Select Videos ({formData.videos.length} selected)
              </label>
              {/* Drag-and-drop list for selected videos */}
              {selectedVideoObjects.length > 0 && (
                <div className="mb-4 max-h-40 overflow-y-auto rounded-md border border-primary/30 bg-primary/5 p-2">
                  {selectedVideoObjects.map((video, idx) => (
                    <DraggableVideo key={video._id} video={video} index={idx} />
                  ))}
                </div>
              )}
              {/* Available videos grid for selection */}
              {isLoadingVideos ? (
                <div className="py-4 text-center">Loading videos...</div>
              ) : availableVideos.length > 0 ? (
                <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto rounded-md border border-gray-300 p-2 md:grid-cols-2 lg:grid-cols-3">
                  {availableVideos.map((video) => (
                    <div
                      key={video._id}
                      className={`flex cursor-pointer items-center space-x-2 rounded p-2 ${
                        (formData.videos as string[]).includes(video._id || "")
                          ? "border border-primary bg-primary/10"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                      onClick={() => handleVideoSelection(video._id || "")}
                    >
                      <input
                        type="checkbox"
                        onClick={(e) => e.stopPropagation()}
                        checked={(formData.videos as string[]).includes(
                          video._id || "",
                        )}
                        onChange={() => handleVideoSelection(video._id || "")}
                        className="mr-2"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-gray-900">
                          {video.title}
                        </p>
                        {/* {video.playlistHint && <p className="text-sm text-gray-900 truncate">({video.playlistHint})</p>} */}
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
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-md border border-primary px-4 py-2 text-primary hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 w-full rounded-md bg-secondary p-6 text-creamey shadow-md">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative h-32 w-full flex-shrink-0 md:w-48">
          <Image
            src={playlist.thumbnailUrl}
            alt={playlist.title}
            fill
            className="rounded-md object-cover"
          />
          <div className="absolute bottom-2 right-2 rounded-md bg-black bg-opacity-75 px-2 py-1 text-xs text-white">
            {getVideoCount()} videos
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-2 flex items-start justify-between">
            <h3 className="text-lg font-semibold text-creamey">
              {playlist.title}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-md bg-creamey px-3 py-1 text-sm text-primary hover:bg-creamey/90"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          {/* {playlist.description && playlist.description.length > 0 && (
            <ul className="mb-2 list-disc pl-5">
              {playlist.description.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          )} */}

          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <span className="font-medium text-creamey/90">Category:</span>
              <span className="ml-1 text-creamey/90">
                {playlist.category || "N/A"}
              </span>
            </div>
            <div>
              <span className="font-medium text-creamey/90">Status:</span>
              <span
                className={`ml-1 ${playlist.isPublic ? "text-green-600" : "text-yellow-600"}`}
              >
                {playlist.isPublic ? "Public" : "Private"}
              </span>
            </div>
            <div>
              <span className="font-medium text-creamey/90">Videos:</span>
              <span className="ml-1 text-creamey/90">{getVideoCount()}</span>
            </div>
            {/* <div>
              <span className="font-medium text-creamey/90">Tags:</span>
              <span className="ml-1 text-creamey/90">{playlist.tags?.length || 0} tags</span>
            </div> */}
            <div>
              <span className="font-medium text-creamey/90">Featured:</span>
              <span
                className={`ml-1 ${playlist.featured ? "text-green-600" : "text-yellow-600"}`}
              >
                {playlist.featured ? "Yes" : "No"}
              </span>
            </div>
          </div>

          {playlist.tags && playlist.tags.length > 0 && (
            <div className="mt-2">
              <span className="text-sm font-medium text-creamey/90">Tags:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {playlist.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="rounded-md bg-gray-100 px-2 py-1 text-xs text-creamey/90"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* {getVideos().length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-creamey/90 mb-2">Videos in this playlist:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {getVideos().slice(0, 6).map((video, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                    <div className="relative w-12 h-8 flex-shrink-0">
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-primary">{video.title}</p>

                    </div>
                  </div>
                ))}
                {getVideos().length > 6 && (
                  <div className="flex items-center justify-center p-2 bg-gray-50 rounded-md">
                    <span className="text-xs text-gray-500">
                      +{getVideos().length - 6} more videos
                    </span>
                  </div>
                )}
              </div>
            </div>
          )} */}

          <div className="mt-2 text-xs text-creamey/80">
            Created: {new Date(playlist.createdAt).toLocaleDateString()}
            {playlist.updatedAt &&
              playlist.updatedAt !== playlist.createdAt && (
                <span className="ml-4">
                  Updated: {new Date(playlist.updatedAt).toLocaleDateString()}
                </span>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistComponent;
