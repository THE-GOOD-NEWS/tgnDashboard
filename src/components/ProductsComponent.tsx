"use client";
import { Product } from "@/interfaces/interfaces";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { CgDetailsMore } from "react-icons/cg";
import Swal from "sweetalert2";
import Image from "next/image";
// import { ExposureRegular } from "@/app/layout";
import ProductVariant from "./ProductVariant";
import ProductModal from "./ProductModal";
import { thirdFont } from "@/app/lib/fonts";

const ProductsComponent = ({ product, setProducts }: { product: Product; setProducts: React.Dispatch<React.SetStateAction<Product[]>> }) => {
    async function deleteProductImage(value:string,variantIndex:number) {
        console.log(value)
            try{

             const res =   await axios.delete("/api/uploadthing", {
                  data: {
                    url: value,
                  },
                });
                if (res.status === 200){

                  const imagesAfterDelete = product.variations[variantIndex].images.filter(image => image.url !== value);
  
                  console.log('images after delete'+imagesAfterDelete.length) 
                  updateVariant(variantIndex, "images", imagesAfterDelete)

                }
                // setProducts((prevProducts) =>
                //   prevProducts.map((p) =>
                //     p._id === product._id ? { ...p, variations[variantIndex].images: imagesAfterDelete } : p
                //   )
                // );                // setImagesUrl(imagesAfterDelete);    
                       }
            catch(err){
            console.log(err);}  
    }

    const [isModalOpen, setIsModalOpen] = useState(false);
  const [optionsModalIsOpen, setOptionsModal] = useState(false);
  const [isDetailsModalOpen, setDetailsModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const updateVariant = async (index: number, field: string, value: any) => {
    try {
      console.log('hna' + value.length)
      // Create a copy of the product with the updated variant
      const updatedVariations = [...product.variations];
      updatedVariations[index] = {
        ...updatedVariations[index],
        [field]: value,
      };

      // Update local state optimistically
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === product._id ? { ...p, variations: updatedVariations } : p
        )
      );

      // Send update request to backend
 
      const updatedProduct = await axios.put(`/api/products?productID=${product._id}`, {
        variations: updatedVariations,
      });

   if(updatedProduct.status===200){

     setProducts((prevProducts) =>
       prevProducts.map((p) =>
         p._id === updatedProduct.data._id ? updatedProduct.data : p
       )
     );

     Swal.fire({
       background: '#FFFFF',
       color: 'black',
       toast: false,
       iconColor: '#473728',
       position: 'bottom-right',
       text: 'VARIANT HAS BEEN UPDATED',
       showConfirmButton: false,
       timer: 2000,
       customClass: {
         popup: 'no-rounded-corners small-popup',
       },
     });
   }   // Update state with the response from the backend
    } catch (error) {
      console.error("Error updating variant:", error);
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
    <div className="relative rounded-2xl w-[97%] bg-secondary min-h-2 px-2 py-1 text-creamey bg-backgroundColor/25 ">
      <div onClick={() => setDetailsModal(true)} className='flex w-full hover:cursor-pointer items-start text-primary mr-28'>
        <div className='flex pb-2 w-full justify-between items-start text-creamey'>
          <div className='relative w-[60px] h-[70px] md:w-[100px] md:h-[120px]'>

            <Image className="rounded-2xl" fill alt={product.title} src={product.variations[0]?.images[0]?.url}></Image>
          </div>
          <h2 className={`${thirdFont.className} text-xl xl:text-2xl`}>{product.title}</h2>
          <p className={`${thirdFont.className} text-xl xl:text-2xl`}>{` ${product.price.local} LE`}</p>
        </div>
      </div>
      <ProductModal
        product={product}
        setProducts={setProducts}
        setDetailsModal={setDetailsModal}
        isDetailsModalOpen={isDetailsModalOpen}/>
    </div>
  );
};

export default ProductsComponent;