'use client'
import { IOrder } from '@/interfaces/interfaces';
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import OrderComponent from './OrderComponent';
import Link from 'next/link';
import { thirdFont } from '@/app/lib/fonts';

const RecentOrders = () => {
    const [orders, setOrders] = useState<IOrder[]>([]);
      useEffect(() => {
        const fetchOrders = async () => {
          try {
            const res = await axios.get(`/api/orders?page=1`);
            setOrders(res.data.data);
          } catch (error) {
            console.error("Error fetching orders:", error);
          }
        };
        fetchOrders();
      }, []); 
  
  return (
    <div className=' h-auto col-span-12  bg-white flex flex-col gap-3 rounded-2xl md:gap-6 justify-start items-center  w-full  py-4 '>
      <h2 className={`${thirdFont.className} text-2xl tracking-normal font-semibold text-secondary`}>Recent Orders</h2>
      <div className=' flex flex-col  h-auto w-full    gap-4  items-center  '>

      {orders.length > 0 ? (
  orders.map((order, index) => {
    return index < 7 ? (
      <OrderComponent setOrders={setOrders} key={index} order={order} />
    ) : (
      <div key={index}></div>
    );
  })
) : (
  <h1>No Orders</h1>
)}

      </div>
      <Link className='mb-6' href={'/pages/orders'}>
      <h2 className='text-secondary underline'>VIEW ALL</h2>
      </Link>

      </div>
  )
}

export default RecentOrders