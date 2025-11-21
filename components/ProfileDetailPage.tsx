/**
 * Refactored ProfileDetailPage component with clean separation
 */

import React, { useState, useEffect } from 'react';
import { Profile, CropData } from '../types';
import Lightbox from './Lightbox';
import { ArrowLeftIcon } from './icons';
import AvatarEditor from './profile/AvatarEditor';
import ProfileHeader from './profile/ProfileHeader';
import PhotoGrid from './profile/PhotoGrid';
import UploadArea from './profile/UploadArea';

interface ProfileDetailPageProps {
  profile: Profile;
  onBack: () => void;
  onDeleteImage: (imageId: string) => void;
  onSetAvatar: (imageId: string) => void;
  onUploadImages: (files: File[]) => void;
  onUpdateProfile: (data: { name: string, note: string }) => void;
  onUpdateCropData?: (cropData: CropData) => void;
  onDeleteProfile?: () => void;
  onReorderImages?: (imageIds: string[]) => void;
}

const ProfileDetailPage: React.FC<ProfileDetailPageProps> = ({ 
  profile, 
  onBack, 
  onDeleteImage, 
  onSetAvatar, 
  onUploadImages, 
  onUpdateProfile,
  onUpdateCropData,
  onDeleteProfile,
  onReorderImages 
}) => {
  // UI State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const handleFileSelect = (files: FileList) => {
    onUploadImages(Array.from(files));
  };

  const handleDeleteProfile = () => {
    if (onDeleteProfile) {
      onDeleteProfile();
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
          Back to Profiles
        </button>
      </div>

      {/* Profile Header Section */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Avatar Editor */}
        <div className="md:w-1/6 flex-shrink-0">
          <AvatarEditor
            profile={profile}
            onUpdateCropData={onUpdateCropData}
          />
        </div>

        {/* Profile Information */}
        <div className="md:w-5/6 min-h-0">
          <ProfileHeader
            profile={profile}
            isEditing={isEditing}
            onStartEdit={() => setIsEditing(true)}
            onStopEdit={() => setIsEditing(false)}
            onUpdateProfile={onUpdateProfile}
            onDeleteProfile={onDeleteProfile ? handleDeleteProfile : undefined}
          />
        </div>
      </div>
      
      {/* Gallery Section */}
      <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">
        Photo Gallery
        <span className="text-sm font-normal text-gray-400 ml-2">
          ({profile.images.length} {profile.images.length === 1 ? 'image' : 'images'})
        </span>
      </h2>
      
      <PhotoGrid
        profile={profile}
        images={profile.images}
        onImageClick={openLightbox}
        onDeleteImage={onDeleteImage}
        onSetAvatar={onSetAvatar}
        onReorderImages={onReorderImages}
      />
      
      {/* Upload Area */}
      <UploadArea onFilesSelected={handleFileSelect} />
      
      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          images={profile.images}
          currentIndex={currentImageIndex}
          onClose={() => setLightboxOpen(false)}
          onDelete={onDeleteImage}
          onSetAvatar={onSetAvatar}
          profile={profile}
        />
      )}
    </div>
  );
};

export default ProfileDetailPage;