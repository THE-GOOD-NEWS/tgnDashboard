"use client";
import { Collection, Product } from "@/interfaces/interfaces";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { CgDetailsMore } from "react-icons/cg";
import Swal from "sweetalert2";
import Image from "next/image";
// import { ExposureRegular } from "@/app/layout";
import ProductVariant from "./ProductVariant";
import ProductModal from "./ProductModal";

const CollectionComponent = ({ collection, setCollections }: { collection: Collection; setCollections: React.Dispatch<React.SetStateAction<Collection[]>> }) => {


    const [isModalOpen, setIsModalOpen] = useState(false);
  const [optionsModalIsOpen, setOptionsModal] = useState(false);
  const [isDetailsModalOpen, setDetailsModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();


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
    <div className="relative w-[97%] min-h-2 px-2 py-1 text-primary bg-backgroundColor/25 border border-primary">
      <div onClick={() => setDetailsModal(true)} className='flex w-full hover:cursor-pointer items-start text-primary mr-28'>
        <div className='flex pb-2 w-full justify-between items-start text-primary'>
          <div className='relative w-[60px] h-[70px] md:w-[100px] md:h-[120px]'>

          </div>
          <h2 className={` text-lg`}>{collection.collectionName}</h2>
        </div>
      </div>
      {/* <ProductModal
        product={product}
        setProducts={setProducts}
        setDetailsModal={setDetailsModal}
        isDetailsModalOpen={isDetailsModalOpen}/> */}
    </div>
  );
};

export default CollectionComponent;