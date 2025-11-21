/**
 * ProfileService - Manages profile data and operations
 * Handles profile creation, updating, deletion, and metadata management
 */

import { Profile, LocalImage, CropData } from '../types';
import FileSystemService from './FileSystemService';
import ImageService from './ImageService';

export interface ProfileMetadata {
  id: string;
  name: string;
  note: string;
  avatarId?: string;
  avatarCropData?: CropData;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
}

export class ProfileService {
  private static instance: ProfileService;
  private fileService: FileSystemService;
  private imageService: ImageService;
  private rootDirectoryHandle: FileSystemDirectoryHandle | null = null;

  constructor() {
    this.fileService = FileSystemService.getInstance();
    this.imageService = ImageService.getInstance();
  }

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  /**
   * Initialize the profile service with root directory
   */
  async initialize(): Promise<boolean> {
    try {
      this.rootDirectoryHandle = await this.fileService.getPhotoStorageDirectory();
      return this.rootDirectoryHandle !== null;
    } catch (error) {
      console.error('Error initializing ProfileService:', error);
      return false;
    }
  }

  /**
   * Create a new profile
   */
  async createProfile(name: string, note: string, avatarFile?: File, imageFiles: File[] = []): Promise<Profile | null> {
    if (!this.rootDirectoryHandle) {
      throw new Error('ProfileService not initialized');
    }

    try {
      const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const profileHandle = await this.fileService.createProfileDirectory(this.rootDirectoryHandle, name);
      
      if (!profileHandle) {
        throw new Error('Failed to create profile directory');
      }

      let avatarId = '';
      const images: LocalImage[] = [];

      // Save avatar if provided
      if (avatarFile) {
        const avatarFileName = await this.fileService.saveImageToProfile(profileHandle, avatarFile);
        if (avatarFileName) {
          avatarId = avatarFileName;
          
          // Create thumbnail
          await this.imageService.createThumbnail(avatarFile, profileHandle, avatarFileName);
          
          images.push({
            id: avatarFileName,
            url: URL.createObjectURL(avatarFile),
            name: avatarFileName
          });
        }
      }

      // Save additional images
      for (const imageFile of imageFiles) {
        const fileName = await this.fileService.saveImageToProfile(profileHandle, imageFile);
        if (fileName) {
          // Create thumbnail
          await this.imageService.createThumbnail(imageFile, profileHandle, fileName);
          
          images.push({
            id: fileName,
            url: URL.createObjectURL(imageFile),
            name: fileName
          });
        }
      }

      // Create metadata
      const metadata: ProfileMetadata = {
        id: profileId,
        name,
        note,
        avatarId: avatarId || (images.length > 0 ? images[0].id : ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageCount: images.length
        // Không set avatarCropData mặc định, để sử dụng default position
      };

      // Save metadata
      await this.fileService.saveProfileMetadata(profileHandle, metadata);

      // Return profile object
      const profile: Profile = {
        id: profileId,
        name,
        note,
        images,
        avatarId: metadata.avatarId
      };

      return profile;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  }

  /**
   * Load all profiles from storage
   */
  async loadAllProfiles(): Promise<Profile[]> {
    if (!this.rootDirectoryHandle) {
      console.warn('ProfileService not initialized');
      return [];
    }

    try {
      const profileNames = await this.fileService.listProfiles(this.rootDirectoryHandle);
      const profiles: Profile[] = [];

      for (const profileName of profileNames) {
        const profile = await this.loadProfile(profileName);
        if (profile) {
          profiles.push(profile);
        }
      }

      return profiles;
    } catch (error) {
      console.error('Error loading profiles:', error);
      return [];
    }
  }

  /**
   * Load a specific profile
   */
  async loadProfile(profileName: string): Promise<Profile | null> {
    if (!this.rootDirectoryHandle) {
      throw new Error('ProfileService not initialized');
    }

    try {
      const profileHandle = await this.fileService.getProfileDirectory(this.rootDirectoryHandle, profileName);
      if (!profileHandle) {
        return null;
      }

      // Load metadata
      const metadata = await this.fileService.loadProfileMetadata(profileHandle);
      if (!metadata) {
        return null;
      }

      // Load images
      const imageFileNames = await this.fileService.listProfileImages(profileHandle);
      const images: LocalImage[] = [];

      for (const fileName of imageFileNames) {
        const file = await this.fileService.getImageFile(profileHandle, fileName);
        if (file) {
          // Use filename as imageId to match imageOrder in JSON
          images.push({
            id: fileName,
            url: URL.createObjectURL(file),
            name: fileName
          });
        }
      }

      return {
        id: metadata.id,
        name: metadata.name,
        note: metadata.note,
        images,
        avatarId: metadata.avatarId || (images.length > 0 ? images[0].id : ''),
        avatarCropData: metadata.avatarCropData,
        imageOrder: metadata.imageOrder || images.map(img => img.id) // Create default imageOrder if not exist
      };
    } catch (error) {
      console.error('Error loading profile:', error);
      return null;
    }
  }

  /**
   * Update profile metadata
   */
  async updateProfile(profileId: string, profileName: string, updates: { name?: string; note?: string }): Promise<boolean> {
    if (!this.rootDirectoryHandle) {
      throw new Error('ProfileService not initialized');
    }

    try {
      const profileHandle = await this.fileService.getProfileDirectory(this.rootDirectoryHandle, profileName);
      if (!profileHandle) {
        return false;
      }

      // Load existing metadata
      const metadata = await this.fileService.loadProfileMetadata(profileHandle);
      if (!metadata) {
        return false;
      }

      // Update metadata
      const updatedMetadata = {
        ...metadata,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Save updated metadata
      return await this.fileService.saveProfileMetadata(profileHandle, updatedMetadata);
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  /**
   * Add images to an existing profile
   */
  async addImagesToProfile(profileName: string, imageFiles: File[]): Promise<LocalImage[]> {
    if (!this.rootDirectoryHandle) {
      throw new Error('ProfileService not initialized');
    }

    try {
      const profileHandle = await this.fileService.getProfileDirectory(this.rootDirectoryHandle, profileName);
      if (!profileHandle) {
        return [];
      }

      const newImages: LocalImage[] = [];

      for (const imageFile of imageFiles) {
        const fileName = await this.fileService.saveImageToProfile(profileHandle, imageFile);
        if (fileName) {
          // Create thumbnail
          await this.imageService.createThumbnail(imageFile, profileHandle, fileName);
          
          newImages.push({
            id: fileName,
            url: URL.createObjectURL(imageFile),
            name: fileName
          });
        }
      }

      // Update metadata image count correctly
      const metadata = await this.fileService.loadProfileMetadata(profileHandle);
      if (metadata) {
        // Get actual count from file system instead of incrementing
        const actualImageCount = await this.fileService.listProfileImages(profileHandle);
        metadata.imageCount = actualImageCount.length;
        metadata.updatedAt = new Date().toISOString();
        await this.fileService.saveProfileMetadata(profileHandle, metadata);
      }

      return newImages;
    } catch (error) {
      console.error('Error adding images to profile:', error);
      return [];
    }
  }

  /**
   * Remove image from profile
   */
  async removeImageFromProfile(profileName: string, fileName: string): Promise<boolean> {
    if (!this.rootDirectoryHandle) {
      throw new Error('ProfileService not initialized');
    }

    try {
      const profileHandle = await this.fileService.getProfileDirectory(this.rootDirectoryHandle, profileName);
      if (!profileHandle) {
        return false;
      }

      // Delete image and thumbnail
      const imageDeleted = await this.fileService.deleteImageFromProfile(profileHandle, fileName, 'images');
      const thumbnailDeleted = await this.fileService.deleteImageFromProfile(profileHandle, fileName, 'thumbnails');

      if (imageDeleted) {
        // Update metadata image count with actual count from file system
        const metadata = await this.fileService.loadProfileMetadata(profileHandle);
        if (metadata) {
          const actualImageCount = await this.fileService.listProfileImages(profileHandle);
          const imageOrder = actualImageCount; // Use actual filenames for order
          metadata.imageCount = actualImageCount.length;
          metadata.imageOrder = imageOrder;
          metadata.updatedAt = new Date().toISOString();
          await this.fileService.saveProfileMetadata(profileHandle, metadata);
        }
      }

      return imageDeleted;
    } catch (error) {
      console.error('Error removing image from profile:', error);
      return false;
    }
  }

  /**
   * Set profile avatar
   */
  async setProfileAvatar(profileName: string, imageId: string): Promise<boolean> {
    if (!this.rootDirectoryHandle) {
      throw new Error('ProfileService not initialized');
    }

    try {
      const profileHandle = await this.fileService.getProfileDirectory(this.rootDirectoryHandle, profileName);
      if (!profileHandle) {
        return false;
      }

      // Load metadata
      const metadata = await this.fileService.loadProfileMetadata(profileHandle);
      if (!metadata) {
        return false;
      }

      // Update avatar ID
      metadata.avatarId = imageId;
      // Không set avatarCropData mặc định, để user tự điều chỉnh nếu cần
      metadata.updatedAt = new Date().toISOString();

      // Save metadata
      return await this.fileService.saveProfileMetadata(profileHandle, metadata);
    } catch (error) {
      console.error('Error setting profile avatar:', error);
      return false;
    }
  }

  /**
   * Set profile avatar crop data
   */
  async setAvatarCropData(profileName: string, cropData: CropData): Promise<boolean> {
    if (!this.rootDirectoryHandle) {
      throw new Error('ProfileService not initialized');
    }

    try {
      const profileHandle = await this.fileService.getProfileDirectory(this.rootDirectoryHandle, profileName);
      if (!profileHandle) {
        return false;
      }

      // Load metadata
      const metadata = await this.fileService.loadProfileMetadata(profileHandle);
      if (!metadata) {
        return false;
      }

      // Update crop data with center coordinates
      metadata.avatarCropData = {
        centerX: cropData.centerX,
        centerY: cropData.centerY
      };
      metadata.updatedAt = new Date().toISOString();

      // Save metadata
      return await this.fileService.saveProfileMetadata(profileHandle, metadata);
    } catch (error) {
      console.error('Error setting avatar crop data:', error);
      return false;
    }
  }

  /**
   * Delete entire profile
   */
  async deleteProfile(profileName: string): Promise<boolean> {
    if (!this.rootDirectoryHandle) {
      throw new Error('ProfileService not initialized');
    }

    try {
      return await this.fileService.deleteProfile(this.rootDirectoryHandle, profileName);
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  }

  /**
   * Create profile from folder (for bulk import)
   */
  async createProfileFromFolder(folderName: string, files: File[]): Promise<Profile | null> {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      return null;
    }

    // Use first image as avatar
    const avatarFile = imageFiles[0];
    const otherImages = imageFiles.slice(1);

    return await this.createProfile(
      folderName,
      `Imported from folder - ${imageFiles.length} images`,
      avatarFile,
      otherImages
    );
  }

  /**
   * Check if service is properly initialized
   */
  public get isInitialized(): boolean {
    return this.rootDirectoryHandle !== null;
  }

  /**
   * Get root directory handle (for advanced operations)
   */
  public get rootHandle(): FileSystemDirectoryHandle | null {
    return this.rootDirectoryHandle;
  }
}

export default ProfileService;