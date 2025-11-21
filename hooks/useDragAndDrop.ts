/**
 * Hook for drag and drop file upload functionality
 */

import React, { useState, useCallback, useEffect } from 'react';

interface DragDropState {
  isDragging: boolean;
}

export const useDragAndDrop = (
  onFilesDropped: (files: FileList) => void
) => {
  const [state, setState] = useState<DragDropState>({
    isDragging: false
  });

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragging: true }));
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragging: false }));
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragging: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesDropped(e.dataTransfer.files);
    }
  }, [onFilesDropped]);

  return {
    isDragging: state.isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};