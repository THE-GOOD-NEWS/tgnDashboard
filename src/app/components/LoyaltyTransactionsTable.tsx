import React, { useEffect, useState } from "react";
import { ILoyaltyTransaction } from "@/interfaces/interfaces";

type Props = {
  userId: string;
};

const LoyaltyTransactionsTable: React.FC<Props> = ({ userId }) => {
  const [transactions, setTransactions] = useState<ILoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/loyalty/transactions?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load transactions");
        setLoading(false);
      });
  }, [userId]);

  if (!userId) return null;
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <table className="mb-4 min-w-full border">
      <thead>
        <tr>
          <th className="border px-4 py-2">Type</th>
          <th className="border px-4 py-2">Reason</th>
          <th className="border px-4 py-2">Amount</th>
          <th className="border px-4 py-2">Timestamp</th>
          <th className="border px-4 py-2">Reward ID</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => (
          <tr key={tx._id}>
            <td className="border px-4 py-2">{tx.type}</td>
            <td className="border px-4 py-2">{tx.reason}</td>
            <td className="border px-4 py-2">{tx.amount}</td>
            <td className="border px-4 py-2">
              {new Date(tx.timestamp).toLocaleString()}
            </td>
            <td className="border px-4 py-2">
              {tx.bonusID?.bonusPoints ?? "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default LoyaltyTransactionsTable;
