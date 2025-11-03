import React, { useState } from 'react';
import { useVideoStore } from '../store/useVideoStore';
import { Plus, Play, Trash2, Download, FolderPlus, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export const PlaylistPanel = () => {
  const {
    playlists,
    tagEvents,
    tags,
    videoSrc,
    addPlaylist,
    deletePlaylist,
    setActivePlaylist,
    addEventToPlaylist,
    removeEventFromPlaylist,
    jumpToTime,
  } = useVideoStore();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const activePlaylist = playlists.find(p => p.isActive);

  const handleAddPlaylist = () => {
    if (newPlaylistName.trim()) {
      addPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowAddPlaylist(false);
      toast.success('Playlist created');
    }
  };

  const handleAddToPlaylist = (eventId) => {
    if (activePlaylist) {
      if (!activePlaylist.events.includes(eventId)) {
        addEventToPlaylist(activePlaylist.id, eventId);
        toast.success('Event added to playlist');
      } else {
        toast.info('Event already in playlist');
      }
    } else {
      toast.error('Please select a playlist first');
    }
  };

  const handlePlayAll = async () => {
    if (!activePlaylist || activePlaylist.events.length === 0) {
      toast.error('No events in playlist');
      return;
    }

    const events = activePlaylist.events
      .map(eventId => tagEvents.find(e => e.id === eventId))
      .filter(Boolean)
      .sort((a, b) => a.startTime - b.startTime);

    if (events.length === 0) return;

    jumpToTime(events[0].startTime);
    toast.success('Playing playlist');
  };

  const handleExport = async (playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist || playlist.events.length === 0) {
      toast.error('Playlist is empty');
      return;
    }

    if (!videoSrc) {
      toast.error('No video loaded');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const ffmpeg = new FFmpeg();
      
      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });

      ffmpeg.on('progress', ({ progress }) => {
        setExportProgress(Math.round(progress * 100));
      });

      await ffmpeg.load();

      // Fetch the video file
      const videoData = await fetchFile(videoSrc);
      await ffmpeg.writeFile('input.mp4', videoData);

      // Get sorted events
      const events = playlist.events
        .map(eventId => tagEvents.find(e => e.id === eventId))
        .filter(Boolean)
        .sort((a, b) => a.startTime - b.startTime);

      // Create clips with accurate seeking (using -ss after -i for frame accuracy)
      const clipFiles = [];
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const duration = event.endTime - event.startTime;
        
        // Frame-accurate seeking: -ss AFTER -i with re-encoding
        await ffmpeg.exec([
          '-i', 'input.mp4',
          '-ss', event.startTime.toFixed(3),
          '-t', duration.toFixed(3),
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-preset', 'fast',
          '-avoid_negative_ts', 'make_zero',
          '-fflags', '+genpts',
          '-y',
          `clip${i}.mp4`
        ]);
        clipFiles.push(`clip${i}.mp4`);
      }

      // Create concat file
      let concatContent = '';
      for (let i = 0; i < clipFiles.length; i++) {
        concatContent += `file '${clipFiles[i]}'\n`;
      }
      await ffmpeg.writeFile('concat.txt', concatContent);

      // Concatenate clips
      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-c', 'copy',
        '-y',
        'output.mp4'
      ]);

      // Read output
      const data = await ffmpeg.readFile('output.mp4');
      
      // Download
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${playlist.name}.mp4`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Export complete!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed: ' + error.message);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 p-3" data-testid="playlist-panel">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">Playlist</h2>
        <Dialog open={showAddPlaylist} onOpenChange={setShowAddPlaylist}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="add-playlist-btn">
              <FolderPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="add-playlist-dialog">
            <DialogHeader>
              <DialogTitle>Create Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name"
                data-testid="playlist-name-input"
              />
              <Button onClick={handleAddPlaylist} className="w-full" data-testid="create-playlist-btn">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Playlist Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {playlists.map((playlist) => (
          <button
            key={playlist.id}
            onClick={() => setActivePlaylist(playlist.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              playlist.isActive
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            data-testid={`playlist-tab-${playlist.id}`}
          >
            {playlist.name}
            {playlist.events.length > 0 && (
              <span className="ml-1 text-xs">({playlist.events.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Search Events */}
      <div className="mb-4">
        <Input
          placeholder="Search events"
          className="w-full"
          data-testid="search-events-input"
        />
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {activePlaylist ? (
          activePlaylist.events.length > 0 ? (
            activePlaylist.events.map((eventId) => {
              const event = tagEvents.find(e => e.id === eventId);
              const tag = event ? tags.find(t => t.id === event.tagId) : null;
              if (!event || !tag) return null;

              return (
                <div
                  key={eventId}
                  className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  data-testid={`playlist-event-${eventId}`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-medium text-sm">{tag.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => jumpToTime(event.startTime)}
                      data-testid={`play-event-${eventId}`}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Play
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeEventFromPlaylist(activePlaylist.id, eventId)}
                      data-testid={`remove-event-${eventId}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-sm">No events in this playlist</p>
              <p className="text-xs mt-1">Click on timeline markers to add</p>
            </div>
          )
        ) : (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">Select or create a playlist</p>
          </div>
        )}

        {/* Available Events to Add */}
        {activePlaylist && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Available Events</h3>
            {tagEvents
              .filter(event => !activePlaylist.events.includes(event.id))
              .slice(0, 5)
              .map((event) => {
                const tag = tags.find(t => t.id === event.tagId);
                if (!tag) return null;

                return (
                  <div
                    key={event.id}
                    className="bg-gray-100 p-2 rounded mb-2 flex items-center justify-between"
                    data-testid={`available-event-${event.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-xs">{tag.name}</span>
                      <span className="text-xs text-gray-500">
                        {formatTime(event.startTime)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleAddToPlaylist(event.id)}
                      data-testid={`add-to-playlist-${event.id}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {activePlaylist && (
        <div className="space-y-2 border-t pt-4">
          <Button
            variant="default"
            className="w-full bg-blue-500 hover:bg-blue-600"
            onClick={handlePlayAll}
            disabled={activePlaylist.events.length === 0}
            data-testid="play-all-btn"
          >
            <Play className="h-4 w-4 mr-2" />
            Play All
          </Button>
          
          <Button
            variant="default"
            className="w-full bg-orange-500 hover:bg-orange-600"
            onClick={() => handleExport(activePlaylist.id)}
            disabled={activePlaylist.events.length === 0 || isExporting}
            data-testid="export-btn"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting {exportProgress}%
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Folder
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full text-red-500 hover:bg-red-50"
            onClick={() => {
              if (window.confirm('Delete this playlist?')) {
                deletePlaylist(activePlaylist.id);
                toast.success('Playlist deleted');
              }
            }}
            data-testid="delete-playlist-btn"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Playlist
          </Button>
        </div>
      )}
    </div>
  );
};
