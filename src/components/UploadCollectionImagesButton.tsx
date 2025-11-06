"use client";

import { UploadButton } from "../utils/uploadthing";
import axios from "axios";
import React, { useState } from "react";
import { media } from "@/interfaces/interfaces";
import { compressImage } from "@/utils/imageCompression";
import { compressVideo } from "@/utils/videoCompression";

const UploadCollectionImagesButton = ({
  setImagesUrl,
  imagesUrl,
}: {
  setImagesUrl: React.Dispatch<React.SetStateAction<media[]>>;
  imagesUrl: media[];
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const deleteValue = async (value: string) => {
    await axios.delete("/api/uploadthing", {
      data: {
        url: value,
      },
    });
  };

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);
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
      setIsUploading(false);
    }
  };

  return (
    <div>
      <UploadButton
        className="bg-primary text-white h-16 px-2 py-1 border-primary !important"
        endpoint="mediaUploader"
        onBeforeUploadBegin={handleUpload}
        onClientUploadComplete={(res) => {
          // Check if multiple files were uploaded
          console.log("Files: ", res);

          // Map uploaded files to media objects
          const newMedia = res.map((file) => {
            // Determine type based on file type or extension
            const isVideo = file.type.startsWith("video/") || file.url.match(/\.(mp4|webm|ogg)$/i);
            return {
              url: file.url,
              type: isVideo ? "video" : "image",
            } as media;
          });

          // Append new media to existing imagesUrl
          setImagesUrl((prevUrls) => [...prevUrls, ...newMedia]);

          console.log("Updated media URLs:", imagesUrl);

          alert("Upload Completed");
        }}
        onUploadError={(error: Error) => {
          // Handle upload error
          alert(`ERROR! ${error.message}`);
        }}
      />
    </div>
  );
};

export default UploadCollectionImagesButton; 