import React, { useEffect } from 'react';
import '@/App.css';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './components/ui/resizable';
import { useVideoStore } from './store/useVideoStore';
import { TaggingPanel } from './components/TaggingPanel';
import { VideoPlayer } from './components/VideoPlayer';
import { PlaylistPanel } from './components/PlaylistPanel';
import { Timeline } from './components/Timeline';
import { VideoUpload } from './components/VideoUpload';
import { Toaster } from 'sonner';

function App() {
  const {
    tags,
    taggingMode,
    activeRecording,
    startTagRecording,
    stopTagRecording,
    cancelTagRecording,
  } = useVideoStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Escape to cancel recording
      if (e.key === 'Escape' && activeRecording) {
        cancelTagRecording();
        return;
      }

      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Tag shortcuts
      if (taggingMode) {
        const tag = tags.find(t => t.shortcut === e.key.toLowerCase());
        if (tag) {
          if (activeRecording?.tagId === tag.id) {
            stopTagRecording();
          } else if (!activeRecording) {
            startTagRecording(tag.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [tags, taggingMode, activeRecording, startTagRecording, stopTagRecording, cancelTagRecording]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          RefFlow
        </h1>
        <p className="ml-4 text-sm text-gray-500">Professional Football Video Tagging</p>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* Left Panel - Tagging */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <TaggingPanel />
            </ResizablePanel>

            <ResizableHandle className="w-1 bg-gray-300 hover:bg-blue-500 transition-colors" />

            {/* Center - Video Player */}
            <ResizablePanel defaultSize={55} minSize={40}>
              <div className="relative h-full p-4">
                <VideoUpload />
                <VideoPlayer />
              </div>
            </ResizablePanel>

            <ResizableHandle className="w-1 bg-gray-300 hover:bg-blue-500 transition-colors" />

            {/* Right Panel - Playlist */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
              <PlaylistPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Bottom - Timeline */}
        <div className="h-32">
          <Timeline />
        </div>
      </div>
    </div>
  );
}

export default App;
