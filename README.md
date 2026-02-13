# GitStack - GitHub-like Repository Management Tool

A full-stack web application that replicates essential features of GitHub, allowing users to manage repositories, track issues, and collaborate on projects. GitStack utilizes GitHub's API for repository functionalities, enabling users to interact indirectly with their GitHub accounts.

![GitStack](https://img.shields.io/badge/GitStack-v1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![MongoDB](https://img.shields.io/badge/MongoDB-5.0%2B-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## in work

🚧 Work in Progress

## ⚠️ CRITICAL: Security Notice for Contributors

**NEVER commit your `.env` file to GitHub!** The `.env` file contains sensitive credentials (GitHub OAuth secrets, database passwords) that should remain private.

- ✅ `.env` is already in `.gitignore` (DO NOT REMOVE IT)
- ✅ Always use `.env.example` as a template
- ✅ Each developer must create their own `.env` file locally
- ✅ When deploying, set environment variables through your hosting platform (Heroku, Vercel, etc.)

**See the [Setup Guide](#installation) below for proper configuration.**

---

## Features

### User Authentication

- GitHub OAuth integration for secure authentication
- Session persistence using cookies
- User profile management

### Repository Management

- View, create, update, and delete repositories
- Browse repository contents and file structures
- View commits, branches, and contributors
- Star/unstar repositories

### Issue Tracking

- Create, update, and close issues
- Add labels and assignees to issues
- Comment on issues
- Filter issues by state (open/closed)

### Pull Requests

- Create and manage pull requests
- View code diffs
- Request reviews and add comments
- Merge pull requests

### Collaboration

- User search functionality
- Organization management
- Activity tracking

## Technology Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database for user data and sessions
- **Mongoose** - ODM for MongoDB
- **Passport.js** - Authentication middleware
- **GitHub OAuth** - OAuth provider
- **Axios** - HTTP client for GitHub API

### Frontend

- **HTML5** - Structure
- **CSS3** - Styling (custom CSS, no frameworks)
- **Vanilla JavaScript** - Interactivity (ES6+)
- **Font Awesome** - Icons

### Security

- Helmet.js - Security headers
- Express-rate-limit - Rate limiting
- CORS - Cross-origin resource sharing
- Secure session management

## Project Structure

```
gitstack/
├── client/                     # Frontend code
│   ├── index.html             # Main HTML file
│   └── src/
│       ├── app.js             # Main JavaScript application
│       └── styles/
│           └── main.css       # Main stylesheet
├── server/                     # Backend code
│   ├── server.js              # Express server entry point
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── repos.js           # Repository routes
│   │   ├── issues.js          # Issue routes
│   │   ├── pulls.js           # Pull request routes
│   │   └── user.js            # User routes
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Issue.js           # Issue model
│   │   └── PullRequest.js     # Pull request model
│   └── middleware/
│       └── auth.js            # Authentication middleware
├── config/
│   └── passport.js            # Passport.js configuration
├── package.json               # Dependencies and scripts
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [MongoDB](https://www.mongodb.com/) (version 5.0 or higher)
- [Git](https://git-scm.com/) (for version control)
- A [GitHub](https://github.com/) account

## 🔐 For Contributors: Environment Setup

If you're cloning this repository to contribute or run it locally, follow these steps **before** running the application:

1. **Each developer needs their own GitHub OAuth App** - You cannot use someone else's credentials
2. **Create your own `.env` file** - Never use a shared `.env` file
3. **Keep secrets private** - Never share your `GITHUB_CLIENT_SECRET` or `SESSION_SECRET`

**Why this matters:** GitHub OAuth credentials are tied to specific domains. Using someone else's credentials will result in authentication failures and security vulnerabilities.

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/gitstack.git
cd gitstack
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables ⚠️ IMPORTANT

**SECURITY WARNING**: The `.env` file contains sensitive credentials and should NEVER be committed to version control. It is already in `.gitignore` - do not remove it!

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your credentials:

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017/gitstack

   # Session Secret (generate a strong random string - NEVER share this!)
   SESSION_SECRET=your-secret-key-here

   # GitHub OAuth App Credentials (Get these from GitHub - see step 4)
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret

   # Client URL
   CLIENT_URL=http://localhost:3000
   ```

3. **Verify your `.env` is not tracked by git**:
   ```bash
   git status
   # You should NOT see .env in the untracked files that are ready to commit
   # If you do, STOP and check your .gitignore file
   ```

### 4. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: GitStack
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
4. Click "Register application"
5. Generate a client secret
6. Copy the Client ID and Client Secret to your `.env` file

### 5. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
# Start MongoDB service from Services panel
```

### 6. Run the Application

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

### 7. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

## API Documentation

### Authentication Routes

| Method | Endpoint                    | Description                 |
| ------ | --------------------------- | --------------------------- |
| GET    | `/api/auth/github`          | Initiate GitHub OAuth login |
| GET    | `/api/auth/github/callback` | GitHub OAuth callback       |
| GET    | `/api/auth/me`              | Get current user info       |
| GET    | `/api/auth/logout`          | Logout user                 |

### Repository Routes

| Method | Endpoint                             | Description              |
| ------ | ------------------------------------ | ------------------------ |
| GET    | `/api/repos`                         | List user's repositories |
| GET    | `/api/repos/:owner/:repo`            | Get repository details   |
| POST   | `/api/repos`                         | Create a new repository  |
| PATCH  | `/api/repos/:owner/:repo`            | Update repository        |
| DELETE | `/api/repos/:owner/:repo`            | Delete repository        |
| GET    | `/api/repos/:owner/:repo/contents/*` | Get repository contents  |
| GET    | `/api/repos/:owner/:repo/branches`   | List branches            |
| GET    | `/api/repos/:owner/:repo/commits`    | List commits             |

### Issue Routes

| Method | Endpoint                                          | Description       |
| ------ | ------------------------------------------------- | ----------------- |
| GET    | `/api/issues/:owner/:repo`                        | List issues       |
| GET    | `/api/issues/:owner/:repo/:issue_number`          | Get issue details |
| POST   | `/api/issues/:owner/:repo`                        | Create issue      |
| PATCH  | `/api/issues/:owner/:repo/:issue_number`          | Update issue      |
| POST   | `/api/issues/:owner/:repo/:issue_number/comments` | Add comment       |

### Pull Request Routes

| Method | Endpoint                                     | Description         |
| ------ | -------------------------------------------- | ------------------- |
| GET    | `/api/pulls/:owner/:repo`                    | List pull requests  |
| POST   | `/api/pulls/:owner/:repo`                    | Create pull request |
| GET    | `/api/pulls/:owner/:repo/:pull_number`       | Get PR details      |
| PATCH  | `/api/pulls/:owner/:repo/:pull_number`       | Update PR           |
| PUT    | `/api/pulls/:owner/:repo/:pull_number/merge` | Merge PR            |

## Usage Guide

### First Time Setup

1. Visit `http://localhost:3000`
2. Click "Sign in with GitHub"
3. Authorize GitStack to access your GitHub account
4. You'll be redirected to the dashboard

### Creating a Repository

1. From the dashboard, click the "New" button in the sidebar
2. Or go to the Repositories page and click "New Repository"
3. Fill in the repository details:
   - Name (required)
   - Description (optional)
   - Visibility (Public/Private)
   - Initialize with README (optional)
4. Click "Create repository"

### Managing Issues

1. Navigate to a repository
2. Click the "Issues" tab
3. Click "New issue" to create an issue
4. Fill in the title and description
5. Add labels as needed
6. Click "Submit new issue"

### Working with Pull Requests

1. Navigate to a repository
2. Click the "Pull requests" tab
3. Click "New pull request"
4. Select the base and compare branches
5. Add title and description
6. Submit the pull request

## Keyboard Shortcuts

| Shortcut | Action           |
| -------- | ---------------- |
| `/`      | Focus search bar |
| `ESC`    | Close modals     |

## Security Considerations

### 🔒 Critical Security Requirements

1. **NEVER commit `.env` file**
   - It is already in `.gitignore` - DO NOT REMOVE IT
   - Contains sensitive OAuth secrets that could compromise your GitHub account
   - If accidentally committed, immediately revoke and regenerate your GitHub OAuth credentials

2. **Environment Variables**
   - Each developer needs their own GitHub OAuth App
   - Each deployment needs its own set of environment variables
   - Never share `GITHUB_CLIENT_SECRET` or `SESSION_SECRET`

3. **Session Security**
   - Use strong, random `SESSION_SECRET` in production (minimum 32 characters)
   - Rotate session secrets periodically
   - Enable HTTPS in production

4. **GitHub OAuth Security**
   - Use separate OAuth Apps for development and production
   - Set proper Authorization callback URLs (must match your domain)
   - Review and limit OAuth scopes to minimum required permissions

5. **Rate Limiting**
   - Built-in rate limiting: 100 requests per 15 minutes per IP
   - Respects GitHub API rate limits
   - Exponential backoff for failed requests

### What to do if secrets are exposed:

1. **Immediately revoke the exposed credentials** in GitHub Developer Settings
2. **Generate new OAuth credentials**
3. **Update your `.env` file** with new secrets
4. **Rotate session secrets** if `SESSION_SECRET` was exposed
5. **Check GitHub Security** for any unauthorized access

## Deployment

### Deploying to Heroku

**⚠️ IMPORTANT: Never commit your `.env` file to Heroku!** Use environment variables instead:

1. Create a Heroku app:

   ```bash
   heroku create your-gitstack-app
   ```

2. Set environment variables (DO NOT add these to git):

   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SESSION_SECRET=your-secret-key
   heroku config:set GITHUB_CLIENT_ID=your-client-id
   heroku config:set GITHUB_CLIENT_SECRET=your-client-secret
   heroku config:set MONGODB_URI=your-mongodb-uri
   ```

3. Deploy (your `.env` file will NOT be uploaded):
   ```bash
   git push heroku main
   ```

**Note:** The `.env` file is in `.gitignore` and will not be committed. Heroku uses its own environment variable system (`heroku config`).

### Deploying to Vercel

1. Install Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Deploy:

   ```bash
   vercel
   ```

3. Set environment variables in the Vercel dashboard

## Rate Limiting

GitStack implements rate limiting to prevent abuse:

- 100 requests per 15 minutes per IP
- Respects GitHub API rate limits
- Implements exponential backoff for failed requests

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use ESLint for JavaScript linting
- Follow existing code conventions
- Write meaningful commit messages
- Add tests for new features

## Known Issues

- GitHub API rate limits may affect heavy usage
- Large repositories may take time to load
- Some features require public repository access

## Roadmap

- [ ] Git operations via isomorphic-git
- [ ] Real-time notifications
- [ ] Dark mode
- [ ] Mobile app
- [ ] Advanced search functionality
- [ ] GitHub Actions integration
- [ ] Wiki functionality
- [ ] Project boards

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [GitHub](https://github.com)
- Icons by [Font Awesome](https://fontawesome.com)
- Built with [Node.js](https://nodejs.org) and [Express](https://expressjs.com)

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Screenshots

_(Screenshots to be added)_

## 🚀 Quick Start Checklist

Before you start coding:

- [ ] Cloned the repository
- [ ] Ran `npm install` to install dependencies
- [ ] Created your own `.env` file from `.env.example`
- [ ] **Created your own GitHub OAuth App** at https://github.com/settings/applications/new
- [ ] Copied your GitHub Client ID and Secret to `.env`
- [ ] Verified `.env` is in `.gitignore` (DO NOT REMOVE IT)
- [ ] Started MongoDB service
- [ ] Ran `npm run dev` to start the server
- [ ] Verified the app works at http://localhost:3000

**Remember:** Each developer must use their own GitHub OAuth credentials. Sharing credentials is a security risk and will cause authentication failures.

---

**Happy coding with GitStack!**

**⚠️ One More Time: NEVER commit `.env` to GitHub!**
