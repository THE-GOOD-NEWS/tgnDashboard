"use client";
import { IOrder } from "@/interfaces/interfaces";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { CgDetailsMore } from "react-icons/cg";
import Swal from "sweetalert2";
import { IoMenuSharp } from "react-icons/io5";
import CartItemSmall from "./CartItemSmall";


const OrderComponent = ({ order,setOrders }: { order: IOrder,setOrders:React.Dispatch<React.SetStateAction<IOrder[]>> }) => {

  const [status, setStatus] = useState(order.status);
  const [payment, setPayment] = useState(order.payment)
  const updateOrder = async (field: keyof IOrder, value: string) => {
    if (!order) return;
  
    try {
      // Update local state optimistically
      const updateOdrder: IOrder = { ...order, [field]: value };
      
      // Send update request to backend
      const updatedOrder=  await axios.put(`/api/orders?orderID=${order._id}`, { [field]: value });

      setOrders((prev) =>
             prev.map((o) => (o._id === updatedOrder.data._id ? updatedOrder.data! : o))

      );
  
      Swal.fire({
        background: '#FFFFF',
        color: 'black',
        toast: false,
        iconColor: '#473728',
        position: 'bottom-right',
        text: 'ORDER HAS BEEN UPDATED',
        showConfirmButton: false,
        timer: 2000,
        customClass: {
          popup: 'no-rounded-corners small-popup',
        },
      });
    } catch (error) {
      console.error("Error updating order:", error);
      Swal.fire({
        background: '#FFFFF',
        color: 'black',
        toast: false,
        iconColor: '#473728',
        position: 'bottom-right',
        text: 'UPDATE FAILED',
        showConfirmButton: false,
        timer: 2000,
        customClass: {
          popup: 'no-rounded-corners small-popup',
        },
      });
    }
  };
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [optionsModalIsOpen, setOptionsModal] = useState(false);
  const [isDetailsModalOpen, setDetailsModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Add effect to handle body scroll when modals are open
  useEffect(() => {
    if (isModalOpen || isDetailsModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, isDetailsModalOpen]);

  const deleteOrder = async () => {
    setIsModalOpen(false);
    try {
        const res = await axios.delete(`/api/orders`, {
        data: { orderID:order._id },
      });
      if (res.status === 200) {
        setOrders((prev)=>prev.filter((o)=>o._id!==order._id));
        // fetchOrders();
        Swal.fire({
          background: '#FFFFF',
          color: 'black',
          toast: false,
          iconColor: '#473728',
          position: 'bottom-right',
          text: 'ORDER HAS BEEN DELETED',
          showConfirmButton: false,
          timer: 2000,
          customClass: {
            popup: 'no-rounded-corners small-popup',
          },
        });
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setOptionsModal(false);
      }
    }

    if (optionsModalIsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [optionsModalIsOpen]);

  return (
    <div className="relative text-sm rounded-2xl w-[97%] min-h-6 px-4 py-8 text-creamey bg-secondary bg-backgroundColor/25 border border-secondary">
      <div className="flex text-sm w-full border-b pb-1 border-white justify-between">
        <div className="flex gap-2">
          <h1>ORDER ID :</h1>
          <p>{order._id}</p>
        </div>

        {/* Clickable Icon to Open Modal */}
        <div className="relative">
        <IoMenuSharp  onClick={() => setOptionsModal(true)} className="cursor-pointer" />
          
          {/* Options Modal */}
          {optionsModalIsOpen && (
            <div ref={modalRef} className="px-2 flex flex-col text-primary gap-2 py-2 absolute top-0 right-0 w-auto h-auto bg-backgroundColor p-2 z-30 shadow-xl">
              <p 
              onClick={()=>{
                setDetailsModal(true)
                setOptionsModal(false);
              }}
              className="hover:cursor-pointer flex justify-center items-center border-primary px-4 pt-3 border-b">DETAILS</p>
              <p onClick={()=>{
                setIsModalOpen(true);
                setOptionsModal(false);
              }} className="hover:cursor-pointer flex justify-center items-center border-primary px-4 pt-3 border-b">DELETE</p>
            </div>
          )}
        </div>
      </div>

      {/* Other Order Details */}
      <div className="flex items-center  flex-nowrap pt-1 w-full justify-between">
        <div className="flex flex-nowrap items-center justify-center gap-2">
        <p>{new Date(order.createdAt!).toLocaleString("en-EG", { timeZone: "Africa/Cairo" })}</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <p>{order.firstName } {order.lastName}</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <p>{order.total} LE</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <p>{order.state}</p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div 
        onClick={()=>setIsModalOpen(false)}
        className="fixed inset-0 text-primary bg-black bg-opacity-50 flex justify-center  items-center z-50">
          <div 
          onClick={(e) => e.stopPropagation()}
          className="bg-white p-6 rounded-2xl shadow-lg w-4/5 md:w-1/3 text-center">
            <h2 className="text-lg font-bold mb-4">CONFIRM DELETION</h2>
            <p className="mb-6">Are you sure you want to delete your account? This action cannot be undone.</p>
            <div className="flex justify-around">
              <button
                className="px-4 py-2 rounded-2xl text-primary border-[1px] border-primary  "
                onClick={deleteOrder}
              >
                Yes, Delete
              </button>
              <button
                className="px-4 py-2 rounded-2xl text-white bg-accent "
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
  {isDetailsModalOpen  && (
  <div 
  onClick={()=>setDetailsModal(false)}
  className="fixed   lg:ml-[290px] lg:w-[calc(100vw-290px)] text-primary inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div
        onClick={(e) => e.stopPropagation()} 

    className="bg-creamey h-[95%] overflow-y-scroll rounded-2xl p-6 shadow-lg w-[90%] max-w-3xl text-secondary text-center">
      <div className="flex mb-2 w-full items-center justify-end">
        <span className="hover:cursor-pointer" onClick={()=>setDetailsModal(false)}>x</span>
      </div>
      <h2 className="text-lg font-bold mb-4">ORDER DETAILS</h2>
      
      {/* Order Info */}
      <div className="text-left  space-y-2">
        <p><strong>Order ID:</strong> {order._id || "N/A"}</p>

        <p><strong>Email:</strong> {order.email}</p>
        <p><strong>Customer:</strong> {order.firstName} {order.lastName}</p>
        <p><strong>Cart:</strong></p>
     
      <div className="flex flex-col gap-2">
        {order.cart?.map((item,index) => <CartItemSmall key={index} item={item} wishListBool={false}/>)}
        </div>
        <p><strong>Phone:</strong> {order.phone || "N/A"}</p>
        <p><strong>Address:</strong> {order.address}, {order.city}, {order.state}, {order.country}</p>
        <p><strong>Postal Code:</strong> {order.postalZip || "N/A"}</p>

      
      {/* Order Info */}
        
        {/* Status Dropdown */}
        <label className="block font-semibold mt-4">Status:</label>
        <select
          className="border p-2 bg-creamey w-full"
          value={status}
          onChange={(e) =>{ 

            const newStatus = e.target.value as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
            setStatus(newStatus);
            updateOrder("status", newStatus);
          }}
        >
          {["pending", "confirmed", "shipped", "delivered", "cancelled"].map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        {/* Payment Dropdown */}
        <label className="block font-semibold mt-4">Payment:</label>
        <select
          className="border bg-creamey p-2 w-full"
          value={payment}
          onChange={(e) =>{ 
            const newPayment = e.target.value as "pending"| "failed"| "confirmed";
            setPayment(newPayment);
            updateOrder("payment", e.target.value)}}
        >
          {["pending", "failed", "confirmed"].map((payment) => (
            <option key={payment} value={payment}>{payment}</option>
          ))}
        </select>
        <p><strong>Sub-Total:</strong> {order.subTotal?.toFixed(2)} LE</p>
        <p><strong>Shipping:</strong> {order.shipping?.toFixed(2)} LE</p>
        <p><strong>Total:</strong> {order.total?.toFixed(2)} LE</p>
        <p><strong>Created At:</strong> {new Date(order.createdAt!).toLocaleString("en-EG", { timeZone: "Africa/Cairo" })}</p>
      </div>

      {/* Buttons */}
      {/* <div className="flex justify-around mt-6">
        <button
          className="px-4 py-2 text-primary border-[1px] border-primary"
          onClick={deleteOrder}
        >
          Yes, Delete
        </button>
        <button
          className="px-4 py-2 text-white bg-primary"
          onClick={() => setDetailsModal(false)}
        >
          Close
        </button>
      </div> */}
    </div>
  </div>
)}

    </div>
  );
};

export default OrderComponent;
