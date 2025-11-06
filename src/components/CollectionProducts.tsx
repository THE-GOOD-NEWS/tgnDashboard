'use client'
import { Collection, Product } from '@/interfaces/interfaces'
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import Image from "next/image"

const CollectionProducts = ({collection,collectionProducts, setCollectionProducts}:{collection:Collection,
    collectionProducts:string[]
    ,setCollectionProducts:React.Dispatch<React.SetStateAction<string[]>>}) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const handleCheckboxChange = (productId: string) => {
        setCollectionProducts(prev => {
            const newProducts = prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId];
            console.log('Updated products:', newProducts); // Debug log
            return [...newProducts]; // Ensure new array reference
        });
    }

    useEffect(() => {
        const fetchproducts = async () => {
            try {
                const res = await axios.get(`/api/products?all=true&search=${searchQuery}`);
                setProducts(res.data.data);
            } catch (error) {
                console.error("Error fetching products:", error);
            }
        };
        fetchproducts();
    }, [searchQuery]);

    return (
        <div className='flex gap-2 flex-col w-full'>
            <div className='flex justify-between my-4 items-center'>
                <h3>Collection Products</h3>
                <input
                    type="text"
                    placeholder="Search here..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
            </div>
            {products.map((product) => (
                <div key={product._id} className='flex gap-2 w-full items-center'>
                    <input 
                        type='checkbox' 
                        id={`product-${product._id}`}
                        checked={collectionProducts.includes(product._id)}
                        onChange={() => handleCheckboxChange(product._id)}
                    />
                    <Image 
                        src={product.variations[0].images[0].url} 
                        alt={product.title} 
                        width={50} 
                        height={80} 
                    />
                    <h3>{product.title}</h3>
                </div>
            ))}
        </div>
    )
}

export default CollectionProducts