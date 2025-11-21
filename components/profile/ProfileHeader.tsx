/**
 * Profile header component for editing profile information
 */

import React, { useState } from 'react';
import { Profile } from '../../types';
import { EditIcon, TrashIcon } from '../icons';
import { validateProfileName } from '../../utils/profileNameUtils';

interface ProfileHeaderProps {
  profile: Profile;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onUpdateProfile: (data: { name: string; note: string }) => void;
  onDeleteProfile?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isEditing,
  onStartEdit,
  onStopEdit,
  onUpdateProfile,
  onDeleteProfile
}) => {
  const [editData, setEditData] = useState({ name: profile.name, note: profile.note });

  const handleSaveEdit = () => {
    const validation = validateProfileName(editData.name);
    
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }
    
    if (validation.message) {
      if (!confirm(`${validation.message} Continue with "${editData.name}"?`)) {
        return;
      }
    }
    
    onUpdateProfile({ ...editData, name: editData.name.trim() });
    onStopEdit();
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <input
          type="text"
          value={editData.name}
          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full text-4xl font-bold bg-gray-800 border-b-2 border-gray-700 focus:border-cyan-500 focus:outline-none transition-colors"
        />
        <textarea
          value={editData.note}
          onChange={(e) => setEditData(prev => ({ ...prev, note: e.target.value }))}
          className="w-full text-lg text-gray-300 bg-gray-800 border border-gray-700 rounded-md p-2 h-32 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
          rows={4}
        />
        <div className="flex gap-4">
          <button 
            onClick={handleSaveEdit} 
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Save
          </button>
          <button 
            onClick={onStopEdit} 
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex flex-col">
      <h1 className="text-4xl lg:text-5xl font-bold mb-2 flex-shrink-0">{profile.name}</h1>
      <div className="flex-1 min-h-0 mb-6">
        <p className="text-lg text-gray-300 whitespace-pre-wrap overflow-y-auto max-h-32 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {profile.note}
        </p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <button 
          onClick={onStartEdit} 
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <EditIcon className="w-5 h-5" /> Edit
        </button>
        {onDeleteProfile && (
          <button 
            onClick={onDeleteProfile} 
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            <TrashIcon className="w-5 h-5" /> Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;