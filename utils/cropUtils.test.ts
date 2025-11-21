// Test examples cho calculateDefaultCropData

import { calculateDefaultCropData } from './cropUtils';

// Test với ảnh ngang 1920x1080 (tỷ lệ 16:9)
const landscape = calculateDefaultCropData(1920, 1080);
console.log('Ảnh ngang 1920x1080:', landscape);
// Expected: { centerX: 480, centerY: 540 } - trái 1/4, giữa height

// Test với ảnh dọc 1080x1920 (tỷ lệ 9:16) 
const portrait = calculateDefaultCropData(1080, 1920);
console.log('Ảnh dọc 1080x1920:', portrait);
// Expected: { centerX: 540, centerY: 480 } - giữa width, trên 1/4

// Test với ảnh vuông 1080x1080
const square = calculateDefaultCropData(1080, 1080);
console.log('Ảnh vuông 1080x1080:', square);
// Expected: { centerX: 540, centerY: 270 } - giữa width, trên 1/4

export { calculateDefaultCropData };