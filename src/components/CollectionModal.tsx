import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Image from "next/image";
import { Collection } from '@/interfaces/interfaces';
import UploadCollectionImageButton from './UploadCollectionImageButton';
import CollectionProducts from './CollectionProducts';

interface Props {
  type: 'edit' | 'delete' | 'add';
  collection: Collection;
  closeModal: () => void;
  refreshCollections: () => void;
}

const CollectionModal = ({ type, collection, closeModal, refreshCollections }: Props) => {
  // Initialize state with collection data or empty values for 'add' type
  const [name, setName] = useState(collection?.collectionName || '');
  const [description, setDescription] = useState(collection?.description || '');
  const [image, setImage] = useState(collection?.imageURL || '');
  const [loading, setLoading] = useState(false);
const [collectionProducts, setCollectionProducts] = useState(collection?.products || [])
  const updateImage = async (url: string) => {
    try {
      if (type === 'edit') {
        const response = await axios.put(`/api/collections?collectionID=${collection._id}`, {
          imageURL: url
        });
        console.log('Image updated:', response.data);
      }
    } catch (err) {
      console.error('Error updating image:', err);
    } finally {
      setImage(url);
    }
  };

  async function deleteCollectionImage(value: string) {
    try {
      const res = await axios.delete("/api/uploadthing", { data: { url: value } });
      if (res.status === 200) {
        setImage('');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  }

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`/api/collections?collectionID=${collection._id}`, {
        collectionName: name,
        description: description,
        imageURL: image,
        products : collectionProducts
      });
      refreshCollections();
      closeModal();
    } catch (err) {
      console.error('Error updating collection:', err);
    } finally {
      setLoading(false);
    }
  };

  const addNewCollection = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/collections`, {
        collectionName: name,
        description: description,
        imageURL: image,
        products: collectionProducts
      });
      refreshCollections();
      closeModal();
    } catch (err) {
      console.error('Error adding collection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`/api/collections`, {
        data: { collectionID: collection._id },
      });
      refreshCollections();
      closeModal();
    } catch (err) {
      console.error('Error deleting collection:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      onClick={closeModal}
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white p-6 max-h-[95vh] overflow-y-scroll rounded w-full max-w-lg">
        <h2 className="text-lg font-bold mb-4">
          {type === 'edit' ? 'Edit Collection' : type === 'add' ? 'Add Collection' : 'Delete Collection'}
        </h2>
        
        {type === 'delete' ? (
          <>
            <p>Are you sure you want to delete <strong>{collection.collectionName}</strong>?</p>
            <button 
              onClick={handleDelete} 
              disabled={loading} 
              className="bg-red-600 text-white px-4 py-2 rounded mt-4">
              Delete
            </button>
          </>
        ) : (
          <>
            <label className="block mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />
            
            <label className="block mb-2">Description</label>
            <textarea 
              className="w-full border px-3 py-2 rounded mb-4"
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
            
            <div className='flex flex-col gap-2'>
              {image ? (
                <div className='relative w-[75px]  h-[100px]'>
                  <span
                    onClick={() => deleteCollectionImage(image)}
                    className="rounded-sm z-30 w-4 h-4 bg-red-500 absolute top-2 text-center flex justify-center items-center p-2 cursor-pointer text-white right-2"
                  >
                    x
                  </span>
                  <Image fill alt={name} src={image} />
                </div>
              ) : (
                <div className='h-36 border border-dashed flex items-center justify-center text-gray-400'>
                  No image selected
                </div>
              )}
              
              <UploadCollectionImageButton imageUrl={image} updateImageUrl={updateImage} />
            </div>

            <CollectionProducts collectionProducts={collectionProducts} setCollectionProducts={setCollectionProducts} collection={collection}/>

            <button 
              onClick={type === 'edit' ? handleSave : addNewCollection} 
              disabled={loading} 
              className="bg-primary text-white px-4 py-2 rounded mr-2 mt-4">
              {loading ? 'Processing...' : type === 'edit' ? 'Save Changes' : 'Add Collection'}
            </button>
          </>
        )}
        
        <button 
          onClick={closeModal} 
          className="ml-2 mt-4 text-gray-600 underline">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CollectionModal;