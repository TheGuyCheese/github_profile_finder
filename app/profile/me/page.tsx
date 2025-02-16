'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon, TrashIcon } from '@heroicons/react/24/solid';
import ImageCropper from '../../../components/ImageCropper';

export default function UserProfile() {
  const { user, isAuthenticated, logout, removeFromFavorites } = useAuth();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('favorites');
  const [cropImage, setCropImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchFavoriteProfiles = async () => {
      if (!user?.favorites.length) {
        setIsLoading(false);
        return;
      }

      try {
        const profiles = await Promise.all(
          user.favorites.map(async (username) => {
            const response = await fetch(`https://api.github.com/users/${username}`, {
              headers: {
                ...(process.env.NEXT_PUBLIC_GITHUB_TOKEN && {
                  Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
                }),
              },
            });
            if (!response.ok) return null;
            return response.json();
          })
        );

        setFavorites(profiles.filter(Boolean));
      } catch (error) {
        console.error('Error fetching favorite profiles:', error);
      }
      setIsLoading(false);
    };

    fetchFavoriteProfiles();
  }, [user?.favorites]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCropImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setAvatarUrl(croppedImage);
    localStorage.setItem(`userAvatar_${user?.email}`, croppedImage);
    setCropImage(null);
  };

  const handleRemoveFavorite = (username: string) => {
    removeFromFavorites(username);
    setFavorites(favorites.filter(profile => profile.login !== username));
  };

  useEffect(() => {
    if (user?.email) {
      const savedAvatar = localStorage.getItem(`userAvatar_${user.email}`);
      if (savedAvatar) {
        setAvatarUrl(savedAvatar);
      }
    }
  }, [user?.email]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/')}
          className="mb-6 flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Search</span>
        </motion.button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ring-4 ring-gray-100 dark:ring-gray-700 group-hover:ring-blue-500 transition-all duration-300">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors shadow-lg group-hover:scale-110 transform duration-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {user?.username}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{user?.email}</p>
              <div className="mt-4 flex items-center justify-center md:justify-start space-x-4">
                <div className="flex items-center space-x-2 text-yellow-500">
                  <StarIcon className="w-5 h-5" />
                  <span className="font-medium">{favorites.length} Favorites</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Favorites Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <StarIcon className="w-6 h-6 text-yellow-400 mr-2" />
            Favorite Profiles
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {favorites.map((profile) => (
                  <motion.div
                    key={profile.login}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group bg-gray-50 dark:bg-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      <Image
                        src={profile.avatar_url}
                        alt={profile.login}
                        width={48}
                        height={48}
                        className="rounded-full ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-blue-500 transition-all duration-300"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                          {profile.name || profile.login}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{profile.login}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/profile/${profile.login}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleRemoveFavorite(profile.login)}
                          className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8 max-w-md mx-auto">
                <StarIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No favorites yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start exploring GitHub profiles and add them to your favorites!
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600 transition-colors"
                >
                  Explore Profiles
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      {cropImage && (
        <ImageCropper
          image={cropImage}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropImage(null)}
        />
      )}
    </div>
  );
}
