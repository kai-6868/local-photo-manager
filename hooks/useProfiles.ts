/**
 * Hook for managing profiles state and operations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Profile, LocalImage, CropData } from '../types';
import { ProfileDataService, NewProfileData } from '../services/ProfileDataService';
import { MockDataService } from '../services/MockDataService';
import { generateUniqueProfileName } from '../utils/profileNameUtils';
import { revokeProfileImageUrls, cleanupProfileUrls } from '../utils/objectUrlUtils';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allImages, setAllImages] = useState<LocalImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize profiles
  const initializeProfiles = useCallback(async (isFileSystemSupported: boolean) => {
    try {
      setIsLoading(true);
      const initialProfiles = await ProfileDataService.initializeProfiles(isFileSystemSupported);
      setProfiles(initialProfiles);
    } catch (error) {
      console.error('Error initializing profiles:', error);
      const mockData = await MockDataService.generateMockProfiles();
      setProfiles(mockData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load profiles from folder connection
  const loadProfilesFromFolder = useCallback((newProfiles: Profile[], newImages: LocalImage[]) => {
    setProfiles(newProfiles);
    setAllImages(newImages);
  }, []);

  // Reset to mock data
  const resetToMockData = useCallback(async () => {
    const mockData = await MockDataService.generateMockProfiles();
    setProfiles(mockData);
    setAllImages([]);
  }, []);

  // Create quick profile
  const createQuickProfile = useCallback((): Profile => {
    const profileName = generateUniqueProfileName(profiles);
    const newProfile = ProfileDataService.createEmptyProfile(profileName);
    
    setProfiles(prev => [newProfile, ...prev]);
    return newProfile;
  }, [profiles]);

  // Add full profile
  const addProfile = useCallback((data: NewProfileData): Profile => {
    const newProfile = ProfileDataService.createProfileFromData(data);
    setProfiles(prev => [newProfile, ...prev]);
    return newProfile;
  }, []);

  // Update profile
  const updateProfile = useCallback((id: string, data: { name: string; note: string }) => {
    setProfiles(prev => ProfileDataService.updateProfile(prev, id, data));
  }, []);

  // Delete profile
  const deleteProfile = useCallback((id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (profile) {
      revokeProfileImageUrls(profile);
      setProfiles(prev => ProfileDataService.deleteProfile(prev, id));
      setAllImages(prev => prev.filter(img => 
        img.profileName !== profile.name
      ));
    }
  }, [profiles]);

  // Update crop data
  const updateCropData = useCallback((profileId: string, cropData: CropData) => {
    setProfiles(prev => prev.map(p => 
      p.id === profileId ? { ...p, avatarCropData: cropData } : p
    ));
  }, []);

  // Delete image
  const deleteImage = useCallback((profileId: string, imageId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    const image = profile?.images.find(img => img.id === imageId);
    
    if (image?.url.startsWith('blob:')) {
      URL.revokeObjectURL(image.url);
    }
    
    setProfiles(prev => ProfileDataService.removeImageFromProfile(prev, profileId, imageId));
    setAllImages(prev => prev.filter(img => img.id !== imageId));
  }, [profiles]);

  // Set avatar
  const setAvatar = useCallback((profileId: string, imageId: string) => {
    setProfiles(prev => ProfileDataService.setProfileAvatar(prev, profileId, imageId));
  }, []);

  // Upload images
  const uploadImages = useCallback((profileId: string, files: File[]) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return [];
    
    const newImages = ProfileDataService.createLocalImages(files, profile.name);
    setProfiles(prev => ProfileDataService.addImagesToProfile(prev, profileId, newImages));
    setAllImages(prev => [...prev, ...newImages]);
    
    return newImages;
  }, [profiles]);

  // Reorder images
  const reorderImages = useCallback((profileId: string, imageIds: string[]) => {
    let updatedProfile: Profile | null = null;
    
    setProfiles(prev => {
      const updated = ProfileDataService.reorderProfileImages(prev, profileId, imageIds);
      updatedProfile = updated.find(p => p.id === profileId) || null;
      return updated;
    });

    // Update allImages array to maintain consistency
    if (updatedProfile) {
      setAllImages(prev => {
        const otherImages = prev.filter(img => 
          !updatedProfile!.images.some(profImg => profImg.id === img.id)
        );
        return [...otherImages, ...updatedProfile!.images];
      });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupProfileUrls(profiles);
      setAllImages(prev => {
        prev.forEach(image => {
          if (image.url.startsWith('blob:')) {
            URL.revokeObjectURL(image.url);
          }
        });
        return [];
      });
    };
  }, []); // Only run on unmount

  return {
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
  };
};