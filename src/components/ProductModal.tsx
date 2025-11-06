import {
  Category,
  Collection,
  Product,
  SubCategory,
} from "@/interfaces/interfaces";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Image from "next/image";
import ProductVariant from "./ProductVariant";
import DeleteProductModal from "./DeleteProductModal";

const ProductModal = ({
  isDetailsModalOpen,
  product,
  setProducts,
  setDetailsModal,
}: {
  isDetailsModalOpen: boolean;
  product: Product;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setDetailsModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [productState, setProduct] = useState<Product>(product);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");

  // Reset state when modal opens with a new product
  useEffect(() => {
    if (isDetailsModalOpen) {
      console.log("Modal opened, product:", product);
      console.log("Product subcategory:", product.subCategoryID);
      
      // setSelectedCategory(product.subCategoryID.categoryID._id);
      setSelectedSubCategory(product.subCategoryID?product.subCategoryID._id:"");
      setProduct(product);
    }
  }, [isDetailsModalOpen, product]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios("/api/categories");
        if (res.status === 200) {
          setCategories(res.data.data);
          console.log("Categories loaded:", res.data.data);
          console.log("Current selected category:", selectedCategory);
          
          // Set the selected category and fetch subcategories
          const categoryId = product.subCategoryID?.categoryID?._id;
          console.log("Setting category to:", categoryId);
          setSelectedCategory(categoryId);
          await fetchSubCategories(categoryId);
          setSelectedSubCategory(product.subCategoryID?product.subCategoryID._id:"");
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  const fetchSubCategories = async (categoryId: string) => {
    try {
      const res = await axios(`/api/subcategories?categoryID=${categoryId}`);
      if (res.status === 200) {
        setSubCategories(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    await fetchSubCategories(categoryId);
    // Reset subcategory when category changes
    setProduct((prev) => ({
      ...prev,
      subCategoryID: {
        _id: "",
        categoryID: {
          _id: "",
          categoryName: "",
          description: "",
          imageURL: "",
        },
        description: "",
        subCategoryName: "",
      },
    }));
  };

  const updateFeild = async (field: string, value: any) => {
    if (field === "subCategoryID") {
      // Find the selected subcategory object from the subCategories array
      const selectedSubCategory = subCategories.find(sub => sub._id === value);
      if (selectedSubCategory) {
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            p._id === product._id ? { ...p, [field]: selectedSubCategory } : p,
          ),
        );
        setProduct((prev) => ({ ...prev, [field]: selectedSubCategory }));
      }
    } else {
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === product._id ? { ...p, [field]: value } : p,
        ),
      );
      setProduct((prev) => ({ ...prev, [field]: value }));
    }
  };
  // Update Product Function
  const updateProduct = async () => {
    console.log("clicked");
    try {
      // Update local state optimistically

      // Send update request to backend
      console.log("update" + productState.productDetails);
      const updatedProduct = await axios.put(
        `/api/products?productID=${product._id}`,
        productState,
      );

      // Update state with the response from the backend
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === updatedProduct.data._id ? updatedProduct.data : p,
        ),
      );

      Swal.fire({
        background: "#FFFFF",
        color: "black",
        toast: false,
        iconColor: "#473728",
        position: "bottom-right",
        text: "PRODUCT HAS BEEN UPDATED",
        showConfirmButton: false,
        timer: 2000,
        customClass: {
          popup: "no-rounded-corners small-popup",
        },
      });
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  // Update Variant Function
  const updateVariant = async (index: number, field: string, value: any) => {
    // Create a copy of the product with the updated variant
    const updatedVariations = [...product.variations];
    updatedVariations[index] = {
      ...updatedVariations[index],
      [field]: value,
    };
    setProduct((prev) => ({ ...prev, variations: updatedVariations }));

    // Update local state optimistically
    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p._id === product._id ? { ...p, variations: updatedVariations } : p,
      ),
    );
  };

  // Add this function to handle variant deletion
  const deleteVariant = (index: number) => {
    const updatedVariations = product.variations.filter((_, i) => i !== index);
    setProduct((prev) => ({ ...prev, variations: updatedVariations }));
    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p._id === product._id ? { ...p, variations: updatedVariations } : p
      )
    );
  };

  return (
    isDetailsModalOpen && (
      <div
        onClick={() => setDetailsModal(false)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 lg:pl-72.5"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="max-h-[90vh] w-[90%] overflow-y-scroll rounded-2xl  bg-white p-6 text-center text-gray-600 shadow-lg max-lg:mt-16"
        >
          <h2 className="mb-4 text-lg font-bold">PRODUCT DETAILS</h2>

          {/* Product Info */}
          <div className="space-y-2 text-left">
            {/* Product ID */}
            <div>
              <label className="block font-semibold">Product ID:</label>
              <input
                type="text"
                value={product._id}
                disabled
                className="w-full border p-2"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block font-semibold">Title:</label>
              <input
                type="text"
                value={product.title}
                onChange={(e) => updateFeild("title", e.target.value)}
                className="w-full border p-2"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold">Description:</label>
              <textarea
                value={product.description}
                onChange={(e) => updateFeild("description", e.target.value)}
                className="w-full border p-2"
              />
            </div>
            <div className="flex gap-2">
              <label className="block font-semibold">Featured:</label>
              <input
                type="checkbox"
                checked={productState.featured}
                onChange={(e) => updateFeild("featured", e.target.checked)}
                className="border p-2"
              />
            </div>
            {/* collections */}
            <div>
              <label className="block font-semibold">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full border p-2"
              >
                <option value="">Select a category</option>
                {categories.map((category, index) => (
                  <option key={index} value={category._id}>
                    {category.categoryName}
                  </option>
                ))}
              </select>

            </div>

            <div>
              <label className="block font-semibold">Subcategory:</label>
              <select
                value={productState.subCategoryID? productState.subCategoryID._id:""}
                onChange={(e) => updateFeild("subCategoryID", e.target.value)}
                className="w-full border p-2"
              >
                <option value="">Select a subcategory</option>
                {subCategories.map((subCategory, index) => (
                  <option key={index} value={subCategory._id}>
                    {subCategory.subCategoryName}
                  </option>
                ))}
              </select>

            </div>
            <div>
              <label className="block font-semibold">Season:</label>
              <div className="flex gap-4">
                <div className="flex gap-2">
                  <label className="block font-semibold">Summer</label>
                  <input
                    type="radio"
                    name="season"
                    value="summer"
                    checked={productState.season === "summer"}
                    onChange={(e) => updateFeild("season", e.target.value)}
                  ></input>
                </div>
                <div className="flex gap-2">
                  <label className="block font-semibold">Winter</label>
                  <input
                    type="radio"
                    name="season"
                    checked={productState.season === "winter"}
                    value="winter"
                    onChange={(e) => updateFeild("season", e.target.value)}
                  ></input>
                </div>
                <div className="flex gap-2">
                  <label className="block font-semibold">All</label>
                  <input
                    type="radio"
                    name="season"
                    checked={productState.season === "all"}
                    value="all"
                    onChange={(e) => updateFeild("season", e.target.value)}
                  ></input>
                </div>
              </div>
            </div>
            {/* Price */}
            <div>
              <label className="block font-semibold">Price :</label>
              <input
                type="number"
                value={product.price.local}
                onChange={(e) => {
                  const newPrice = {
                    ...product.price,
                    local: parseFloat(e.target.value),
                  };
                  updateFeild("price", newPrice);
                }}
                className="w-full border p-2"
              />
            </div>

            {/* Compare Price */}
            <div>
              <label className="block font-semibold">Compare Price:</label>
              <input
                type="number"
                value={product.comparedPrice || ""}
                onChange={(e) => {
                  updateFeild("comparedPrice", parseFloat(e.target.value));
                }}
                className="w-full border p-2"
              />
            </div>

            {/* Variations */}
            <div>
              <label className="block font-semibold">Product Variants:</label>
              {product.variations.map((variant, index) => (
                <ProductVariant
                  key={index}
                  index={index}
                  product={product}
                  variant={variant}
                  updateVariant={updateVariant}
                  onVariantChange={updateVariant}
                  onDeleteVariant={deleteVariant}
                />
              ))}
              <button
                onClick={() =>
                  updateFeild("variations", [
                    ...product.variations,
                    { color: "", stock: 0, featured: false, images: [] },
                  ])
                }
                className="px-4 py-2 text-accent underline"
              >
                Add Variant
              </button>
            </div>

            {/* Product Details */}
            <div>
              <label className="block font-semibold">Product Details:</label>
              {product.productDetails.map((detail, index) => (
                <div key={index} className="mb-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={detail}
                    onChange={(e) => {
                      const newDetails = [...product.productDetails];
                      newDetails[index] = e.target.value;
                      updateFeild("productDetails", newDetails);
                    }}
                    className="w-full border p-2"
                  />
                  <span
                    className="cursor-pointer text-red-500"
                    onClick={() => {
                      const newDetails = product.productDetails.filter(
                        (_, i) => i !== index,
                      );
                      updateFeild("productDetails", newDetails);
                    }}
                  >
                    &#10006;
                  </span>
                </div>
              ))}
              <button
                onClick={() =>
                  updateFeild("productDetails", [...product.productDetails, ""])
                }
                className="px-4 py-2 text-accent underline"
              >
                Add More
              </button>
            </div>

            {/* Product Care */}
            {/* <div>
  <label className="block font-semibold">Product Care:</label>
  {product.productCare.map((care, index) => (
    <div key={index} className="flex items-center gap-2 mb-2">
      <input
        type="text"
        value={care}
        onChange={(e) => {
          const newCare = [...product.productCare];
          newCare[index] = e.target.value;
          updateFeild("productCare", newCare);
        }}
        className="border p-2 w-full"
      />
      <span 
        className="cursor-pointer text-red-500" 
        onClick={() => {
          const newCare = product.productCare.filter((_, i) => i !== index);
          updateFeild("productCare", newCare);
        }}
      >
        &#10006;
      </span>
    </div>
  ))}
  <button 
    onClick={() => updateFeild("productCare", [...product.productCare, ""])} 
    className="underline text-primary px-4 py-2"
  >
    Add More
  </button>
</div> */}
          </div>

          {/* Buttons */}
          <div className="flex w-full justify-end">
            <h3
              className="px-4 py-2 text-primary underline hover:cursor-pointer"
              onClick={() => setDeleteModalOpen(true)}
            >
              DELETE PRODUCT
            </h3>
            <DeleteProductModal
              setBigModal={setDetailsModal}
              productID={product._id}
              isModalOpen={isDeleteModalOpen}
              setModalOpen={setDeleteModalOpen}
              setProducts={setProducts}
            />
          </div>
          <div className="mt-6 flex justify-around">
            <button
              className="rounded-2xl border-[1px] bg-accent px-4 py-2 text-white"
              onClick={updateProduct}
            >
              Update
            </button>
          </div>
        </div>
      </div>
    )
  );
};
export default ProductModal;
