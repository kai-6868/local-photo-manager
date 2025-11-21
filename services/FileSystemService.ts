/**
 * FileSystemService - Handles local file system operations
 * For web browsers, we'll use File System Access API (where supported)
 * Falls back to download/upload for unsupported browsers
 */

export interface FileHandle {
  name: string;
  kind: 'file' | 'directory';
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
}

export class FileSystemService {
  private static instance: FileSystemService;
  private isFileSystemAccessSupported = false;

  constructor() {
    // Check if File System Access API is supported
    this.isFileSystemAccessSupported = 'showDirectoryPicker' in window;
  }

  public static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  /**
   * Initialize or get access to the photo storage directory
   * Returns null if user cancels or API not supported
   */
  async getPhotoStorageDirectory(): Promise<FileSystemDirectoryHandle | null> {
    try {
      if (!this.isFileSystemAccessSupported) {
        console.warn('File System Access API not supported');
        return null;
      }

      // Request directory access from user
      const dirHandle = await (window as any).showDirectoryPicker();
      return dirHandle;
    } catch (error) {
      // User cancelled or other error
      console.log('Directory access cancelled or failed:', error);
      return null;
    }
  }

  /**
   * Create a new profile directory
   */
  async createProfileDirectory(parentHandle: FileSystemDirectoryHandle, profileName: string): Promise<FileSystemDirectoryHandle | null> {
    try {
      const sanitizedName = this.sanitizeFileName(profileName);
      const profileHandle = await parentHandle.getDirectoryHandle(sanitizedName, { create: true });
      
      // Create subdirectories
      await profileHandle.getDirectoryHandle('images', { create: true });
      await profileHandle.getDirectoryHandle('thumbnails', { create: true });
      
      return profileHandle;
    } catch (error) {
      console.error('Error creating profile directory:', error);
      return null;
    }
  }

  /**
   * Save profile metadata as JSON file
   */
  async saveProfileMetadata(profileHandle: FileSystemDirectoryHandle, metadata: any): Promise<boolean> {
    try {
      const metadataHandle = await profileHandle.getFileHandle('profile.json', { create: true });
      const writable = await metadataHandle.createWritable();
      await writable.write(JSON.stringify(metadata, null, 2));
      await writable.close();
      return true;
    } catch (error) {
      console.error('Error saving metadata:', error);
      return false;
    }
  }

  /**
   * Load profile metadata from JSON file
   */
  async loadProfileMetadata(profileHandle: FileSystemDirectoryHandle): Promise<any | null> {
    try {
      const metadataHandle = await profileHandle.getFileHandle('profile.json');
      const file = await metadataHandle.getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('Error loading metadata:', error);
      return null;
    }
  }

  /**
   * Save image file to profile directory with timestamp filename
   */
  async saveImageToProfile(profileHandle: FileSystemDirectoryHandle, file: File, subfolder: 'images' | 'thumbnails' = 'images'): Promise<string | null> {
    try {
      const imagesHandle = await profileHandle.getDirectoryHandle(subfolder);
      const timestampFileName = this.generateTimestampFileName(file.name);
      const imageHandle = await imagesHandle.getFileHandle(timestampFileName, { create: true });
      
      const writable = await imageHandle.createWritable();
      await writable.write(file);
      await writable.close();
      
      return timestampFileName;
    } catch (error) {
      console.error('Error saving image:', error);
      return null;
    }
  }

  /**
   * Delete image from profile directory
   */
  async deleteImageFromProfile(profileHandle: FileSystemDirectoryHandle, fileName: string, subfolder: 'images' | 'thumbnails' = 'images'): Promise<boolean> {
    try {
      const imagesHandle = await profileHandle.getDirectoryHandle(subfolder);
      await imagesHandle.removeEntry(fileName);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * List all images in profile directory
   */
  async listProfileImages(profileHandle: FileSystemDirectoryHandle, subfolder: 'images' | 'thumbnails' = 'images'): Promise<string[]> {
    try {
      const imagesHandle = await profileHandle.getDirectoryHandle(subfolder);
      const imageFiles: string[] = [];
      
      for await (const [name, handle] of imagesHandle.entries()) {
        if (handle.kind === 'file' && this.isImageFile(name)) {
          imageFiles.push(name);
        }
      }
      
      return imageFiles;
    } catch (error) {
      console.error('Error listing images:', error);
      return [];
    }
  }

  /**
   * Get image file from profile directory
   */
  async getImageFile(profileHandle: FileSystemDirectoryHandle, fileName: string, subfolder: 'images' | 'thumbnails' = 'images'): Promise<File | null> {
    try {
      const imagesHandle = await profileHandle.getDirectoryHandle(subfolder);
      const imageHandle = await imagesHandle.getFileHandle(fileName);
      return await imageHandle.getFile();
    } catch (error) {
      console.error('Error getting image file:', error);
      return null;
    }
  }

  /**
   * List all profile directories
   */
  async listProfiles(rootHandle: FileSystemDirectoryHandle): Promise<string[]> {
    try {
      const profiles: string[] = [];
      
      for await (const [name, handle] of rootHandle.entries()) {
        if (handle.kind === 'directory') {
          profiles.push(name);
        }
      }
      
      return profiles;
    } catch (error) {
      console.error('Error listing profiles:', error);
      return [];
    }
  }

  /**
   * Get profile directory handle
   */
  async getProfileDirectory(rootHandle: FileSystemDirectoryHandle, profileName: string): Promise<FileSystemDirectoryHandle | null> {
    try {
      const sanitizedName = this.sanitizeFileName(profileName);
      return await rootHandle.getDirectoryHandle(sanitizedName);
    } catch (error) {
      console.error('Error getting profile directory:', error);
      return null;
    }
  }

  /**
   * Delete entire profile directory
   */
  async deleteProfile(rootHandle: FileSystemDirectoryHandle, profileName: string): Promise<boolean> {
    try {
      const sanitizedName = this.sanitizeFileName(profileName);
      await rootHandle.removeEntry(sanitizedName, { recursive: true });
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  }

  /**
   * Generate filename with timestamp and file extension
   */
  private generateTimestampFileName(originalFileName: string): string {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/T/, '_')
      .replace(/:/g, '')
      .replace(/-/g, '')
      .split('.')[0]; // Format: YYYYMMDD_HHMMSS
    
    // Get file extension from original filename
    const lastDotIndex = originalFileName.lastIndexOf('.');
    const extension = lastDotIndex !== -1 ? originalFileName.substring(lastDotIndex) : '.jpg';
    
    return `${timestamp}${extension}`;
  }

  /**
   * Utility: Sanitize file/folder names
   */
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 255);
  }

  /**
   * Utility: Check if file is an image
   */
  private isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return imageExtensions.includes(extension);
  }

  /**
   * Check if File System Access API is supported
   */
  public get isSupported(): boolean {
    return this.isFileSystemAccessSupported;
  }
}

export default FileSystemService;