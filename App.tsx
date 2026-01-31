
import React, { useState, useEffect } from 'react';
import { Profile, LocalImage, CropData } from './types';
import HomePage from './components/HomePage';
import ProfileDetailPage from './components/ProfileDetailPage';
import AddProfilePage from './components/AddProfilePage';
import GalleryView from './components/GalleryView';
import { UserIcon } from './components/icons';
import FolderService from './services/FolderService';
import FileSystemService from './services/FileSystemService';
import { calculateDefaultCropData, getImageDimensions } from './utils/cropUtils';

const generateMockData = async (): Promise<Profile[]> => {
  const profilesData: Omit<Profile, 'id' | 'avatarId' | 'images'>[] = [
    { name: 'Isabella Rossi', note: 'Travel enthusiast and photographer. Capturing moments from around the globe.' },
    { name: 'Kenji Tanaka', note: 'Urban explorer and street artist. The city is my canvas.' },
    { name: 'Anya Petrova', note: 'Lover of nature and wildlife. Finding beauty in the wild.' },
    { name: 'Mateo Garcia', note: 'Chef and culinary artist. Every dish tells a story.' },
    { name: 'Chloe Dubois', note: 'Musician and composer. Creating sounds that move the soul.' },
  ];

  const profiles: Profile[] = [];

  for (const p of profilesData) {
    const profileId = `profile_${Date.now()}_${Math.random()}`;
    const images: LocalImage[] = [];
    
    for (let i = 0; i < Math.floor(Math.random() * 10) + 5; i++) {
        const imageName = `${p.name.split(' ')[0]}_image_${i}.jpg`;
        const imageUrl = `https://picsum.photos/seed/${profileId}_${i}/800/600`;
        images.push({
            id: imageName,
            url: imageUrl,
            name: imageName
        });
    }

    if (images.length > 0) {
        profiles.push({
            id: profileId,
            ...p,
            images,
            avatarId: '', // Don't auto-assign avatar in mock data
        });
    }
  }
  return profiles;
};

// Helper function to generate unique profile names
const generateUniqueProfileName = (existingProfiles: Profile[]): string => {
  const baseName = 'newprofile';
  const existingNames = existingProfiles.map(p => p.name.toLowerCase());
  
  // Check if base name is available
  if (!existingNames.includes(baseName)) {
    return baseName;
  }
  
  // Find the next available number
  let counter = 1;
  let candidateName = `${baseName}(${counter})`;
  
  while (existingNames.includes(candidateName.toLowerCase())) {
    counter++;
    candidateName = `${baseName}(${counter})`;
  }
  
  return candidateName;
};

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allImages, setAllImages] = useState<LocalImage[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'add' | 'gallery'>('list');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [folderService] = useState(() => FolderService.getInstance());
  const [fileSystemService] = useState(() => FileSystemService.getInstance());
  const [isFolderConnected, setIsFolderConnected] = useState(false);
  const [connectedFolderName, setConnectedFolderName] = useState<string>('');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if File System Access API is supported
        if (!folderService.isSupported) {
          const mockData = await generateMockData();
          setProfiles(mockData);
          setIsLoading(false);
          return;
        }

        // For supported browsers, start with mock data
        const mockData = await generateMockData();
        setProfiles(mockData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        const mockData = await generateMockData();
        setProfiles(mockData);
        setIsLoading(false);
      }
    };

    initializeApp();
    
    // Cleanup function to revoke object URLs
    return () => {
      profiles.forEach(profile => {
        profile.images.forEach(image => {
          if (image.url.startsWith('blob:')) {
            URL.revokeObjectURL(image.url);
          }
        });
      });
      
      allImages.forEach(image => {
        if (image.url.startsWith('blob:')) {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, [folderService]); // Remove profiles and allImages from deps to avoid memory leak

  const handleViewProfile = (id: string) => {
    setSelectedProfileId(id);
    setView('detail');
  };
  
  // Quick add profile with auto-generated name
  const handleQuickAddProfile = async () => {
    try {
      setIsLoading(true);
      
      // Generate unique profile name
      const profileName = generateUniqueProfileName(profiles);
      
      if (isFolderConnected && folderService.isConnected) {
        // Create in real file system
        const folderStructure = await folderService.getFolderStructure();
        if (!folderStructure) {
          throw new Error('No folder connected');
        }

        // Create profile directory
        const sanitizedName = profileName.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
        const profileHandle = await folderStructure.mainFolderHandle.getDirectoryHandle(sanitizedName, { create: true });
        
        // Create images subdirectory
        await profileHandle.getDirectoryHandle('images', { create: true });
        
        // Create profile.json metadata
        const profileData = {
          id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: profileName,
          note: '',
          avatarId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          imageCount: 0,
          imageOrder: [],
          avatarCropData: null
        };
        
        const metadataHandle = await profileHandle.getFileHandle('profile.json', { create: true });
        const writable = await metadataHandle.createWritable();
        await writable.write(JSON.stringify(profileData, null, 2));
        await writable.close();
        
        // Create new profile object
        const newProfile: Profile = {
          id: profileData.id,
          name: profileName,
          note: '',
          images: [],
          avatarId: ''
        };
        
        // Update state
        setProfiles(prev => [newProfile, ...prev]);
        
        // Navigate to profile detail page
        setSelectedProfileId(newProfile.id);
        setView('detail');
        
      } else {
        // Create in memory
        const newProfile: Profile = {
          id: `profile_${Date.now()}_${Math.random()}`,
          name: profileName,
          note: '',
          images: [],
          avatarId: ''
        };
        
        setProfiles(prev => [newProfile, ...prev]);
        
        // Navigate to profile detail page
        setSelectedProfileId(newProfile.id);
        setView('detail');
      }
    } catch (error) {
      console.error('Error creating quick profile:', error);
      alert(`❌ Failed to create profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddProfile = async (newProfileData: {name: string, note: string, avatar: File, images: File[]}) => {
    const { name, note, avatar, images: otherImages } = newProfileData;
    
    try {
      if (isFolderConnected && folderService.isConnected) {
        // Save to real file system
        setIsLoading(true);
        
        const folderStructure = await folderService.getFolderStructure();
        if (!folderStructure) {
          throw new Error('No folder connected');
        }

        // Create profile directory
        const sanitizedName = name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
        const profileHandle = await folderStructure.mainFolderHandle.getDirectoryHandle(sanitizedName, { create: true });
        
        // Create images subdirectory
        const imagesHandle = await profileHandle.getDirectoryHandle('images', { create: true });
        
        // Save all images (avatar + others) with timestamp filenames
        const allFiles = [avatar, ...otherImages];
        const savedImages: LocalImage[] = [];
        
        for (const file of allFiles) {
          // Use FileSystemService to save with timestamp filename
          const timestampFileName = await fileSystemService.saveImageToProfile(profileHandle, file, 'images');
          
          if (timestampFileName) {
            savedImages.push({
              id: `${timestampFileName}`,
              url: URL.createObjectURL(file),
              name: timestampFileName,
              profileName: sanitizedName
            });
          }
        }
        
        // Create profile.json metadata
        const profileData = {
          id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          note,
          avatarId: '', // Don't auto-assign avatar, let user choose
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          imageCount: savedImages.length,
          imageOrder: savedImages.map(img => img.name),
          avatarCropData: null
        };
        
        const metadataHandle = await profileHandle.getFileHandle('profile.json', { create: true });
        const writable = await metadataHandle.createWritable();
        await writable.write(JSON.stringify(profileData, null, 2));
        await writable.close();
        
        // Create new profile object
        const newProfile: Profile = {
          id: profileData.id,
          name,
          note,
          images: savedImages,
          avatarId: profileData.avatarId
        };
        
        // Update state
        setProfiles(prev => [newProfile, ...prev]);
        setAllImages(prev => [...prev, ...savedImages]);
        
        alert(`✅ Profile "${name}" saved successfully with ${savedImages.length} images!`);
      } else {
        // Fallback to in-memory operations with timestamp filenames
        const allFiles = [avatar, ...otherImages];
        const newImages: LocalImage[] = allFiles.map(file => {
          // Generate timestamp filename for memory mode too
          const now = new Date();
          const timestamp = now.toISOString()
            .replace(/T/, '_')
            .replace(/:/g, '')
            .replace(/-/g, '')
            .split('.')[0]; // Format: YYYYMMDD_HHMMSS
          
          // Get file extension from original filename
          const lastDotIndex = file.name.lastIndexOf('.');
          const extension = lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : '.jpg';
          const timestampFileName = `${timestamp}${extension}`;

          return {
            id: timestampFileName,
            url: URL.createObjectURL(file),
            name: timestampFileName
          };
        });

        const newProfile: Profile = {
          id: `profile_${Date.now()}_${Math.random()}`,
          name,
          note,
          images: newImages,
          avatarId: '' // Don't auto-assign avatar, let user choose
        };
        
        setProfiles(prev => [newProfile, ...prev]);
        alert(`✅ Profile "${name}" created in memory mode!`);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      alert(`❌ Failed to create profile: ${error.message}`);
    } finally {
      setIsLoading(false);
      setView('list');
    }
  };

  const handleUpdateProfile = (id: string, data: { name: string, note: string }) => {
    const profile = profiles.find(p => p.id === id);
    if (!profile) {
      console.error('Profile not found for update');
      return;
    }
    
    const updateProfileInMemory = (updatedFolderName?: string) => {
      setProfiles(prev => {
        const updated = prev.map(p => {
          if (p.id === id) {
            const updatedProfile = { ...p, ...data };
            
            // Update profileName in all images if folder was renamed
            if (updatedFolderName) {
              updatedProfile.images = p.images.map(img => ({
                ...img,
                profileName: updatedFolderName
              }));
            }
            
            return updatedProfile;
          }
          return p;
        });
        return updated;
      });
      
      // Update allImages if folder was renamed
      if (updatedFolderName) {
        setAllImages(prev => prev.map(img => {
          if (img.profileName === profile.images[0]?.profileName) {
            return { ...img, profileName: updatedFolderName };
          }
          return img;
        }));
      }
    };
    
    if (isFolderConnected && folderService.isConnected) {
      // Update in real file system
      console.log('📝 Updating profile in file system...');
      const currentFolderName = profile.images[0]?.profileName || profile.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
      const needsFolderRename = data.name !== profile.name;
      
      if (needsFolderRename) {
        // Rename folder and update metadata
        console.log(`🔄 Profile name changed, renaming folder: "${currentFolderName}" → "${data.name}"`);
        const sanitizedNewName = data.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
        
        folderService.renameProfileFolder(currentFolderName, data.name, {
          name: data.name,
          note: data.note
        })
          .then(success => {
            if (success) {
              updateProfileInMemory(sanitizedNewName);
              alert(`✅ Profile "${data.name}" updated and folder renamed successfully!`);
            } else {
              alert(`❌ Failed to rename folder for profile "${data.name}"`);
            }
          })
          .catch(error => {
            console.error('Rename profile folder error:', error);
            alert(`❌ Error renaming folder: ${error.message}`);
          });
      } else {
        // Just update metadata, no folder rename needed
        folderService.updateProfileMetadata(currentFolderName, {
          name: data.name,
          note: data.note
        })
          .then(success => {
            if (success) {
              updateProfileInMemory();
              alert(`✅ Profile "${data.name}" updated successfully!`);
            } else {
              alert(`❌ Failed to update profile "${data.name}"`);
            }
          })
          .catch(error => {
            console.error('Update profile error:', error);
            alert(`❌ Error updating profile: ${error.message}`);
          });
      }
    } else {
      // Update in memory only
      updateProfileInMemory();
      alert(`✅ Profile "${data.name}" updated in memory!`);
    }
  };

  const handleUpdateCropData = (profileId: string, cropData: CropData) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) {
      return;
    }
    
    const updateCropInMemory = () => {
      setProfiles(prev => {
        const updated = prev.map(p => p.id === profileId ? { ...p, avatarCropData: cropData } : p);
        return updated;
      });
    };
    
    if (isFolderConnected && folderService.isConnected) {
      const profileFolderName = profile.images[0]?.profileName || profile.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
      
      folderService.updateProfileMetadata(profileFolderName, {
        avatarCropData: cropData
      })
        .then(success => {
          if (success) {
            updateCropInMemory();
          }
        })
        .catch(error => {
          console.error('Save crop center error:', error);
        });
    } else {
      updateCropInMemory();
    }
  };
  
  const handleDeleteImage = (profileId: string, imageId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    const image = profile?.images.find(img => img.id === imageId);
    
    if (!profile || !image) {
      console.error('Profile or image not found for deletion');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${image.name}"?`)) {
      return;
    }
    
    const updateProfiles = () => {
      setProfiles(prev => {
        const updated = prev.map(p => {
          if (p.id === profileId) {
            const updatedImages = p.images.filter(img => {
              if (img.id === imageId) {
                // Revoke object URL to free memory
                if (img.url.startsWith('blob:')) {
                  URL.revokeObjectURL(img.url);
                  console.log(`🗑️ Revoked URL for deleted image: ${img.name}`);
                }
                return false;
              }
              return true;
            });
            
            // If the deleted image was the avatar, clear avatar (don't auto-assign)
            let newAvatarId = p.avatarId;
            if (p.avatarId === imageId) {
              newAvatarId = ''; // Clear avatar instead of auto-assigning
            }
            
            return { ...p, images: updatedImages, avatarId: newAvatarId };
          }
          return p;
        });
        
        console.log('✅ Profiles updated after image deletion');
        return updated;
      });
      
      // Update allImages array
      setAllImages(prev => prev.filter(img => img.id !== imageId));
    };
    
    if (isFolderConnected && folderService.isConnected) {
      // Delete from real file system
      console.log('🗑️ Starting file system deletion...');
      
      folderService.deleteImageFile(image.profileName || profile.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_'), image.name)
        .then(async success => {
          if (success) {
            // Reload the entire profile from file system to ensure data consistency
            const profileFolderName = image.profileName || profile.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
            const reloadedProfile = await folderService.loadProfile(profileFolderName);
            if (reloadedProfile) {
              setProfiles(prev => {
                const updated = prev.map(p => {
                  if (p.id === profileId) {
                    return { ...p, images: reloadedProfile.images };
                  }
                  return p;
                });
                console.log('✅ Profile reloaded after image deletion');
                return updated;
              });
              setAllImages(prev => {
                // Remove old images from this profile and add reloaded ones
                const otherImages = prev.filter(img => img.profileName !== profileFolderName);
                return [...otherImages, ...reloadedProfile.images];
              });
            } else {
              // Fallback to memory update if reload fails
              updateProfiles();
            }
            alert(`✅ Image "${image.name}" deleted successfully!`);
          } else {
            alert(`❌ Failed to delete image "${image.name}"`);
          }
        })
        .catch(error => {
          console.error('Delete image error:', error);
          alert(`❌ Error deleting image: ${error.message}`);
        });
    } else {
      // Delete from memory
      updateProfiles();
      alert(`✅ Image "${image.name}" deleted from memory!`);
    }
  };

  const handleSetAvatar = async (profileId: string, imageId: string) => {
    // Prevent concurrent avatar setting operations
    if (isLoading) {
      console.log('⏳ Avatar setting already in progress, ignoring request');
      return;
    }
    
    const profile = profiles.find(p => p.id === profileId);
    const image = profile?.images.find(img => img.id === imageId);
    
    if (!profile || !image) {
      console.error('Profile or image not found for avatar setting');
      return;
    }
    
    console.log(`👤 Setting avatar for profile "${profile.name}" to image "${image.name}"`);
    setIsLoading(true);
    
    try {
      // Lấy kích thước ảnh để tính toán default crop data cho ảnh MỚI
      console.log(`🔄 Calculating new crop data for image: ${image.name}`);
      const dimensions = await getImageDimensions(image.url);
      
      // Tính toán crop data MỚI dựa trên kích thước ảnh hiện tại (không dùng lại cũ)
      const newCropData = calculateDefaultCropData(dimensions.width, dimensions.height);
      
      console.log(`📏 Image "${image.name}" dimensions: ${dimensions.width}x${dimensions.height}`);
      console.log(`🎯 NEW crop data (not reused): centerX=${newCropData.centerX}, centerY=${newCropData.centerY}`);
      
      const updateAvatarInMemory = () => {
        setProfiles(prev => {
          const updated = prev.map(p => {
            if (p.id === profileId) {
              // Set ảnh mới làm avatar với crop data MỚI tính toán riêng
              return { 
                ...p, 
                avatarId: imageId, 
                avatarCropData: newCropData  // Luôn luôn tạo mới, không dùng lại cũ
              };
            }
            return p;
          });
          console.log('✅ Avatar updated in memory with FRESH crop data');
          return updated;
        });
      };
      
      if (isFolderConnected && folderService.isConnected) {
        // Update avatar in file system
        console.log('💾 Updating avatar in file system...');
        const profileFolderName = profile.images[0]?.profileName || profile.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
        
        const success = await folderService.updateProfileMetadata(profileFolderName, {
          avatarId: imageId,
          avatarCropData: newCropData  // Sử dụng crop data MỚI
        });
        
        if (success) {
          console.log(`💾 Metadata updated successfully for avatar: ${imageId}`);
          try {
            // Reload profile from file system to ensure consistency
            const reloadedProfile = await folderService.loadProfile(profileFolderName);
            if (reloadedProfile) {
              console.log(`🔄 Profile reloaded:`, reloadedProfile);
              setProfiles(prev => {
                const updated = prev.map(p => {
                  if (p.id === profileId) {
                    return { ...p, ...reloadedProfile, id: profileId }; // Preserve original ID
                  }
                  return p;
                });
                console.log('✅ Profile reloaded after avatar setting');
                return updated;
              });
            } else {
              console.warn('⚠️ Failed to reload profile, using fallback update');
              // Fallback to memory update
              updateAvatarInMemory();
            }
            console.log(`✅ Avatar set to "${image.name}" for profile "${profile.name}"`);
          } catch (reloadError) {
            console.error('❌ Error during profile reload:', reloadError);
            // Fallback to memory update
            updateAvatarInMemory();
          }
        } else {
          console.error(`❌ Failed to update avatar metadata`);
          // Fallback to memory update
          updateAvatarInMemory();
        }
      } else {
        // Update in memory only
        updateAvatarInMemory();
        console.log(`✅ Avatar set to "${image.name}" in memory mode`);
      }
    } catch (error) {
      console.error('Set avatar error:', error);
      // Fallback without crop data if image loading fails
      setProfiles(prev => {
        const updated = prev.map(p => {
          if (p.id === profileId) {
            return { ...p, avatarId: imageId };
          }
          return p;
        });
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadImages = (profileId: string, files: File[]) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) {
      console.error('Profile not found for image upload');
      return;
    }
    
    console.log(`📸 Starting upload of ${files.length} images to profile: ${profile.name}`);
    
    const addImagesToMemory = (filesToAdd: File[] = files) => {
      const newImages: LocalImage[] = filesToAdd.map(file => {
        // Generate timestamp filename for memory mode too
        const now = new Date();
        const timestamp = now.toISOString()
          .replace(/T/, '_')
          .replace(/:/g, '')
          .replace(/-/g, '')
          .split('.')[0]; // Format: YYYYMMDD_HHMMSS
        
        // Get file extension from original filename
        const lastDotIndex = file.name.lastIndexOf('.');
        const extension = lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : '.jpg';
        const timestampFileName = `${timestamp}${extension}`;

        return {
          id: timestampFileName,
          url: URL.createObjectURL(file),
          name: timestampFileName,
          profileName: profile.images[0]?.profileName
        };
      });
      
      setProfiles(prev => {
        const updated = prev.map(p => {
          if (p.id === profileId) {
            return { ...p, images: [...p.images, ...newImages] };
          }
          return p;
        });
        console.log('✅ Profiles updated after image upload');
        return updated;
      });
      
      setAllImages(prev => [...prev, ...newImages]);
      return newImages;
    };
    
    if (isFolderConnected && folderService.isConnected) {
      // Add to real file system
      console.log('📁 Uploading to file system...');
      const profileFolderName = profile.images[0]?.profileName || profile.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
      
      folderService.addImagesToProfile(profileFolderName, files)
        .then(async newImages => {
          if (newImages.length > 0) {
            console.log(`✅ ${newImages.length} images added to file system, reloading profile...`);
            
            // Reload the entire profile from file system to ensure data consistency
            const reloadedProfile = await folderService.loadProfile(profileFolderName);
            if (reloadedProfile) {
              console.log(`📁 Profile reloaded from disk:`, reloadedProfile);
              console.log(`📋 Reloaded images count: ${reloadedProfile.images.length}`);
              console.log(`📋 Reloaded imageOrder:`, reloadedProfile.imageOrder);
              
              setProfiles(prev => {
                const updated = prev.map(p => {
                  if (p.id === profileId) {
                    // Update with reloaded data but preserve original profile ID
                    const updatedProfile = { 
                      ...reloadedProfile, 
                      id: profileId,
                      // Ensure imageOrder is properly set
                      imageOrder: reloadedProfile.imageOrder || reloadedProfile.images.map(img => img.id)
                    };
                    console.log(`🔄 Updated profile state:`, updatedProfile);
                    return updatedProfile;
                  }
                  return p;
                });
                console.log('✅ File system upload completed, profile state updated');
                return updated;
              });
              
              setAllImages(prev => {
                // Remove old images from this profile and add reloaded ones
                const otherImages = prev.filter(img => img.profileName !== profileFolderName);
                const updatedAllImages = [...otherImages, ...reloadedProfile.images];
                console.log(`🖼️ Updated allImages: ${updatedAllImages.length} total images`);
                return updatedAllImages;
              });
            } else {
              console.error(`❌ Failed to reload profile: ${profileFolderName}`);
            }
            // alert(`✅ Added ${newImages.length} images successfully!`);
          } else {
            alert(`❌ Failed to add images`);
          }
        })
        .catch(error => {
          console.error('Upload images error:', error);
          alert(`❌ Error uploading images: ${error.message}`);
        });
    } else {
      // Add to memory only
      const newImages = addImagesToMemory();
      alert(`✅ Added ${newImages.length} images to memory!`);
    }
  };

  const handleLoadFromFolder = async () => {
    if (!folderService.isSupported) {
      alert('Your browser does not support File System Access API. Please use Chrome or Edge.');
      return;
    }

    try {
      console.log('🔄 Starting folder connection...');
      setIsLoading(true);
      
      // Connect to main folder
      const connected = await folderService.connectToMainFolder();
      if (!connected) {
        console.log('❌ User cancelled folder selection');
        setIsLoading(false);
        return; // User cancelled
      }

      console.log('✅ Folder connected successfully');
      setIsFolderConnected(true);
      setConnectedFolderName(folderService.folderName);

      // Load all profiles from the folder
      console.log('📂 Loading profiles from folder...');
      const loadedProfiles = await folderService.loadAllProfiles();
      const loadedImages = await folderService.loadAllImages();

      console.log(`📊 Loaded ${loadedProfiles.length} profiles and ${loadedImages.length} images`);
      console.log('Loaded profiles:', loadedProfiles);

      setProfiles(loadedProfiles);
      setAllImages(loadedImages);

      console.log('🔄 State updated with loaded data');

      alert(`✅ Connected to "${folderService.folderName}" - Found ${loadedProfiles.length} profiles with ${loadedImages.length} images total`);
    } catch (error) {
      console.error('❌ Error connecting to folder:', error);
      alert('Failed to connect to folder. Please try again.');
    } finally {
      console.log('🏁 Finishing folder load, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleDisconnectFolder = () => {
    folderService.disconnect();
    setIsFolderConnected(false);
    setConnectedFolderName('');
    
    // Reload mock data
    generateMockData().then(mockData => {
      setProfiles(mockData);
      setAllImages([]);
    });
  };

  const handleDeleteProfile = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    if (!confirm(`Are you sure you want to delete profile "${profile.name}" and all its images? This action cannot be undone.`)) {
      return;
    }
    
    const removeFromMemory = () => {
      // Revoke all object URLs for this profile
      profile.images.forEach(image => {
        if (image.url.startsWith('blob:')) {
          URL.revokeObjectURL(image.url);
        }
      });
      
      // Remove from profiles and allImages
      setProfiles(prev => {
        const updated = prev.filter(p => p.id !== profileId);
        console.log('✅ Profile removed from memory');
        return updated;
      });
      setAllImages(prev => prev.filter(img => img.profileName !== (profile.images[0]?.profileName || profile.name)));
    };
    
    if (isFolderConnected && folderService.isConnected) {
      // Delete from real file system
      console.log('🗑️ Deleting profile from file system...');
      const profileFolderName = profile.images[0]?.profileName || profile.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
      
      folderService.deleteProfile(profileFolderName)
        .then(success => {
          if (success) {
            removeFromMemory();
            alert(`✅ Profile "${profile.name}" deleted successfully!`);
          } else {
            alert(`❌ Failed to delete profile "${profile.name}"`);
          }
        })
        .catch(error => {
          console.error('Delete profile error:', error);
          alert(`❌ Error deleting profile: ${error.message}`);
        });
    } else {
      // Delete from memory only
      removeFromMemory();
      alert(`✅ Profile "${profile.name}" deleted from memory!`);
    }
  };

  const handleViewGallery = () => {
    setView('gallery');
  };

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  // Validate selected profile - with additional safety checks
  React.useEffect(() => {
    if (view === 'detail' && selectedProfileId) {
      if (!selectedProfile && !isLoading) {
        console.warn('Selected profile not found, redirecting to list');
        setView('list');
        setSelectedProfileId(null);
      }
    }
  }, [selectedProfile, selectedProfileId, view, isLoading]);

  // Additional safety check to prevent profile from disappearing during avatar operations
  const safeSelectedProfile = React.useMemo(() => {
    if (!selectedProfileId) return null;
    return profiles.find(p => p.id === selectedProfileId) || null;
  }, [profiles, selectedProfileId]);

  // Helper function to delete image from gallery view
  const handleDeleteImageFromGallery = async (imageId: string) => {
    // Find the profile that contains this image
    const profile = profiles.find(p => p.images.some(img => img.id === imageId));
    if (!profile) {
      console.error('Profile not found for image:', imageId);
      return;
    }
    
    await handleDeleteImage(profile.id, imageId);
  };

  // Handle reordering images within a profile
  const handleReorderImages = async (profileId: string, imageIds: string[]) => {
    console.log(`🔄 Starting reorder for profile ${profileId} with imageIds:`, imageIds);
    
    // Immediately update UI state for responsive experience
    setProfiles(prev => {
      const updated = prev.map(profile => {
        if (profile.id === profileId) {
          // Reorder images based on the provided imageIds order
          const reorderedImages = imageIds.map(id => {
            return profile.images.find(img => img.id === id);
          }).filter(Boolean) as LocalImage[];
          
          const newProfile = { 
            ...profile, 
            images: reorderedImages,
            imageOrder: imageIds // Update imageOrder to match new order
          };
          console.log(`📝 Updated profile in memory (immediate UI update)`);
          return newProfile;
        }
        return profile;
      });
      
      return updated;
    });

    // Update allImages array to maintain consistency
    const updatedProfile = profiles.find(p => p.id === profileId);
    if (updatedProfile) {
      const reorderedImages = imageIds.map(id => {
        return updatedProfile.images.find(img => img.id === id);
      }).filter(Boolean) as LocalImage[];
      
      setAllImages(prev => {
        const otherImages = prev.filter(img => 
          !reorderedImages.some(profImg => profImg.id === img.id)
        );
        
        return [...otherImages, ...reorderedImages];
      });
    }

    // Save to file system in background (don't block UI)
    if (isFolderConnected && folderService.isConnected && updatedProfile) {
      // Use setTimeout to make this truly async and not block the UI
      setTimeout(async () => {
        try {
          const profileFolderName = updatedProfile.images[0]?.profileName || 
                                    updatedProfile.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
          
          console.log(`💾 Saving image order to file system in background for folder: ${profileFolderName}`);
          
          const updateResult = await folderService.updateProfileMetadata(profileFolderName, {
            imageOrder: imageIds
          });
          
          if (updateResult) {
            console.log(`✅ Successfully saved image order in background for profile: ${profileFolderName}`);
          } else {
            console.error(`❌ Failed to save image order in background for profile: ${profileFolderName}`);
          }
        } catch (error) {
          console.error('Failed to save image order to file system in background:', error);
        }
      }, 0); // Run in next tick
    } else {
      console.log(`📝 Image order updated in memory only (not connected to file system)`);
    }
  };

  const renderView = () => {
    console.log('🎨 Rendering view:', view);
    console.log('📊 Current state:', {
      isLoading,
      profilesCount: profiles.length,
      allImagesCount: allImages.length,
      selectedProfileId,
      isFolderConnected,
      connectedFolderName
    });

    if (isLoading) {
      console.log('⏳ Showing loading screen');
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center">
            <UserIcon className="w-16 h-16 animate-pulse text-cyan-400" />
            <p className="mt-4 text-lg">Loading Photo Manager...</p>
            {folderService.isSupported && (
              <p className="mt-2 text-sm text-gray-400">
                {isFolderConnected ? 'Folder connected' : 'Ready to connect folder...'}
              </p>
            )}
          </div>
        </div>
      );
    }

    try {
      switch (view) {
      case 'detail':
        if (!safeSelectedProfile) {
          // Profile not found - redirect to home
          console.error('Profile not found, redirecting to home');
          setView('list');
          setSelectedProfileId(null);
          return (
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <p className="text-lg text-gray-400">Profile not found</p>
                <p className="text-sm text-gray-500">Redirecting to home...</p>
              </div>
            </div>
          );
        }
        
        return (
          <ProfileDetailPage 
            profile={safeSelectedProfile}
            onBack={() => setView('list')}
            onDeleteImage={(imageId) => handleDeleteImage(safeSelectedProfile.id, imageId)}
            onSetAvatar={(imageId) => handleSetAvatar(safeSelectedProfile.id, imageId)}
            onUploadImages={(files) => handleUploadImages(safeSelectedProfile.id, files)}
            onUpdateProfile={(data) => handleUpdateProfile(safeSelectedProfile.id, data)}
            onUpdateCropData={(cropData) => handleUpdateCropData(safeSelectedProfile.id, cropData)}
            onReorderImages={(imageIds) => handleReorderImages(safeSelectedProfile.id, imageIds)}
            onDeleteProfile={() => {
              handleDeleteProfile(safeSelectedProfile.id);
              setView('list'); // Go back to list after deletion
            }}
          />
        );
      case 'add':
        return <AddProfilePage onBack={() => setView('list')} onAddProfile={handleAddProfile} />;
      case 'gallery':
        return (
          <GalleryView
            images={allImages}
            onBack={() => setView('list')}
            folderName={connectedFolderName || 'Photo Gallery'}
            onDeleteImage={handleDeleteImageFromGallery}
          />
        );
      case 'list':
      default:
        console.log('🏠 Rendering HomePage');
        return (
          <HomePage 
            profiles={profiles} 
            onViewProfile={handleViewProfile} 
            onAddProfile={handleQuickAddProfile} 
            onLoadFromFolder={handleLoadFromFolder}
            onViewGallery={allImages.length > 0 ? handleViewGallery : undefined}
            onDisconnectFolder={isFolderConnected ? handleDisconnectFolder : undefined}
            serviceStatus={{
              isReady: isFolderConnected,
              isSupported: folderService.isSupported,
              connectedFolder: connectedFolderName
            }}
          />
        );
    }
  } catch (error) {
    console.error('❌ Error in renderView:', error);
    // Fallback UI in case of render error
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-red-400">Something went wrong</p>
          <p className="text-sm text-gray-500">Check console for details</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  };

  return <div className="min-h-screen bg-gray-900">{renderView()}</div>;
};

export default App;
