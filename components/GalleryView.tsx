import React, { useState, useMemo, useEffect } from 'react';
import { LocalImage } from '../types';
import { SearchIcon, ArrowLeftIcon, ImageIcon, TrashIcon } from './icons';
import Lightbox from './Lightbox';
import ImageWithFallback from './ImageWithFallback';

interface GalleryViewProps {
  images: LocalImage[];
  onBack: () => void;
  folderName: string;
  onDeleteImage?: (imageId: string) => void;
}

interface ImageWithDimensions extends LocalImage {
  aspectRatio?: number;
  height?: number;
}

// Optimize column count calculation
const getColumnCount = () => {
  if (typeof window === 'undefined') return 2;
  const width = window.innerWidth;
  
  if (width >= 1440) return 6;
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  return 2;
};

const GalleryView: React.FC<GalleryViewProps> = ({ images, onBack, folderName, onDeleteImage }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>('all');
  const [imagesWithDimensions, setImagesWithDimensions] = useState<ImageWithDimensions[]>(
    images.map(img => ({ ...img, aspectRatio: 1, height: 300 }))
  );
  const [columnCount, setColumnCount] = useState(getColumnCount);

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

  useEffect(() => {
    if (images.length === 0) {
      setImagesWithDimensions([]);
      return;
    }

    // Set basic images immediately
    const basicImages = images.map(img => ({ ...img, aspectRatio: 1, height: 300 }));
    setImagesWithDimensions(basicImages);
    
    // Load actual dimensions asynchronously
    Promise.all(
      images.map(image => 
        new Promise<ImageWithDimensions>(resolve => {
          const img = new Image();
          const timeout = setTimeout(() => resolve({ ...image, aspectRatio: 1, height: 300 }), 3000);
          
          img.onload = () => {
            clearTimeout(timeout);
            resolve({
              ...image,
              aspectRatio: img.naturalWidth / img.naturalHeight,
              height: Math.floor(250 + Math.random() * 200)
            });
          };
          
          img.onerror = () => {
            clearTimeout(timeout);
            resolve({ ...image, aspectRatio: 1, height: 300 });
          };
          
          img.src = image.url;
        })
      )
    ).then(setImagesWithDimensions).catch(() => {});
  }, [images]);

  const profileNames = useMemo(() => {
    const profiles = new Set(images.map(img => img.profileName).filter(Boolean));
    return Array.from(profiles) as string[];
  }, [images]);

  const filteredImages = useMemo(() => {
    let filtered = imagesWithDimensions;

    // Filter by profile
    if (selectedProfile !== 'all') {
      filtered = filtered.filter(img => img.profileName === selectedProfile);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(img =>
        img.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (img.profileName && img.profileName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [imagesWithDimensions, selectedProfile, searchTerm]);

  const balanceImagesInColumns = useMemo(() => {
    if (columnCount <= 0 || filteredImages.length === 0) {
      return Array.from({ length: Math.max(columnCount, 1) }, () => []);
    }
    
    const columns: ImageWithDimensions[][] = Array.from({ length: columnCount }, () => []);
    const columnHeights = Array(columnCount).fill(0);
    
    // Calculate column width for height estimation
    const containerPadding = 32;
    const maxWidth = typeof window !== 'undefined' 
      ? (window.innerWidth < 1280 ? window.innerWidth - containerPadding : 1200)
      : 1200;
    const gapTotal = (columnCount - 1) * 16;
    const columnWidth = Math.max((maxWidth - gapTotal) / columnCount, 150);
    
    filteredImages.forEach(image => {
      const minHeightIndex = columnHeights.indexOf(Math.min(...columnHeights));
      columns[minHeightIndex].push(image);
      
      const imageHeight = image.aspectRatio && image.aspectRatio > 0 
        ? columnWidth / image.aspectRatio 
        : 200;
      columnHeights[minHeightIndex] += Math.max(imageHeight, 120) + 16;
    });
    
    return columns;
  }, [filteredImages, columnCount]);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
            <span>Back to Profiles</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Gallery <span className="text-cyan-400">View</span>
            </h1>
            <p className="text-gray-400 mt-1">
              {folderName} • {filteredImages.length} images
            </p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search images or profiles..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-full py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Profile Filter */}
        {profileNames.length > 0 && (
          <select
            value={selectedProfile}
            onChange={e => setSelectedProfile(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-full py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Profiles ({images.length})</option>
            {profileNames.map(profileName => (
              <option key={profileName} value={profileName}>
                {profileName} ({images.filter(img => img.profileName === profileName).length})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Gallery */}
      {imagesWithDimensions.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h2 className="text-2xl text-gray-400 mb-2">No images found</h2>
          <p className="text-gray-500">
            {searchTerm || selectedProfile !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No images available to display.'}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-400">
            Showing {filteredImages.length} of {images.length} images
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {balanceImagesInColumns.map((column, columnIndex) => (
              <div key={`column-${columnIndex}`} className="flex flex-col gap-4">
                {column.map((image, imageIndex) => {
                  const globalIndex = filteredImages.findIndex(img => img.id === image.id);
                  const imageKey = `${image.id}-${columnIndex}-${imageIndex}`;
                  
                  // Handle invalid images
                  if (!image.url?.trim()) {
                    return (
                      <div key={`error-${imageKey}`} className="bg-red-900/50 p-4 rounded-lg text-red-300 text-sm border border-red-500">
                        <div className="font-semibold">⚠️ Invalid Image</div>
                        <div className="text-xs mt-1">{image.name}</div>
                      </div>
                    );
                  }
                  
                  return (
                    <div
                      key={imageKey}
                      className="group relative cursor-pointer overflow-hidden rounded-lg bg-gray-800 shadow-lg transition-all duration-300 hover:shadow-cyan-500/30 hover:scale-[1.02] min-h-[120px]"
                      onClick={() => handleImageClick(globalIndex)}
                    >
                      <ImageWithFallback
                        src={image.url}
                        alt={image.name}
                        className="w-full h-auto block transition-transform duration-300 group-hover:scale-110"
                      />
                      
                      {/* Delete Button */}
                      {onDeleteImage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteImage(image.id);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                          title="Delete image"
                        >
                          <TrashIcon className="w-4 h-4 text-white" />
                        </button>
                      )}
                      
                      {/* Text Overlay */}
                      <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-black/60 backdrop-blur-sm p-2 text-white">
                          <p className="text-sm font-medium truncate">{image.name}</p>
                          {image.profileName && (
                            <p className="text-xs text-gray-300 truncate">{image.profileName}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Lightbox */}
      {selectedImageIndex !== null && (
        <Lightbox
          images={filteredImages}
          currentIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
          onDelete={onDeleteImage}
        />
      )}
    </div>
  );
};

export default GalleryView;