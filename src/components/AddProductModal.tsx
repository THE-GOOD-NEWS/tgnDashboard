"use client";

import {
  AddProductType,
  Category,
  Product,
  SubCategory,
} from "@/interfaces/interfaces";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Image from "next/image";
import ProductVariant from "./ProductVariant";
import CheckboxOne from "./Checkboxes/CheckboxOne";

const AddProductModal = ({
  isModalOpen,
  setModalOpen,
  fetchProducts,
}: {
  isModalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fetchProducts: () => Promise<void>;
}) => {
  const updateVariant = async (index: number, field: string, value: any) => {
    const updatedVariations = [...productState.variations];
    updatedVariations[index] = {
      ...updatedVariations[index],
      [field]: value,
    };
    setProduct((prev) => ({ ...prev, variations: updatedVariations }));
  };
  // testtest test
  const [productState, setProduct] = useState<AddProductType>({
    title: "",
    description: "",
    price: { local: 0 ,global:0},
    comparedPrice: 0,
    variations: [],
    subCategoryID: {
      _id: "",
      categoryID: {} as Category,
      description: "",
      subCategoryName: "",
    },
    season: "all",
    productDimensions: [],
    productDetails: [],
    productCare: [],
    featured: false,
    ratings: 0,
  });

  const [errors, setErrors] = useState<any>({}); // For validation errors
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  // Validation function
  const validate = () => {
    const newErrors: any = {};
    if (!productState.title) newErrors.title = "Title is required";
    if (!productState.description)
      newErrors.description = "Description is required";
    if (productState.price.local <= 0)
      newErrors.localPrice = "Local price must be greater than 0";
    if (productState.variations.length === 0)
      newErrors.variations = "At least one variation is required";
    if (!productState.subCategoryID)
      newErrors.subCategory = "Subcategory is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios("/api/categories");
        if (res.status === 200) {
          setCategories(res.data.data);
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
    setProduct((prev) => ({ ...prev, subCategoryID: {} as SubCategory }));
  };

  // Create Product Function
  const addProduct = async () => {
    if (!validate()) return; // If validation fails, do not submit

    try {
      const res = await axios.post("/api/products", productState);
      if (res.status === 200) {
        Swal.fire({
          background: "#FFFFF",
          color: "black",
          toast: false,
          iconColor: "#473728",
          position: "bottom-right",
          text: "PRODUCT HAS BEEN ADDED",
          showConfirmButton: false,
          timer: 2000,
          customClass: {
            popup: "no-rounded-corners small-popup",
          },
        });
        await fetchProducts();
        setModalOpen(false); // Close modal on success
      }
    } catch (error) {
      console.error("Error adding product:", error);
      Swal.fire({
        background: "#FFFFF",
        color: "black",
        toast: false,
        iconColor: "#473728",
        position: "bottom-right",
        text: "ERROR! Product could not be added.",
        showConfirmButton: false,
        timer: 2000,
        customClass: {
          popup: "no-rounded-corners small-popup",
        },
      });
    }
  };

  // Update product fields
  const updateField = (field: string, value: any) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  // Update the variant structure when adding a new variant
  const addNewVariant = () => {
    updateField("variations", [
      ...productState.variations,
      {
        name: "",
        attributeName: "",
        attributes: [],
        images: [],
      },
    ]);
  };

  // Add this function to handle variant deletion
  const deleteVariant = (index: number) => {
    const updatedVariations = productState.variations.filter((_, i) => i !== index);
    setProduct((prev) => ({ ...prev, variations: updatedVariations }));
  };

  return (
    isModalOpen && (
      <div
        onClick={() => setModalOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 lg:pl-72.5"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="max-h-[90vh] w-[90%] overflow-y-scroll bg-white p-6 text-center shadow-lg max-lg:mt-16"
        >
          <h2 className="mb-4 text-lg font-bold">ADD PRODUCT</h2>

          {/* Product Info */}
          <div className="space-y-2 text-left">
            {/* Title */}
            <div>
              <label className="block font-semibold">Title:</label>
              <input
                type="text"
                value={productState.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full border p-2"
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold">Description:</label>
              <textarea
                value={productState.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="w-full border p-2"
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <label className="block font-semibold">Featured:</label>
            <input
              type="checkbox"
              checked={productState.featured}
              onChange={(e) => updateField("featured", e.target.checked)}
              className="border p-2"
            />
            {errors.featured && (
              <p className="text-sm text-red-500">{errors.featured}</p>
            )}

            {/* Category and Subcategory */}
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
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold">Subcategory:</label>
              <select
                value={productState.subCategoryID._id}
                onChange={(e) => updateField("subCategoryID", e.target.value)}
                className="w-full border p-2"
                disabled={!selectedCategory}
              >
                <option value="">Select a subcategory</option>
                {subCategories.map((subCategory, index) => (
                  <option key={index} value={subCategory._id}>
                    {subCategory.subCategoryName}
                  </option>
                ))}
              </select>
              {errors.subCategory && (
                <p className="text-sm text-red-500">{errors.subCategory}</p>
              )}
            </div>

            {/* collections */}
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
                    onChange={(e) => updateField("season", e.target.value)}
                  ></input>
                </div>
                <div className="flex gap-2">
                  <label className="block font-semibold">Winter</label>
                  <input
                    type="radio"
                    name="season"
                    checked={productState.season === "winter"}
                    value="winter"
                    onChange={(e) => updateField("season", e.target.value)}
                  ></input>
                </div>
                <div className="flex gap-2">
                  <label className="block font-semibold">All</label>
                  <input
                    type="radio"
                    name="season"
                    checked={productState.season === "all"}
                    value="all"
                    onChange={(e) => updateField("season", e.target.value)}
                  ></input>
                </div>
              </div>

              {errors.collection && (
                <p className="text-sm text-red-500">{errors.collection}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block font-semibold">Price :</label>
              <input
                type="number"
                value={productState.price.local}
                onChange={(e) =>
                  updateField("price", {
                    ...productState.price,
                    local: parseFloat(e.target.value),
                  })
                }
                className="w-full border p-2"
              />
              {errors.localPrice && (
                <p className="text-sm text-red-500">{errors.localPrice}</p>
              )}
            </div>

            {/* Compare Price */}
            <div>
              <label className="block font-semibold">Compare Price:</label>
              <input
                type="number"
                value={productState.comparedPrice}
                onChange={(e) =>
                  updateField("comparedPrice", parseFloat(e.target.value))
                }
                className="w-full border p-2"
              />
            </div>

            {/* Product Variants */}
            <div>
              <label className="block font-semibold">Product Variants:</label>
              {productState.variations.map((variant, index) => (
                <ProductVariant
                  key={index}
                  index={index}
                  product={{ ...productState, _id: "" }}
                  variant={variant}
                  updateVariant={updateVariant}
                  onVariantChange={updateVariant}
                  onDeleteVariant={deleteVariant}
                />
              ))}
              {errors.variations && (
                <p className="text-sm text-red-500">{errors.variations}</p>
              )}
              <button
                onClick={() =>
                  updateField("variations", [
                    ...productState.variations,
                    {
                      name: "",
                      attributeName: "",
                      attributes: [],
                      images: [],
                    },
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
              {productState.productDetails.map((detail, index) => (
                <div key={index} className="mb-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={detail}
                    onChange={(e) => {
                      const newDetails = [...productState.productDetails];
                      newDetails[index] = e.target.value;
                      updateField("productDetails", newDetails);
                    }}
                    className="w-full border p-2"
                  />
                  <span
                    className="cursor-pointer text-red-500"
                    onClick={() => {
                      const newDetails = productState.productDetails.filter(
                        (_, i) => i !== index,
                      );
                      updateField("productDetails", newDetails);
                    }}
                  >
                    &#10006;
                  </span>
                </div>
              ))}
              <button
                onClick={() =>
                  updateField("productDetails", [
                    ...productState.productDetails,
                    "",
                  ])
                }
                className="px-4 py-2 text-secondary underline"
              >
                Add More
              </button>
            </div>

            {/* Product Care */}
            {/* <div>
  <label className="block font-semibold">Product Care:</label>
  {productState.productCare.map((care, index) => (
    <div key={index} className="flex items-center gap-2 mb-2">
      <input
        type="text"
        value={care}
        onChange={(e) => {
          const newCare = [...productState.productCare];
          newCare[index] = e.target.value;
          updateField("productCare", newCare);
        }}
        className="border p-2 w-full"
      />
      <span 
        className="cursor-pointer text-red-500" 
        onClick={() => {
          const newCare = productState.productCare.filter((_, i) => i !== index);
          updateField("productCare", newCare);
        }}
      >
        &#10006;
      </span>
    </div>
  ))}
  <button 
    onClick={() => updateField("productCare", [...productState.productCare, ""])} 
    className="underline text-primary px-4 py-2"
  >
    Add More
  </button>
</div> */}
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-around">
            <button
              className="border-[1px] rounded-2xl bg-secondary px-4 py-2 text-creamey"
              onClick={addProduct}
            >
              Add Product
            </button>
            <button
              className="border-[1px] border-secondary rounded-2xl px-4 py-2 text-secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default AddProductModal;
