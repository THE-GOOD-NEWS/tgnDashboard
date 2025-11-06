'use client';

import { UploadButton as UploadThingButton } from "@/utils/uploadthing";
import { compressImage } from "@/utils/imageCompression";
import { useState } from "react";

export function UploadButton() {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);
    try {
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.type.startsWith('image/')) {
            return await compressImage(file);
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
    <UploadThingButton
      endpoint="mediaUploader"
      onClientUploadComplete={(res) => {
        console.log("Files: ", res);
        alert("Upload Completed");
      }}
      onUploadError={(error: Error) => {
        alert(`ERROR! ${error.message}`);
      }}
      onBeforeUploadBegin={handleUpload}
    />
  );
} 