/**
 * Photo grid component with drag and drop reordering
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Profile, LocalImage } from '../../types';
import { UserIcon, TrashIcon } from '../icons';
import ImageWithFallback from '../ImageWithFallback';
import { getColumnCount, distributeImagesInColumns } from '../../utils/imageLayoutUtils';
import { useImageReordering } from '../../hooks/useImageReordering';

interface PhotoGridProps {
  profile: Profile;
  images: LocalImage[];
  onImageClick: (index: number) => void;
  onDeleteImage: (imageId: string) => void;
  onSetAvatar: (imageId: string) => void;
  onReorderImages?: (imageIds: string[]) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({
  profile,
  images,
  onImageClick,
  onDeleteImage,
  onSetAvatar,
  onReorderImages
}) => {
  const [columnCount, setColumnCount] = useState(getColumnCount);

  // Handle responsive column count
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newColumnCount = getColumnCount();
        if (newColumnCount !== columnCount) {
          setColumnCount(newColumnCount);
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [columnCount]);

  // Distribute images in columns
  const distributedColumns = useMemo(() => {
    return distributeImagesInColumns(images, columnCount);
  }, [images, columnCount]);

  // Image reordering functionality
  const {
    draggedImageId,
    insertionIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  } = useImageReordering(images, onReorderImages);

  if (images.length === 0) {
    return (
      <div className="text-center py-20">
        <UserIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
        <h3 className="text-xl text-gray-400 mb-2">No images yet</h3>
        <p className="text-gray-500">Upload some images to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {distributedColumns.map((column, columnIndex) => (
        <div key={`column-${columnIndex}`} className="flex flex-col gap-4">
          {column.map((image, imageIndex) => {
            // Calculate global index for drag & drop logic
            const globalIndex = images.findIndex(img => img.id === image.id);
            const imageKey = `${profile.id}-${image.id}-${columnIndex}-${imageIndex}`;
            
            return (
              <div key={imageKey} className="relative">
                {/* Insertion indicators */}
                {insertionIndex === 0 && globalIndex === 0 && (
                  <div className="absolute -left-2 top-0 w-1 h-full bg-cyan-400 rounded-full z-50 animate-pulse shadow-lg shadow-cyan-400/50">
                    <div className="absolute -top-2 -left-1 w-3 h-3 bg-cyan-400 rounded-full"></div>
                    <div className="absolute -bottom-2 -left-1 w-3 h-3 bg-cyan-400 rounded-full"></div>
                  </div>
                )}
                
                {insertionIndex === globalIndex + 1 && (
                  <div className="absolute -right-2 top-0 w-1 h-full bg-cyan-400 rounded-full z-50 animate-pulse shadow-lg shadow-cyan-400/50">
                    <div className="absolute -top-2 -left-1 w-3 h-3 bg-cyan-400 rounded-full"></div>
                    <div className="absolute -bottom-2 -left-1 w-3 h-3 bg-cyan-400 rounded-full"></div>
                  </div>
                )}
                
                <div 
                  draggable
                  onDragStart={(e) => handleDragStart(e, image.id)}
                  onDragOver={(e) => handleDragOver(e, globalIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  className={`group relative cursor-pointer overflow-hidden rounded-lg bg-gray-800 shadow-lg transition-all duration-300 hover:shadow-cyan-500/30 hover:scale-[1.02] min-h-[120px] ${
                    draggedImageId === image.id 
                      ? 'opacity-50 scale-95 rotate-2 z-10' 
                      : ''
                  }`}
                  onClick={() => onImageClick(globalIndex)}
                >
                  <ImageWithFallback
                    src={image.url}
                    alt={image.name}
                    className="w-full h-auto block transition-transform duration-300 group-hover:scale-110"
                  />
                  
                  {/* Avatar Badge */}
                  {profile.avatarId === image.id && (
                    <div className="absolute top-2 right-2 bg-cyan-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg z-20 flex items-center gap-1 opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                      <UserIcon className="w-3 h-3" />
                      <span>Avatar</span>
                    </div>
                  )}
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteImage(image.id);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30"
                    title="Delete image"
                  >
                    <TrashIcon className="w-4 h-4 text-white" />
                  </button>
                  
                  {/* Drag Handle */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
                    <div className="w-6 h-6 bg-black/70 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing">
                      <span className="text-white text-xs">⋮⋮</span>
                    </div>
                  </div>
                  
                  {/* Text Overlay */}
                  <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-black/60 backdrop-blur-sm p-2 text-white">
                      <p className="text-sm font-medium truncate">{image.name}</p>
                      {profile.avatarId === image.id && (
                        <p className="text-xs text-cyan-300 truncate">Current Avatar</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default PhotoGrid;