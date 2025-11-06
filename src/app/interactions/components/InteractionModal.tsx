"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface Interaction {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  targetId: string;
  targetType: "video" | "comment" | "reply";
  actionType: "like" | "unlike" | "comment" | "reply";
  content?: string;
  read: boolean;
  createdAt: string;
}

interface InteractionModalProps {
  interaction: Interaction;
  onClose: () => void;
  onUpdate: (updatedInteraction: Interaction) => void;
}

const InteractionModal = ({ interaction, onClose, onUpdate }: InteractionModalProps) => {
  const [formData, setFormData] = useState({
    targetType: interaction.targetType,
    actionType: interaction.actionType,
    content: interaction.content || "",
    read: interaction.read,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        [name]: target.checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.patch(`/api/interactions/${interaction._id}`, formData);
      
      // Update the interaction in the parent component
      onUpdate({
        ...interaction,
        ...formData,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update interaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            Edit Interaction
          </h3>
          <button
            onClick={onClose}
            className="text-black hover:text-primary dark:text-white"
          >
            <svg
              className="fill-current"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.8913 10.0002L17.8596 4.03185C18.0465 3.84497 18.0465 3.54997 17.8596 3.36309C17.6727 3.17622 17.3777 3.17622 17.1909 3.36309L11.2225 9.33145L5.25424 3.36309C5.06737 3.17622 4.77237 3.17622 4.58549 3.36309C4.39862 3.54997 4.39862 3.84497 4.58549 4.03185L10.5538 10.0002L4.58549 15.9686C4.39862 16.1554 4.39862 16.4504 4.58549 16.6373C4.67893 16.7307 4.80112 16.7775 4.92268 16.7775C5.04424 16.7775 5.16643 16.7307 5.25987 16.6373L11.2282 10.669L17.1965 16.6373C17.29 16.7307 17.4122 16.7775 17.5337 16.7775C17.6553 16.7775 17.7775 16.7307 17.8709 16.6373C18.0578 16.4504 18.0578 16.1554 17.8709 15.9686L11.8913 10.0002Z"
                fill=""
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-danger bg-opacity-10 px-4 py-3 text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-2.5 block text-black dark:text-white">
              User
            </label>
            <input
              type="text"
              value={interaction.userId?.name || "Unknown"}
              disabled
              className="w-full rounded-md border border-stroke bg-gray py-3 px-4 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            />
          </div>

          <div className="mb-4">
            <label className="mb-2.5 block text-black dark:text-white">
              Target Type
            </label>
            <select
              name="targetType"
              value={formData.targetType}
              onChange={handleChange}
              className="w-full rounded-md border border-stroke bg-white py-3 px-4 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            >
              <option value="video">Video</option>
              <option value="comment">Comment</option>
              <option value="reply">Reply</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-2.5 block text-black dark:text-white">
              Action Type
            </label>
            <select
              name="actionType"
              value={formData.actionType}
              onChange={handleChange}
              className="w-full rounded-md border border-stroke bg-white py-3 px-4 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            >
              <option value="like">Like</option>
              <option value="unlike">Unlike</option>
              <option value="comment">Comment</option>
              <option value="reply">Reply</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-2.5 block text-black dark:text-white">
              Content
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-md border border-stroke bg-white py-3 px-4 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
              placeholder="Interaction content"
            ></textarea>
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="read"
                checked={formData.read}
                onChange={handleChange}
                className="mr-2 h-5 w-5 rounded border-stroke bg-transparent text-primary focus:border-primary focus:ring-primary dark:border-strokedark"
              />
              <span className="text-black dark:text-white">Mark as read</span>
            </label>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-white hover:bg-opacity-90"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InteractionModal;