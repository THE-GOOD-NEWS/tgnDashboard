"use client";

import { UploadButton } from "../utils/uploadthing";
import axios from "axios";
import React, { useState } from "react";
import { media } from "@/interfaces/interfaces";
import { compressImage } from "@/utils/imageCompression";
import { compressVideo } from "@/utils/videoCompression";

const UploadProductsImagesButton = ({
  setImagesUrl,
  imagesUrl,
}: {
  setImagesUrl: React.Dispatch<React.SetStateAction<media[]>>;
  imagesUrl: media[];
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<number | null>(null);

  const deleteValue = async (value: string) => {
    await axios.delete("/api/uploadthing", {
      data: {
        url: value,
      },
    });
  };

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);
    setCompressionProgress(0);
    try {
      console.log('Starting upload process with files:', files.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size
      })));

      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            if (file.type.startsWith('image/')) {
              console.log('Compressing image:', file.name);
              return await compressImage(file);
            } else if (file.type.startsWith('video/')) {
              console.log('Compressing video:', file.name);
              const compressed = await compressVideo(file, (progress) => {
                setCompressionProgress(progress);
              });
              console.log('Video compression result:', {
                originalSize: file.size,
                compressedSize: compressed.size,
                type: compressed.type,
                name: compressed.name
              });
              return compressed;
            }
            return file;
          } catch (error) {
            console.error(`Error compressing ${file.name}:`, error);
            return file;
          }
        })
      );

      console.log('Compressed files ready for upload:', compressedFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size
      })));

      return compressedFiles;
    } catch (error) {
      console.error('Error during compression:', error);
      return files;
    } finally {
      setIsUploading(false);
      setCompressionProgress(null);
    }
  };

  return (
    <div className="relative">
      <UploadButton
        className="bg-secondary text-white h-16 px-2 py-1 border-secondary !important"
        endpoint="mediaUploader"
        onBeforeUploadBegin={handleUpload}
        onClientUploadComplete={(res) => {
          console.log("Uploaded Files: ", res);

          const newMedia = res.map((file) => {
            const isVideo = file.type.startsWith("video/") || 
                          file.url.match(/\.(mp4|webm|ogg)$/i) ||
                          file.name.match(/\.(mp4|webm|ogg)$/i);
            return {
              url: file.url,
              type: isVideo ? "video" : "image",
            } as media;
          });

          setImagesUrl((prevUrls) => [...prevUrls, ...newMedia]);
          console.log("Updated media URLs:", imagesUrl);
          alert("Upload Completed");
        }}
        onUploadError={(error: Error) => {
          console.error("Upload error:", error);
          alert(`ERROR! ${error.message}`);
        }}
      />
      {(isUploading || compressionProgress !== null) && (
        <div className="w-screen h-screen fixed inset top-0 left-0  flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-lg">
            <div className="text-center mb-2">
              {compressionProgress !== null ? "Compressing video..." : "Uploading..."}
            </div>
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${compressionProgress || 0}%` }}
              />
            </div>
            <div className="text-center mt-2">
              {compressionProgress !== null ? `${compressionProgress.toFixed(0)}%` : "Please wait..."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadProductsImagesButton;