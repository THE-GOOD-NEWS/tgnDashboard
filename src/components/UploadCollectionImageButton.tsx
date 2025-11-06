"use client";

import { UploadButton } from "../utils/uploadthing";
import axios from "axios";
import React from "react";
import imageCompression from 'browser-image-compression';
import { media } from "@/interfaces/interfaces";
import { compressImage } from "@/utils/imageCompression";
import { compressVideo } from "@/utils/videoCompression";

const UploadCollectionImageButton = ({
  updateImageUrl,
  imageUrl,
}: {
  updateImageUrl:  (url: string) => Promise<void>;
  imageUrl: string;
}) => {
  const deleteValue = async (value: string) => {
    try {
      await axios.delete("/api/uploadthing", {
        data: {
          url: value,
        },
      });
    } catch (error) {
      console.error("Error deleting old image:", error);
    }
  };
  const handleUpload = async (files: File[]) => {
    try {
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.type.startsWith('image/')) {
            return await compressImage(file);
          } else if (file.type.startsWith('video/')) {
            return await compressVideo(file);
          }
          return file;
        })
      );
      return compressedFiles;
    } catch (error) {
      console.error('Error during compression:', error);
      return files;
    } finally {
      // setIsUploading(false);
    }
  };

  return (
    <div className="text-white">
<UploadButton
        onBeforeUploadBegin={handleUpload}

  endpoint="mediaUploader"
  onClientUploadComplete={(res) => {
    if (res && res.length > 0) {
      deleteValue(imageUrl);
      console.log("Files: ", res);
      const newUrl = res[0].url;
      updateImageUrl(newUrl);
      console.log("Updated image URLs:", imageUrl);
      alert("Upload Completed");
    } else {
      alert("No files were uploaded");
    }
  }}
  onUploadError={(error: Error) => {
    console.error("Upload error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    alert(`Upload failed: ${error.message}. Please try a smaller file or check your connection.`);
  }}
  onUploadProgress={(progress) => {
    console.log(`Upload progress: ${progress}%`);
  }}
  appearance={{
    button: "bg-primary text-white py-2 h-10 text-nowrap px-4 rounded-lg border border-primary",
    container: "flex  flex-col items-center gap-2",
    allowedContent:"hidden"
  }}
/>
    </div>
  );
};

export default UploadCollectionImageButton;
