'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon, AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

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
  const [usernameQuery, setUsernameQuery] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState('');
  const [accountType, setAccountType] = useState<'all' | 'user' | 'org'>('all');
  const [sortBy, setSortBy] = useState<'followers' | 'repositories' | 'joined' | ''>('');
  const [minRepos, setMinRepos] = useState('');
  const [minFollowers, setMinFollowers] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<GitHubUser[]>([]);
  const [totalResultsCount, setTotalResultsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [seenUsers, setSeenUsers] = useState(new Set<string>());

  // Filter modal ref
  const filterModalRef = useRef<HTMLDivElement>(null);

  const handleAccountTypeChange = (value: 'all' | 'user' | 'org') => {
    setAccountType(value);
  };

  const handleSortByChange = (value: 'followers' | 'repositories' | 'joined' | '') => {
    setSortBy(value);
  };

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleAddLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      setLocations([...locations, newLocation.trim()]);
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (location: string) => {
    setLocations(locations.filter(loc => loc !== location));
  };

  const constructSearchQuery = () => {
    let query = usernameQuery;
    
    if (locations.length > 0) {
      query += ' ' + locations.map(location => `location:${location}`).join(' ');
    }

    if (minRepos) {
      query += ` repos:>=${minRepos}`;
    }

    if (minFollowers) {
      query += ` followers:>=${minFollowers}`;
    }

    if (accountType !== 'all') {
      query += ` type:${accountType}`;
    }

    if (sortBy) {
      query += ` sort:${sortBy}`;
    }

    return query;
  };

  const handleSearch = async (page = 1) => {
    const trimmedQuery = usernameQuery.trim();
    const trimmedFilters = [...locations].map(filter => filter.trim()).filter(Boolean);

    if (!trimmedQuery && trimmedFilters.length === 0) {
      setError('Please enter a username or add location filters');
      setSearchResults([]);
      setTotalResultsCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchQuery = constructSearchQuery();
      const response = await fetch(
        `https://api.github.com/search/users?q=${encodeURIComponent(searchQuery)}&per_page=30&page=${page}`,
        { 
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(process.env.NEXT_PUBLIC_GITHUB_TOKEN && {
              'Authorization': `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`
            })
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
        setSearchResults([]);
        setTotalResultsCount(0);
        setHasMoreResults(false);
      } else {
        const newUsers = data.items.filter(user => !seenUsers.has(user.login));
        const updatedSeenUsers = new Set(seenUsers);
        newUsers.forEach(user => updatedSeenUsers.add(user.login));
        setSeenUsers(updatedSeenUsers);

        setSearchResults(page === 1 ? newUsers : [...searchResults, ...newUsers]);
        setTotalResultsCount(data.total_count);
        setHasMoreResults(searchResults.length + newUsers.length < data.total_count);
        setCurrentPage(page);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    handleSearch(currentPage + 1);
  };

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
              onClick={toggleDarkMode}
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
            <div className="flex flex-col items-center space-y-4 w-full max-w-3xl mx-auto">
              <div className="flex items-center w-full space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={usernameQuery}
                    onChange={(e) => setUsernameQuery(e.target.value)}
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
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsFilterModalOpen(true)}
                  className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  <AdjustmentsHorizontalIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Active Filters Section */}
          {locations.length > 0 && (
            <div className="max-w-3xl mx-auto mb-6 flex flex-wrap gap-2">
              {locations.map((location, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm"
                >
                  <span className="mr-2">{location}</span>
                  <button
                    onClick={() => handleRemoveLocation(location)}
                    className="text-green-600 dark:text-green-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
          <div className="w-full mt-8 max-w-6xl mx-auto">
            <p className="text-gray-500 dark:text-gray-400 text-left mb-4">
              Showing {searchResults.length} out of {totalResultsCount} results
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((user) => (
                <div
                  key={`${user.login}-${currentPage}`}
                  className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 group hover:shadow-lg dark:hover:shadow-gray-700 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="p-6 flex flex-col items-center">
                    <div className="relative">
                      <Image
                        src={user.avatar_url}
                        alt={user.login}
                        width={48}
                        height={48}
                        className="w-24 h-24 rounded-full ring-2 ring-gray-200 dark:ring-gray-700 transition-all duration-300 group-hover:ring-blue-500"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                      {user.login}
                    </h3>
                    <div className="mt-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <Link
                        href={`/profile/${user.login}`}
                        target="_blank"
                        className="block px-4 py-2 mb-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-center"
                      >
                        View Profile
                      </Link>
                      <a
                        href={user.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center"
                      >
                        GitHub Profile ↗
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {hasMoreResults && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}

        {isLoading && searchResults.length === 0 ? (
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

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Search Filters</h2>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Locations
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {locations.map((location) => (
                    <span
                      key={location}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                    >
                      {location}
                      <button
                        onClick={() => handleRemoveLocation(location)}
                        className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
                    placeholder="Add location..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddLocation}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Minimum Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Repositories
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minRepos}
                    onChange={(e) => setMinRepos(e.target.value)}
                    className="w-full px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Followers
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minFollowers}
                    onChange={(e) => setMinFollowers(e.target.value)}
                    className="w-full px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Account Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Type
                </label>
                <select
                  value={accountType}
                  onChange={(e) => handleAccountTypeChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
                >
                  <option value="all">All Account Types</option>
                  <option value="user">Users Only</option>
                  <option value="org">Organizations Only</option>
                </select>
              </div>

              {/* Sort By Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort Results By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortByChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
                >
                  <option value="">Best Match</option>
                  <option value="followers">Most Followers</option>
                  <option value="repositories">Most Repositories</option>
                  <option value="joined">Recently Joined</option>
                </select>
              </div>

              {/* Apply Filters Button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setIsFilterModalOpen(false);
                    handleSearch();
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <footer className="text-center py-8 text-gray-600 dark:text-gray-400 mt-8">
        <p className="text-sm">
        &copy; All rights reserved.
        </p>
      </footer>
    </main>
  );
}
