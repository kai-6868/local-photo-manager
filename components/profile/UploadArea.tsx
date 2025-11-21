/**
 * Upload area component with drag and drop functionality
 */

import React, { useRef } from 'react';
import { UploadIcon } from '../icons';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

interface UploadAreaProps {
  onFilesSelected: (files: FileList) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onFilesSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useDragAndDrop(
    onFilesSelected
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <>
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-6 flex items-center justify-center text-gray-500 text-center flex-col p-8 cursor-pointer hover:bg-gray-800/50 hover:text-gray-400 transition-colors border-2 border-dashed rounded-lg ${
          isDragging ? 'border-cyan-500 bg-gray-800/50' : 'border-gray-600 hover:border-gray-500'
        }`}
        onClick={handleClick}
      >
        <UploadIcon className="w-12 h-12 mb-3"/>
        <span className="text-lg font-medium">Drag & Drop or click to Upload</span>
        <span className="text-sm text-gray-600 mt-1">Add more images to your gallery</span>
        <span className="text-xs text-gray-500 mt-2">
          💡 Tip: Drag to reorder • Paste images: Ctrl+V
        </span>
      </div>
      
      <input 
        ref={fileInputRef}
        type="file" 
        multiple 
        onChange={handleFileInputChange} 
        className="hidden" 
        accept="image/*" 
      />
    </>
  );
};

export default UploadArea;