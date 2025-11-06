export const compressVideo = async (file: File, onProgress?: (progress: number) => void): Promise<File> => {
  try {
    // If video is already small enough, return original
    if (file.size <= 20 * 1024 * 1024) { // 20MB
      onProgress?.(100);
      return file;
    }

    // Create a video element
    const video = document.createElement('video');
    const videoUrl = URL.createObjectURL(file);
    
    // Wait for video metadata to load
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
      video.src = videoUrl;
    });

    // Set up canvas for video processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Calculate new dimensions (reduce to 720p if larger)
    const maxWidth = 1280;
    const maxHeight = 720;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;

    // Create a MediaRecorder to capture the processed video
    const stream = canvas.captureStream(30); // 30fps
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2000000 // 2Mbps
    });

    const chunks: Blob[] = [];
    let progress = 0;

    // Start recording
    mediaRecorder.start();

    // Process video frames
    const processFrame = () => {
      if (video.ended || video.paused) {
        mediaRecorder.stop();
        return;
      }

      // Draw current frame
      ctx.drawImage(video, 0, 0, width, height);
      
      // Update progress
      progress = Math.min(100, (video.currentTime / video.duration) * 100);
      onProgress?.(progress);
      
      // Schedule next frame
      requestAnimationFrame(processFrame);
    };

    // Start processing frames
    video.muted = true; // Ensure video is muted during compression
    video.playsInline = true; // Prevent fullscreen playback
    video.play().catch(error => {
      console.error('Error playing video during compression:', error);
    });
    processFrame();

    // Handle data available
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // Wait for recording to complete
    await new Promise((resolve) => {
      mediaRecorder.onstop = resolve;
    });

    // Create blob from chunks
    const blob = new Blob(chunks, { type: 'video/webm' });

    // Create new file from blob
    const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webm'), {
      type: 'video/webm',
      lastModified: file.lastModified
    });

    // Clean up
    URL.revokeObjectURL(videoUrl);
    stream.getTracks().forEach(track => track.stop());

    // If compression resulted in a larger file, return the original
    if (compressedFile.size > file.size) {
      console.log('Compression resulted in larger file, using original');
      return file;
    }

    console.log('Video compression successful:', {
      originalSize: file.size,
      compressedSize: compressedFile.size,
      originalType: file.type,
      compressedType: compressedFile.type,
      dimensions: { width, height }
    });

    onProgress?.(100);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing video:', error);
    return file; // Return original file if compression fails
  }
}; 