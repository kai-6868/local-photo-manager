
import React, { useState, useRef, useCallback, DragEvent, useEffect, useLayoutEffect, useMemo } from 'react';
import { Profile, LocalImage, CropData } from '../types';
import Lightbox from './Lightbox';
import ImageWithFallback from './ImageWithFallback';
import { ArrowLeftIcon, EditIcon, UploadIcon, UserIcon, TrashIcon } from './icons';

interface ProfileDetailPageProps {
  profile: Profile;
  onBack: () => void;
  onDeleteImage: (imageId: string) => void;
  onSetAvatar: (imageId: string) => void;
  onUploadImages: (files: File[]) => void;
  onUpdateProfile: (data: { name: string, note: string }) => void;
  onUpdateCropData?: (cropData: CropData) => void;
  onDeleteProfile?: () => void;
  onReorderImages?: (imageIds: string[]) => void;
}

// Responsive column count calculation
const getColumnCount = () => {
  if (typeof window === 'undefined') return 2;
  const width = window.innerWidth;

  if (width >= 1440) return 6;
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  return 2;
};

const ProfileDetailPage: React.FC<ProfileDetailPageProps> = ({
  profile,
  onBack,
  onDeleteImage,
  onSetAvatar,
  onUploadImages,
  onUpdateProfile,
  onUpdateCropData,
  onDeleteProfile,
  onReorderImages
}) => {
  // UI State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: profile.name, note: profile.note });

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  
  // Sort Mode State
  const [isSortMode, setIsSortMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<{id: string, order: number}[]>([]);
  const [selectionOrder, setSelectionOrder] = useState(1);
  // Initialize ordered images according to imageOrder from profile JSON
  const [orderedImages, setOrderedImages] = useState<LocalImage[]>(() => {
    if (profile.imageOrder) {
      // Sort images according to imageOrder array
      return profile.imageOrder
        .map(imageId => profile.images.find(img => img.id === imageId))
        .filter((img): img is LocalImage => img !== undefined);
    }
    return profile.images;
  });

  // Avatar Cropping State
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [activeCropData, setActiveCropData] = useState<CropData | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 320, height: 320 });

  // Responsive Layout
  const [columnCount, setColumnCount] = useState(getColumnCount);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollAnimationFrameRef = useRef<number | null>(null);
  const previousImageCountRef = useRef<number>(0);
  const scrollPositionRef = useRef<number>(0);
  const shouldScrollToBottomRef = useRef<boolean>(false);

  const stopScrolling = useCallback(() => {
    if (scrollAnimationFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
      scrollAnimationFrameRef.current = null;
    }
  }, []);

  const startScrolling = useCallback((direction: number) => {
    if (scrollAnimationFrameRef.current !== null) return;
    const step = () => {
      window.scrollBy(0, direction * 8); // Tốc độ 8px mỗi frame là rất mượt
      scrollAnimationFrameRef.current = requestAnimationFrame(step);
    };
    scrollAnimationFrameRef.current = requestAnimationFrame(step);
  }, []);

  // Sync ordered images with profile changes, respecting imageOrder
  useEffect(() => {
    // Save current scroll position before state update
    scrollPositionRef.current = window.scrollY;

    // Check if new images are being added
    const currentCount = profile.images.length;
    const previousCount = previousImageCountRef.current;

    if (currentCount > previousCount && previousCount > 0) {
      shouldScrollToBottomRef.current = true;
    }

    if (profile.imageOrder && profile.imageOrder.length > 0) {
      // Sort images according to imageOrder array
      const sortedImages = profile.imageOrder
        .map(imageId => profile.images.find(img => img.id === imageId))
        .filter((img): img is LocalImage => img !== undefined);

      // Add any images not in imageOrder to the end (newly added images)
      const imagesNotInOrder = profile.images.filter(img => !profile.imageOrder?.includes(img.id));
      sortedImages.push(...imagesNotInOrder);

      setOrderedImages(sortedImages);
    } else {
      setOrderedImages(profile.images);
    }
  }, [profile.images, profile.id, profile.imageOrder]);

  // Restore scroll position and scroll to bottom when new images are added
  useEffect(() => {
    // If new images were added, scroll to bottom smoothly
    if (shouldScrollToBottomRef.current) {
      shouldScrollToBottomRef.current = false;

      // Use setTimeout to ensure DOM has updated with new images
      setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    } else {
      // Only restore scroll position if NOT adding new images
      if (scrollPositionRef.current > 0) {
        window.scrollTo(0, scrollPositionRef.current);
      }
    }

    // Update the ref with current count
    previousImageCountRef.current = orderedImages.length;
    scrollPositionRef.current = 0;
  }, [orderedImages]);

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



  // Memoized values
  const avatar = useMemo(() =>
    profile.images.find(img => img.id === profile.avatarId),
    [profile.images, profile.avatarId]
  );

  // Memoized avatar style calculation
  const avatarImageStyle = useMemo(() => {
    if (imageDimensions.width === 0 || containerDimensions.width === 0) return {};

    const { width: containerWidth, height: containerHeight } = containerDimensions;
    const imageAspectRatio = imageDimensions.width / imageDimensions.height;

    // BƯỚC 1: Tính scale factor (fit theo chiều ngắn hơn)
    let scale;
    if (imageAspectRatio > 1) {
      // Ảnh ngang: fit theo height của container
      scale = containerHeight / imageDimensions.height;
    } else {
      // Ảnh dọc/vuông: fit theo width của container
      scale = containerWidth / imageDimensions.width;
    }

    // BƯỚC 2: Tính kích thước ảnh sau khi scale
    const scaledImageWidth = imageDimensions.width * scale;
    const scaledImageHeight = imageDimensions.height * scale;

    // BƯỚC 3: Xác định vị trí hiển thị (translateX, translateY)
    let translateX, translateY;

    // Kiểm tra xem có crop data hay đang drag không
    const cropData = isDraggingAvatar && activeCropData ? activeCropData : profile.avatarCropData;

    if (cropData) {
      // CÓ CROP DATA: Sử dụng vị trí đã được user customize

      // Vị trí center trên ảnh gốc mà user đã chọn
      const originalCenterX = cropData.centerX;
      const originalCenterY = cropData.centerY;

      // Chuyển đổi center sang ảnh đã scale
      const scaledCenterX = originalCenterX * scale;
      const scaledCenterY = originalCenterY * scale;

      // Tính translate để center này hiển thị ở giữa container
      translateX = containerWidth / 2 - scaledCenterX;
      translateY = containerHeight / 2 - scaledCenterY;

    } else {
      // CHƯA CÓ CROP DATA: Sử dụng default center cho container vuông

      if (imageAspectRatio > 1) {
        // Ảnh ngang: hiển thị vùng giữa theo chiều cao (container vuông)
        const defaultCenterX = imageDimensions.height / 2;  // Trung tâm vùng vuông
        const defaultCenterY = imageDimensions.height / 2;

        const scaledCenterX = defaultCenterX * scale;
        const scaledCenterY = defaultCenterY * scale;

        translateX = containerWidth / 2 - scaledCenterX;
        translateY = containerHeight / 2 - scaledCenterY;
      } else {
        // Ảnh dọc/vuông: hiển thị vùng giữa theo chiều rộng (container vuông)
        const defaultCenterX = imageDimensions.width / 2;   // Trung tâm vùng vuông
        const defaultCenterY = imageDimensions.width / 2;

        const scaledCenterX = defaultCenterX * scale;
        const scaledCenterY = defaultCenterY * scale;

        translateX = containerWidth / 2 - scaledCenterX;
        translateY = containerHeight / 2 - scaledCenterY;
      }
    }

    return {
      width: `${scaledImageWidth}px`,
      height: `${scaledImageHeight}px`,
      transform: `translate(${translateX}px, ${translateY}px)`,
      maxWidth: 'none',  // Đảm bảo không bị CSS constrain width
      minWidth: '0',     // Đảm bảo có thể scale tự do
      flexShrink: '0'    // Không cho flex shrink
    };
  }, [imageDimensions, containerDimensions, isDraggingAvatar, activeCropData, profile.avatarCropData]);

  // Handle image load to get dimensions
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setImageDimensions({ width: naturalWidth, height: naturalHeight });
    }
  }, []);

  // Update container dimensions when size changes
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateContainerSize();
    const timer = setTimeout(updateContainerSize, 100);

    window.addEventListener('resize', updateContainerSize);
    return () => {
      window.removeEventListener('resize', updateContainerSize);
      clearTimeout(timer);
    };
  }, [profile.id]);

  // Reset states when profile changes or avatar changes
  useEffect(() => {
    setImageDimensions({ width: 0, height: 0 });
    setContainerDimensions({ width: 320, height: 320 });
    setIsDraggingAvatar(false);
    setActiveCropData(null);
    console.log(`🔄 Reset avatar states for profile: ${profile.name}, avatar: ${profile.avatarId}`);
  }, [profile.id, profile.avatarId]); // Thêm profile.avatarId để reset khi đổi avatar

  // Handle avatar drag for cropping
  const handleAvatarPointerDown = useCallback((e: React.PointerEvent) => {
    if (!avatar || imageDimensions.width === 0 || containerDimensions.width === 0) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    setIsDraggingAvatar(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });

    const imageAspectRatio = imageDimensions.width / imageDimensions.height;

    const currentCrop = profile.avatarCropData || {
      // Sử dụng default center phù hợp với container vuông
      centerX: imageAspectRatio > 1 ? imageDimensions.height / 2 : imageDimensions.width / 2,
      centerY: imageAspectRatio > 1 ? imageDimensions.height / 2 : imageDimensions.width / 2
    };
    setActiveCropData(currentCrop);

    (e.target as Element).setPointerCapture(e.pointerId);
  }, [avatar, profile.avatarCropData, imageDimensions, containerDimensions]);

  const handleAvatarPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingAvatar || !activeCropData || imageDimensions.width === 0 || containerDimensions.width === 0) {
      return;
    }

    e.preventDefault();

    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    const { width: containerWidth, height: containerHeight } = containerDimensions;
    const imageAspectRatio = imageDimensions.width / imageDimensions.height;

    // Calculate scale and movement constraints
    let scale, canMoveX, canMoveY;
    if (imageAspectRatio > 1) {
      // Landscape: fit height, allow horizontal movement
      scale = containerHeight / imageDimensions.height;
      canMoveX = true;
      canMoveY = false;
    } else if (imageAspectRatio < 1) {
      // Portrait: fit width, allow vertical movement
      scale = containerWidth / imageDimensions.width;
      canMoveX = false;
      canMoveY = true;
    } else {
      // Square: fit both, no movement
      scale = Math.min(containerWidth / imageDimensions.width, containerHeight / imageDimensions.height);
      canMoveX = false;
      canMoveY = false;
    }

    const sensitivity = 1.2;
    const deltaOnImageX = canMoveX ? (deltaX / scale) * sensitivity : 0;
    const deltaOnImageY = canMoveY ? (deltaY / scale) * sensitivity : 0;

    // Calculate boundaries
    const halfContainerWidthOnImage = (containerWidth / 2) / scale;
    const halfContainerHeightOnImage = (containerHeight / 2) / scale;

    let minCenterX, maxCenterX, minCenterY, maxCenterY;
    if (canMoveX) {
      minCenterX = halfContainerWidthOnImage;
      maxCenterX = imageDimensions.width - halfContainerWidthOnImage;
      minCenterY = maxCenterY = imageDimensions.height / 2;
    } else if (canMoveY) {
      minCenterY = halfContainerHeightOnImage;
      maxCenterY = imageDimensions.height - halfContainerHeightOnImage;
      minCenterX = maxCenterX = imageDimensions.width / 2;
    } else {
      minCenterX = maxCenterX = imageDimensions.width / 2;
      minCenterY = maxCenterY = imageDimensions.height / 2;
    }

    const newCenterX = Math.max(minCenterX, Math.min(maxCenterX, activeCropData.centerX - deltaOnImageX));
    const newCenterY = Math.max(minCenterY, Math.min(maxCenterY, activeCropData.centerY - deltaOnImageY));

    setActiveCropData({ centerX: newCenterX, centerY: newCenterY });
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isDraggingAvatar, activeCropData, lastMousePos, imageDimensions, containerDimensions]);

  const handleAvatarPointerUp = useCallback((e: React.PointerEvent) => {
    setIsDraggingAvatar(false);

    if (activeCropData && onUpdateCropData) {
      onUpdateCropData(activeCropData);
    }

    setActiveCropData(null);
    (e.target as Element).releasePointerCapture(e.pointerId);
  }, [activeCropData, onUpdateCropData]);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const handleSaveEdit = () => {
    // Validate profile name
    const trimmedName = editData.name.trim();
    if (!trimmedName) {
      alert('Profile name cannot be empty');
      return;
    }

    // Check for invalid characters that might cause file system issues
    const invalidChars = /[<>:"/\\|?*]/g;
    const hasInvalidChars = invalidChars.test(trimmedName);

    if (hasInvalidChars) {
      if (!confirm(`Profile name contains special characters that will be replaced with underscores in the folder name. Continue with "${trimmedName}"?`)) {
        return;
      }
    }

    onUpdateProfile({ ...editData, name: trimmedName });
    setIsEditing(false);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      onUploadImages(Array.from(files));
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Handle paste functionality
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;

      const items = Array.from(e.clipboardData.items);
      const imageFiles: File[] = [];

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        onUploadImages(imageFiles);
      }
    };

    // Add paste event listener
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [onUploadImages]);

  // Handle image reordering
  const handleImageDragStart = (e: DragEvent<HTMLDivElement>, imageId: string) => {
    setDraggedImageId(imageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: DragEvent<HTMLDivElement>, globalIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedImageId) return;

    // Auto-scroll logic: scroll window if mouse near top/bottom

    const { clientY } = e;
    const margin = 120; // Vùng nhạy cảm 120px

    if (clientY < margin) {
      startScrolling(-1); // Cuộn lên
    } else if (window.innerHeight - clientY < margin) {
      startScrolling(1);  // Cuộn xuống
    } else {
      stopScrolling();    // Dừng khi chuột ở giữa
    }

    // Get mouse position relative to the image element
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const imageWidth = rect.width;

    // Simple insertion point based on mouse position
    let insertIndex;
    if (mouseX < imageWidth / 2) {
      // Insert before this image
      insertIndex = globalIndex;
    } else {
      // Insert after this image
      insertIndex = globalIndex + 1;
    }

    // Don't show insertion point if it's the same as current position
    const draggedIndex = orderedImages.findIndex(img => img.id === draggedImageId);
    if (insertIndex === draggedIndex || insertIndex === draggedIndex + 1) {
      setInsertionIndex(null);
    } else {
      setInsertionIndex(insertIndex);
    }
  };

  const handleImageDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear insertion index if leaving the grid area
    const relatedTarget = e.relatedTarget as Element;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setInsertionIndex(null);
    }
  };

  const handleImageDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    stopScrolling();

    if (!draggedImageId || insertionIndex === null) {
      setDraggedImageId(null);
      setInsertionIndex(null);
      return;
    }

    const draggedIndex = orderedImages.findIndex(img => img.id === draggedImageId);
    if (draggedIndex === -1) {
      setDraggedImageId(null);
      setInsertionIndex(null);
      return;
    }

    // Create new array with insertion logic
    const newOrderedImages = [...orderedImages];
    const [draggedImage] = newOrderedImages.splice(draggedIndex, 1);

    // Adjust insertion index if needed (when removing item before insertion point)
    const adjustedInsertionIndex = insertionIndex > draggedIndex ? insertionIndex - 1 : insertionIndex;

    newOrderedImages.splice(adjustedInsertionIndex, 0, draggedImage);

    setOrderedImages(newOrderedImages);
    setDraggedImageId(null);
    setInsertionIndex(null);

    // Notify parent component
    if (onReorderImages) {
      const imageIds = newOrderedImages.map(img => img.id);
      onReorderImages(imageIds);
    }
  };

  const handleImageDragEnd = () => {
    setDraggedImageId(null);
    setInsertionIndex(null);
    stopScrolling();
  };

  // Sort Mode Functions
  const handleToggleSortMode = () => {
    if (isSortMode) {
      // Exit sort mode - reset selection
      setSelectedImages([]);
      setSelectionOrder(1);
    }
    setIsSortMode(!isSortMode);
  };

  const handleImageSelect = (imageId: string) => {
    if (!isSortMode) return;
    
    const existingSelection = selectedImages.find(img => img.id === imageId);
    
    if (existingSelection) {
      // Deselect: Remove and renumber remaining selections
      const newSelection = selectedImages
        .filter(img => img.id !== imageId)
        .sort((a, b) => a.order - b.order)
        .map((img, index) => ({ ...img, order: index + 1 }));
      
      setSelectedImages(newSelection);
      setSelectionOrder(newSelection.length + 1);
    } else {
      // Select: Add with next order number
      setSelectedImages(prev => [...prev, { id: imageId, order: selectionOrder }]);
      setSelectionOrder(prev => prev + 1);
    }
  };

  const handleClearSelection = () => {
    setSelectedImages([]);
    setSelectionOrder(1);
  };

  const handleSubmitSort = () => {
    if (selectedImages.length < 2) return;
    
    // Get anchor image (first selected)
    const sortedSelected = selectedImages.sort((a, b) => a.order - b.order);
    const anchorImageId = sortedSelected[0].id;
    
    // Find anchor position in current order
    const anchorIndex = orderedImages.findIndex(img => img.id === anchorImageId);
    if (anchorIndex === -1) return;
    
    // Create new order array
    const newOrderedImages = [...orderedImages];
    
    // Get OTHER selected images (excluding anchor) to be inserted
    const otherSelectedIds = sortedSelected.slice(1).map(sel => sel.id);
    
    // Remove OTHER selected images from their current positions (keep anchor)
    const tempOrder = newOrderedImages.filter(img => !otherSelectedIds.includes(img.id));
    
    // Get other selected image objects in correct order
    const otherSelectedObjects = sortedSelected
      .slice(1) // Skip anchor (first one)
      .map(sel => orderedImages.find(img => img.id === sel.id))
      .filter(Boolean) as LocalImage[];
    
    // Find anchor position in temp array (anchor is still there)
    const anchorIndexInTempOrder = tempOrder.findIndex(img => img.id === anchorImageId);
    
    // Insert other selected images after anchor
    const finalOrder = [...tempOrder];
    finalOrder.splice(anchorIndexInTempOrder + 1, 0, ...otherSelectedObjects);
    
    // Update state and notify parent
    setOrderedImages(finalOrder);
    if (onReorderImages) {
      onReorderImages(finalOrder.map(img => img.id));
    }
    
    // Exit sort mode
    setIsSortMode(false);
    setSelectedImages([]);
    setSelectionOrder(1);
  };

  const getImageSelectionOrder = (imageId: string): number | null => {
    const selection = selectedImages.find(img => img.id === imageId);
    return selection ? selection.order : null;
  };

  // Handle avatar drag for cropping


  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors">
          <ArrowLeftIcon className="w-6 h-6" />
          Back to Profiles
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="md:w-1/6 flex-shrink-0">
          {avatar ? (
            <div
              ref={containerRef}
              className="relative w-full aspect-square overflow-hidden rounded-2xl shadow-lg cursor-move select-none touch-none"
              onPointerDown={handleAvatarPointerDown}
              onPointerMove={handleAvatarPointerMove}
              onPointerUp={handleAvatarPointerUp}
            >
              <div className="w-full h-full overflow-hidden">
                <img
                  ref={imageRef}
                  src={avatar.url}
                  alt={profile.name}
                  className="absolute top-0 left-0"
                  style={avatarImageStyle}
                  onLoad={handleImageLoad}
                  draggable={false}
                />
              </div>
              {/* Visual crop boundaries overlay */}
              {isDraggingAvatar && imageDimensions.width > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Crop area outline */}
                  <div className="absolute border-2 border-cyan-400 border-dashed rounded"
                    style={{
                      left: '0px',
                      top: '0px',
                      width: `${containerDimensions.width}px`,
                      height: `${containerDimensions.height}px`,
                      boxShadow: 'inset 0 0 0 2px rgba(34, 211, 238, 0.2)'
                    }}
                  />
                  {/* Center crosshair */}
                  <div className="absolute w-4 h-4 -ml-2 -mt-2 border border-cyan-400 rounded-full bg-cyan-400/20"
                    style={{
                      left: `${containerDimensions.width / 2}px`,
                      top: `${containerDimensions.height / 2}px`
                    }}
                  />
                </div>
              )}

            </div>
          ) : (
            <div className="w-full aspect-square bg-gray-800 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-700">
              <UserIcon className="w-24 h-24 text-gray-600 mb-4" />
              <p className="text-gray-500 text-center">
                No avatar selected
                <br />
                <span className="text-sm">Click on any image in gallery and select "Set as Avatar"</span>
              </p>
            </div>
          )}
        </div>
        <div className="md:w-5/6 min-h-0">
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full text-4xl font-bold bg-gray-800 border-b-2 border-gray-700 focus:border-cyan-500 focus:outline-none transition-colors"
              />
              <textarea
                value={editData.note}
                onChange={(e) => setEditData(prev => ({ ...prev, note: e.target.value }))}
                className="w-full text-lg text-gray-300 bg-gray-800 border border-gray-700 rounded-md p-2 h-32 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                rows={4}
              />
              <div className="flex gap-4">
                <button onClick={handleSaveEdit} className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Save</button>
                <button onClick={() => setIsEditing(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex flex-col">
              <h1 className="text-4xl lg:text-5xl font-bold mb-2 flex-shrink-0">{profile.name}</h1>
              <div className="flex-1 min-h-0 mb-6">
                <p className="text-lg text-gray-300 whitespace-pre-wrap overflow-y-auto max-h-32 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">{profile.note}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 flex-shrink-0">
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                <EditIcon className="w-5 h-5" /> Edit
              </button>
            )}
            {onDeleteProfile && !isEditing && (
              <button onClick={onDeleteProfile} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                <TrashIcon className="w-5 h-5" /> Delete
              </button>
            )}
            <input type="file" multiple ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files)} className="hidden" accept="image/*" />
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">
        Photo Gallery
        <span className="text-sm font-normal text-gray-400 ml-2">
          ({orderedImages.length} {orderedImages.length === 1 ? 'image' : 'images'})
        </span>
      </h2>

      {/* Sort Mode Control Bar */}
      {orderedImages.length > 1 && (
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleSortMode}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isSortMode 
                  ? 'bg-cyan-500 text-white hover:bg-cyan-600' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              {isSortMode ? '✓ Sort Mode' : '🔀 Sort Images'}
            </button>
            
            {isSortMode && (
              <div className="text-sm text-gray-400">
                {selectedImages.length === 0 ? (
                  'Click images in order to arrange them'
                ) : selectedImages.length === 1 ? (
                  `Selected ${selectedImages.length} image (select at least 2 to sort)`
                ) : (
                  `Selected ${selectedImages.length} images`
                )}
              </div>
            )}
          </div>
          
          {isSortMode && (
            <div className="flex items-center gap-2">
              {selectedImages.length > 0 && (
                <button
                  onClick={handleClearSelection}
                  className="px-3 py-1 text-sm bg-gray-600 text-gray-300 rounded hover:bg-gray-500 transition-colors"
                >
                  Clear All
                </button>
              )}
              
              <button
                onClick={handleSubmitSort}
                disabled={selectedImages.length < 2}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedImages.length >= 2
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-600 text-gray-500 cursor-not-allowed'
                }`}
              >
                Apply Sort
              </button>
              
              <button
                onClick={handleToggleSortMode}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {orderedImages.length === 0 ? (
        <div className="text-center py-20">
          <UserIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl text-gray-400 mb-2">No images yet</h3>
          <p className="text-gray-500">Upload some images to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {orderedImages.map((image, globalIndex) => {
            const imageKey = `${profile.id}-${image.id}-${globalIndex}`;

            return (
              <div key={imageKey} className="relative">
                {/* Single Insertion Indicator Logic:
                    - If inserting at position 0 (beginning): show indicator on first image (left side)
                    - If inserting between images: show indicator on the previous image (right side)
                */}

                {/* Left indicator: only for insertion at very beginning (position 0) */}
                {insertionIndex === 0 && globalIndex === 0 && (
                  <div className="absolute -left-2 top-0 w-1 h-full bg-cyan-400 rounded-full z-50 animate-pulse shadow-lg shadow-cyan-400/50">
                    <div className="absolute -top-2 -left-1 w-3 h-3 bg-cyan-400 rounded-full"></div>
                    <div className="absolute -bottom-2 -left-1 w-3 h-3 bg-cyan-400 rounded-full"></div>
                  </div>
                )}

                {/* Right indicator: for insertion after this image (between images or at end) */}
                {insertionIndex === globalIndex + 1 && (
                  <div className="absolute -right-2 top-0 w-1 h-full bg-cyan-400 rounded-full z-50 animate-pulse shadow-lg shadow-cyan-400/50">
                    <div className="absolute -top-2 -left-1 w-3 h-3 bg-cyan-400 rounded-full"></div>
                    <div className="absolute -bottom-2 -left-1 w-3 h-3 bg-cyan-400 rounded-full"></div>
                  </div>
                )}

                {/* Gallery cell with dark background */}
                <div className="relative w-full h-full bg-gray-800/50 rounded-lg overflow-hidden">
                  <div
                    draggable={!isSortMode}
                    onDragStart={(e) => {
                      if (!isSortMode) handleImageDragStart(e, image.id);
                    }}
                    onDragOver={(e) => !isSortMode && handleImageDragOver(e, globalIndex)}
                    onDragLeave={!isSortMode ? handleImageDragLeave : undefined}
                    onDrop={!isSortMode ? handleImageDrop : undefined}
                    onDragEnd={() => {
                      if (!isSortMode) handleImageDragEnd();
                    }}
                    className={`group relative cursor-pointer overflow-hidden rounded-lg bg-gray-800 shadow-lg transition-all duration-300 ${
                      isSortMode 
                        ? (getImageSelectionOrder(image.id) 
                           ? 'ring-4 ring-cyan-400 shadow-lg shadow-cyan-400/50 scale-105' 
                           : 'opacity-60 hover:opacity-80')
                        : `hover:shadow-cyan-500/30 hover:scale-[1.02] ${draggedImageId === image.id ? 'opacity-50 scale-95 rotate-2 z-10' : ''}`
                    }`}
                    onClick={() => isSortMode ? handleImageSelect(image.id) : openLightbox(globalIndex)}
                  >
                    <ImageWithFallback
                      src={image.url}
                      alt={image.name}
                      className="w-full h-auto block transition-transform duration-300 group-hover:scale-110"
                    />

                    {/* Selection Order Badge - Show in sort mode */}
                    {isSortMode && getImageSelectionOrder(image.id) && (
                      <div className="absolute top-2 left-2 w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg z-30 animate-pulse">
                        {getImageSelectionOrder(image.id)}
                      </div>
                    )}

                    {/* Selection Order Badge - Show in sort mode */}
                    {isSortMode && getImageSelectionOrder(image.id) && (
                      <div className="absolute top-2 left-2 w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg z-30 animate-pulse">
                        {getImageSelectionOrder(image.id)}
                      </div>
                    )}

                    {/* Avatar Badge - Always visible when it's avatar, hidden on hover */}
                    {profile.avatarId === image.id && (
                      <div className="absolute top-2 right-2 bg-cyan-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg z-20 flex items-center gap-1 opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                        <UserIcon className="w-3 h-3" />
                        <span>Avatar</span>
                      </div>
                    )}

                    {/* Delete Button - Show on hover */}
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

                    {/* Drag Handle - Show on hover (hidden in sort mode) */}
                    {!isSortMode && (
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
                        <div className="w-6 h-6 bg-black/70 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing">
                          <span className="text-white text-xs">⋮⋮</span>
                        </div>
                      </div>
                    )}

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
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-6 flex items-center justify-center text-gray-500 text-center flex-col p-8 cursor-pointer hover:bg-gray-800/50 hover:text-gray-400 transition-colors border-2 border-dashed rounded-lg ${isDragging ? 'border-cyan-500 bg-gray-800/50' : 'border-gray-600 hover:border-gray-500'
          }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon className="w-12 h-12 mb-3" />
        <span className="text-lg font-medium">Drag & Drop or click to Upload</span>
        <span className="text-sm text-gray-600 mt-1">Add more images to your gallery</span>
        <span className="text-xs text-gray-500 mt-2">
          💡 Tip: {isSortMode ? 'Exit sort mode to drag & drop • Paste images: Ctrl+V' : 'Drag to reorder • Sort multiple images • Paste images: Ctrl+V'}
        </span>
      </div>

      {lightboxOpen && (
        <Lightbox
          images={orderedImages}
          currentIndex={currentImageIndex}
          onClose={() => setLightboxOpen(false)}
          onDelete={onDeleteImage}
          onSetAvatar={onSetAvatar}
          profile={profile}
        />
      )}
    </div>
  );
};

export default ProfileDetailPage;
