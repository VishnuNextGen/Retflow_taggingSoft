import React, { useState } from 'react';
import { useVideoStore } from '../store/useVideoStore';
import { Settings, Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

export const TaggingPanel = () => {
  const {
    tags,
    taggingMode,
    activeRecording,
    selectedTagFilter,
    toggleTaggingMode,
    startTagRecording,
    stopTagRecording,
    setSelectedTagFilter,
    addTag,
    updateTag,
    deleteTag,
  } = useVideoStore();

  const [showSettings, setShowSettings] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [newTagShortcut, setNewTagShortcut] = useState('');

  const handleTagClick = (tag) => {
    if (taggingMode) {
      if (activeRecording?.tagId === tag.id) {
        stopTagRecording();
      } else if (!activeRecording) {
        startTagRecording(tag.id);
      }
    } else {
      setSelectedTagFilter(selectedTagFilter === tag.id ? null : tag.id);
    }
  };

  const handleAddTag = () => {
    if (newTagName.trim()) {
      addTag({
        name: newTagName.trim(),
        color: newTagColor,
        shortcut: newTagShortcut.toLowerCase(),
      });
      setNewTagName('');
      setNewTagColor('#3b82f6');
      setNewTagShortcut('');
    }
  };

  const handleUpdateTag = () => {
    if (editingTag && newTagName.trim()) {
      updateTag(editingTag.id, {
        name: newTagName.trim(),
        color: newTagColor,
        shortcut: newTagShortcut.toLowerCase(),
      });
      setEditingTag(null);
      setNewTagName('');
      setNewTagColor('#3b82f6');
      setNewTagShortcut('');
    }
  };

  const startEditing = (tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setNewTagShortcut(tag.shortcut);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 p-4" data-testid="tagging-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Tagging</h2>
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="settings-btn">
              <Settings className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="settings-dialog">
            <DialogHeader>
              <DialogTitle>Tag Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Add/Edit Tag Form */}
              <div className="space-y-3">
                <Label>Tag Name</Label>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name"
                  data-testid="tag-name-input"
                />
                
                <Label>Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                    data-testid="tag-color-input"
                  />
                  <Input value={newTagColor} readOnly className="flex-1" />
                </div>
                
                <Label>Keyboard Shortcut</Label>
                <Input
                  value={newTagShortcut}
                  onChange={(e) => setNewTagShortcut(e.target.value.slice(0, 1))}
                  placeholder="Single key (e.g., 'a')"
                  maxLength={1}
                  data-testid="tag-shortcut-input"
                />
                
                <Button
                  onClick={editingTag ? handleUpdateTag : handleAddTag}
                  className="w-full"
                  data-testid="save-tag-btn"
                >
                  {editingTag ? 'Update Tag' : 'Add Tag'}
                </Button>
              </div>

              {/* Existing Tags List */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Existing Tags</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-sm">{tag.name}</span>
                      <span className="text-xs text-gray-500">({tag.shortcut})</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => startEditing(tag)}
                        data-testid={`edit-tag-${tag.id}`}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-700"
                        onClick={() => deleteTag(tag.id)}
                        data-testid={`delete-tag-${tag.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 mb-4 p-3 bg-white rounded-lg shadow-sm">
        <span className="text-sm font-medium">All</span>
        <Switch
          checked={taggingMode}
          onCheckedChange={toggleTaggingMode}
          data-testid="tagging-mode-toggle"
        />
        <span className="text-sm text-gray-600">Tagging Mode</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {tags.map((tag) => {
          const isRecording = activeRecording?.tagId === tag.id;
          const isSelected = selectedTagFilter === tag.id;
          
          return (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag)}
              style={{
                backgroundColor: tag.color,
                opacity: isSelected ? 1 : taggingMode ? 0.9 : 0.7,
                boxShadow: isRecording ? '0 0 0 3px rgba(0,0,0,0.3)' : 'none',
              }}
              className={`w-full p-3 rounded-lg text-white font-medium text-left transition-all hover:opacity-100 ${
                isRecording ? 'animate-pulse' : ''
              }`}
              data-testid={`tag-btn-${tag.id}`}
            >
              <div className="flex items-center justify-between">
                <span>{tag.name}</span>
                {!taggingMode && (
                  <span className="bg-white/30 px-2 py-0.5 rounded text-xs">
                    {tag.count}
                  </span>
                )}
                {isRecording && (
                  <span className="bg-white/30 px-2 py-0.5 rounded text-xs animate-pulse">
                    Recording...
                  </span>
                )}
              </div>
              <div className="text-xs mt-1 opacity-80">Shortcut: {tag.shortcut}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
