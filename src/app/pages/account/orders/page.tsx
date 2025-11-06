import { ShoppingBag, Package, Truck, CheckCircle } from 'lucide-react';

export default function OrdersPage() {
  // This would typically come from your database
  const orders = [
    {
      id: 'ORD-12345',
      date: 'March 15, 2024',
      total: 299.99,
      status: 'delivered',
      items: [
        {
          name: 'Premium Wireless Headphones',
          quantity: 1,
          price: 299.99,
          image: '/images/headphones.jpg',
        },
      ],
    },
    {
      id: 'ORD-12344',
      date: 'March 10, 2024',
      total: 129.99,
      status: 'shipped',
      items: [
        {
          name: 'Bluetooth Speaker',
          quantity: 1,
          price: 129.99,
          image: '/images/speaker.jpg',
        },
      ],
    },
    {
      id: 'ORD-12343',
      date: 'March 5, 2024',
      total: 399.99,
      status: 'processing',
      items: [
        {
          name: 'Smart Watch Series 5',
          quantity: 1,
          price: 399.99,
          image: '/images/smartwatch.jpg',
        },
      ],
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-yellow-500" />;
      default:
        return <ShoppingBag className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
        <span className="text-sm text-gray-500">{orders.length} orders</span>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow"
          >
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(order.status)}
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Order {order.id}
                  </h3>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500">{order.date}</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="flow-root">
                <ul role="list" className="-my-5 divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <li key={index} className="py-5">
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {item.name}
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            ${item.price}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
                <div className="text-sm text-gray-500">
                  <span className="font-medium text-gray-900">Total:</span>{' '}
                  ${order.total}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 