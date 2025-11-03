import { create } from 'zustand';

export const useVideoStore = create((set, get) => ({
  // Video state
  videoSrc: null,
  videoRef: null,
  videoDuration: 0,
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,

  // Tagging state
  taggingMode: false,
  tags: [
    { id: '1', name: 'Attack', color: '#ef4444', shortcut: 'a', count: 0 },
    { id: '2', name: 'Pass', color: '#f97316', shortcut: 'p', count: 0 },
    { id: '3', name: 'Goal', color: '#10b981', shortcut: 'g', count: 0 },
    { id: '4', name: 'Foul', color: '#3b82f6', shortcut: 'f', count: 0 },
    { id: '5', name: 'Defense', color: '#8b5cf6', shortcut: 'd', count: 0 },
    { id: '6', name: 'Corner', color: '#ec4899', shortcut: 'c', count: 0 },
  ],
  tagEvents: [],
  activeRecording: null,
  selectedTagFilter: null,

  // Playlist state
  playlists: [
    { id: '1', name: 'Attacking Plays', events: [], isActive: true },
    { id: '2', name: 'Defensive Actions', events: [], isActive: false },
  ],

  // Timeline state
  timelineZoom: 1,
  timelineScroll: 0,

  // Actions
  setVideoSrc: (src) => set({ videoSrc: src }),
  setVideoRef: (ref) => set({ videoRef: ref }),
  setVideoDuration: (duration) => set({ videoDuration: duration }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackSpeed: (speed) => {
    const { videoRef } = get();
    if (videoRef) {
      videoRef.playbackRate = speed;
    }
    set({ playbackSpeed: speed });
  },

  // Tagging actions
  toggleTaggingMode: () => set((state) => ({ taggingMode: !state.taggingMode })),
  setTaggingMode: (mode) => set({ taggingMode: mode }),

  addTag: (tag) => set((state) => ({
    tags: [...state.tags, { ...tag, id: Date.now().toString(), count: 0 }]
  })),

  updateTag: (id, updates) => set((state) => ({
    tags: state.tags.map(tag => tag.id === id ? { ...tag, ...updates } : tag)
  })),

  deleteTag: (id) => set((state) => ({
    tags: state.tags.filter(tag => tag.id !== id),
    tagEvents: state.tagEvents.filter(event => event.tagId !== id)
  })),

  startTagRecording: (tagId) => {
    const { currentTime } = get();
    set({ activeRecording: { tagId, startTime: currentTime } });
  },

  stopTagRecording: () => {
    const { activeRecording, currentTime, tags, tagEvents } = get();
    if (!activeRecording) return;

    const newEvent = {
      id: Date.now().toString(),
      tagId: activeRecording.tagId,
      startTime: activeRecording.startTime,
      endTime: currentTime,
    };

    const updatedTags = tags.map(tag =>
      tag.id === activeRecording.tagId ? { ...tag, count: tag.count + 1 } : tag
    );

    set({
      tagEvents: [...tagEvents, newEvent],
      tags: updatedTags,
      activeRecording: null,
    });
  },

  cancelTagRecording: () => set({ activeRecording: null }),

  deleteTagEvent: (eventId) => set((state) => {
    const event = state.tagEvents.find(e => e.id === eventId);
    if (!event) return state;

    return {
      tagEvents: state.tagEvents.filter(e => e.id !== eventId),
      tags: state.tags.map(tag =>
        tag.id === event.tagId ? { ...tag, count: Math.max(0, tag.count - 1) } : tag
      ),
    };
  }),

  setSelectedTagFilter: (tagId) => set({ selectedTagFilter: tagId }),

  // Playlist actions
  addPlaylist: (name) => set((state) => ({
    playlists: [...state.playlists, {
      id: Date.now().toString(),
      name,
      events: [],
      isActive: false
    }]
  })),

  deletePlaylist: (id) => set((state) => ({
    playlists: state.playlists.filter(p => p.id !== id)
  })),

  setActivePlaylist: (id) => set((state) => ({
    playlists: state.playlists.map(p => ({ ...p, isActive: p.id === id }))
  })),

  addEventToPlaylist: (playlistId, eventId) => set((state) => ({
    playlists: state.playlists.map(p =>
      p.id === playlistId ? { ...p, events: [...p.events, eventId] } : p
    )
  })),

  removeEventFromPlaylist: (playlistId, eventId) => set((state) => ({
    playlists: state.playlists.map(p =>
      p.id === playlistId ? { ...p, events: p.events.filter(e => e !== eventId) } : p
    )
  })),

  reorderPlaylistEvents: (playlistId, startIndex, endIndex) => set((state) => {
    const playlist = state.playlists.find(p => p.id === playlistId);
    if (!playlist) return state;

    const newEvents = Array.from(playlist.events);
    const [removed] = newEvents.splice(startIndex, 1);
    newEvents.splice(endIndex, 0, removed);

    return {
      playlists: state.playlists.map(p =>
        p.id === playlistId ? { ...p, events: newEvents } : p
      )
    };
  }),

  // Timeline actions
  setTimelineZoom: (zoom) => set({ timelineZoom: Math.max(0.5, Math.min(5, zoom)) }),
  setTimelineScroll: (scroll) => set({ timelineScroll: scroll }),

  // Navigation
  jumpToTime: (time) => {
    const { videoRef, videoDuration } = get();
    const clampedTime = Math.max(0, Math.min(time, videoDuration));
    if (videoRef) {
      videoRef.currentTime = clampedTime;
    }
    set({ currentTime: clampedTime });
  },

  jumpToNextTag: () => {
    const { currentTime, tagEvents, selectedTagFilter } = get();
    const filteredEvents = selectedTagFilter
      ? tagEvents.filter(e => e.tagId === selectedTagFilter)
      : tagEvents;

    const nextEvent = filteredEvents
      .filter(e => e.startTime > currentTime)
      .sort((a, b) => a.startTime - b.startTime)[0];

    if (nextEvent) {
      get().jumpToTime(nextEvent.startTime);
    }
  },

  jumpToPrevTag: () => {
    const { currentTime, tagEvents, selectedTagFilter } = get();
    const filteredEvents = selectedTagFilter
      ? tagEvents.filter(e => e.tagId === selectedTagFilter)
      : tagEvents;

    const prevEvent = filteredEvents
      .filter(e => e.startTime < currentTime)
      .sort((a, b) => b.startTime - a.startTime)[0];

    if (prevEvent) {
      get().jumpToTime(prevEvent.startTime);
    }
  },
}));
