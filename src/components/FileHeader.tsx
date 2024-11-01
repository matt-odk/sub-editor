import React, { useState } from 'react';
import { ChevronLeft, Edit2, Save } from 'lucide-react';

interface FileHeaderProps {
  filename: string;
  onFilenameChange: (newName: string) => void;
  onBack: () => void;
}

export default function FileHeader({ filename, onFilenameChange, onBack }: FileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(filename);

  const handleSave = () => {
    onFilenameChange(editedName);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          title="Back to files"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="p-2 text-green-600 hover:text-green-800 transition-colors"
            >
              <Save className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{filename}</h2>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}