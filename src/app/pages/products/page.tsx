"use client";
import AddProductModal from "@/components/AddProductModal";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import ProductComponent from "@/components/ProductsComponent";
import { Product } from "@/interfaces/interfaces";
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addModalisOpen, setAddModalisOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      // const res = await axios.get(`/api/learn`);
      const res = await axios.get(
        `/api/products?page=${page}&search=${searchQuery}`,
      );
      console.log("formatedData" + res.data.data[0].subCategoryID._id);
      console.log(
        "formatedData" + res.data.data[0].subCategoryID.subCategoryName,
      );
      setProducts(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    // Only reset to first page when search query changes
    if (searchQuery) {
      setPage(1);
    }
    fetchProducts();
  }, [fetchProducts, searchQuery]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <DefaultLayout>
      <div className="flex  h-auto min-h-screen w-full flex-col items-center justify-between gap-4 overflow-hidden bg-backgroundColor px-1  py-2 md:px-2 md:py-4">
        <div className="flex h-full w-full flex-col items-center space-y-4">
          <div className="flex w-[97%] flex-col-reverse items-center justify-between gap-4 md:flex-row">
            <div className="w-full md:w-64">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex w-full justify-end text-primary underline md:w-auto">
              <button
                className="hover:cursor-pointer rounded-2xl px-4 bg-primary text-creamey py-2 text-sm"
                onClick={() => setAddModalisOpen(true)}
              >
                ADD NEW PRODUCT
              </button>
            </div>
          </div>
          {isLoading ? (
            <div>Loading...</div>
          ) : products.length > 0 ? (
            products.map((product) => (
              <ProductComponent
                key={product._id}
                setProducts={setProducts}
                product={product}
              />
            ))
          ) : (
            <h1>No products found</h1>
          )}
        </div>
        <AddProductModal
          isModalOpen={addModalisOpen}
          setModalOpen={setAddModalisOpen}
          fetchProducts={fetchProducts}
        />

        {/* Pagination Controls */}
        <div className="mt-4 flex items-center gap-4">
          <button
            className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || isLoading}
          >
            Previous
          </button>

          <span className="text-lg">
            Page {page} of {totalPages}
          </span>

          <button
            className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages || isLoading}
          >
            Next
          </button>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ProductsPage;
