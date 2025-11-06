// import { SubCollection } from '@/interfaces/interfaces'
// import React, { useState, useEffect } from 'react'
// import Image from "next/image"
// import axios from 'axios';
// import UploadCollectionImageButton from './UploadCollectionImageButton';

// const SubCollectionComponent = ({subcollection, index, setSubCollections}: {
//   subcollection: SubCollection,
//   index: number,
//   setSubCollections: React.Dispatch<React.SetStateAction<SubCollection[]>>
// }) => {
//   const [image, setImage] = useState(subcollection.imageUrl)
//   const [name, setName] = useState(subcollection.subCollectionName)
//   const [description, setDescription] = useState(subcollection.description)
// const updateImage =async(url:string)=>{
//     try{

//         const response = await axios.put(`/api/subCollections?subCollectionID=${subcollection._id}`, {
//             imageUrl: url
//           })
//           console.log(response)
//     }
//     catch(err){
//         console.error(err)
//     }
//     finally{
//     setImage(url)
//     }
//     }
//   // Update API when name, description, or image changes
//   useEffect(() => {
//     const updateSubCollection = async () => {
//       try {
//         const response = await axios.put(`/api/subCollections?subCollectionID=${subcollection._id}`, {
//           subCollectionID: subcollection._id,
//           subCollectionName: name,
//           description: description,
//           imageUrl: image
//         })
        
//         if (response.status === 200) {
//           // Update local state to reflect the successful API update
//           setSubCollections(prev => {
//             const newSubCollections = [...prev]
//             newSubCollections[index] = {
//               ...newSubCollections[index],
//               subCollectionName: name,
//               description: description,
//               imageUrl: image
//             }
//             return newSubCollections
//           })
//         }
//       } catch (error) {
//         console.error('Error updating subcollection:', error)
//       }
//     }

//     // Only trigger update if values have actually changed
//     if (name !== subcollection.subCollectionName || 
//         description !== subcollection.description || 
//         image !== subcollection.imageUrl) {
//       updateSubCollection()
//     }
//   }, [name, description, image])

//   async function deleteSubCollectionImage(value: string) {
//     try {
//       const res = await axios.delete("/api/uploadthing", { data: { url: value } });
//       if (res.status === 200) {
//         setImage('')
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   }

//   const handleDelete = async () => {
//     try {
//       const res = await axios.delete(`/api/subCollections?subCollectionID=${subcollection._id}`);
//       if (res.status === 200) {
//         setSubCollections(prev => 
//           prev.filter(sc => sc._id !== subcollection._id)
//         );
//       }
//     } catch (error) {
//       console.error('Error deleting subcollection:', error)
//     }
//   };

//   return (
//     <div className='flex gap-4 my-2 items-start'>
//       <div className='flex border rounded-md border-gray-300 p-2 gap-2 w-full h-full justify-start items-start' key={index}>
//         <div className='flex w-full gap-2 flex-col'>
//           <label>Name</label>
//           <input 
//             type="text" 
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="w-full border px-3 py-2 rounded mb-4" 
//           />
//           <label>Description</label>
//           <textarea 
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             className="w-full border px-3 py-2 rounded mb-4"
//           />
//         </div>
//           <div className='flex flex-col gap-2'>
//         {image !== '' || "" ? (
//             <div className='relative w-full h-36'>
//               <span
//                 onClick={() => deleteSubCollectionImage(image)}
//                 className="rounded-sm z-30 w-4 h-4 bg-red-500 absolute top-2 text-center flex justify-center items-center p-2 cursor-pointer text-white right-2"
//               >
//                 x
//               </span>
//               <Image fill alt={name} src={image}/>
//             </div>
//         ) : <div className='h-36'></div>}
//             <UploadCollectionImageButton imageUrl={image} updateImageUrl={updateImage} />
//           </div>
//       </div>  
//       <span 
//         onClick={handleDelete}
//         className="h-6 hover:cursor-pointer bg-red-600 w-6 flex justify-center text-white items-center rounded-md"
//       >
//         x
//       </span>
//     </div>
//   )
// }

// export default SubCollectionComponent