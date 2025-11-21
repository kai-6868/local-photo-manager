/**
 * Utility functions for managing object URLs and memory cleanup
 */

import { Profile, LocalImage } from '../types';

/**
 * Revoke object URLs for a profile's images
 */
export const revokeProfileImageUrls = (profile: Profile): void => {
  profile.images.forEach(image => {
    if (image.url.startsWith('blob:')) {
      URL.revokeObjectURL(image.url);
    }
  });
};

/**
 * Revoke object URLs for an array of images
 */
export const revokeImageUrls = (images: LocalImage[]): void => {
  images.forEach(image => {
    if (image.url.startsWith('blob:')) {
      URL.revokeObjectURL(image.url);
    }
  });
};

/**
 * Cleanup object URLs from profiles array
 */
export const cleanupProfileUrls = (profiles: Profile[]): void => {
  profiles.forEach(profile => {
    revokeProfileImageUrls(profile);
  });
};

/**
 * Create object URL and track for cleanup
 */
export const createTrackedObjectUrl = (file: File): string => {
  return URL.createObjectURL(file);
};