import React, { useRef } from 'react';
import { useVideoStore } from '../store/useVideoStore';
import { Upload } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

export const VideoUpload = () => {
  const fileInputRef = useRef(null);
  const { setVideoSrc } = useVideoStore();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setVideoSrc(url);
        toast.success('Video loaded successfully');
      } else {
        toast.error('Please select a valid video file');
      }
    }
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
        data-testid="video-upload-input"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        className="bg-blue-500 hover:bg-blue-600"
        data-testid="upload-video-btn"
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload Video
      </Button>
    </div>
  );
};
