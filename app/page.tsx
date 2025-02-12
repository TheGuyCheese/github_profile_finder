'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SunIcon, MoonIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
  bio: string;
}

interface GitHubResponse {
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
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const PER_PAGE = 30;

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const searchUsers = async (newSearch = true) => {
    if (!searchQuery) return;
    
    setLoading(true);
    const currentPage = newSearch ? 1 : page;
    
    try {
      const response = await fetch(
        `https://api.github.com/search/users?q=${searchQuery}&per_page=${PER_PAGE}&page=${currentPage}`
      );
      const data: GitHubResponse = await response.json();
      
      if (newSearch) {
        setUsers(data.items || []);
        setPage(1);
        setTotalCount(data.total_count);
      } else {
        setUsers(prev => [...prev, ...(data.items || [])]);
      }
      
      setHasMore(data.total_count > currentPage * PER_PAGE);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    searchUsers(false);
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

          <div className="relative mb-12 max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers(true)}
                placeholder="Search GitHub users..."
                className="w-full px-6 py-4 pl-14 rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-lg shadow-lg"
              />
              <MagnifyingGlassIcon className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            </div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => searchUsers(true)}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium shadow-lg shadow-purple-500/20"
              >
                Search
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-8 -mt-20">
        {totalCount > 0 && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-600 dark:text-gray-400 mb-6 bg-white dark:bg-gray-800 inline-block px-4 py-2 rounded-full shadow-sm"
          >
            Found {totalCount.toLocaleString()} users
          </motion.p>
        )}

        <AnimatePresence mode="wait">
          {loading && users.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center py-12"
            >
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {users.map((user, index) => (
                <motion.a
                  key={`${user.login}-${index}`}
                  variants={itemVariants}
                  href={user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={user.avatar_url}
                        alt={user.login}
                        className="w-16 h-16 rounded-full ring-2 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
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

        {hasMore && !loading && users.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mt-12 mb-16"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadMore}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:shadow-xl transition-colors font-medium shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Load More
                  <span className="text-purple-300">↓</span>
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>
      <footer className="text-center py-8 text-gray-600 dark:text-gray-400 mt-8">
        <p className="text-sm">
          {new Date().getFullYear()}-2040 Aditya Singh. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
