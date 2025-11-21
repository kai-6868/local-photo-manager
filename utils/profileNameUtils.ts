/**
 * Utility functions for profile name operations
 */

import { Profile } from '../types';

/**
 * Generate unique profile name from existing profiles
 */
export const generateUniqueProfileName = (existingProfiles: Profile[]): string => {
  const baseName = 'newprofile';
  const existingNames = existingProfiles.map(p => p.name.toLowerCase());
  
  // Check if base name is available
  if (!existingNames.includes(baseName)) {
    return baseName;
  }
  
  // Find the next available number
  let counter = 1;
  let candidateName = `${baseName}(${counter})`;
  
  while (existingNames.includes(candidateName.toLowerCase())) {
    counter++;
    candidateName = `${baseName}(${counter})`;
  }
  
  return candidateName;
};

/**
 * Sanitize profile name for file system
 */
export const sanitizeProfileName = (name: string): string => {
  return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
};

/**
 * Validate profile name
 */
export const validateProfileName = (name: string): { isValid: boolean; message?: string } => {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { isValid: false, message: 'Profile name cannot be empty' };
  }
  
  const invalidChars = /[<>:"/\\|?*]/g;
  const hasInvalidChars = invalidChars.test(trimmedName);
  
  if (hasInvalidChars) {
    return { 
      isValid: true, 
      message: `Profile name contains special characters that will be replaced with underscores in the folder name.`
    };
  }
  
  return { isValid: true };
};