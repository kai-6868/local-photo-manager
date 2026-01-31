
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Profile } from '../types';
import { UserIcon, ImageIcon } from './icons';

interface ProfileCardProps {
  profile: Profile;
  onView: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onView }) => {
  // Safety check for profile
  if (!profile || !profile.id || !profile.name) {
    console.error('❌ Invalid profile data:', profile);
    return (
      <div className="aspect-square bg-gray-800 rounded-xl p-4 flex items-center justify-center border border-red-500">
        <div className="text-center">
          <UserIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-xs text-red-400">Invalid Profile</p>
        </div>
      </div>
    );
  }

  const avatar = profile.images?.find(img => img.id === profile.avatarId);
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
              const imageWidth = imageDimensions.width;
              const imageHeight = imageDimensions.height;

              const imageAspectRatio = imageWidth / imageHeight;

              let scaledImageWidth: number;
              let scaledImageHeight: number;
              let scale: number;

              // BƯỚC 1: Tính kích thước ảnh sau khi scale (fit theo chiều ngắn hơn)
              if (imageAspectRatio > 1) {
                // Ảnh ngang: fit theo chiều cao container
                scale = containerHeight / imageHeight;
                scaledImageHeight = containerHeight;
                scaledImageWidth = imageWidth * scale;
              } else {
                // Ảnh dọc hoặc vuông: fit theo chiều rộng container
                scale = containerWidth / imageWidth;
                scaledImageWidth = containerWidth;
                scaledImageHeight = imageHeight * scale;
              }

              // BƯỚC 2: Xác định vị trí hiển thị
              let translateX = 0;
              let translateY = 0;

              if (profile.avatarCropData) {
                // CÓ CROP DATA: sử dụng vị trí user customize
                const originalCenterX = profile.avatarCropData.centerX;
                const originalCenterY = profile.avatarCropData.centerY;

                // Chuyển center sang ảnh đã scale
                const scaledCenterX = originalCenterX * scale;
                const scaledCenterY = originalCenterY * scale;

                // Tính translate để center này hiển thị ở giữa container
                translateX = containerWidth / 2 - scaledCenterX;
                translateY = containerHeight / 2 - scaledCenterY;

                // Giới hạn translate không vượt quá biên container
                translateX = Math.min(0, Math.max(containerWidth - scaledImageWidth, translateX));
                translateY = Math.min(0, Math.max(containerHeight - scaledImageHeight, translateY));
              } else {
                // KHÔNG CÓ CROP DATA: Sử dụng default center cho container vuông
                
                if (imageAspectRatio > 1) {
                  // Ảnh ngang: hiển thị vùng giữa theo chiều cao (container vuông)
                  const defaultCenterX = imageHeight / 2;  // Trung tâm vùng vuông
                  const defaultCenterY = imageHeight / 2;
                  
                  const scaledCenterX = defaultCenterX * scale;
                  const scaledCenterY = defaultCenterY * scale;
                  
                  translateX = containerWidth / 2 - scaledCenterX;
                  translateY = containerHeight / 2 - scaledCenterY;
                } else {
                  // Ảnh dọc/vuông: hiển thị vùng giữa theo chiều rộng (container vuông)
                  const defaultCenterX = imageWidth / 2;   // Trung tâm vùng vuông
                  const defaultCenterY = imageWidth / 2;
                  
                  const scaledCenterX = defaultCenterX * scale;
                  const scaledCenterY = defaultCenterY * scale;
                  
                  translateX = containerWidth / 2 - scaledCenterX;
                  translateY = containerHeight / 2 - scaledCenterY;
                }
              }

              // Trả về style
              return {
                width: `${scaledImageWidth}px`,
                height: `${scaledImageHeight}px`,
                transform: `translate(${translateX}px, ${translateY}px)`,
                maxWidth: 'none',  // Đảm bảo không bị CSS constrain width  
                minWidth: '0',     // Đảm bảo có thể scale tự do
                flexShrink: '0'    // Không cho flex shrink
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
