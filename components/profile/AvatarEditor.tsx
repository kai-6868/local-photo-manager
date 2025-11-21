/**
 * Avatar editor component with crop functionality
 */

import React, { useMemo } from 'react';
import { Profile, CropData } from '../../types';
import { UserIcon } from '../icons';
import { useAvatarCropping } from '../../hooks/useAvatarCropping';
import { calculateCropTransform } from '../../utils/cropCalculationUtils';

interface AvatarEditorProps {
  profile: Profile;
  onUpdateCropData?: (cropData: CropData) => void;
}

const AvatarEditor: React.FC<AvatarEditorProps> = ({
  profile,
  onUpdateCropData
}) => {
  const avatar = useMemo(() => 
    profile.images.find(img => img.id === profile.avatarId),
    [profile.images, profile.avatarId]
  );

  const {
    imageRef,
    containerRef,
    isDragging,
    activeCropData,
    imageDimensions,
    containerDimensions,
    handleImageLoad,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  } = useAvatarCropping(profile.id, profile.avatarCropData, onUpdateCropData);

  const cropStyle = useMemo(() => {
    const cropData = isDragging && activeCropData ? activeCropData : profile.avatarCropData;
    return calculateCropTransform(imageDimensions, containerDimensions, cropData);
  }, [imageDimensions, containerDimensions, isDragging, activeCropData, profile.avatarCropData]);

  if (!avatar) {
    return (
      <div className="w-full aspect-square bg-gray-800 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-700">
        <UserIcon className="w-24 h-24 text-gray-600 mb-4"/>
        <p className="text-gray-500 text-center">
          No avatar selected
          <br />
          <span className="text-sm">Choose an image from gallery below</span>
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-square overflow-hidden rounded-2xl shadow-lg cursor-move select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="w-full h-full overflow-hidden">
        <img
          ref={imageRef}
          src={avatar.url}
          alt={profile.name}
          className="absolute top-0 left-0"
          style={cropStyle}
          onLoad={handleImageLoad}
          draggable={false}
        />
      </div>
      
      {/* Visual crop boundaries overlay */}
      {isDragging && imageDimensions.width > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Crop area outline */}
          <div 
            className="absolute border-2 border-cyan-400 border-dashed rounded"
            style={{
              left: '0px',
              top: '0px', 
              width: `${containerDimensions.width}px`,
              height: `${containerDimensions.height}px`,
              boxShadow: 'inset 0 0 0 2px rgba(34, 211, 238, 0.2)'
            }}
          />
          {/* Center crosshair */}
          <div 
            className="absolute w-4 h-4 -ml-2 -mt-2 border border-cyan-400 rounded-full bg-cyan-400/20"
            style={{
              left: `${containerDimensions.width / 2}px`,
              top: `${containerDimensions.height / 2}px`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AvatarEditor;