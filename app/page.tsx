'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SunIcon, MoonIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

const GitHubLogo = () => (
  <svg viewBox="0 0 16 16" className="w-20 h-20 fill-current padding-2">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

export default function Home() {
  const [usernameQuery, setUsernameQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<GitHubUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleAddLocationFilter = () => {
    if (locationFilter.trim() && !activeFilters.includes(`location:${locationFilter.trim()}`)) {
      setActiveFilters([...activeFilters, `${locationFilter.trim()}`]);
      setLocationFilter('');
      setIsFilterModalOpen(false);
    }
  };

  const handleRemoveFilter = (filterToRemove: string) => {
    setActiveFilters(activeFilters.filter(filter => filter !== filterToRemove));
  };

  const handleSearch = async () => {
    // Validate search
    if (!usernameQuery.trim() && activeFilters.length === 0) {
      setError('Please enter a search query or add filters');
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Construct search query
      const searchParts = [];
      
      // Add username query if present
      if (usernameQuery.trim()) {
        searchParts.push(usernameQuery.trim());
      }

      // Add active filters with location qualifier
      const locationFilters = activeFilters.map(filter => `location:${filter}`);
      searchParts.push(...locationFilters);

      const searchQuery = searchParts.join(' ');

      const apiUrl = `https://api.github.com/search/users?q=${encodeURIComponent(searchQuery)}&per_page=30&page=1`;

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      
      // If no results found, show a helpful message
      if (data.items.length === 0) {
        setError('No users found matching your search criteria');
      }

      setSearchResults(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const filterModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterModalRef.current && 
        !filterModalRef.current.contains(event.target as Node)
      ) {
        setIsFilterModalOpen(false);
      }
    };

    // Add event listener when modal is open
    if (isFilterModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterModalOpen]);

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
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-full hover:bg-white/10 dark:hover:bg-gray-700/50 transition-colors"
            >
              {darkMode ? (
                <SunIcon className="w-7 h-7 text-yellow-500" />
              ) : (
                <MoonIcon className="w-7 h-7 text-gray-600" />
              )}
            </motion.button>
          </div>

          {/* Search and Filter Section */}
          <div className="relative max-w-3xl mx-auto mb-12">
            <div className="flex items-center space-x-4">
              <div className="relative flex-grow">
                <MagnifyingGlassIcon className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 z-10" />
                <input
                  type="text"
                  value={usernameQuery}
                  onChange={(e) => setUsernameQuery(e.target.value)}
                  placeholder="Search GitHub users"
                  className="w-full pl-12 pr-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearch}
                className="px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all duration-200 font-medium shadow-lg shadow-purple-500/20"
              >
                Search
              </motion.button>
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsFilterModalOpen(!isFilterModalOpen)}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 16v-4.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                </motion.button>
                {isFilterModalOpen && (
                  <div 
                    ref={filterModalRef}
                    className="absolute z-50 right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg p-4"
                  >
                    <input
                      type="text"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      placeholder="Enter location"
                      className="w-full py-2 px-3 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLocationFilter()}
                    />
                    <button
                      type="button"
                      onClick={handleAddLocationFilter}
                      className="mt-3 w-full py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Add Location Filter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Section */}
          {activeFilters.length > 0 && (
            <div className="max-w-3xl mx-auto mb-6 flex flex-wrap gap-2">
              {activeFilters.map((filter, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm"
                >
                  <span className="mr-2">{filter}</span>
                  <button
                    onClick={() => handleRemoveFilter(filter)}
                    className="text-purple-600 dark:text-purple-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-8 -mt-20">
        {searchResults.length > 0 && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-600 dark:text-gray-400 mb-6"
          >
            Found {searchResults.length} users
          </motion.p>
        )}

        <AnimatePresence>
          {isLoading && searchResults.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center h-64"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {searchResults.map((user, index) => (
                <motion.a
                  key={`${user.login}-${index}`}
                  variants={itemVariants}
                  href={user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="flex items-center space-x-4 p-4">
                    <div className="relative">
                      <img
                        src={user.avatar_url}
                        alt={user.login}
                        className="w-16 h-16 rounded-full ring-2 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {user.login}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-1">
                        View Profile 
                        <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                      </p>
                    </div>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

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
      <footer className="text-center py-8 text-gray-600 dark:text-gray-400 mt-8">
        <p className="text-sm">
        &copy; All rights reserved.
        </p>
      </footer>
    </main>
  );
}
