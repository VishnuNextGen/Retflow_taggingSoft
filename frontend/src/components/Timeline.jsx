import React, { useRef, useEffect, useState } from 'react';
import { useVideoStore } from '../store/useVideoStore';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './ui/button';

export const Timeline = () => {
  const containerRef = useRef(null);
  const {
    videoDuration,
    currentTime,
    tags,
    tagEvents,
    activeRecording,
    selectedTagFilter,
    timelineZoom,
    setTimelineZoom,
    jumpToTime,
    jumpToNextTag,
    jumpToPrevTag,
  } = useVideoStore();

  const [isDragging, setIsDragging] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e) => {
    if (!containerRef.current || !videoDuration) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * videoDuration;
    jumpToTime(time);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleTimelineClick(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleTimelineClick(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const moveHandler = (e) => handleMouseMove(e);
      const upHandler = () => handleMouseUp();
      
      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', upHandler);
      
      return () => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', upHandler);
      };
    }
  }, [isDragging, videoDuration]);

  const filteredEvents = selectedTagFilter
    ? tagEvents.filter(e => e.tagId === selectedTagFilter)
    : tagEvents;

  const progressPercentage = videoDuration ? (currentTime / videoDuration) * 100 : 0;

  return (
    <div className="bg-slate-50 border-t border-gray-200 p-3" data-testid="timeline-container">
      {/* Controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={jumpToPrevTag}
            data-testid="prev-tag-btn"
          >
            <ChevronLeft className="h-3 w-3 mr-0.5" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={jumpToNextTag}
            data-testid="next-tag-btn"
          >
            Next
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-600">
            {formatTime(currentTime)} / {formatTime(videoDuration)}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setTimelineZoom(timelineZoom - 0.2)}
            disabled={timelineZoom <= 0.5}
            data-testid="zoom-out-btn"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="text-xs text-gray-500 w-10 text-center">
            {timelineZoom.toFixed(1)}x
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setTimelineZoom(timelineZoom + 0.2)}
            disabled={timelineZoom >= 5}
            data-testid="zoom-in-btn"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div
        ref={containerRef}
        className="relative h-14 bg-gray-200 rounded-md cursor-pointer overflow-hidden"
        onMouseDown={handleMouseDown}
        data-testid="timeline-track"
      >
        {/* Time markers */}
        <div className="absolute inset-0 flex items-start pt-1">
          {Array.from({ length: Math.ceil(videoDuration / 10) }).map((_, i) => (
            <div
              key={i}
              className="absolute text-xs text-gray-500"
              style={{ left: `${(i * 10 / videoDuration) * 100}%` }}
            >
              {formatTime(i * 10)}
            </div>
          ))}
        </div>

        {/* Tag event markers */}
        {filteredEvents.map((event) => {
          const tag = tags.find(t => t.id === event.tagId);
          if (!tag) return null;

          const startPercent = (event.startTime / videoDuration) * 100;
          const duration = event.endTime - event.startTime;
          const widthPercent = (duration / videoDuration) * 100;

          return (
            <div
              key={event.id}
              className="absolute top-6 h-6 rounded cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
                backgroundColor: tag.color,
                minWidth: '2px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                jumpToTime(event.startTime);
              }}
              title={`${tag.name}: ${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}
              data-testid={`timeline-marker-${event.id}`}
            />
          );
        })}

        {/* Active recording indicator */}
        {activeRecording && (
          <div
            className="absolute top-8 h-6 rounded animate-pulse"
            style={{
              left: `${(activeRecording.startTime / videoDuration) * 100}%`,
              width: `${((currentTime - activeRecording.startTime) / videoDuration) * 100}%`,
              backgroundColor: tags.find(t => t.id === activeRecording.tagId)?.color || '#666',
              minWidth: '2px',
            }}
          />
        )}

        {/* Progress bar */}
        <div
          className="absolute top-0 bottom-0 bg-white/30"
          style={{ width: `${progressPercentage}%` }}
        />

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{ left: `${progressPercentage}%` }}
          data-testid="timeline-playhead"
        >
          <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
        </div>
      </div>

      {/* Legend */}
      {selectedTagFilter && (
        <div className="mt-2 text-xs text-gray-600">
          Showing: {tags.find(t => t.id === selectedTagFilter)?.name || 'Unknown'}
        </div>
      )}
    </div>
  );
};
