"use client";
import { Ipackage } from "@/interfaces/interfaces";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { CgDetailsMore } from "react-icons/cg";
import Swal from "sweetalert2";
import Image from "next/image";
import { thirdFont } from "@/app/lib/fonts";
import PackageModal from "./PackageModal";
import { FaImages } from "react-icons/fa";
import { IoCardOutline } from "react-icons/io5";

interface PackageComponentProps {
  package: Ipackage & { _id: string };
  setPackages: React.Dispatch<React.SetStateAction<(Ipackage & { _id: string })[]>>;
}

const PackageComponent = ({ package: packageItem, setPackages }: PackageComponentProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [optionsModalIsOpen, setOptionsModal] = useState(false);
  const [isDetailsModalOpen, setDetailsModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const deletePackage = async () => {
    try {
      const result = await Swal.fire({
        background:"#FBF3E0",
        title: "Are you sure?",
        iconColor:"#FFB6C7",
        color:"#D32333",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#12665C",
        cancelButtonColor: "#D32333",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const response = await axios.delete(`/api/packages?packageID=${packageItem._id}`);
        
        if (response.status === 200) {
          setPackages((prevPackages) =>
            prevPackages.filter((p) => p._id !== packageItem._id)
          );

          Swal.fire({
            background: '#FFFFF',
            color: 'black',
            toast: false,
            iconColor: '#473728',
            position: 'bottom-right',
            text: 'PACKAGE DELETED SUCCESSFULLY',
            showConfirmButton: false,
            timer: 2000,
            customClass: {
              popup: 'no-rounded-corners small-popup',
            },
          });
        }
      }
    } catch (error) {
      console.error("Error deleting package:", error);
      Swal.fire({
        background: '#FFFFF',
        color: 'black',
        toast: false,
        iconColor: '#473728',
        position: 'bottom-right',
        text: 'DELETE FAILED',
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
    <div className="relative rounded-2xl w-[97%] bg-secondary min-h-2 px-2 py-1 text-creamey bg-backgroundColor/25">
      <div className='flex w-full hover:cursor-pointer items-start text-primary mr-28'>
        <div className='flex pb-2 w-full justify-between items-start text-creamey'>
          <div className='relative w-[60px] h-[70px] md:w-[100px] md:h-[120px]'>
            <Image 
              className="rounded-2xl" 
              fill 
              alt={packageItem.name} 
              src={packageItem.imgUrl}
            />
          </div>
          <div className="flex flex-col">
            <h2 className={`${thirdFont.className} text-xl xl:text-2xl`}>
              {packageItem.name}
            </h2>
            <p className={`${thirdFont.className} text-sm xl:text-base text-creamey/90`}>
              Duration: {packageItem.duration}
            </p>
            <p className={`${thirdFont.className} text-sm xl:text-base text-creamey/90`}>
              Items: {packageItem.items.length}
            </p>
            <div className="flex items-center gap-2">
              {packageItem.images && packageItem.images.length > 0 && (
                <div className="flex items-center">
                  <FaImages className="text-creamey/90 mr-1" />
                  <span className={`${thirdFont.className} text-xs xl:text-sm text-creamey/90`}>
                    {packageItem.images.length}
                  </span>
                </div>
              )}
              {packageItem.cards && packageItem.cards.length > 0 && (
                <div className="flex items-center ml-2">
                  <IoCardOutline className="text-creamey/90 mr-1" />
                  <span className={`${thirdFont.className} text-xs xl:text-sm text-creamey/90`}>
                    {packageItem.cards.length}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <p className={`${thirdFont.className} text-xl xl:text-2xl`}>
              {`${packageItem.price} LE`}
            </p>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOptionsModal(!optionsModalIsOpen);
                }}
                className="p-2 hover:cursor-pointer rounded-full"
              >
                <CgDetailsMore className="w-5 h-5" />
              </button>
              
              {optionsModalIsOpen && (
                <div
                  ref={modalRef}
                  className="absolute right-0 top-full mt-2 w-48 bg-creamey rounded-md shadow-lg z-50 border"
                >
                  <div className="py-1">
                                         <button
                       onClick={(e) => {
                         e.stopPropagation();
                         setOptionsModal(false);
                         setDetailsModal(true)
                         // Trigger edit functionality - this will need to be passed from parent
                         console.log('Edit package:', packageItem._id);
                       }}
                       className="block w-full text-left px-4 py-2 text-sm text-primary/90 hover:underline"
                     >
                       View Details
                     </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOptionsModal(false);
                        deletePackage();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-primary/90 hover:underline"
                    >
                      Delete Package
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Package Details Modal */}
      {isDetailsModalOpen && (
        <PackageModal
          isOpen={isDetailsModalOpen}
          onClose={() => setDetailsModal(false)}
          package={packageItem}
          setPackages={setPackages}
        />
      )}
    </div>
  );
};

export default PackageComponent;