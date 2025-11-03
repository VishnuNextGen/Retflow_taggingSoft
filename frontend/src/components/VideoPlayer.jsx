import React, { useRef, useEffect, useState } from 'react';
import { useVideoStore } from '../store/useVideoStore';
import { Play, Pause, SkipBack, SkipForward, Maximize } from 'lucide-react';
import { Button } from './ui/button';

export const VideoPlayer = () => {
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const {
    videoSrc,
    isPlaying,
    playbackSpeed,
    currentTime,
    videoDuration,
    setVideoRef,
    setVideoDuration,
    setCurrentTime,
    setIsPlaying,
    setPlaybackSpeed,
    jumpToTime,
  } = useVideoStore();

  useEffect(() => {
    if (videoRef.current) {
      setVideoRef(videoRef.current);
    }
  }, [setVideoRef]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipTime = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden" data-testid="video-player-container">
      {!videoSrc ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <p className="text-lg">No video loaded</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-contain"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            data-testid="video-element"
          />
          
          {/* Video Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skipTime(-5)}
                className="text-white hover:bg-white/20"
                data-testid="skip-back-btn"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/20"
                data-testid="play-pause-btn"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skipTime(5)}
                className="text-white hover:bg-white/20"
                data-testid="skip-forward-btn"
              >
                <SkipForward className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-2 ml-4">
                <span className="text-white text-sm">Speed:</span>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="bg-white/20 text-white text-sm px-2 py-1 rounded border-none outline-none"
                  data-testid="playback-speed-select"
                >
                  <option value="0.5">0.5x</option>
                  <option value="1">1x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20 ml-auto"
                data-testid="fullscreen-btn"
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
