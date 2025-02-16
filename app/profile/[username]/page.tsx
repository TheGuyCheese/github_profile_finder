'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPinIcon, LinkIcon } from '@heroicons/react/24/outline';
import FavoriteButton from '../../../components/FavoriteButton';
import { useAuth } from '../../../context/AuthContext';
import Image from 'next/image';

interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
  name?: string;
}

interface ProfileData extends GitHubUser {
  bio?: string;
  followers: number;
  following: number;
  public_repos: number;
  location?: string;
  company?: string;
  blog?: string;
  twitter_username?: string;
}

interface Repository {
  id: number;
  name: string;
  description?: string;
  html_url: string;
  stargazers_count: number;
  language?: string;
  updated_at: string;
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function ProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const username = resolvedParams.username;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [followers, setFollowers] = useState<GitHubUser[]>([]);
  const [following, setFollowing] = useState<GitHubUser[]>([]);
  const [activeTab, setActiveTab] = useState<'repositories' | 'followers' | 'following'>('repositories');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add state for repository pagination
  const [currentRepoPage, setCurrentRepoPage] = useState(1);
  const reposPerPage = 10;

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    document.documentElement.classList.toggle('dark', isDark);

    // Set up a listener for theme changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'darkMode') {
        const newDarkMode = e.newValue === 'true';
        document.documentElement.classList.toggle('dark', newDarkMode);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setIsLoading(true);
        setError(null);

        // Prepare headers
        const headers: HeadersInit = {
          'Accept': 'application/vnd.github.v3+json'
        };

        // Add token if available
        if (process.env.NEXT_PUBLIC_GITHUB_TOKEN) {
          headers['Authorization'] = `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`;
        }

        // Fetch user profile
        const profileResponse = await fetch(`https://api.github.com/users/${username}`, { 
          headers,
          next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!profileResponse.ok) {
          if (profileResponse.status === 404) {
            throw new Error(`User ${username} not found`);
          } else if (profileResponse.status === 403) {
            throw new Error('API rate limit exceeded. Please try again later.');
          }
          throw new Error(`Failed to fetch profile. Please try again later.`);
        }
        const profileData = await profileResponse.json();
        setProfile(profileData);

        // Fetch repositories
        const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { 
          headers,
          next: { revalidate: 3600 }
        });
        if (!reposResponse.ok) {
          if (reposResponse.status === 403) {
            throw new Error('API rate limit exceeded. Please try again later.');
          }
          throw new Error('Failed to fetch repositories. Please try again later.');
        }
        const reposData = await reposResponse.json();
        setRepositories(reposData);

        // Fetch followers
        const followersResponse = await fetch(`https://api.github.com/users/${username}/followers`, { 
          headers,
          next: { revalidate: 3600 }
        });
        if (!followersResponse.ok) {
          if (followersResponse.status === 403) {
            throw new Error('API rate limit exceeded. Please try again later.');
          }
          throw new Error('Failed to fetch followers. Please try again later.');
        }
        const followersData = await followersResponse.json();
        setFollowers(followersData);

        // Fetch following
        const followingResponse = await fetch(`https://api.github.com/users/${username}/following`, { 
          headers,
          next: { revalidate: 3600 }
        });
        if (!followingResponse.ok) {
          if (followingResponse.status === 403) {
            throw new Error('API rate limit exceeded. Please try again later.');
          }
          throw new Error('Failed to fetch following list. Please try again later.');
        }
        const followingData = await followingResponse.json();
        setFollowing(followingData);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfileData();
  }, [username]);

  // Filter function for followers and following
  const getFilteredUsers = (users: GitHubUser[]) => {
    return users.filter(user => 
      user.login.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Get current repos
  const indexOfLastRepo = currentRepoPage * reposPerPage;
  const indexOfFirstRepo = indexOfLastRepo - reposPerPage;
  const currentRepos = repositories.slice(indexOfFirstRepo, indexOfLastRepo);
  const totalRepoPages = Math.ceil(repositories.length / reposPerPage);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 16 16" className="w-full h-full fill-current animate-pulse">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center text-red-500 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>{error}</p>
          <div className="mt-4 text-sm text-gray-600">
            {!process.env.NEXT_PUBLIC_GITHUB_TOKEN && (
              <p>Tip: Consider adding a GitHub Personal Access Token to increase API rate limits.</p>
            )}
          </div>
          <Link href="/" className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'repositories':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {repo.name}
                      </a>
                      {repo.description && (
                        <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        ⭐ {repo.stargazers_count}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center space-x-4">
                    {repo.language && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                        {repo.language}
                      </div>
                    )}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Updated {new Date(repo.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalRepoPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setCurrentRepoPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentRepoPage === 1}
                  className={`px-4 py-2 rounded-lg ${
                    currentRepoPage === 1
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalRepoPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentRepoPage(pageNum)}
                      className={`w-8 h-8 rounded-lg ${
                        currentRepoPage === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentRepoPage(prev => Math.min(prev + 1, totalRepoPages))}
                  disabled={currentRepoPage === totalRepoPages}
                  className={`px-4 py-2 rounded-lg ${
                    currentRepoPage === totalRepoPages
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        );
      case 'followers':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredUsers(followers).map((follower) => (
              <div
                key={follower.login}
                className="flex items-center space-x-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
              >
                <Image
                  src={follower.avatar_url}
                  alt={follower.login}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {follower.login}
                  </h3>
                  <div className="mt-2 space-y-2 flex flex-col">
                    <Link
                      href={`/profile/${follower.login}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      View Profile
                    </Link>
                    <a
                      href={follower.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 dark:text-gray-400 hover:underline text-sm"
                    >
                      GitHub Profile ↗
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'following':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredUsers(following).map((followedUser) => (
              <div
                key={followedUser.login}
                className="flex items-center space-x-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
              >
                <Image
                  src={followedUser.avatar_url}
                  alt={followedUser.login}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {followedUser.login}
                  </h3>
                  <div className="mt-2 space-y-2 flex flex-col">
                    <Link
                      href={`/profile/${followedUser.login}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      View Profile
                    </Link>
                    <a
                      href={followedUser.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 dark:text-gray-400 hover:underline text-sm"
                    >
                      GitHub Profile ↗
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden"
        >
          {/* Profile Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Image
                src={profile.avatar_url}
                alt={`${profile.login}'s avatar`}
                width={128}
                height={128}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 ring-gray-200 dark:ring-gray-700"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {profile.name || profile.login}
                  </h1>
                  <FavoriteButton username={username} />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1">@{profile.login}</p>
                {profile.bio && (
                  <p className="text-gray-700 dark:text-gray-300 mt-3">{profile.bio}</p>
                )}
                <div className="flex flex-wrap gap-4 mt-4">
                  {profile.location && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPinIcon className="w-5 h-5 mr-1" />
                      {profile.location}
                    </div>
                  )}
                  {profile.blog && (
                    <a
                      href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <LinkIcon className="w-5 h-5 mr-1" />
                      Website
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={profile.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View on GitHub
                </a>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6 border-t dark:border-gray-700 pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{repositories.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Repositories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{followers.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{following.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Following</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('repositories')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'repositories'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Repositories
                </button>
                <button
                  onClick={() => setActiveTab('followers')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'followers'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Followers
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'following'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Following
                </button>
              </nav>
            </div>
          </div>

          {/* Search bar for followers/following */}
          {(activeTab === 'followers' || activeTab === 'following') && (
            <div className="px-6 mb-6 mt-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Filter ${activeTab}...`}
                  className="w-full max-w-md px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {renderContent()}
          </div>

          {/* Back to Search Button */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              ← Back to Search
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
