import React from 'react';
import { PlusIcon } from './icons';

interface AddProfileCardProps {
  onAddProfile: () => void;
}

const AddProfileCard: React.FC<AddProfileCardProps> = ({ onAddProfile }) => {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg bg-gray-800/50 border-2 border-dashed border-gray-600 shadow-lg transition-all duration-300 hover:border-cyan-500 hover:bg-gray-800 hover:-translate-y-1 w-full aspect-square"
      onClick={onAddProfile}
    >
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="w-16 h-16 mb-4 bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-cyan-500 transition-colors duration-300">
          <PlusIcon className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors duration-300" />
        </div>
        
        <h3 className="font-bold text-lg text-gray-400 group-hover:text-white transition-colors duration-300 mb-1">
          Add Profile
        </h3>
        
        <p className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors duration-300 text-center px-4">
          Click to create a new profile
        </p>
      </div>
    </div>
  );
};

export default AddProfileCard;