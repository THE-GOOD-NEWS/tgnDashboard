"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IFavorite } from "@/app/models/favoritesModel";
import { toast } from "react-hot-toast";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import FavoritesModal from "@/components/FavoritesModal";

interface Favorite {
  _id: string;
  title: string;
  image: string;
  link: string;
  clickCount: number;
  category: string;
  subCategory: string;
  brand: string;
  price: number;
  maxPrice: number;
}

export default function AdminFavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFavorite, setCurrentFavorite] = useState<Favorite | undefined>(
    undefined,
  );
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("none");
  const router = useRouter();

  // Fetch favorites
  const fetchFavorites = async () => {
    try {
      const response = await fetch("/api/favorites");
      const data = await response.json();
      setFavorites(data);
      setFilteredFavorites(data);

      // Extract unique categories, subcategories, and brands
      const uniqueCategories = [
        ...new Set(data.map((item: Favorite) => item.category)),
      ] as string[];
      const uniqueSubCategories = [
        ...new Set(data.map((item: Favorite) => item.subCategory)),
      ] as string[];
      const uniqueBrands = [
        ...new Set(data.map((item: Favorite) => item.brand).filter(Boolean)),
      ] as string[];

      setCategories(uniqueCategories);
      setSubCategories(uniqueSubCategories);
      setBrands(uniqueBrands);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Apply filters and sorting when states change
  useEffect(() => {
    if (!favorites.length) return;

    let result = [...favorites];

    // Apply filters
    if (selectedCategory) {
      result = result.filter((item) => item.category === selectedCategory);
    }

    if (selectedSubCategory) {
      result = result.filter(
        (item) => item.subCategory === selectedSubCategory,
      );
    }

    if (selectedBrand) {
      result = result.filter((item) => item.brand === selectedBrand);
    }

    // Apply sorting
    if (sortBy !== "none") {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case "clicks_asc":
            return a.clickCount - b.clickCount;
          case "clicks_desc":
            return b.clickCount - a.clickCount;
          case "price_asc":
            return a.price - b.price;
          case "price_desc":
            return b.price - a.price;
          default:
            return 0;
        }
      });
    }

    setFilteredFavorites(result);
  }, [favorites, selectedCategory, selectedSubCategory, selectedBrand, sortBy]);

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedBrand("");
    setSortBy("none");
  };

  // This function is no longer needed as we're using the modal component

  // Handle form submission
  const handleSubmit = async (data: {
    _id?: string;
    title: string;
    image: string;
    link: string;
    category: string;
    subCategory: string;
    price: number;
    maxPrice: number;
  }) => {
    try {
      const isEditing = !!data._id;
      const url = isEditing ? `/api/favorites/${data._id}` : "/api/favorites";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save favorite");
      }

      // Close modal and refresh data
      setIsModalOpen(false);
      fetchFavorites();
      toast.success(isEditing ? "Favorite updated!" : "Favorite added!");
    } catch (error) {
      console.error("Error saving favorite:", error);
      toast.error("Failed to save favorite");
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this favorite?")) {
      return;
    }

    try {
      const response = await fetch(`/api/favorites/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete favorite");
      }

      fetchFavorites();
      toast.success("Favorite deleted!");
    } catch (error) {
      console.error("Error deleting favorite:", error);
      toast.error("Failed to delete favorite");
    }
  };

  return (
    <DefaultLayout>
      <div className="container mx-auto px-4 py-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <h1 className="text-2xl font-bold">Favorites</h1>
          </div>
          <button
            onClick={() => {
              setCurrentFavorite(undefined);
              setIsModalOpen(true);
            }}
            className="rounded-md bg-primary px-4 py-2 text-white transition-colors hover:bg-secondary"
          >
            Add New Favorite
          </button>
        </div>

        {/* Filter Section */}
        <div className=" mb-6 rounded-lg bg-white p-4 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button
              onClick={resetFilters}
              className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
            >
              Reset Filters
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {/* Category Filter */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Filter */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Subcategory
              </label>
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">All Subcategories</option>
                {subCategories.map((subCategory) => (
                  <option key={subCategory} value={subCategory}>
                    {subCategory}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="none">Default</option>
                <option value="clicks_asc">Clicks (Low to High)</option>
                <option value="clicks_desc">Clicks (High to Low)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
              </select>
            </div>
          </div>
        </div>
        {/* Favorites List */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
            </div>
          ) : filteredFavorites.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xl text-gray-600">No favorites found</p>
              {favorites.length > 0 && (
                <p className="mt-2 text-gray-500">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="mb-2 text-sm text-gray-500">
                Showing {filteredFavorites.length} of {favorites.length}{" "}
                favorites
              </div>
              <table className="min-w-full overflow-hidden rounded-lg border bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Image</th>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Subcategory</th>
                    <th className="px-4 py-3 text-left">Brand</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-left">Max Price</th>
                    <th className="px-4 py-3 text-left">Clicks</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFavorites.map((favorite) => (
                    <tr key={favorite._id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="relative h-16 w-16">
                          <Image
                            src={favorite.image}
                            alt={favorite.title}
                            fill
                            className="rounded object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">{favorite.title}</td>
                      <td className="px-4 py-3">{favorite.category}</td>
                      <td className="px-4 py-3">{favorite.subCategory}</td>
                      <td className="px-4 py-3">{favorite.brand || "-"}</td>
                      <td className="px-4 py-3">
                        LE{favorite.price?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-4 py-3">{favorite.maxPrice}</td>
                      <td className="px-4 py-3">{favorite.clickCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCurrentFavorite(favorite);
                              setIsModalOpen(true);
                            }}
                            className="rounded bg-yellow-500 px-3 py-1 text-white transition-colors hover:bg-yellow-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(favorite._id)}
                            className="rounded bg-red-500 px-3 py-1 text-white transition-colors hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Favorites Modal */}
      <FavoritesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={currentFavorite}
        categories={categories}
        subCategories={subCategories}
      />
    </DefaultLayout>
  );
}
