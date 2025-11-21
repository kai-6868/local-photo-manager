import React, { useState, useEffect } from 'react';
import { ImageIcon } from './icons';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  onError?: (error: string) => void;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallbackIcon,
  onError 
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  useEffect(() => {
    if (src !== imageSrc) {
      setImageSrc(src);
      setImageState('loading');
      setHasAttemptedLoad(false);
    }
  }, [src, imageSrc, alt]);

  const handleImageLoad = () => {
    setImageState('loaded');
    setHasAttemptedLoad(true);
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.target as HTMLImageElement;
    
    if (!hasAttemptedLoad || target.src === imageSrc) {
      setImageState('error');
      setHasAttemptedLoad(true);
      
      if (onError) {
        onError(`Failed to load image: ${imageSrc}`);
      }
    }
  };

  const renderFallback = () => (
    <div className={`flex flex-col items-center justify-center bg-gray-700 min-h-[120px] ${className}`}>
      {fallbackIcon || <ImageIcon className="w-12 h-12 text-gray-500 mb-2" />}
      <div className="text-center px-2">
        <div className="text-white text-xs font-medium mb-1">
          {imageState === 'error' ? 'Load Error' : 'Loading...'}
        </div>
        <div className="text-gray-400 text-xs truncate max-w-[150px]">
          {alt}
        </div>
        {imageState === 'error' && (
          <div className="text-red-300 text-xs mt-1 truncate max-w-[150px]">
            URL: {src.length > 30 ? src.substring(0, 30) + '...' : src}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative w-full">
      {imageState !== 'error' && imageSrc && (
        <img
          key={`img-${imageSrc}`} // Stable key based on source
          src={imageSrc}
          alt={alt}
          className={`${className} ${imageState === 'loading' ? 'opacity-75' : 'opacity-100'} transition-opacity duration-200 w-full h-auto display-block`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          style={{ 
            maxWidth: '100%', 
            height: 'auto',
            display: 'block',
            visibility: 'visible' // Always visible, use opacity for loading
          }}
        />
      )}
      
      {imageState === 'loading' && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-700/50 backdrop-blur-sm min-h-[120px]`}>
          <div className="animate-pulse flex flex-col items-center">
            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
            <div className="text-xs text-gray-300">Loading...</div>
          </div>
        </div>
      )}
      
      {imageState === 'error' && renderFallback()}
    </div>
  );
};

export default ImageWithFallback;