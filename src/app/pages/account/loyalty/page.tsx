import { Gift, TrendingUp, Clock } from 'lucide-react';

export default function LoyaltyPage() {
  // This would typically come from your database
  const userPoints = {
    current: 1250,
    lifetime: 5000,
    nextReward: 1500,
  };

  const pointsHistory = [
    {
      id: 1,
      points: 250,
      description: 'Purchase of Premium Headphones',
      date: 'March 15, 2024',
      type: 'earned',
    },
    {
      id: 2,
      points: -500,
      description: 'Redeemed for $50 Discount',
      date: 'March 10, 2024',
      type: 'redeemed',
    },
    {
      id: 3,
      points: 100,
      description: 'Referral Bonus',
      date: 'March 5, 2024',
      type: 'earned',
    },
  ];

  const availableRewards = [
    {
      id: 1,
      name: '$50 Store Credit',
      points: 500,
      description: 'Use towards any purchase',
    },
    {
      id: 2,
      name: 'Free Shipping',
      points: 200,
      description: 'Valid for 30 days',
    },
    {
      id: 3,
      name: 'Premium Membership',
      points: 1000,
      description: '3 months of premium features',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Points Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Current Points</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {userPoints.current}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Lifetime Points</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {userPoints.lifetime}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Points to Next Reward</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {userPoints.nextReward - userPoints.current}
          </dd>
        </div>
      </div>

      {/* Available Rewards */}
      <div>
        <h2 className="text-lg font-medium text-gray-900">Available Rewards</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableRewards.map((reward) => (
            <div
              key={reward.id}
              className="relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">{reward.name}</h3>
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                  {reward.points} points
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">{reward.description}</p>
              <button
                type="button"
                className="mt-4 inline-flex items-center justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Redeem
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Points History */}
      <div>
        <h2 className="text-lg font-medium text-gray-900">Points History</h2>
        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Points
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {pointsHistory.map((item) => (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {item.description}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span
                            className={
                              item.type === 'earned'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {item.type === 'earned' ? '+' : ''}
                            {item.points}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 