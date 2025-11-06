"use client";
import React, { useEffect, useState } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import axios from "axios";
import {
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaPlus,
} from "react-icons/fa";
import { UploadButton } from "@/utils/uploadthing";

interface Popup {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  link: string;
  active: boolean;
}

const BannersPage = () => {
  // Banner state
  const [banner, setBanner] = useState({ announcementBar: "" });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Popup states
  const [popups, setPopups] = useState<Popup[]>([]);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupError, setPopupError] = useState("");
  const [showPopupForm, setShowPopupForm] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [newPopup, setNewPopup] = useState<Partial<Popup>>({
    title: "",
    description: "",
    imageUrl: "",
    buttonText: "",
    link: "",
    active: false,
  });

  useEffect(() => {
    const fetchBanner = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/banners");
        setBanner(res.data.data || { announcementBar: "" });
      } catch (err) {
        setError("Failed to load banner");
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    setPopupLoading(true);
    try {
      const res = await axios.get("/api/popups");
      setPopups(res.data.data || []);
    } catch (err) {
      setPopupError("Failed to load popups");
    } finally {
      setPopupLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBanner({ ...banner, announcementBar: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await axios.patch("/api/banners", {
        announcementBar: banner.announcementBar,
      });
      setEditing(false);
    } catch (err) {
      setError("Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  // Popup form handlers
  const handlePopupChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setNewPopup({ ...newPopup, [name]: checked });
    } else {
      setNewPopup({ ...newPopup, [name]: value });
    }
  };

  const handlePopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPopupError("");

    try {
      if (editingPopup) {
        await axios.put(`/api/popups/${editingPopup._id}`, newPopup);
      } else {
        await axios.post("/api/popups", newPopup);
      }

      setShowPopupForm(false);
      setEditingPopup(null);
      setNewPopup({
        title: "",
        description: "",
        imageUrl: "",
        buttonText: "",
        link: "",
        active: false,
      });
      fetchPopups();
    } catch (err) {
      setPopupError("Failed to save popup");
    }
  };

  const handleEditPopup = (popup: Popup) => {
    setEditingPopup(popup);
    setNewPopup({ ...popup });
    setShowPopupForm(true);
  };

  const handleDeletePopup = async (id: string) => {
    if (!confirm("Are you sure you want to delete this popup?")) return;

    try {
      await axios.delete(`/api/popups/${id}`);
      fetchPopups();
    } catch (err) {
      setPopupError("Failed to delete popup");
    }
  };

  const handleToggleActive = async (popup: Popup) => {
    // Update local state immediately for better UX
    setPopups(popups.map(p => 
      p._id === popup._id ? { ...p, active: !p.active } : p
    ));
    
    try {
      await axios.put(`/api/popups/${popup._id}`, {
        ...popup,
        active: !popup.active,
      });
      // No need to fetch all popups again since we already updated locally
    } catch (err) {
      // Revert the local change if API call fails
      setPopups(popups.map(p => 
        p._id === popup._id ? { ...p, active: p.active } : p
      ));
      setPopupError("Failed to update popup status");
    }
  };

  return (
    <DefaultLayout>
      {/* Announcement Bar Section */}
      <div className="mx-auto mt-10 rounded p-6">
        <h1 className="mb-4 text-2xl font-bold text-primary">Banners</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <label className="mb-2 block font-medium">Announcement Bar</label>
            <input
              type="text"
              className="mb-4 w-full rounded border px-3 py-2"
              value={banner.announcementBar}
              onChange={handleChange}
              disabled={!editing}
            />
            {error && <div className="mb-2 text-red-500">{error}</div>}
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    className="rounded bg-primary px-4 py-2 text-white"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="rounded bg-gray-300 px-4 py-2"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="rounded bg-primary px-4 py-2 text-white"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Popups Section */}
      <div className="mx-auto mt-10 rounded p-6">
        <div className="flex items-center justify-between">
          <h2 className="mb-4 text-2xl font-bold text-primary">Popups</h2>
          {/* <button
            className="flex items-center gap-1 rounded bg-primary px-4 py-2 text-white"
            onClick={() => {
              setEditingPopup(null);
              setNewPopup({
                title: "",
                description: "",
                imageUrl: "",
                buttonText: "",
                link: "",
                active: false,
              });
              setShowPopupForm(true);
            }}
          >
            <FaPlus /> Add New Popup
          </button> */}
        </div>

        {popupError && <div className="mb-4 text-red-500">{popupError}</div>}

        {/* Popup Form */}
        {showPopupForm && (
          <div className="mb-6 rounded border p-4">
            <h3 className="mb-4 text-xl font-semibold">
              {editingPopup ? "Edit Popup" : "Create New Popup"}
            </h3>
            <form onSubmit={handlePopupSubmit}>
              <div className="mb-4">
                <label className="mb-1 block font-medium">Title</label>
                <input
                  type="text"
                  name="title"
                  className="w-full rounded border px-3 py-2"
                  value={newPopup.title || ""}
                  onChange={handlePopupChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="mb-1 block font-medium">Description</label>
                <textarea
                  name="description"
                  className="w-full rounded border px-3 py-2"
                  value={newPopup.description || ""}
                  onChange={handlePopupChange}
                  required
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="mb-1 block font-medium">Image</label>
                {newPopup.imageUrl && (
                  <div className="relative mb-2">
                    <img
                      src={newPopup.imageUrl}
                      alt="Popup image"
                      className="h-32 w-64 rounded object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/300x150?text=Image+Not+Found";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setNewPopup({ ...newPopup, imageUrl: "" })}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {!newPopup.imageUrl && (
                  <UploadButton
                    endpoint="mediaUploader"
                    onClientUploadComplete={(res) => {
                      if (res && res.length > 0) {
                        setNewPopup({ ...newPopup, imageUrl: res[0].url });
                      }
                    }}
                    onUploadError={(error: Error) => {
                      alert(`Upload error: ${error.message}`);
                    }}
                    className="mt-2 w-fit rounded-md bg-primary px-2 text-white"
                  />
                )}
              </div>
              <div className="mb-4">
                <label className="mb-1 block font-medium">Button Text</label>
                <input
                  type="text"
                  name="buttonText"
                  className="w-full rounded border px-3 py-2"
                  value={newPopup.buttonText || ""}
                  onChange={handlePopupChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="mb-1 block font-medium">Link</label>
                <input
                  type="text"
                  name="link"
                  className="w-full rounded border px-3 py-2"
                  value={newPopup.link || ""}
                  onChange={handlePopupChange}
                  required
                />
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  id="active"
                  className="mr-2 h-4 w-4"
                  checked={newPopup.active || false}
                  onChange={handlePopupChange}
                />
                <label htmlFor="active" className="font-medium">
                  Active
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded bg-primary px-4 py-2 text-white"
                >
                  {editingPopup ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  className="rounded bg-gray-300 px-4 py-2"
                  onClick={() => setShowPopupForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Popups List */}
        {popupLoading ? (
          <div>Loading popups...</div>
        ) : popups.length === 0 ? (
          <div className="text-gray-500">No popups found</div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {popups.map((popup) => (
              <div
                key={popup._id}
                className="rounded border p-4 shadow-sm transition-all hover:shadow"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{popup.title}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(popup)}
                      className={`text-lg ${
                        popup.active ? "text-green-500" : "text-gray-400"
                      }`}
                      title={popup.active ? "Deactivate" : "Activate"}
                    >
                      {popup.active ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                    <button
                      onClick={() => handleEditPopup(popup)}
                      className="text-blue-500"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeletePopup(popup._id)}
                      className="text-red-500"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div className="mb-2">
                  <img
                    src={popup.imageUrl}
                    alt={popup.title}
                    className="h-32 w-64 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/300x150?text=Image+Not+Found";
                    }}
                  />
                </div>
                <p className="mb-2 whitespace-pre-line text-sm text-gray-600">
                  {popup.description.length > 100
                    ? popup.description.substring(0, 100) + "..."
                    : popup.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Button: {popup.buttonText}
                  </span>
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      popup.active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {popup.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default BannersPage;
