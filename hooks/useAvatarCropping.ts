/**
 * Hook for avatar cropping functionality
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CropData } from '../types';
import { ImageDimensions, ContainerDimensions, calculateCropConstraints } from '../utils/cropCalculationUtils';

interface AvatarCroppingState {
  isDragging: boolean;
  activeCropData: CropData | null;
  imageDimensions: ImageDimensions;
  containerDimensions: ContainerDimensions;
  lastMousePos: { x: number; y: number };
}

export const useAvatarCropping = (
  profileId: string,
  initialCropData?: CropData,
  onUpdateCropData?: (cropData: CropData) => void
) => {
  const [state, setState] = useState<AvatarCroppingState>({
    isDragging: false,
    activeCropData: null,
    imageDimensions: { width: 0, height: 0 },
    containerDimensions: { width: 320, height: 320 },
    lastMousePos: { x: 0, y: 0 }
  });

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle image load to get dimensions
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setState(prev => ({
        ...prev,
        imageDimensions: { width: naturalWidth, height: naturalHeight }
      }));
    }
  }, []);

  // Update container dimensions when size changes
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setState(prev => ({
          ...prev,
          containerDimensions: { width: rect.width, height: rect.height }
        }));
      }
    };

    updateContainerSize();
    const timer = setTimeout(updateContainerSize, 100);
    
    window.addEventListener('resize', updateContainerSize);
    return () => {
      window.removeEventListener('resize', updateContainerSize);
      clearTimeout(timer);
    };
  }, [profileId]);

  // Reset states when profile changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      imageDimensions: { width: 0, height: 0 },
      containerDimensions: { width: 320, height: 320 },
      isDragging: false,
      activeCropData: null
    }));
  }, [profileId]);

  // Handle pointer down
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (state.imageDimensions.width === 0 || state.containerDimensions.width === 0) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const currentCrop = initialCropData || {
      centerX: state.imageDimensions.width / 2,
      centerY: state.imageDimensions.height / 2
    };

    setState(prev => ({
      ...prev,
      isDragging: true,
      lastMousePos: { x: e.clientX, y: e.clientY },
      activeCropData: currentCrop
    }));
    
    (e.target as Element).setPointerCapture(e.pointerId);
  }, [state.imageDimensions, state.containerDimensions, initialCropData]);

  // Handle pointer move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!state.isDragging || !state.activeCropData || state.imageDimensions.width === 0) {
      return;
    }
    
    e.preventDefault();

    const deltaX = e.clientX - state.lastMousePos.x;
    const deltaY = e.clientY - state.lastMousePos.y;
    
    const constraints = calculateCropConstraints(state.imageDimensions, state.containerDimensions);
    const { scale, canMoveX, canMoveY, minCenterX, maxCenterX, minCenterY, maxCenterY } = constraints;
    
    const sensitivity = 1.2;
    const deltaOnImageX = canMoveX ? (deltaX / scale) * sensitivity : 0;
    const deltaOnImageY = canMoveY ? (deltaY / scale) * sensitivity : 0;

    const newCenterX = Math.max(minCenterX, Math.min(maxCenterX, state.activeCropData.centerX - deltaOnImageX));
    const newCenterY = Math.max(minCenterY, Math.min(maxCenterY, state.activeCropData.centerY - deltaOnImageY));

    setState(prev => ({
      ...prev,
      activeCropData: { centerX: newCenterX, centerY: newCenterY },
      lastMousePos: { x: e.clientX, y: e.clientY }
    }));
  }, [state.isDragging, state.activeCropData, state.lastMousePos, state.imageDimensions, state.containerDimensions]);

  // Handle pointer up
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (state.activeCropData && onUpdateCropData) {
      onUpdateCropData(state.activeCropData);
    }
    
    setState(prev => ({
      ...prev,
      isDragging: false,
      activeCropData: null
    }));
    
    (e.target as Element).releasePointerCapture(e.pointerId);
  }, [state.activeCropData, onUpdateCropData]);

  return {
    imageRef,
    containerRef,
    isDragging: state.isDragging,
    activeCropData: state.activeCropData,
    imageDimensions: state.imageDimensions,
    containerDimensions: state.containerDimensions,
    handleImageLoad,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};