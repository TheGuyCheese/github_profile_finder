'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface FavoriteButtonProps {
  username: string;
  className?: string;
}

export default function FavoriteButton({ username, className = '' }: FavoriteButtonProps) {
  const { user, addToFavorites, removeFromFavorites, isAuthenticated } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);
  
  const isFavorite = user?.favorites.includes(username);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }
    
    if (isFavorite) {
      removeFromFavorites(username);
    } else {
      addToFavorites(username);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseEnter={() => !isAuthenticated && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`transition-all duration-200 ${className} ${
          !isAuthenticated ? 'opacity-50 hover:opacity-75' : 'hover:scale-110'
        }`}
      >
        {isFavorite ? (
          <StarIconSolid className="h-6 w-6 text-yellow-400" />
        ) : (
          <StarIcon className="h-6 w-6 text-gray-400 hover:text-yellow-400" />
        )}
      </button>
      
      {showTooltip && !isAuthenticated && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-sm text-white bg-gray-900 rounded-md whitespace-nowrap">
          Login to add favorites
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
        </div>
      )}
    </div>
  );
}
