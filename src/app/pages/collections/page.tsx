'use client'

import CollectionModal from '@/components/CollectionModal';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { Collection } from '@/interfaces/interfaces';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

const CollectionsPage = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalType, setModalType] = useState<'edit' | 'delete' | 'add' | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection>({ _id: '', collectionName: '',description:"", imageURL: '', products: [] });

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await axios.get(`/api/collections`);
        setCollections(res.data);
        // setTotalPages(res.data.totalPages);
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    };
    fetchCollections();
  }, [page]);

  const openModal = (type: 'edit' | 'delete' | 'add', collection?: Collection) => {
    setModalType(type);
    setSelectedCollection(collection || { _id: '', collectionName: '',description:"", imageURL: '', products: [] });
  };

  return (
    <DefaultLayout>
      <div className="px-1 overflow-hidden md:px-2 py-2 md:py-4 w-full h-auto min-h-screen flex flex-col justify-start items-center gap-4 bg-backgroundColor">
        <div
         
          className="text-primary w-[97%] flex justify-end underline"
        >
          <h3
          className='hover:cursor-pointer'
           onClick={() => openModal('add')}
          >ADD NEW COLLECTION</h3>
        </div>

        {/* Table */}
        {collections.length > 0 ? (
          <table className="w-[97%] text-left border border-gray-300 rounded">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Collection Name</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((collection, index) => (
                <tr key={collection._id} className="hover:bg-gray-50 text-sm">
                  <td className="p-2 border">{(page - 1) * 10 + index + 1}</td>
                  <td className="p-2 border">{collection.collectionName}</td>
                  <td className="p-2 border space-x-2">
                    <button
                      onClick={() => openModal('edit', collection)}
                      className="text-blue-600 underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openModal('delete', collection)}
                      className="text-red-600 underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <h1>No collections</h1>
        )}

        {/* Pagination */}
        <div className="flex items-center gap-4 mt-4">
          <button
            className="px-4 py-2 bg-accent text-white rounded disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-lg">Page {page} of {totalPages}</span>
          <button
            className="px-4 py-2 bg-accent text-white rounded disabled:opacity-50"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>

        {/* Modal */}
        {modalType && (
          <CollectionModal
            type={modalType}
            collection={selectedCollection}
            closeModal={() => {
              setModalType(null);
            }}
            refreshCollections={() => {
              axios.get(`/api/collections`).then(res => {
                setCollections(res.data);
              });
            }}
          />
        )}
      </div>
    </DefaultLayout>
  );
};

export default CollectionsPage;
