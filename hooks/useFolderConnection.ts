/**
 * Hook for managing folder connection state and operations
 */

import { useState, useCallback } from 'react';
import FolderService from '../services/FolderService';
import { Profile, LocalImage } from '../types';

export interface FolderConnectionState {
  isConnected: boolean;
  folderName: string;
  isLoading: boolean;
}

export const useFolderConnection = () => {
  const [folderService] = useState(() => FolderService.getInstance());
  const [connectionState, setConnectionState] = useState<FolderConnectionState>({
    isConnected: false,
    folderName: '',
    isLoading: false
  });

  const connectToFolder = useCallback(async (): Promise<{ profiles: Profile[], images: LocalImage[] } | null> => {
    if (!folderService.isSupported) {
      alert('Your browser does not support File System Access API. Please use Chrome or Edge.');
      return null;
    }

    try {
      setConnectionState(prev => ({ ...prev, isLoading: true }));
      
      const connected = await folderService.connectToMainFolder();
      if (!connected) {
        setConnectionState(prev => ({ ...prev, isLoading: false }));
        return null; // User cancelled
      }

      setConnectionState({
        isConnected: true,
        folderName: folderService.folderName,
        isLoading: false
      });

      // Load all profiles and images
      const loadedProfiles = await folderService.loadAllProfiles();
      const loadedImages = await folderService.loadAllImages();

      return { profiles: loadedProfiles, images: loadedImages };
    } catch (error) {
      console.error('Error connecting to folder:', error);
      setConnectionState(prev => ({ ...prev, isLoading: false }));
      alert('Failed to connect to folder. Please try again.');
      return null;
    }
  }, [folderService]);

  const disconnectFromFolder = useCallback(() => {
    folderService.disconnect();
    setConnectionState({
      isConnected: false,
      folderName: '',
      isLoading: false
    });
  }, [folderService]);

  return {
    folderService,
    connectionState,
    connectToFolder,
    disconnectFromFolder,
    isSupported: folderService.isSupported
  };
};