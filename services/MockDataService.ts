/**
 * Service for generating mock profile data
 */

import { Profile, LocalImage } from '../types';

export interface MockProfileData {
  name: string;
  note: string;
}

export class MockDataService {
  private static readonly MOCK_PROFILES_DATA: MockProfileData[] = [
    { name: 'Isabella Rossi', note: 'Travel enthusiast and photographer. Capturing moments from around the globe.' },
    { name: 'Kenji Tanaka', note: 'Urban explorer and street artist. The city is my canvas.' },
    { name: 'Anya Petrova', note: 'Lover of nature and wildlife. Finding beauty in the wild.' },
    { name: 'Mateo Garcia', note: 'Chef and culinary artist. Every dish tells a story.' },
    { name: 'Chloe Dubois', note: 'Musician and composer. Creating sounds that move the soul.' },
  ];

  /**
   * Generate mock images for a profile
   */
  private static generateMockImages(profileId: string, profileName: string): LocalImage[] {
    const images: LocalImage[] = [];
    const imageCount = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < imageCount; i++) {
      const imageId = `img_${Date.now()}_${Math.random()}`;
      const imageUrl = `https://picsum.photos/seed/${profileId}_${i}/800/600`;
      images.push({
        id: imageId,
        url: imageUrl,
        name: `${profileName.split(' ')[0]}_image_${i}.jpg`
      });
    }
    
    return images;
  }

  /**
   * Generate complete mock profiles with images
   */
  static async generateMockProfiles(): Promise<Profile[]> {
    const profiles: Profile[] = [];

    for (const profileData of this.MOCK_PROFILES_DATA) {
      const profileId = `profile_${Date.now()}_${Math.random()}`;
      const images = this.generateMockImages(profileId, profileData.name);
      
      if (images.length > 0) {
        profiles.push({
          id: profileId,
          ...profileData,
          images,
          avatarId: images[0].id,
        });
      }
    }
    
    return profiles;
  }

  /**
   * Generate single mock profile with given name
   */
  static generateMockProfile(name: string, note: string = ''): Profile {
    const profileId = `profile_${Date.now()}_${Math.random()}`;
    const images = this.generateMockImages(profileId, name);
    
    return {
      id: profileId,
      name,
      note,
      images,
      avatarId: images.length > 0 ? images[0].id : ''
    };
  }
}