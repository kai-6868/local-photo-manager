/**
 * FolderService - Manages main folder connection and profile discovery
 */

import { Profile, LocalImage, CropData } from '../types';
import FileSystemService from './FileSystemService';

export interface FolderStructure {
  mainFolderHandle: FileSystemDirectoryHandle;
  profileFolders: string[];
  isConnected: boolean;
}

export interface ProfileConfig {
  id: string;
  name: string;
  note: string;
  avatarId?: string;
  avatarCropData?: CropData;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
  imageOrder?: string[]; // Array of image IDs in display order
}

export class FolderService {
  private static instance: FolderService;
  private mainFolderHandle: FileSystemDirectoryHandle | null = null;
  private isFileSystemSupported = false;
  private fileSystemService: FileSystemService;

  constructor() {
    this.isFileSystemSupported = 'showDirectoryPicker' in window;
    this.fileSystemService = FileSystemService.getInstance();
  }

  public static getInstance(): FolderService {
    if (!FolderService.instance) {
      FolderService.instance = new FolderService();
    }
    return FolderService.instance;
  }

  /**
   * Connect to main photo folder
   */
  async connectToMainFolder(): Promise<boolean> {
    if (!this.isFileSystemSupported) {
      console.warn('File System Access API not supported');
      return false;
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      this.mainFolderHandle = dirHandle;
      console.log('Connected to main folder:', dirHandle.name);
      return true;
    } catch (error) {
      console.log('User cancelled folder selection');
      return false;
    }
  }

  /**
   * Scan main folder for profile subfolders
   */
  async scanForProfiles(): Promise<string[]> {
    if (!this.mainFolderHandle) {
      throw new Error('Main folder not connected');
    }

    try {
      const profileFolders: string[] = [];
      
      for await (const [name, handle] of this.mainFolderHandle.entries()) {
        if (handle.kind === 'directory') {
          // Check if this folder has profile.json
          try {
            const profileHandle = handle as FileSystemDirectoryHandle;
            await profileHandle.getFileHandle('profile.json');
            profileFolders.push(name);
          } catch {
            // No profile.json, skip this folder
            console.log(`Skipping folder "${name}" - no profile.json found`);
          }
        }
      }

      return profileFolders;
    } catch (error) {
      console.error('Error scanning for profiles:', error);
      return [];
    }
  }

  /**
   * Load profile configuration from profile.json
   */
  async loadProfileConfig(profileFolderName: string): Promise<ProfileConfig | null> {
    if (!this.mainFolderHandle) {
      throw new Error('Main folder not connected');
    }

    try {
      const profileHandle = await this.mainFolderHandle.getDirectoryHandle(profileFolderName);
      const configHandle = await profileHandle.getFileHandle('profile.json');
      const file = await configHandle.getFile();
      const configText = await file.text();
      return JSON.parse(configText) as ProfileConfig;
    } catch (error) {
      console.error(`Error loading profile config for "${profileFolderName}":`, error);
      return null;
    }
  }

  /**
   * Load all images from a profile folder
   */
  async loadProfileImages(profileFolderName: string): Promise<LocalImage[]> {
    if (!this.mainFolderHandle) {
      throw new Error('Main folder not connected');
    }

    try {
      const profileHandle = await this.mainFolderHandle.getDirectoryHandle(profileFolderName);
      const images: LocalImage[] = [];

      // Check if images subfolder exists
      let imagesHandle: FileSystemDirectoryHandle;
      try {
        imagesHandle = await profileHandle.getDirectoryHandle('images');
      } catch {
        // No images subfolder, scan profile folder directly
        imagesHandle = profileHandle;
      }

      for await (const [fileName, fileHandle] of imagesHandle.entries()) {
        if (fileHandle.kind === 'file' && this.isImageFile(fileName)) {
          try {
            const file = await (fileHandle as FileSystemFileHandle).getFile();
            const objectUrl = URL.createObjectURL(file);
            
            images.push({
              id: `${fileName}`,
              url: objectUrl,
              name: fileName,
              profileName: profileFolderName
            });
            
            console.log(`✅ Loaded image: ${fileName} (${Math.round(file.size / 1024)}KB)`);
          } catch (fileError) {
            console.error(`❌ Failed to load image "${fileName}":`, fileError);
            // Continue loading other images even if one fails
          }
        }
      }

      console.log(`📁 Profile "${profileFolderName}": loaded ${images.length} images`);
      return images;
    } catch (error) {
      console.error(`Error loading images from "${profileFolderName}":`, error);
      return [];
    }
  }

  /**
   * Load complete profile data
   */
  async loadProfile(profileFolderName: string): Promise<Profile | null> {
    try {
      const config = await this.loadProfileConfig(profileFolderName);
      if (!config) return null;

      const images = await this.loadProfileImages(profileFolderName);
      
      // Use avatar from config only, don't auto-assign
      let avatarId = config.avatarId || '';

      // Sort images according to imageOrder if it exists
      let sortedImages = images;
      if (config.imageOrder && config.imageOrder.length > 0) {
        console.log(`📋 Found imageOrder in config:`, config.imageOrder);
        console.log(`📁 Loaded images:`, images.map(img => img.name));
        
        // Sort images according to imageOrder
        sortedImages = config.imageOrder
          .map(imageId => images.find(img => img.id === imageId))
          .filter(Boolean) as LocalImage[];
        
        // Add any images not in imageOrder to the end (newly added images)
        const imagesNotInOrder = images.filter(img => !config.imageOrder?.includes(img.id));
        sortedImages.push(...imagesNotInOrder);
        
        console.log(`🔄 Images sorted by imageOrder:`, sortedImages.map(img => img.name));
        console.log(`🆕 Images not in order (added to end):`, imagesNotInOrder.map(img => img.name));
      } else {
        console.log(`📋 No imageOrder found, using default order`);
      }

      return {
        id: config.id,
        name: config.name,
        note: config.note,
        images: sortedImages,
        avatarId,
        avatarCropData: config.avatarCropData,
        imageOrder: config.imageOrder || sortedImages.map(img => img.id) // Use sorted images for default order
      };
    } catch (error) {
      console.error(`Error loading complete profile "${profileFolderName}":`, error);
      return null;
    }
  }

  /**
   * Load all profiles from main folder
   */
  async loadAllProfiles(): Promise<Profile[]> {
    try {
      console.log('📂 FolderService: Starting to load all profiles...');
      const profileFolderNames = await this.scanForProfiles();
      console.log('📁 Found profile folders:', profileFolderNames);
      
      const profiles: Profile[] = [];

      for (const folderName of profileFolderNames) {
        console.log(`📄 Loading profile from folder: ${folderName}`);
        const profile = await this.loadProfile(folderName);
        if (profile) {
          profiles.push(profile);
          console.log(`✅ Successfully loaded profile: ${profile.name} (${profile.images.length} images)`);
        } else {
          console.warn(`⚠️ Failed to load profile from folder: ${folderName}`);
        }
      }

      console.log(`📊 FolderService: Loaded ${profiles.length} profiles total`);
      return profiles;
    } catch (error) {
      console.error('❌ FolderService: Error loading all profiles:', error);
      return [];
    }
  }

  /**
   * Load all images from all profiles (for gallery view)
   */
  async loadAllImages(): Promise<LocalImage[]> {
    try {
      const profileFolderNames = await this.scanForProfiles();
      const allImages: LocalImage[] = [];

      for (const folderName of profileFolderNames) {
        const images = await this.loadProfileImages(folderName);
        allImages.push(...images);
      }

      return allImages;
    } catch (error) {
      console.error('Error loading all images:', error);
      return [];
    }
  }

  /**
   * Get folder structure info
   */
  async getFolderStructure(): Promise<FolderStructure | null> {
    if (!this.mainFolderHandle) {
      return null;
    }

    try {
      const profileFolders = await this.scanForProfiles();
      return {
        mainFolderHandle: this.mainFolderHandle,
        profileFolders,
        isConnected: true
      };
    } catch (error) {
      console.error('Error getting folder structure:', error);
      return null;
    }
  }

  /**
   * Utility: Check if file is an image
   */
  private isImageFile(fileName: string): boolean {
    const imageExtensions = [
      '.jpg', '.jpeg', '.jpe', '.jif', '.jfif', '.jfi',
      '.png', '.gif', '.webp', '.tiff', '.tif', '.psd', 
      '.raw', '.arw', '.cr2', '.nrw', '.k25', '.bmp', 
      '.dib', '.heif', '.heic', '.ind', '.indd', '.indt',
      '.jp2', '.j2k', '.jpf', '.jpx', '.jpm', '.mj2',
      '.svg', '.svgz', '.ai', '.eps', '.ico'
    ];
    
    if (!fileName || typeof fileName !== 'string') {
      return false;
    }
    
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    const isImage = imageExtensions.includes(extension);
    
    if (isImage) {
      console.log(`🖼️ Detected image file: ${fileName} (${extension})`);
    }
    
    return isImage;
  }

  /**
   * Check if main folder is connected
   */
  get isConnected(): boolean {
    return this.mainFolderHandle !== null;
  }

  /**
   * Get main folder name
   */
  get folderName(): string {
    return this.mainFolderHandle?.name || 'Not connected';
  }

  /**
   * Check if File System API is supported
   */
  get isSupported(): boolean {
    return this.isFileSystemSupported;
  }

  /**
   * Disconnect from folder
   */
  disconnect(): void {
    this.mainFolderHandle = null;
  }

  /**
   * Delete an image file from a profile
   */
  async deleteImageFile(profileFolderName: string, fileName: string): Promise<boolean> {
    if (!this.mainFolderHandle) {
      throw new Error('Main folder not connected');
    }

    try {
      const profileHandle = await this.mainFolderHandle.getDirectoryHandle(profileFolderName);
      
      // Check if images subfolder exists
      let imagesHandle: FileSystemDirectoryHandle;
      try {
        imagesHandle = await profileHandle.getDirectoryHandle('images');
      } catch {
        // No images subfolder, use profile folder directly
        imagesHandle = profileHandle;
      }

      // Delete the image file
      await imagesHandle.removeEntry(fileName);
      console.log(`🗑️ Deleted image file: ${fileName} from ${profileFolderName}`);
      
      // Update imageCount and imageOrder in profile metadata after deletion
      const remainingImages = await this.loadProfileImages(profileFolderName);
      const imageOrder = remainingImages.map(img => img.name);
      await this.updateProfileMetadata(profileFolderName, {
        imageCount: remainingImages.length,
        imageOrder: imageOrder
      });
      
      return true;
    } catch (error) {
      console.error(`Error deleting image "${fileName}" from "${profileFolderName}":`, error);
      return false;
    }
  }

  /**
   * Delete entire profile folder and all its contents
   */
  async deleteProfile(profileFolderName: string): Promise<boolean> {
    if (!this.mainFolderHandle) {
      throw new Error('Main folder not connected');
    }

    try {
      // Delete the entire profile directory
      await this.mainFolderHandle.removeEntry(profileFolderName, { recursive: true });
      console.log(`🗑️ Deleted profile folder: ${profileFolderName}`);
      return true;
    } catch (error) {
      console.error(`Error deleting profile "${profileFolderName}":`, error);
      return false;
    }
  }

  /**
   * Update profile metadata in profile.json
   */
  async updateProfileMetadata(profileFolderName: string, updates: Partial<ProfileConfig>): Promise<boolean> {
    if (!this.mainFolderHandle) {
      throw new Error('Main folder not connected');
    }

    try {
      const profileHandle = await this.mainFolderHandle.getDirectoryHandle(profileFolderName);
      
      // Load current config
      const configHandle = await profileHandle.getFileHandle('profile.json');
      const file = await configHandle.getFile();
      const currentConfig = JSON.parse(await file.text()) as ProfileConfig;
      
      // Merge updates
      const updatedConfig: ProfileConfig = {
        ...currentConfig,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Write back to file
      const writable = await configHandle.createWritable();
      await writable.write(JSON.stringify(updatedConfig, null, 2));
      await writable.close();
      
      console.log(`✅ Successfully updated profile metadata for: ${profileFolderName}`);
      return true;
    } catch (error) {
      console.error(`❌ Error updating profile metadata for "${profileFolderName}":`, error);
      return false;
    }
  }

  /**
   * Rename profile folder and update metadata
   */
  async renameProfileFolder(oldFolderName: string, newFolderName: string, profileData: Partial<ProfileConfig>): Promise<boolean> {
    if (!this.mainFolderHandle) {
      throw new Error('Main folder not connected');
    }

    try {
      console.log(`🔄 Starting folder rename: "${oldFolderName}" → "${newFolderName}"`);
      
      // Sanitize new folder name
      const sanitizedNewName = newFolderName.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
      
      // Validate new name
      if (!sanitizedNewName || sanitizedNewName.trim() === '') {
        throw new Error('Invalid folder name');
      }
      
      // Check if trying to rename to same name
      if (oldFolderName === sanitizedNewName) {
        console.log('📝 Same folder name, just updating metadata');
        return await this.updateProfileMetadata(oldFolderName, profileData);
      }
      
      // Check if new folder name already exists
      try {
        await this.mainFolderHandle.getDirectoryHandle(sanitizedNewName);
        throw new Error(`Folder "${sanitizedNewName}" already exists`);
      } catch (error) {
        // Good! Folder doesn't exist, we can proceed
        if (error.message.includes('already exists')) {
          throw error;
        }
      }

      // Get old folder handle
      const oldProfileHandle = await this.mainFolderHandle.getDirectoryHandle(oldFolderName);
      
      // Create new folder
      const newProfileHandle = await this.mainFolderHandle.getDirectoryHandle(sanitizedNewName, { create: true });
      
      try {
        // Copy all contents from old to new folder
        await this.copyFolderContents(oldProfileHandle, newProfileHandle);
        
        // Update metadata in new folder
        await this.updateProfileMetadata(sanitizedNewName, {
          ...profileData,
          name: newFolderName,
          updatedAt: new Date().toISOString()
        });
        
        // Delete old folder
        await this.mainFolderHandle.removeEntry(oldFolderName, { recursive: true });
        
        console.log(`✅ Folder successfully renamed: "${oldFolderName}" → "${sanitizedNewName}"`);
        return true;
      } catch (copyError) {
        // Cleanup: remove new folder if copy failed
        try {
          await this.mainFolderHandle.removeEntry(sanitizedNewName, { recursive: true });
          console.log('🧹 Cleaned up incomplete folder after error');
        } catch (cleanupError) {
          console.error('Failed to cleanup incomplete folder:', cleanupError);
        }
        throw copyError;
      }
    } catch (error) {
      console.error(`Error renaming folder "${oldFolderName}" to "${newFolderName}":`, error);
      return false;
    }
  }

  /**
   * Copy all contents from source folder to destination folder
   */
  private async copyFolderContents(sourceHandle: FileSystemDirectoryHandle, destHandle: FileSystemDirectoryHandle): Promise<void> {
    for await (const [name, handle] of sourceHandle.entries()) {
      if (handle.kind === 'file') {
        // Copy file
        const sourceFile = await (handle as FileSystemFileHandle).getFile();
        const destFileHandle = await destHandle.getFileHandle(name, { create: true });
        const writable = await destFileHandle.createWritable();
        await writable.write(sourceFile);
        await writable.close();
        console.log(`📄 Copied file: ${name}`);
      } else if (handle.kind === 'directory') {
        // Copy directory recursively
        const sourceDirHandle = handle as FileSystemDirectoryHandle;
        const destDirHandle = await destHandle.getDirectoryHandle(name, { create: true });
        await this.copyFolderContents(sourceDirHandle, destDirHandle);
        console.log(`📁 Copied directory: ${name}`);
      }
    }
  }

  /**
   * Add new images to a profile with timestamp filenames
   */
  async addImagesToProfile(profileFolderName: string, files: File[]): Promise<LocalImage[]> {
    if (!this.mainFolderHandle) {
      throw new Error('Main folder not connected');
    }

    try {
      const profileHandle = await this.mainFolderHandle.getDirectoryHandle(profileFolderName);
      
      // Ensure images subfolder exists
      const imagesHandle = await profileHandle.getDirectoryHandle('images', { create: true });
      
      const newImages: LocalImage[] = [];
      
      for (const file of files) {
        try {
          // Use FileSystemService to save with timestamp filename
          const timestampFileName = await this.fileSystemService.saveImageToProfile(profileHandle, file, 'images');
          
          if (timestampFileName) {
            newImages.push({
              id: `${timestampFileName}`,
              url: URL.createObjectURL(file),
              name: timestampFileName,
              profileName: profileFolderName
            });
            
            console.log(`✅ Added image with timestamp: ${timestampFileName} to ${profileFolderName}`);
          } else {
            console.error(`❌ Failed to save image with timestamp: ${file.name}`);
          }
        } catch (fileError) {
          console.error(`❌ Failed to add image "${file.name}":`, fileError);
        }
      }
      
      // Update image count and imageOrder in profile metadata
      const currentImages = await this.loadProfileImages(profileFolderName);
      
      // Load current metadata to get existing imageOrder
      const currentConfig = await this.loadProfileConfig(profileFolderName);
      let updatedImageOrder: string[] = [];
      
      if (currentConfig && currentConfig.imageOrder) {
        // Keep existing order and add new images at the end
        updatedImageOrder = [...currentConfig.imageOrder];
        
        // Add any new images not already in imageOrder
        const newImageNames = newImages.map(img => img.name);
        const imagesToAdd = newImageNames.filter(name => !updatedImageOrder.includes(name));
        updatedImageOrder.push(...imagesToAdd);
        
        console.log(`📋 Preserved existing imageOrder and added ${imagesToAdd.length} new images:`, imagesToAdd);
      } else {
        // No existing imageOrder, create new one with all images
        updatedImageOrder = currentImages.map(img => img.name);
        console.log(`📋 Created new imageOrder with all images`);
      }
      
      await this.updateProfileMetadata(profileFolderName, {
        imageCount: currentImages.length, 
        imageOrder: updatedImageOrder
      });
      
      console.log(`✅ Updated metadata: imageCount=${currentImages.length}, imageOrder length=${updatedImageOrder.length}`);
      
      return newImages;
    } catch (error) {
      console.error(`Error adding images to profile "${profileFolderName}":`, error);
      return [];
    }
  }

}

export default FolderService;