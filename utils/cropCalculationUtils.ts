/**
 * Utility functions for crop calculations and avatar positioning
 */

import { CropData } from '../types';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ContainerDimensions {
  width: number;
  height: number;
}

/**
 * Calculate crop transform style for avatar display
 */
export const calculateCropTransform = (
  imageDimensions: ImageDimensions,
  containerDimensions: ContainerDimensions,
  cropData?: CropData
): Record<string, string | number> => {
  if (imageDimensions.width === 0 || containerDimensions.width === 0) return {};
  
  const { width: containerWidth, height: containerHeight } = containerDimensions;
  const imageAspectRatio = imageDimensions.width / imageDimensions.height;
  
  let scale;
  if (imageAspectRatio > 1) {
    scale = containerHeight / imageDimensions.height;
  } else if (imageAspectRatio < 1) {
    scale = containerWidth / imageDimensions.width;
  } else {
    scale = Math.min(containerWidth / imageDimensions.width, containerHeight / imageDimensions.height);
  }
  
  const centerX = cropData?.centerX ?? imageDimensions.width / 2;
  const centerY = cropData?.centerY ?? imageDimensions.height / 2;
  
  const scaledCenterX = centerX * scale;
  const scaledCenterY = centerY * scale;
  const translateX = containerWidth / 2 - scaledCenterX;
  const translateY = containerHeight / 2 - scaledCenterY;
  
  return {
    width: `${imageDimensions.width * scale}px`,
    height: `${imageDimensions.height * scale}px`,
    transform: `translate(${translateX}px, ${translateY}px)`
  };
};

/**
 * Calculate movement constraints for cropping
 */
export const calculateCropConstraints = (
  imageDimensions: ImageDimensions,
  containerDimensions: ContainerDimensions
) => {
  const imageAspectRatio = imageDimensions.width / imageDimensions.height;
  const { width: containerWidth, height: containerHeight } = containerDimensions;
  
  let scale, canMoveX, canMoveY;
  if (imageAspectRatio > 1) {
    // Landscape: fit height, allow horizontal movement
    scale = containerHeight / imageDimensions.height;
    canMoveX = true;
    canMoveY = false;
  } else if (imageAspectRatio < 1) {
    // Portrait: fit width, allow vertical movement
    scale = containerWidth / imageDimensions.width;
    canMoveX = false;
    canMoveY = true;
  } else {
    // Square: fit both, no movement
    scale = Math.min(containerWidth / imageDimensions.width, containerHeight / imageDimensions.height);
    canMoveX = false;
    canMoveY = false;
  }
  
  // Calculate boundaries
  const halfContainerWidthOnImage = (containerWidth / 2) / scale;
  const halfContainerHeightOnImage = (containerHeight / 2) / scale;
  
  let minCenterX, maxCenterX, minCenterY, maxCenterY;
  if (canMoveX) {
    minCenterX = halfContainerWidthOnImage;
    maxCenterX = imageDimensions.width - halfContainerWidthOnImage;
    minCenterY = maxCenterY = imageDimensions.height / 2;
  } else if (canMoveY) {
    minCenterY = halfContainerHeightOnImage;
    maxCenterY = imageDimensions.height - halfContainerHeightOnImage;
    minCenterX = maxCenterX = imageDimensions.width / 2;
  } else {
    minCenterX = maxCenterX = imageDimensions.width / 2;
    minCenterY = maxCenterY = imageDimensions.height / 2;
  }
  
  return {
    scale,
    canMoveX,
    canMoveY,
    minCenterX,
    maxCenterX,
    minCenterY,
    maxCenterY
  };
};