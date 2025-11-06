import { Product } from '@/interfaces/interfaces'
import axios from 'axios';
import React from 'react'
import Swal from 'sweetalert2';

const DeleteProductModal = ({productID,isModalOpen,setModalOpen,setBigModal,setProducts}:{productID:string,isModalOpen:boolean,
    setModalOpen:React.Dispatch<React.SetStateAction<boolean>>,
    setBigModal:React.Dispatch<React.SetStateAction<boolean>>,
setProducts:React.Dispatch<React.SetStateAction<Product[]>>}) => {
    const deleteProduct = async () => {
        const res = await axios.delete(`/api/products`, {
            data: { productID: productID },
          });
        if (res.status===200){
            setProducts((prevProducts)=>prevProducts.filter(product=>product._id!==productID))
            setModalOpen(false)
            setBigModal(false)
            Swal.fire({
              background: '#FFFFF',
              color: 'black',
              toast: false,
              iconColor: '#473728',
              position: 'bottom-right',
              text: 'PRODUCT HAS BEEN DELETED',
              showConfirmButton: false,
              timer: 2000,
              customClass: {
                popup: 'no-rounded-corners small-popup',
              },
            });
        }
        
    }
  return (
    isModalOpen && (
        <div 
        onClick={()=>setModalOpen(false)}
        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div 
          onClick={(e) => e.stopPropagation()}
          className="bg-white p-6  shadow-lg w-4/5 md:w-1/3 text-center">
            <h2 className="text-lg font-bold mb-4">CONFIRM DELETION</h2>
            <p className="mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="flex justify-around">
              <button
                className="px-4 py-2  text-primary border-[1px] border-primary  "
                onClick={deleteProduct}
              >
                Yes, Delete
              </button>
              <button
                className="px-4 py-2 text-white bg-primary "
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )
  )
}

export default DeleteProductModal