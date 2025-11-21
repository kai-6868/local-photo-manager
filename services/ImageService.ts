/**
 * ImageService - Handles image processing operations
 * Thumbnail generation, resizing, format conversion, and image optimization
 */

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export class ImageService {
  private static instance: ImageService;

  public static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  /**
   * Create thumbnail for an image and save to profile thumbnails folder
   */
  async createThumbnail(
    imageFile: File,
    profileHandle: FileSystemDirectoryHandle,
    fileName: string,
    maxSize: number = 200
  ): Promise<boolean> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      // Load image
      const img = await this.loadImage(imageFile);
      
      // Calculate thumbnail dimensions
      const { width, height } = this.calculateThumbnailSize(img.width, img.height, maxSize);
      
      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      const thumbnailBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail blob'));
          }
        }, 'image/jpeg', 0.8);
      });

      // Create file from blob using the same timestamped filename
      const thumbnailFile = new File([thumbnailBlob], fileName, { type: 'image/jpeg' });

      // Save to thumbnails folder using the same filename as main image
      const thumbnailsHandle = await profileHandle.getDirectoryHandle('thumbnails');
      const thumbnailHandle = await thumbnailsHandle.getFileHandle(fileName, { create: true });
      const writable = await thumbnailHandle.createWritable();
      await writable.write(thumbnailFile);
      await writable.close();

      return true;
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      return false;
    }
  }

  /**
   * Resize image with specified options
   */
  async resizeImage(file: File, options: ImageProcessingOptions): Promise<File | null> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      // Load image
      const img = await this.loadImage(file);
      
      // Calculate new dimensions
      const { width, height } = this.calculateResizeSize(
        img.width,
        img.height,
        options.maxWidth,
        options.maxHeight
      );
      
      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with specified format and quality
      const format = options.format || 'jpeg';
      const quality = options.quality || 0.9;
      const mimeType = `image/${format}`;

      const resizedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to resize image'));
          }
        }, mimeType, quality);
      });

      // Create new file
      const extension = format === 'jpeg' ? '.jpg' : `.${format}`;
      const newFileName = this.changeFileExtension(file.name, extension);
      
      return new File([resizedBlob], newFileName, { type: mimeType });
    } catch (error) {
      console.error('Error resizing image:', error);
      return null;
    }
  }

  /**
   * Compress image by reducing quality
   */
  async compressImage(file: File, quality: number = 0.8): Promise<File | null> {
    return this.resizeImage(file, { quality, format: 'jpeg' });
  }

  /**
   * Convert image format
   */
  async convertFormat(file: File, targetFormat: 'jpeg' | 'png' | 'webp'): Promise<File | null> {
    return this.resizeImage(file, { format: targetFormat });
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
    try {
      const img = await this.loadImage(file);
      return { width: img.width, height: img.height };
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return null;
    }
  }

  /**
   * Extract image metadata/EXIF data
   */
  async extractMetadata(file: File): Promise<any> {
    try {
      // Basic metadata
      const metadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified),
        dimensions: await this.getImageDimensions(file)
      };

      // For more advanced EXIF extraction, you would use a library like piexifjs
      // For now, return basic metadata
      return metadata;
    } catch (error) {
      console.error('Error extracting metadata:', error);
      return {};
    }
  }

  /**
   * Create image preview/data URL
   */
  async createPreview(file: File, maxSize: number = 400): Promise<string | null> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      // Load image
      const img = await this.loadImage(file);
      
      // Calculate preview dimensions
      const { width, height } = this.calculateThumbnailSize(img.width, img.height, maxSize);
      
      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Return data URL
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Error creating preview:', error);
      return null;
    }
  }

  /**
   * Batch process multiple images
   */
  async batchProcess(
    files: File[],
    operation: 'thumbnail' | 'resize' | 'compress' | 'convert',
    options: any = {}
  ): Promise<File[]> {
    const processedFiles: File[] = [];

    for (const file of files) {
      try {
        let processedFile: File | null = null;

        switch (operation) {
          case 'resize':
            processedFile = await this.resizeImage(file, options);
            break;
          case 'compress':
            processedFile = await this.compressImage(file, options.quality);
            break;
          case 'convert':
            processedFile = await this.convertFormat(file, options.format);
            break;
          default:
            processedFile = file;
        }

        if (processedFile) {
          processedFiles.push(processedFile);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    return processedFiles;
  }

  /**
   * Validate if file is a valid image
   */
  isValidImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    return validTypes.includes(file.type);
  }

  /**
   * Get supported image formats
   */
  getSupportedFormats(): string[] {
    return ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
  }

  // Private helper methods

  private async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private calculateThumbnailSize(width: number, height: number, maxSize: number): { width: number; height: number } {
    if (width <= maxSize && height <= maxSize) {
      return { width, height };
    }

    const ratio = Math.min(maxSize / width, maxSize / height);
    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio)
    };
  }

  private calculateResizeSize(
    width: number,
    height: number,
    maxWidth?: number,
    maxHeight?: number
  ): { width: number; height: number } {
    if (!maxWidth && !maxHeight) {
      return { width, height };
    }

    let newWidth = width;
    let newHeight = height;

    if (maxWidth && width > maxWidth) {
      newWidth = maxWidth;
      newHeight = (height * maxWidth) / width;
    }

    if (maxHeight && newHeight > maxHeight) {
      newWidth = (newWidth * maxHeight) / newHeight;
      newHeight = maxHeight;
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    };
  }

  private changeFileExtension(fileName: string, newExtension: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return fileName + newExtension;
    }
    return fileName.substring(0, lastDotIndex) + newExtension;
  }
}

export default ImageService;