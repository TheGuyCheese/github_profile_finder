'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon, AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import FavoriteButton from '../components/FavoriteButton';
import UserMenu from '../components/UserMenu';

interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

interface SearchResults {
  items: GitHubUser[];
  total_count: number;
}

const GitHubLogo = () => (
  <svg viewBox="0 0 16 16" className="w-20 h-20 fill-current padding-2">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<GitHubUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newTheme;
    });
  };

  const constructSearchQuery = () => {
    let query = searchQuery;
    return query;
  };

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setError('Please enter a username');
      setUsers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchQuery = constructSearchQuery();
      const response = await fetch(
        `https://api.github.com/search/users?q=${encodeURIComponent(searchQuery)}&per_page=30&page=1`,
        { 
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
          next: { revalidate: 300 }
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('API rate limit exceeded. Please try again later or add a GitHub token.');
        } else if (response.status === 422) {
          throw new Error('Invalid search query. Please try a different search term.');
        }
        throw new Error('Failed to fetch search results. Please try again later.');
      }

      const data: SearchResults = await response.json();
      
      if (data.total_count === 0) {
        setError('No users found matching your search criteria.');
        setUsers([]);
      } else {
        setUsers(data.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen transition-colors duration-300 dark:bg-gray-900 bg-gray-50">
      {/* Hero Section with GitHub-style header */}
      <div className="bg-gradient-to-b from-purple-600/10 to-transparent dark:from-purple-900/20 pb-32 pt-10">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-4">
              <div className="text-purple-600 dark:text-purple-400">
                <GitHubLogo />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                  GitHub Profile Finder
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Discover developers around the world
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors duration-200"
                >
                  Login
                </button>
              )}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-6 w-6" />
                ) : (
                  <MoonIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="relative max-w-3xl mx-auto mb-12">
            <div className="flex flex-col items-center space-y-4 w-full max-w-3xl mx-auto">
              <div className="flex items-center w-full space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search GitHub users..."
                    className="w-full px-4 py-3 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSearch()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg shadow-blue-500/20"
                >
                  Search
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-8 -mt-20">
        {users.length > 0 && (
          <div className="w-full mt-8 max-w-6xl mx-auto">
            <p className="text-gray-500 dark:text-gray-400 text-left mb-4">
              Showing {users.length} results
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <div
                  key={user.login}
                  className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 group hover:shadow-lg dark:hover:shadow-gray-700 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="p-6 flex flex-col items-center">
                    <div className="relative">
                      <Image
                        src={user.avatar_url}
                        alt={user.login}
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full ring-2 ring-gray-200 dark:ring-gray-700 transition-all duration-300 group-hover:ring-blue-500"
                      />
                    </div>
                    <div className="mt-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {user.login}
                        </h3>
                        <FavoriteButton username={user.login} />
                      </div>
                      <div className="mt-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <Link
                          href={`/profile/${user.login}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
                        >
                          View Profile
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && users.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          </div>
        ) : (
          <></>
        )}

        {error && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600 dark:text-red-400 mb-6 bg-white dark:bg-gray-800 inline-block px-4 py-2 rounded-full shadow-sm"
          >
            {error}
          </motion.p>
        )}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <footer className="text-center py-8 text-gray-600 dark:text-gray-400 mt-8">
        <p className="text-sm">
        &copy; All rights reserved.
        </p>
      </footer>
    </main>
  );
}
