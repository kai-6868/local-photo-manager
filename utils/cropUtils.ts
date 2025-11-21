/**
 * Tính toán default avatarCropData dựa theo tỷ lệ ảnh
 */
export function calculateDefaultCropData(imageWidth: number, imageHeight: number): { centerX: number; centerY: number } {
  const imageAspectRatio = imageWidth / imageHeight;
  
  if (imageAspectRatio > 1) {
    // Ảnh ngang: container vuông
    return {
      centerX: Math.round(imageHeight / 2),
      centerY: Math.round(imageHeight / 2)
    };
  } else {
    // Ảnh dọc hoặc vuông: container vuông
    return {
      centerX: Math.round(imageWidth / 2),
      centerY: Math.round(imageWidth / 2)
    };
  }
}

/**
 * Lấy kích thước ảnh từ URL
 */
export function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = imageUrl;
  });
}