/**
 * Utility functions for image layout and responsive calculations
 */

import { LocalImage } from '../types';

/**
 * Calculate responsive column count based on window width
 */
export const getColumnCount = (): number => {
  if (typeof window === 'undefined') return 2;
  const width = window.innerWidth;
  
  if (width >= 1440) return 6;
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  return 2;
};

/**
 * Distribute images across columns sequentially (masonry-style)
 */
export const distributeImagesInColumns = (images: LocalImage[], columnCount: number): LocalImage[][] => {
  if (columnCount <= 0 || images.length === 0) {
    return Array.from({ length: Math.max(columnCount, 1) }, () => []);
  }
  
  const columns: LocalImage[][] = Array.from({ length: columnCount }, () => []);
  
  // Distribute images sequentially: column 0, 1, 2, ..., then back to 0
  images.forEach((image, index) => {
    const columnIndex = index % columnCount;
    columns[columnIndex].push(image);
  });
  
  return columns;
};