import React, { useEffect, useState } from 'react';
import { User } from '@/interfaces/interfaces';

type Props = {
  rewardId: string;
};

const UserRedemptionsTable: React.FC<Props> = ({ rewardId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rewardId) return;
    fetch(`/api/loyalty/users?rewardId=${rewardId}`)
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load users');
        setLoading(false);
      });
  }, [rewardId]);

  if (!rewardId) return null;
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <table className="min-w-full border mb-4">
      <thead>
        <tr>
          <th className="border px-4 py-2">User ID</th>
          <th className="border px-4 py-2">Email</th>
          <th className="border px-4 py-2">First Name</th>
          <th className="border px-4 py-2">Last Name</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.userId}>
            <td className="border px-4 py-2">{user.userId}</td>
            <td className="border px-4 py-2">{user.email}</td>
            <td className="border px-4 py-2">{user.firstName}</td>
            <td className="border px-4 py-2">{user.lastName}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserRedemptionsTable; 