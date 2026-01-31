
import React, { useState, useMemo } from 'react';
import { Profile } from '../types';
import ProfileCard from './ProfileCard';
import AddProfileCard from './AddProfileCard';
import { SearchIcon, PlusIcon, FolderIcon, ImageIcon, XIcon } from './icons';

interface HomePageProps {
  profiles: Profile[];
  onViewProfile: (id: string) => void;
  onAddProfile: () => void;
  onLoadFromFolder?: () => void;
  onViewGallery?: () => void;
  onDisconnectFolder?: () => void;
  serviceStatus?: {
    isReady: boolean;
    isSupported: boolean;
    connectedFolder?: string;
  };
}

const HomePage: React.FC<HomePageProps> = ({ 
  profiles, 
  onViewProfile, 
  onAddProfile, 
  onLoadFromFolder, 
  onViewGallery,
  onDisconnectFolder,
  serviceStatus 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Debug logging
  console.log('🏠 HomePage render:', {
    profilesCount: profiles.length,
    searchTerm,
    serviceStatus
  });

  const filteredProfiles = useMemo(() => {
    if (!searchTerm) return profiles;
    return profiles.filter(profile =>
      profile.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [profiles, searchTerm]);

  console.log('🔍 Filtered profiles count:', filteredProfiles.length);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex flex-col space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Local <span className="text-cyan-400">Photo Manager</span>
          </h1>
          {serviceStatus && (
            <div className="flex items-center gap-4">
              {serviceStatus.isSupported ? (
                serviceStatus.isReady ? (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-green-400 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      Connected to "{serviceStatus.connectedFolder}"
                    </span>
                    {onDisconnectFolder && (
                      <button
                        onClick={onDisconnectFolder}
                        className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
                      >
                        <XIcon className="w-3 h-3" />
                        Disconnect
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-blue-400 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Ready to connect - Click "Connect Folder"
                  </span>
                )
              ) : (
                <span className="text-sm text-orange-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  Browser compatibility mode - Limited features
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex-grow md:flex-grow-0 md:min-w-[280px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search profiles..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-full py-2.5 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
            />
          </div>
          <div className="flex items-center gap-2">
            {onLoadFromFolder && (
              <button
                onClick={onLoadFromFolder}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-4 rounded-full transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:scale-105"
              >
                <FolderIcon className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {serviceStatus?.isReady ? 'Reload' : 'Connect'}
                </span>
              </button>
            )}
            {onViewGallery && (
              <button
                onClick={onViewGallery}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-medium py-2.5 px-4 rounded-full transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-105"
              >
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Gallery</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {/* Existing Profile Cards */}
        {filteredProfiles.map(profile => {
          try {
            return (
              <ProfileCard key={profile.id} profile={profile} onView={() => onViewProfile(profile.id)} />
            );
          } catch (error) {
            console.error('❌ Error rendering profile card:', error, profile);
            return (
              <div key={profile.id || 'error'} className="aspect-square bg-red-800 rounded-xl p-4 flex items-center justify-center">
                <div className="text-center">
                  <XIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-xs text-red-400">Error</p>
                </div>
              </div>
            );
          }
        })}
        
        {/* Add Profile Card - Always last */}
        <AddProfileCard onAddProfile={onAddProfile} />
      </div>
      
      {/* Empty state message when no profiles exist */}
      {filteredProfiles.length === 0 && (
        <div className="text-center py-12 col-span-full">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-400 mb-2">
              {searchTerm ? 'No profiles match your search' : 'Welcome! Create your first profile'}
            </h2>
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'Try adjusting your search terms' : 'Click the "Add Profile" card above to get started'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
