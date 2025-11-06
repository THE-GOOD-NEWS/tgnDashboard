import React, { useState } from 'react';
import axios from 'axios';
import { Newsletters } from '@/interfaces/interfaces';

interface Props {
  type: 'edit' | 'delete' | 'add';
  newSletter: Newsletters;
  closeModal: () => void;
  refreshNewsletters: () => void;
}

const NewSlettersModal = ({ type, newSletter, closeModal, refreshNewsletters }: Props) => {
  const [email, setName] = useState(newSletter.email);
  // const [number, setNumber] = useState(newSletter.number);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`/api/newSletters?newSletterID=${newSletter._id}`, {"email": email });
      refreshNewsletters();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
const addNewNewsletters =async()=>{
    setLoading(true);
    try {
      await axios.post(`/api/newSletters`, { "email": email });
      refreshNewsletters();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  
}
  const handleDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`/api/newSletters/`,{
        data: { newSletterID: newSletter._id },
      });
      refreshNewsletters();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">
          {type === 'edit' ? 'Edit Newsletters' :type==='add'?'Add Newsletter': 'Delete Newsletters'}
        </h2>
        {type === 'edit' ? (
          <>
            <input
              type="text"
              value={email}
              onChange={(e) => setName(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <button onClick={handleSave} disabled={loading} className="bg-primary text-white px-4 py-2 rounded mr-2">
              Save
            </button>
          </>
        ) :type==='add'?    
        <>
        <input
          type="text"
          value={email}
          onChange={(e) => setName(e.target.value)}
          className="w-full border px-3 py-2 rounded mb-4"
        />
                    {/* <input
              type="text"
              value={}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            /> */}
        <button onClick={addNewNewsletters} disabled={loading} className="bg-primary text-white px-4 py-2 rounded mr-2">
          Add
        </button>
      </> :(
          <>
            <p>Are you sure you want to delete <strong>{newSletter.email}</strong>?</p>
            <button onClick={handleDelete} disabled={loading} className="bg-red-600 text-white px-4 py-2 rounded mt-4">
              Delete
            </button>
          </>
        )}
        <button onClick={closeModal} className="ml-2 mt-4 text-gray-600 underline">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default NewSlettersModal;
