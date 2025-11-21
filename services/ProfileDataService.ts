/**
 * Service for managing profile data operations
 */

import { Profile, LocalImage } from '../types';
import { MockDataService } from './MockDataService';
import { createTrackedObjectUrl } from '../utils/objectUrlUtils';

export interface NewProfileData {
  name: string;
  note: string;
  avatar: File;
  images: File[];
}

export class ProfileDataService {
  /**
   * Create local images from files
   */
  static createLocalImages(files: File[], profileName?: string): LocalImage[] {
    return files.map(file => ({
      id: `img_${Date.now()}_${Math.random()}`,
      url: createTrackedObjectUrl(file),
      name: file.name,
      profileName
    }));
  }

  /**
   * Create profile from form data (in-memory mode)
   */
  static createProfileFromData(data: NewProfileData): Profile {
    const allFiles = [data.avatar, ...data.images];
    const newImages = this.createLocalImages(allFiles);

    return {
      id: `profile_${Date.now()}_${Math.random()}`,
      name: data.name,
      note: data.note,
      images: newImages,
      avatarId: newImages.length > 0 ? newImages[0].id : ''
    };
  }

  /**
   * Create empty profile with auto-generated name
   */
  static createEmptyProfile(name: string): Profile {
    return {
      id: `profile_${Date.now()}_${Math.random()}`,
      name,
      note: '',
      images: [],
      avatarId: ''
    };
  }

  /**
   * Update profile data
   */
  static updateProfile(
    profiles: Profile[], 
    profileId: string, 
    updates: { name: string; note: string }
  ): Profile[] {
    return profiles.map(p => 
      p.id === profileId ? { ...p, ...updates } : p
    );
  }

  /**
   * Delete profile by ID
   */
  static deleteProfile(profiles: Profile[], profileId: string): Profile[] {
    return profiles.filter(p => p.id !== profileId);
  }

  /**
   * Add images to profile
   */
  static addImagesToProfile(
    profiles: Profile[],
    profileId: string,
    newImages: LocalImage[]
  ): Profile[] {
    return profiles.map(p => 
      p.id === profileId 
        ? { ...p, images: [...p.images, ...newImages] }
        : p
    );
  }

  /**
   * Remove image from profile
   */
  static removeImageFromProfile(
    profiles: Profile[],
    profileId: string,
    imageId: string
  ): Profile[] {
    return profiles.map(p => {
      if (p.id === profileId) {
        const updatedImages = p.images.filter(img => img.id !== imageId);
        let newAvatarId = p.avatarId;
        
        // If deleted image was avatar, set new avatar
        if (p.avatarId === imageId && updatedImages.length > 0) {
          newAvatarId = updatedImages[0].id;
        }
        
        return { ...p, images: updatedImages, avatarId: newAvatarId };
      }
      return p;
    });
  }

  /**
   * Set avatar for profile
   */
  static setProfileAvatar(
    profiles: Profile[],
    profileId: string,
    imageId: string
  ): Profile[] {
    return profiles.map(p => 
      p.id === profileId ? { ...p, avatarId: imageId } : p
    );
  }

  /**
   * Reorder images in profile
   */
  static reorderProfileImages(
    profiles: Profile[],
    profileId: string,
    imageIds: string[]
  ): Profile[] {
    return profiles.map(profile => {
      if (profile.id === profileId) {
        const reorderedImages = imageIds.map(id => 
          profile.images.find(img => img.id === id)
        ).filter(Boolean) as LocalImage[];
        
        return { ...profile, images: reorderedImages };
      }
      return profile;
    });
  }

  /**
   * Initialize app with appropriate data source
   */
  static async initializeProfiles(isFileSystemSupported: boolean): Promise<Profile[]> {
    if (!isFileSystemSupported) {
      return await MockDataService.generateMockProfiles();
    }
    
    // For supported browsers, start with mock data
    return await MockDataService.generateMockProfiles();
  }
}