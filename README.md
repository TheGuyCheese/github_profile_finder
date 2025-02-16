# GitHub Profile Finder

A Next.js application that allows you to search and explore GitHub user profiles.

## Setup

1. Create a `.env.local` file in the root directory with the following content:
```
NEXT_PUBLIC_GITHUB_TOKEN=your_github_token_here
```

2. To get your GitHub token:
   - Go to GitHub Settings > Developer Settings > Personal Access Tokens
   - Generate a new token with the `read:user` and `user:email` scopes
   - Copy the token and paste it in your `.env.local` file

## Features

- Search GitHub users by username
- Filter users by location
- View detailed user profiles including:
  - Repositories
  - Followers
  - Following
- Dark mode support
- Responsive design

## Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Note

The GitHub API has rate limits:
- Without authentication: 60 requests per hour
- With authentication: 5,000 requests per hour

It's recommended to set up a GitHub token to avoid rate limiting issues.
