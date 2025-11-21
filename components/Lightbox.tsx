
import React, { useEffect, useState } from 'react';
import { LocalImage, Profile } from '../types';
import { XIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, UserIcon } from './icons';

interface LightboxProps {
  images: LocalImage[];
  currentIndex: number;
  onClose: () => void;
  onDelete?: (imageId: string) => void;
  onSetAvatar?: (imageId: string) => void;
  profile?: Profile;
}

const Lightbox: React.FC<LightboxProps> = ({ images, currentIndex, onClose, onDelete, onSetAvatar, profile }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const currentImage = images[currentIndex];
  const isCurrentAvatar = profile?.avatarId === currentImage?.id;
  
  if (!currentImage) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <div 
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <img
            src={currentImage.url}
            alt={currentImage.name}
            className="max-w-[90vw] max-h-[85vh] object-contain shadow-2xl cursor-pointer"
          />
          
          {/* Hover Tooltip */}
          {showTooltip && (
            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm text-white p-4 animate-fade-in">
              <div className="text-center space-y-1">
                <p className="text-lg font-semibold">{currentImage.name}</p>
                {currentImage.profileName && (
                  <p className="text-md text-gray-300">{currentImage.profileName}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 flex gap-3">
            {/* Avatar Control Button */}
            {onSetAvatar && (
              <button
                onClick={() => onSetAvatar(currentImage.id)}
                className={`p-2 rounded-full transition-all duration-300 group ${
                  isCurrentAvatar 
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400' 
                    : 'bg-black/50 text-white hover:bg-cyan-600 hover:shadow-lg hover:shadow-cyan-500/20'
                }`}
                title={isCurrentAvatar ? 'Current Avatar' : 'Set as Avatar'}
                aria-label={isCurrentAvatar ? 'Current Avatar' : 'Set as Avatar'}
              >
                <UserIcon className={`w-6 h-6 transition-transform duration-300 ${
                  isCurrentAvatar ? 'scale-110' : 'group-hover:scale-110'
                }`} />
              </button>
            )}
            
            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={() => onDelete(currentImage.id)}
                className="p-2 bg-black/50 text-white rounded-full hover:bg-red-600 transition-colors group"
                title="Delete image"
                aria-label="Delete image"
              >
                <TrashIcon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              </button>
            )}
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors group"
              title="Close"
              aria-label="Close lightbox"
            >
              <XIcon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
            </button>
        </div>

      </div>
    </div>
  );
};

export default Lightbox;
