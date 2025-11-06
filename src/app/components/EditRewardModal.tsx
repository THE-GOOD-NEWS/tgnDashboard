import React, { useState } from "react";
import { ILoyaltyBonus } from "@/interfaces/interfaces";

type Props = {
  royaltyPoint: ILoyaltyBonus;
  onClose: () => void;
  onRoyaltyPointUpdated: (royaltyPoint: ILoyaltyBonus) => void;
};

const EditRoyaltyPointModal: React.FC<Props> = ({
  royaltyPoint,
  onClose,
  onRoyaltyPointUpdated,
}) => {
  const [form, setForm] = useState({
    title: royaltyPoint.title,
    description: royaltyPoint.description,
    bonusPoints: royaltyPoint.bonusPoints,
    active: royaltyPoint.active,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/loyalty/loyaltyPoints/${royaltyPoint._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            bonusPoints: Number(form.bonusPoints),
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to update loyalty point");
      const updated = await res.json();
      onRoyaltyPointUpdated(updated);
      onClose();
    } catch (err) {
      setError("Failed to update loyalty point");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Edit Loyalty Point</h2>
        <form onSubmit={handleSubmit}>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            className="mb-2 w-full rounded border p-2"
            required
          />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="mb-2 w-full rounded border p-2"
            required
          />
          <input
            name="bonusPoints"
            type="number"
            value={form.bonusPoints}
            onChange={handleChange}
            placeholder="Bonus Points"
            className="mb-2 w-full rounded border p-2"
            required
            min={1}
          />
          <label className="mb-2 flex items-center">
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
              className="mr-2"
            />
            Active
          </label>
          {error && <div className="mb-2 text-red-500">{error}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-gray-300 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoyaltyPointModal;
