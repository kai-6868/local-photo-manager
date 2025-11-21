/**
 * Refactored App component with clean separation of concerns
 */

import React, { useEffect, useState } from 'react';
import { Profile, CropData } from './types';
import { useProfiles } from './hooks/useProfiles';
import { useFolderConnection } from './hooks/useFolderConnection';
import HomePage from './components/HomePage';
import ProfileDetailPage from './components/ProfileDetailPage';
import AddProfilePage from './components/AddProfilePage';
import GalleryView from './components/GalleryView';
import { UserIcon } from './components/icons';

const App: React.FC = () => {
  const [view, setView] = useState<'list' | 'detail' | 'add' | 'gallery'>('list');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Core hooks for state management
  const {
    profiles,
    allImages,
    isLoading,
    initializeProfiles,
    loadProfilesFromFolder,
    resetToMockData,
    createQuickProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    updateCropData,
    deleteImage,
    setAvatar,
    uploadImages,
    reorderImages
  } = useProfiles();

  const {
    folderService,
    connectionState,
    connectToFolder,
    disconnectFromFolder,
    isSupported
  } = useFolderConnection();

  // Initialize app
  useEffect(() => {
    initializeProfiles(isSupported);
  }, [initializeProfiles, isSupported]);

  // Validate selected profile
  useEffect(() => {
    const selectedProfile = profiles.find(p => p.id === selectedProfileId);
    if (view === 'detail' && !selectedProfile && selectedProfileId) {
      setView('list');
      setSelectedProfileId(null);
    }
  }, [profiles, selectedProfileId, view]);

  // Handle paste functionality for image upload
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (view !== 'detail' || !selectedProfileId) return;
      
      if (!e.clipboardData) return;
      
      const items = Array.from(e.clipboardData.items);
      const imageFiles: File[] = [];
      
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }
      
      if (imageFiles.length > 0) {
        uploadImages(selectedProfileId, imageFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [view, selectedProfileId, uploadImages]);

  // Event handlers
  const handleViewProfile = (id: string) => {
    setSelectedProfileId(id);
    setView('detail');
  };

  const handleQuickAddProfile = async () => {
    try {
      const newProfile = await handleQuickAddWithFileSystem();
      setSelectedProfileId(newProfile.id);
      setView('detail');
    } catch (error) {
      console.error('Error creating quick profile:', error);
      alert(`❌ Failed to create profile: ${error.message}`);
    }
  };

  const handleQuickAddWithFileSystem = async () => {
    if (connectionState.isConnected && folderService.isConnected) {
      return await createQuickProfileInFileSystem();
    } else {
      return createQuickProfile();
    }
  };

  const createQuickProfileInFileSystem = async () => {
    const newProfile = createQuickProfile();
    
    try {
      const folderStructure = await folderService.getFolderStructure();
      if (!folderStructure) {
        throw new Error('No folder connected');
      }

      // Create profile directory
      const sanitizedName = newProfile.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
      const profileHandle = await folderStructure.mainFolderHandle.getDirectoryHandle(sanitizedName, { create: true });
      
      // Create images subdirectory
      await profileHandle.getDirectoryHandle('images', { create: true });
      
      // Create profile.json metadata
      const profileData = {
        id: newProfile.id,
        name: newProfile.name,
        note: newProfile.note,
        avatarId: newProfile.avatarId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageCount: 0
      };
      
      const metadataHandle = await profileHandle.getFileHandle('profile.json', { create: true });
      const writable = await metadataHandle.createWritable();
      await writable.write(JSON.stringify(profileData, null, 2));
      await writable.close();

      return newProfile;
    } catch (error) {
      // Remove from memory if file system operation failed
      deleteProfile(newProfile.id);
      throw error;
    }
  };

  const handleAddProfile = async (newProfileData: {name: string, note: string, avatar: File, images: File[]}) => {
    const { name, note, avatar, images: otherImages } = newProfileData;
    
    try {
      if (connectionState.isConnected && folderService.isConnected) {
        await handleAddProfileToFileSystem(newProfileData);
      } else {
        addProfile(newProfileData);
        alert(`✅ Profile "${name}" created in memory mode!`);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      alert(`❌ Failed to create profile: ${error.message}`);
    } finally {
      setView('list');
    }
  };

  const handleAddProfileToFileSystem = async (data: {name: string, note: string, avatar: File, images: File[]}) => {
    const folderStructure = await folderService.getFolderStructure();
    if (!folderStructure) {
      throw new Error('No folder connected');
    }

    // Create profile directory and save files
    const sanitizedName = data.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
    const profileHandle = await folderStructure.mainFolderHandle.getDirectoryHandle(sanitizedName, { create: true });
    const imagesHandle = await profileHandle.getDirectoryHandle('images', { create: true });
    
    // Save all files
    const allFiles = [data.avatar, ...data.images];
    const savedImages = [];
    
    for (const file of allFiles) {
      const imageHandle = await imagesHandle.getFileHandle(file.name, { create: true });
      const writable = await imageHandle.createWritable();
      await writable.write(file);
      await writable.close();
      
      savedImages.push({
        id: `img_${sanitizedName}_${file.name}`,
        url: URL.createObjectURL(file),
        name: file.name,
        profileName: sanitizedName
      });
    }
    
    // Create profile.json metadata
    const profileData = {
      id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      note: data.note,
      avatarId: savedImages.length > 0 ? savedImages[0].id : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageCount: savedImages.length
    };
    
    const metadataHandle = await profileHandle.getFileHandle('profile.json', { create: true });
    const writable = await metadataHandle.createWritable();
    await writable.write(JSON.stringify(profileData, null, 2));
    await writable.close();
    
    // Update state with file system profile
    const newProfile = {
      id: profileData.id,
      name: data.name,
      note: data.note,
      images: savedImages,
      avatarId: profileData.avatarId
    };
    
    loadProfilesFromFolder([...profiles, newProfile], [...allImages, ...savedImages]);
    alert(`✅ Profile "${data.name}" saved successfully with ${savedImages.length} images!`);
  };

  const handleUpdateProfile = async (id: string, data: { name: string, note: string }) => {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return;
    
    if (connectionState.isConnected && folderService.isConnected) {
      await handleUpdateProfileInFileSystem(profile, data);
    } else {
      updateProfile(id, data);
      alert(`✅ Profile "${data.name}" updated in memory!`);
    }
  };

  const handleUpdateProfileInFileSystem = async (profile: Profile, data: { name: string, note: string }) => {
    const currentFolderName = profile.images[0]?.profileName || profile.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
    const needsFolderRename = data.name !== profile.name;
    
    try {
      if (needsFolderRename) {
        const sanitizedNewName = data.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
        const success = await folderService.renameProfileFolder(currentFolderName, data.name, data);
        
        if (success) {
          // Update memory with new folder name
          updateProfile(profile.id, data);
          alert(`✅ Profile "${data.name}" updated and folder renamed successfully!`);
        } else {
          alert(`❌ Failed to rename folder for profile "${data.name}"`);
        }
      } else {
        const success = await folderService.updateProfileMetadata(currentFolderName, data);
        
        if (success) {
          updateProfile(profile.id, data);
          alert(`✅ Profile "${data.name}" updated successfully!`);
        } else {
          alert(`❌ Failed to update profile "${data.name}"`);
        }
      }
    } catch (error) {
      console.error('Update profile error:', error);
      alert(`❌ Error updating profile: ${error.message}`);
    }
  };

  const handleLoadFromFolder = async () => {
    const result = await connectToFolder();
    if (result) {
      loadProfilesFromFolder(result.profiles, result.images);
      alert(`✅ Connected to "${connectionState.folderName}" - Found ${result.profiles.length} profiles with ${result.images.length} images total`);
    }
  };

  const handleDisconnectFolder = () => {
    disconnectFromFolder();
    resetToMockData();
  };

  const handleDeleteProfile = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    if (!confirm(`Are you sure you want to delete profile "${profile.name}" and all its images? This action cannot be undone.`)) {
      return;
    }
    
    if (connectionState.isConnected && folderService.isConnected) {
      const profileFolderName = profile.images[0]?.profileName || profile.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
      
      try {
        const success = await folderService.deleteProfile(profileFolderName);
        if (success) {
          deleteProfile(profileId);
          alert(`✅ Profile "${profile.name}" deleted successfully!`);
        } else {
          alert(`❌ Failed to delete profile "${profile.name}"`);
        }
      } catch (error) {
        console.error('Delete profile error:', error);
        alert(`❌ Error deleting profile: ${error.message}`);
      }
    } else {
      deleteProfile(profileId);
      alert(`✅ Profile "${profile.name}" deleted from memory!`);
    }
  };

  const handleDeleteImageFromGallery = async (imageId: string) => {
    const profile = profiles.find(p => p.images.some(img => img.id === imageId));
    if (!profile) return;
    
    await handleDeleteImage(profile.id, imageId);
  };

  const handleDeleteImage = async (profileId: string, imageId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    const image = profile?.images.find(img => img.id === imageId);
    
    if (!profile || !image) return;
    
    if (!confirm(`Are you sure you want to delete "${image.name}"?`)) {
      return;
    }
    
    if (connectionState.isConnected && folderService.isConnected) {
      try {
        const success = await folderService.deleteImageFile(
          image.profileName || profile.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_'),
          image.name
        );
        
        if (success) {
          deleteImage(profileId, imageId);
          alert(`✅ Image "${image.name}" deleted successfully!`);
        } else {
          alert(`❌ Failed to delete image "${image.name}"`);
        }
      } catch (error) {
        console.error('Delete image error:', error);
        alert(`❌ Error deleting image: ${error.message}`);
      }
    } else {
      deleteImage(profileId, imageId);
      alert(`✅ Image "${image.name}" deleted from memory!`);
    }
  };

  const handleViewGallery = () => {
    setView('gallery');
  };

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="flex flex-col items-center">
          <UserIcon className="w-16 h-16 animate-pulse text-cyan-400" />
          <p className="mt-4 text-lg text-white">Loading Photo Manager...</p>
          {isSupported && (
            <p className="mt-2 text-sm text-gray-400">
              {connectionState.isConnected ? 'Folder connected' : 'Ready to connect folder...'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Render appropriate view
  const renderView = () => {
    switch (view) {
      case 'detail':
        if (!selectedProfile) {
          setView('list');
          setSelectedProfileId(null);
          return null;
        }
        
        return (
          <ProfileDetailPage 
            profile={selectedProfile}
            onBack={() => setView('list')}
            onDeleteImage={(imageId) => handleDeleteImage(selectedProfile.id, imageId)}
            onSetAvatar={(imageId) => setAvatar(selectedProfile.id, imageId)}
            onUploadImages={(files) => uploadImages(selectedProfile.id, files)}
            onUpdateProfile={(data) => handleUpdateProfile(selectedProfile.id, data)}
            onUpdateCropData={(cropData) => updateCropData(selectedProfile.id, cropData)}
            onReorderImages={(imageIds) => reorderImages(selectedProfile.id, imageIds)}
            onDeleteProfile={() => {
              handleDeleteProfile(selectedProfile.id);
              setView('list');
            }}
          />
        );
        
      case 'add':
        return <AddProfilePage onBack={() => setView('list')} onAddProfile={handleAddProfile} />;
        
      case 'gallery':
        return (
          <GalleryView
            images={allImages}
            onBack={() => setView('list')}
            folderName={connectionState.folderName || 'Photo Gallery'}
            onDeleteImage={handleDeleteImageFromGallery}
          />
        );
        
      case 'list':
      default:
        return (
          <HomePage 
            profiles={profiles} 
            onViewProfile={handleViewProfile} 
            onAddProfile={handleQuickAddProfile} 
            onLoadFromFolder={handleLoadFromFolder}
            onViewGallery={allImages.length > 0 ? handleViewGallery : undefined}
            onDisconnectFolder={connectionState.isConnected ? handleDisconnectFolder : undefined}
            serviceStatus={{
              isReady: connectionState.isConnected,
              isSupported: isSupported,
              connectedFolder: connectionState.folderName
            }}
          />
        );
    }
  };

  return <div className="min-h-screen bg-gray-900">{renderView()}</div>;
};

export default App;