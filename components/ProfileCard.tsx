
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Profile } from '../types';
import { UserIcon, ImageIcon } from './icons';

interface ProfileCardProps {
  profile: Profile;
  onView: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onView }) => {
  const avatar = profile.images.find(img => img.id === profile.avatarId);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle image load to get dimensions
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setImageDimensions({ width: naturalWidth, height: naturalHeight });
    }
  }, []);

  // Update container dimensions
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);
  
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg bg-gray-800 shadow-lg transition-all duration-300 hover:shadow-cyan-500/30 hover:-translate-y-1 w-full aspect-square"
      onClick={onView}
    >
      <div className="w-full h-full overflow-hidden" ref={containerRef}>
        {avatar ? (
          <img
            ref={imageRef}
            src={avatar.url}
            alt={profile.name}
            className="absolute top-0 left-0 transition-transform duration-300 group-hover:scale-110"
            style={(() => {
              if (imageDimensions.width === 0 || containerDimensions.width === 0) {
                return { width: '100%', height: '100%', objectFit: 'cover' as const };
              }
              
              const containerWidth = containerDimensions.width;
              const containerHeight = containerDimensions.height;
              
              // Simple object-cover logic for square containers
              const scaleX = containerWidth / imageDimensions.width;
              const scaleY = containerHeight / imageDimensions.height;
              const scale = Math.max(scaleX, scaleY);
              
              // Get crop center from avatarCropData or default to center
              const centerX = profile.avatarCropData?.centerX ?? imageDimensions.width / 2;
              const centerY = profile.avatarCropData?.centerY ?? imageDimensions.height / 2;
              
              // Position image to show cropped area
              const scaledCenterX = centerX * scale;
              const scaledCenterY = centerY * scale;
              const translateX = containerWidth / 2 - scaledCenterX;
              const translateY = containerHeight / 2 - scaledCenterY;
              
              return {
                width: `${imageDimensions.width * scale}px`,
                height: `${imageDimensions.height * scale}px`,
                transform: `translate(${translateX}px, ${translateY}px)`
              };
            })()}
            onLoad={handleImageLoad}
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full bg-gray-700">
            <UserIcon className="w-16 h-16 text-gray-500 mb-2" />
            <span className="text-xs text-gray-400">No Avatar</span>
          </div>
        )}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
      
      <div className="absolute inset-x-0 bottom-0 p-2.5 text-white flex flex-col justify-end">
        <h3 className="font-bold text-lg truncate mb-0.5">{profile.name}</h3>
        <div className="flex items-center text-xs text-gray-300">
            <ImageIcon className="w-4 h-4 mr-1" />
            <span>{profile.images.length}</span>
        </div>
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-white font-semibold py-2 px-4 border-2 border-white rounded-full bg-black/30 backdrop-blur-sm">
          View
        </span>
      </div>
    </div>
  );
};

export default ProfileCard;
