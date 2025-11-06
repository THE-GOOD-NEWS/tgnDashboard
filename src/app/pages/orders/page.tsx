"use client";
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import OrderComponent from '@/components/OrderComponent';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { IOrder } from '@/interfaces/interfaces';

const OrdersPage = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.append('search', search);
      if (orderDate) params.append('orderDate', orderDate);
      const res = await axios.get(`/api/orders?${params.toString()}`);
      setOrders(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, orderDate]);

  useEffect(() => {
    fetchOrders();
  }, [page, search, orderDate]);

  useEffect(() => {
    setPage(1); // Reset to first page when filters change
  }, [search, orderDate]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <DefaultLayout>
      <div className="px-1 overflow-hidden md:px-2 py-2 md:py-4 w-full h-auto min-h-screen flex flex-col justify-center items-center gap-4 bg-backgroundColor">
        <div className="w-full flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Search by order ID or customer name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="date"
            value={orderDate}
            onChange={e => setOrderDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        {isLoading ? (
          <div>Loading...</div>
        ) : orders.length > 0 ? (
          orders.map((order) => <OrderComponent setOrders={setOrders} key={order._id} order={order} />)
        ) : (
          <h1>No Orders</h1>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center gap-4 mt-4">
          <button
            className="px-4 py-2 bg-accent text-white rounded disabled:opacity-50"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || isLoading}
          >
            Previous
          </button>

          <span className="text-lg">Page {page} of {totalPages}</span>

          <button
            className="px-4 py-2 bg-accent text-white rounded disabled:opacity-50"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages || isLoading}
          >
            Next
          </button>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default OrdersPage;
