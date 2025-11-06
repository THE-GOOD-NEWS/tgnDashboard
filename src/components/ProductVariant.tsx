"use client";

import { Variant, Product, media, attribute } from "@/interfaces/interfaces";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import UploadProductsImagesButton from "./UploadProductImagesButton";
import axios from "axios";
import { useDrag, useDrop } from "react-dnd";

const ProductVariant = ({
  index,
  product,
  variant,
  updateVariant,
  onVariantChange,
  onDeleteVariant,
}: {
  index: number;
  product: Product;
  variant: Variant;
  updateVariant: (index: number, field: string, value: any) => Promise<void>;
  onVariantChange: (index: number, field: string, value: any) => void;
  onDeleteVariant: (index: number) => void;
}) => {
  const [imagesUrl, setImagesUrl] = useState<media[]>(variant.images || []);
  const [attributes, setAttributes] = useState<attribute[]>(variant.attributes || []);
  const ItemTypes = {
    MEDIA: "media",
  };

  useEffect(() => {
    updateVariant(index, "images", imagesUrl);
  }, [imagesUrl]);

  useEffect(() => {
    updateVariant(index, "attributes", attributes);
  }, [attributes]);

  // Handle media deletion
  async function deleteProductImage(url: string) {
    try {
      const res = await axios.delete("/api/uploadthing", { data: { url } });
      if (res.status === 200) {
        const imagesAfterDelete = imagesUrl.filter((media) => media.url !== url);
        setImagesUrl(imagesAfterDelete);
        updateVariant(index, "images", imagesAfterDelete);
      }
    } catch (err) {
      console.error("Error deleting media:", err);
    }
  }

  // Handle adding a new attribute
  const addAttribute = () => {
    setAttributes([...attributes, { name: "", stock: 0 }]);
  };

  // Handle updating an attribute
  const updateAttribute = (attrIndex: number, field: "name" | "stock", value: string | number) => {
    const updatedAttributes = attributes.map((attr, i) =>
      i === attrIndex ? { ...attr, [field]: value } : attr
    );
    setAttributes(updatedAttributes);
  };

  // Handle removing an attribute
  const removeAttribute = (attrIndex: number) => {
    setAttributes(attributes.filter((_, i) => i !== attrIndex));
  };

  // Handle drag-and-drop for media
  const moveMedia = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...imagesUrl];
    const [movedMedia] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedMedia);
    setImagesUrl(updatedImages);
    updateVariant(index, "images", updatedImages);
  };

  // Drag-and-drop media item
  const MediaItem = ({ media, index }: { media: media; index: number }) => {
    const [, drag] = useDrag({
      type: ItemTypes.MEDIA,
      item: { index },
    });

    const [, drop] = useDrop({
      accept: ItemTypes.MEDIA,
      hover: (item: { index: number }) => {
        if (item.index !== index) {
          moveMedia(item.index, index);
          item.index = index;
        }
      },
    });

    return (
      <div
        ref={(node) => {
          drag(node);
          drop(node);
        }}
        className="relative w-28 h-34 cursor-move"
      >
        <span
          onClick={() => deleteProductImage(media.url)}
          className="rounded-sm z-30 w-4 h-4 bg-red-500 absolute top-2 text-center flex justify-center items-center p-2 cursor-pointer text-white left-2"
        >
          x
        </span>
        {media.type === "image" ? (
          <Image fill alt={product.title} src={media.url} className="object-cover" />
        ) : (
          <video
            src={media.url}
            className="w-full h-full object-cover"
            controls
            muted
            playsInline
          />
        )}
      </div>
    );
  };

  return (
    <div key={index} className="border p-4 mt-4 relative">
      {/* (x) button to delete variant */}
      <button
        onClick={() => onDeleteVariant(index)}
        className="absolute top-2 right-2 z-40 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600"
        title="Delete Variant"
        type="button"
      >
        ×
      </button>
      <h3 className="font-semibold mb-4">Variant {index + 1}</h3>

      {/* Variant Name */}
      <div className="mb-4">
        <label className="block font-semibold">Variant Name:</label>
        <input
          type="text"
          value={variant.name}
          onChange={(e) => onVariantChange(index, "name", e.target.value)}
          className="border p-2 w-full"
          placeholder="e.g., Default Variant"
        />
      </div>

      {/* Attribute Name */}
      <div className="mb-4">
        <label className="block font-semibold">Attribute Name:</label>
        <input
          type="text"
          value={variant.attributeName}
          onChange={(e) => onVariantChange(index, "attributeName", e.target.value)}
          className="border p-2 w-full"
          placeholder="e.g., Color or Size"
        />
      </div>

      {/* Attributes */}
      <div className="mb-4">
        <label className="block font-semibold">Attributes:</label>
        {attributes.map((attr, attrIndex) => (
          <div key={attrIndex} className="flex items-center gap-2 mb-2">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Attribute Name"
                value={attr.name}
                onChange={(e) => updateAttribute(attrIndex, "name", e.target.value)}
                className="border p-2 flex-1"
              />
              <input
                type="number"
                placeholder="Stock"
                value={attr.stock}
                onChange={(e) => updateAttribute(attrIndex, "stock", parseInt(e.target.value) || 0)}
                className="border p-2 w-24"
              />
            </div>
            <button
              onClick={() => removeAttribute(attrIndex)}
              className="text-red-500"
            >
              ×
            </button>
          </div>
        ))}
        <button onClick={addAttribute} className="underline text-secondary px-4 py-2">
          Add Attribute
        </button>
      </div>

      {/* Media Section */}
      <div>
        <label className="block font-semibold">Media:</label>
        <div className="flex gap-2">
          <div className="flex flex-nowrap gap-2 max-w-[90%] scrollbar-hidden overflow-x-scroll">
            {imagesUrl.map((media, i) => (
              <MediaItem key={i} media={media} index={i} />
            ))}
          </div>
          <UploadProductsImagesButton
            imagesUrl={imagesUrl}
            setImagesUrl={setImagesUrl}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductVariant;