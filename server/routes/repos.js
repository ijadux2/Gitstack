const express = require('express');
const axios = require('axios');
const router = express.Router();
const { isAuthenticated } = require('./auth');

// Get authenticated user's repositories
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { page = 1, per_page = 30, sort = 'updated' } = req.query;
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      },
      params: {
        page,
        per_page,
        sort,
        direction: 'desc'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching repositories:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Get a specific repository
router.get('/:owner/:repo', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching repository:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch repository' });
  }
});

// Create a new repository
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name, description, private: isPrivate, auto_init } = req.body;
    
    const response = await axios.post('https://api.github.com/user/repos', {
      name,
      description,
      private: isPrivate || false,
      auto_init: auto_init || false
    }, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating repository:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create repository' });
  }
});

// Update a repository
router.patch('/:owner/:repo', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { name, description, private: isPrivate } = req.body;
    
    const response = await axios.patch(`https://api.github.com/repos/${owner}/${repo}`, {
      name,
      description,
      private: isPrivate
    }, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error updating repository:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to update repository' });
  }
});

// Delete a repository
router.delete('/:owner/:repo', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    await axios.delete(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json({ message: 'Repository deleted successfully' });
  } catch (error) {
    console.error('Error deleting repository:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to delete repository' });
  }
});

// Get repository contents
router.get('/:owner/:repo/contents/*', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const path = req.params[0] || '';
    const { ref } = req.query;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      },
      params: { ref }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching repository contents:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch repository contents' });
  }
});

// Get repository branches
router.get('/:owner/:repo/branches', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching branches:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Get repository commits
router.get('/:owner/:repo/commits', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { sha, page = 1, per_page = 30 } = req.query;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      },
      params: { sha, page, per_page }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching commits:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch commits' });
  }
});

// Get repository contributors
router.get('/:owner/:repo/contributors', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contributors`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching contributors:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch contributors' });
  }
});

// Star a repository
router.put('/:owner/:repo/star', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    await axios.put(`https://api.github.com/user/starred/${owner}/${repo}`, {}, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json({ message: 'Repository starred' });
  } catch (error) {
    console.error('Error starring repository:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to star repository' });
  }
});

// Unstar a repository
router.delete('/:owner/:repo/star', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    await axios.delete(`https://api.github.com/user/starred/${owner}/${repo}`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json({ message: 'Repository unstarred' });
  } catch (error) {
    console.error('Error unstarring repository:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to unstar repository' });
  }
});

module.exports = router;