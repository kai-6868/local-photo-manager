
export interface CropData {
  centerX: number; // Center X coordinate on original image (pixels)
  centerY: number; // Center Y coordinate on original image (pixels)
}

export interface LocalImage {
  id: string;
  url: string; 
  name: string;
  profileName?: string; // Optional: which profile this image belongs to
}

export interface Profile {
  id: string;
  name: string;
  note: string;
  avatarId: string;
  avatarCropData?: CropData; // Crop information for avatar
  images: LocalImage[];
  imageOrder?: string[]; // Order of images for display
}
