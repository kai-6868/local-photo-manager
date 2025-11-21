/**
 * Hook for image reordering functionality via drag and drop
 */

import React, { useState, useCallback } from 'react';
import { LocalImage } from '../types';

interface ImageReorderingState {
  draggedImageId: string | null;
  insertionIndex: number | null;
}

export const useImageReordering = (
  images: LocalImage[],
  onReorderImages?: (imageIds: string[]) => void
) => {
  const [state, setState] = useState<ImageReorderingState>({
    draggedImageId: null,
    insertionIndex: null
  });

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, imageId: string) => {
    setState(prev => ({ ...prev, draggedImageId: imageId }));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, globalIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!state.draggedImageId) return;
    
    // Get mouse position relative to the image element
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const imageWidth = rect.width;
    
    // Simple insertion point based on mouse position
    let insertIndex;
    if (mouseX < imageWidth / 2) {
      insertIndex = globalIndex;
    } else {
      insertIndex = globalIndex + 1;
    }
    
    // Don't show insertion point if it's the same as current position
    const draggedIndex = images.findIndex(img => img.id === state.draggedImageId);
    if (insertIndex === draggedIndex || insertIndex === draggedIndex + 1) {
      setState(prev => ({ ...prev, insertionIndex: null }));
    } else {
      setState(prev => ({ ...prev, insertionIndex: insertIndex }));
    }
  }, [state.draggedImageId, images]);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const relatedTarget = e.relatedTarget as Element;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setState(prev => ({ ...prev, insertionIndex: null }));
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!state.draggedImageId || state.insertionIndex === null) {
      setState(prev => ({ ...prev, draggedImageId: null, insertionIndex: null }));
      return;
    }
    
    const draggedIndex = images.findIndex(img => img.id === state.draggedImageId);
    if (draggedIndex === -1) {
      setState(prev => ({ ...prev, draggedImageId: null, insertionIndex: null }));
      return;
    }

    // Create new array with insertion logic
    const newOrderedImages = [...images];
    const [draggedImage] = newOrderedImages.splice(draggedIndex, 1);
    
    // Adjust insertion index if needed (when removing item before insertion point)
    const adjustedInsertionIndex = state.insertionIndex > draggedIndex 
      ? state.insertionIndex - 1 
      : state.insertionIndex;
    
    newOrderedImages.splice(adjustedInsertionIndex, 0, draggedImage);
    
    setState(prev => ({ ...prev, draggedImageId: null, insertionIndex: null }));

    // Notify parent component
    if (onReorderImages) {
      onReorderImages(newOrderedImages.map(img => img.id));
    }
  }, [state.draggedImageId, state.insertionIndex, images, onReorderImages]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setState(prev => ({ ...prev, draggedImageId: null, insertionIndex: null }));
  }, []);

  return {
    draggedImageId: state.draggedImageId,
    insertionIndex: state.insertionIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  };
};