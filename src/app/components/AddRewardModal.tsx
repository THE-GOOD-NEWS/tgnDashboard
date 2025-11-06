import React, { useState } from "react";
import { ILoyaltyBonus } from "@/interfaces/interfaces";

type Props = {
  onRoyaltyPointAdded: (royaltyPoint: ILoyaltyBonus) => void;
};

const AddRoyaltyPointModal: React.FC<Props> = ({ onRoyaltyPointAdded }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    bonusPoints: 0,
    active: true,
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
      const res = await fetch("/api/loyalty/loyaltyPoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          bonusPoints: Number(form.bonusPoints),
        }),
      });
      if (!res.ok) throw new Error("Failed to add loyalty point");
      const royaltyPoint = await res.json();
      onRoyaltyPointAdded(royaltyPoint);
      setOpen(false);
      setForm({ title: "", description: "", bonusPoints: 0, active: true });
    } catch (err) {
      setError("Failed to add loyalty point");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mb-4 rounded bg-primary/90 px-4 py-2 text-white"
      >
        Add Loyalty Bonus
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="w-full max-w-md rounded bg-creamey p-6 text-primary/90 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Add Loyalty Point</h2>
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
                  onClick={() => setOpen(false)}
                  className="rounded bg-gray-300 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-primary px-4 py-2 text-white"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddRoyaltyPointModal;
