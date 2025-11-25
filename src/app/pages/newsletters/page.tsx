"use client";

import CollectionModal from "@/components/CategoryModal";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import NewSlettersModal from "@/components/NewSlettersModal";
import { Collection, Newsletters } from "@/interfaces/interfaces";
import axios from "axios";
import React, { useEffect, useState } from "react";

const NewSlettersPage = () => {
  const [newSletters, setNewSletters] = useState<Newsletters[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalType, setModalType] = useState<"edit" | "delete" | "add" | null>(
    null,
  );
  //   const [selectedCollection, setSelectedCollection] = useState<Collection>({ _id: '', collectionName: '' });
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletters>({
    _id: "",
    email: "",
  });

  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        const res = await axios.get(`/api/newSletters?page=${page}`);
        setNewSletters(res.data.data);
        setTotalPages(res.data.totalPages);
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    };
    fetchNewsletters();
  }, [page]);

  const openModal = (
    type: "edit" | "delete" | "add",
    newSletter?: Newsletters,
  ) => {
    setModalType(type);
    setSelectedNewsletter(newSletter || { _id: "", email: "" });
  };

  return (
    <DefaultLayout>
      <div className="flex h-auto min-h-screen w-full flex-col items-center justify-start gap-4 overflow-hidden bg-backgroundColor px-1 py-2 md:px-2 md:py-4">
        <div className=" flex w-[97%] justify-end  ">
          <button
            className="rounded-2xl bg-primary px-4 py-2 text-sm text-creamey hover:cursor-pointer"
            onClick={() => openModal("add")}
          >
            Add Newsletter
          </button>
        </div>

        {/* Table */}
        {newSletters.length > 0 ? (
          <table className="w-[97%] rounded border border-gray-300 text-left">
            <thead className="bg-secondary text-sm text-white">
              <tr>
                <th className="border p-2">#</th>
                <th className="border p-2">email</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {newSletters.map((newSletter, index) => (
                <tr
                  key={index}
                  className="bg-white text-sm text-gray-600 hover:bg-gray-50"
                >
                  <td className="border p-2">{(page - 1) * 10 + index + 1}</td>
                  <td className="border p-2">{newSletter.email}</td>
                  <td className="space-x-2 border p-2">
                    <button
                      onClick={() => openModal("edit", newSletter)}
                      className="text-blue-600 underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openModal("delete", newSletter)}
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
          <h1>No Newsletters</h1>
        )}

        {/* Pagination */}
        <div className="mt-4 flex items-center gap-4">
          <button
            className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-lg">
            Page {page} of {totalPages}
          </span>
          <button
            className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>

        {/* Modal */}
        {modalType && (
          <NewSlettersModal
            type={modalType}
            newSletter={selectedNewsletter}
            closeModal={() => {
              setModalType(null);
            }}
            refreshNewsletters={() => {
              axios.get(`/api/newSletters?page=${page}`).then((res) => {
                setNewSletters(res.data.data);
              });
            }}
          />
        )}
      </div>
    </DefaultLayout>
  );
};

export default NewSlettersPage;
