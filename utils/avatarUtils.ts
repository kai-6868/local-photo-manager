import { CropData } from '../types';

/**
 * Tính toán style hiển thị avatar trong container vuông
 */
export interface AvatarDisplayParams {
  imageDimensions: { width: number; height: number };
  containerDimensions: { width: number; height: number };
  cropData?: CropData | null;
}

export interface AvatarDisplayResult {
  width: string;
  height: string;
  transform: string;
  visibleArea: {
    startX: number;
    endX: number;
    startY: number;
    endY: number;
  };
}

export function calculateAvatarDisplay({
  imageDimensions,
  containerDimensions,
  cropData
}: AvatarDisplayParams): AvatarDisplayResult {
  
  if (imageDimensions.width === 0 || containerDimensions.width === 0) {
    return {
      width: '100%',
      height: '100%',
      transform: 'translate(0px, 0px)',
      visibleArea: { startX: 0, endX: 0, startY: 0, endY: 0 }
    };
  }

  const { width: containerWidth, height: containerHeight } = containerDimensions;
  const imageAspectRatio = imageDimensions.width / imageDimensions.height;
  
  // BƯỚC 1: Tính scale factor (fit theo chiều ngắn hơn)
  let scale: number;
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
  let translateX: number, translateY: number;
  
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
    // CHƯA CÓ CROP DATA: Sử dụng default position
    
    if (imageAspectRatio > 1) {
      // Ảnh ngang: căn trái-trên (hiển thị phần bên trái của ảnh)
      translateX = 0;
      translateY = 0;
    } else {
      // Ảnh dọc/vuông: căn trái-trên (hiển thị phần trên của ảnh)
      translateX = 0;
      translateY = 0;
    }
  }
  
  // BƯỚC 4: Tính vùng hiển thị trên ảnh đã scale
  const visibleArea = {
    startX: Math.max(0, -translateX),
    endX: Math.min(scaledImageWidth, containerWidth - translateX),
    startY: Math.max(0, -translateY), 
    endY: Math.min(scaledImageHeight, containerHeight - translateY)
  };
  
  return {
    width: `${scaledImageWidth}px`,
    height: `${scaledImageHeight}px`,
    transform: `translate(${translateX}px, ${translateY}px)`,
    visibleArea
  };
}

/**
 * Helper function để debug thông tin hiển thị avatar
 */
export function debugAvatarDisplay(params: AvatarDisplayParams, result: AvatarDisplayResult): void {
  const { imageDimensions, containerDimensions, cropData } = params;
  const { visibleArea } = result;
  
  console.group('🖼️ Avatar Display Debug Info');
  
  console.log('📏 Kích thước:', {
    original: `${imageDimensions.width} × ${imageDimensions.height}px`,
    container: `${containerDimensions.width} × ${containerDimensions.height}px`,
    scaled: result.width + ' × ' + result.height
  });
  
  console.log('📍 Vị trí:', {
    transform: result.transform,
    hasCropData: !!cropData,
    cropCenter: cropData ? `(${cropData.centerX}, ${cropData.centerY})` : 'None'
  });
  
  console.log('👁️ Vùng hiển thị trên ảnh đã scale:', {
    horizontal: `${visibleArea.startX.toFixed(1)} → ${visibleArea.endX.toFixed(1)}px`,
    vertical: `${visibleArea.startY.toFixed(1)} → ${visibleArea.endY.toFixed(1)}px`,
    percentage: `${((visibleArea.endX - visibleArea.startX) / parseFloat(result.width) * 100).toFixed(1)}% width, ${((visibleArea.endY - visibleArea.startY) / parseFloat(result.height) * 100).toFixed(1)}% height`
  });
  
  // Tính toán vùng hiển thị trên ảnh gốc
  const scale = parseFloat(result.width) / imageDimensions.width;
  const originalVisibleArea = {
    startX: visibleArea.startX / scale,
    endX: visibleArea.endX / scale,
    startY: visibleArea.startY / scale,
    endY: visibleArea.endY / scale
  };
  
  console.log('🎯 Vùng hiển thị trên ảnh gốc:', {
    horizontal: `${originalVisibleArea.startX.toFixed(1)} → ${originalVisibleArea.endX.toFixed(1)}px`,
    vertical: `${originalVisibleArea.startY.toFixed(1)} → ${originalVisibleArea.endY.toFixed(1)}px`
  });
  
  console.groupEnd();
}