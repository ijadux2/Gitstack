const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOCAL_REPOS_PATH = process.env.LOCAL_REPOS_PATH || path.join(__dirname, '../../repos');

function isGitRepo(dirPath) {
  try {
    return fs.existsSync(path.join(dirPath, '.git'));
  } catch {
    return false;
  }
}

function getRepoInfo(repoPath, repoName) {
  try {
    const gitDir = path.join(repoPath, '.git');
    
    let branch = 'main';
    try {
      branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath, encoding: 'utf8' }).trim();
    } catch {}

    let lastCommit = null;
    try {
      const log = execSync('git log -1 --pretty=format:"%H|%an|%ae|%at|%s"', { cwd: repoPath, encoding: 'utf8' }).trim();
      const [hash, author, email, timestamp, message] = log.split('|');
      lastCommit = { hash, author, email, timestamp: parseInt(timestamp), message };
    } catch {}

    let description = '';
    try {
      description = fs.readFileSync(path.join(gitDir, 'description'), 'utf8').trim();
    } catch {}

    let commits = [];
    try {
      const log = execSync('git log --pretty=format:"%H|%an|%ae|%at|%s" -10', { cwd: repoPath, encoding: 'utf8' }).trim();
      commits = log.split('\n').filter(Boolean).map(line => {
        const [hash, author, email, timestamp, message] = line.split('|');
        return { hash, author, email, timestamp: parseInt(timestamp), message };
      });
    } catch {}

    let branches = [];
    try {
      const branchOutput = execSync('git branch -a', { cwd: repoPath, encoding: 'utf8' }).trim();
      branches = branchOutput.split('\n').map(b => b.replace(/^\*\s*/, '').trim()).filter(Boolean);
    } catch {}

    let files = [];
    try {
      const lsOutput = execSync('git ls-tree -r --name-only HEAD', { cwd: repoPath, encoding: 'utf8' }).trim();
      files = lsOutput.split('\n').filter(Boolean).filter(f => !f.startsWith('.git/'));
    } catch {}

    return {
      name: repoName,
      path: repoPath,
      description,
      branch,
      lastCommit,
      commits,
      branches,
      files,
      isLocal: true
    };
  } catch (error) {
    console.error(`Error getting repo info for ${repoName}:`, error.message);
    return null;
  }
}

function scanLocalRepos() {
  const repos = [];
  
  if (!fs.existsSync(LOCAL_REPOS_PATH)) {
    fs.mkdirSync(LOCAL_REPOS_PATH, { recursive: true });
    return repos;
  }

  const entries = fs.readdirSync(LOCAL_REPOS_PATH, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const repoPath = path.join(LOCAL_REPOS_PATH, entry.name);
      if (isGitRepo(repoPath)) {
        const info = getRepoInfo(repoPath, entry.name);
        if (info) {
          repos.push(info);
        }
      }
    }
  }
  
  return repos;
}

router.get('/', (req, res) => {
  const repos = scanLocalRepos();
  res.json(repos);
});

router.get('/:name', (req, res) => {
  const { name } = req.params;
  const repoPath = path.join(LOCAL_REPOS_PATH, name);
  
  if (!fs.existsSync(repoPath) || !isGitRepo(repoPath)) {
    return res.status(404).json({ error: 'Repository not found' });
  }
  
  const info = getRepoInfo(repoPath, name);
  if (!info) {
    return res.status(500).json({ error: 'Failed to read repository' });
  }
  
  res.json(info);
});

router.get('/:name/commits', (req, res) => {
  const { name } = req.params;
  const { limit = 50 } = req.query;
  const repoPath = path.join(LOCAL_REPOS_PATH, name);
  
  if (!fs.existsSync(repoPath) || !isGitRepo(repoPath)) {
    return res.status(404).json({ error: 'Repository not found' });
  }
  
  try {
    const log = execSync(`git log --pretty=format:"%H|%an|%ae|%at|%s" -${limit}`, { cwd: repoPath, encoding: 'utf8' }).trim();
    const commits = log.split('\n').filter(Boolean).map(line => {
      const [hash, author, email, timestamp, message] = line.split('|');
      return { hash, author, email, timestamp: parseInt(timestamp), message };
    });
    res.json(commits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get commits' });
  }
});

router.get('/:name/branches', (req, res) => {
  const { name } = req.params;
  const repoPath = path.join(LOCAL_REPOS_PATH, name);
  
  if (!fs.existsSync(repoPath) || !isGitRepo(repoPath)) {
    return res.status(404).json({ error: 'Repository not found' });
  }
  
  try {
    const branchOutput = execSync('git branch -a', { cwd: repoPath, encoding: 'utf8' }).trim();
    const branches = branchOutput.split('\n').map(b => {
      const current = b.startsWith('*');
      const name = b.replace(/^\*\s*/, '').trim();
      return { name, current };
    }).filter(b => b.name);
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get branches' });
  }
});

router.get('/:name/contents/*', (req, res) => {
  const { name } = req.params;
  const filePath = req.params[0] || '';
  const repoPath = path.join(LOCAL_REPOS_PATH, name);
  
  if (!fs.existsSync(repoPath) || !isGitRepo(repoPath)) {
    return res.status(404).json({ error: 'Repository not found' });
  }
  
  try {
    const fullPath = path.join(repoPath, filePath);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      const files = fs.readdirSync(fullPath)
        .filter(f => f !== '.git')
        .map(f => {
        const fstat = fs.statSync(path.join(fullPath, f));
        return {
          name: f,
          path: filePath ? `${filePath}/${f}` : f,
          type: fstat.isDirectory() ? 'dir' : 'file',
          size: fstat.size
        };
      });
      res.json(files);
    } else {
      const content = fs.readFileSync(fullPath, 'utf8');
      res.json({
        name: path.basename(filePath),
        path: filePath,
        type: 'file',
        content,
        size: stat.size
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get contents' });
  }
});

router.post('/clone', (req, res) => {
  const { url, name } = req.body;
  
  if (!url || !name) {
    return res.status(400).json({ error: 'URL and name are required' });
  }
  
  const repoPath = path.join(LOCAL_REPOS_PATH, name);
  
  if (fs.existsSync(repoPath)) {
    return res.status(400).json({ error: 'Repository already exists' });
  }
  
  try {
    execSync(`git clone ${url} "${repoPath}"`, { encoding: 'utf8' });
    const info = getRepoInfo(repoPath, name);
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: `Failed to clone: ${error.message}` });
  }
});

router.post('/init', (req, res) => {
  const { name, description = '' } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const repoPath = path.join(LOCAL_REPOS_PATH, name);
  
  if (fs.existsSync(repoPath)) {
    return res.status(400).json({ error: 'Repository already exists' });
  }
  
  try {
    fs.mkdirSync(repoPath, { recursive: true });
    execSync('git init', { cwd: repoPath, encoding: 'utf8' });
    
    if (description) {
      fs.writeFileSync(path.join(repoPath, '.git', 'description'), description);
    }
    
    const info = getRepoInfo(repoPath, name);
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: `Failed to init: ${error.message}` });
  }
});

module.exports = router;
