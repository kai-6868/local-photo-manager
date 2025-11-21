
import React, { useState, useCallback, DragEvent } from 'react';
import { ArrowLeftIcon, UploadIcon, UserIcon, XIcon } from './icons';

interface AddProfilePageProps {
  onBack: () => void;
  onAddProfile: (data: { name: string, note: string, avatar: File, images: File[] }) => void;
}

const AddProfilePage: React.FC<AddProfilePageProps> = ({ onBack, onAddProfile }) => {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };

  const handleImagesChange = (files: FileList) => {
    setImages(prev => [...prev, ...Array.from(files)]);
  };
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && avatar) {
      onAddProfile({ name, note, avatar, images });
    } else {
      alert('Name and Avatar are required.');
    }
  };

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImagesChange(e.dataTransfer.files);
    }
  }, []);

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors mb-6">
        <ArrowLeftIcon className="w-6 h-6" />
        Back to Profiles
      </button>

      <h1 className="text-4xl font-bold mb-8">Create New Profile</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-lg font-medium text-gray-300 mb-2">Name</label>
          <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
        </div>

        <div>
          <label htmlFor="note" className="block text-lg font-medium text-gray-300 mb-2">Note</label>
          <textarea id="note" value={note} onChange={e => setNote(e.target.value)} rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
        </div>

        <div>
            <label className="block text-lg font-medium text-gray-300 mb-2">Avatar (Required)</label>
            <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-gray-800 border border-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {avatar ? 
                        <img src={URL.createObjectURL(avatar)} alt="Avatar preview" className="w-full h-full object-cover" /> : 
                        <UserIcon className="w-12 h-12 text-gray-500" />
                    }
                </div>
                <label htmlFor="avatar-upload" className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Choose Avatar
                </label>
                <input id="avatar-upload" type="file" onChange={handleAvatarChange} className="hidden" accept="image/*" required/>
            </div>
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-300 mb-2">Upload Images (Optional)</label>
          <div onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-cyan-500 bg-gray-800/50' : 'border-gray-700'}`}>
            <UploadIcon className="w-12 h-12 mx-auto text-gray-500 mb-2"/>
            <p className="text-gray-400">Drag & drop images here, or <label htmlFor="images-upload" className="text-cyan-400 hover:underline cursor-pointer">browse</label></p>
            <input id="images-upload" type="file" multiple onChange={(e) => e.target.files && handleImagesChange(e.target.files)} className="hidden" accept="image/*" />
          </div>
        </div>

        {images.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">Image Previews</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative aspect-square group">
                  <img src={URL.createObjectURL(image)} alt={`preview ${index}`} className="w-full h-full object-cover rounded-lg" />
                  <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="pt-4">
          <button type="submit" className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={!name || !avatar}>
            Create Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProfilePage;
