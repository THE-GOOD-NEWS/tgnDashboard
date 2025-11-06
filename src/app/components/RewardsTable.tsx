import React, { useEffect, useState } from "react";
import { ILoyaltyBonus } from "@/interfaces/interfaces";
import EditRoyaltyPointModal from "./EditRewardModal";

const RoyaltyPointsTable: React.FC = () => {
  const [royaltyPoints, setRoyaltyPoints] = useState<ILoyaltyBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ILoyaltyBonus | null>(null);

  useEffect(() => {
    fetch("/api/loyalty/loyaltyPoints")
      .then((res) => res.json())
      .then((data) => {
        setRoyaltyPoints(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load loyalty points");
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this loyalty point?")) return;
    const res = await fetch(`/api/loyalty/loyaltyPoints/${id}`, {
      method: "DELETE",
    });
    if (res.ok) setRoyaltyPoints(royaltyPoints.filter((r) => r._id !== id));
    else alert("Failed to delete");
  };

  const handleRoyaltyPointUpdated = (updated: ILoyaltyBonus) => {
    setRoyaltyPoints(
      royaltyPoints.map((r) => (r._id === updated._id ? updated : r)),
    );
    setEditing(null);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <>
      <table className="min-w-full border">
        <thead className="bg-secondary text-creamey">
          <tr>
            <th className="border px-4 py-2">Title</th>
            <th className="border px-4 py-2">Description</th>
            <th className="border px-4 py-2">Bonus Points</th>
            <th className="border px-4 py-2">Active</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {royaltyPoints.map((rp) => (
            <tr key={rp._id} className="text-center">
              <td className="border px-4 py-2">{rp.title}</td>
              <td className="border px-4 py-2">{rp.description}</td>
              <td className="border px-4 py-2">{rp.bonusPoints}</td>
              <td className="border px-4 py-2">{rp.active ? "Yes" : "No"}</td>
              <td className="border px-4 py-2">
                <button
                  onClick={() => setEditing(rp)}
                  className="mr-2 text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(rp._id!)}
                  className="ml-2 text-red-500"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editing && (
        <EditRoyaltyPointModal
          royaltyPoint={editing}
          onClose={() => setEditing(null)}
          onRoyaltyPointUpdated={handleRoyaltyPointUpdated}
        />
      )}
    </>
  );
};

export default RoyaltyPointsTable;
