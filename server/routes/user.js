const express = require('express');
const axios = require('axios');
const router = express.Router();
const { isAuthenticated } = require('./auth');

// Get authenticated user's GitHub profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching user profile:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get user's GitHub organizations
router.get('/orgs', isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get('https://api.github.com/user/orgs', {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching organizations:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// Search users
router.get('/search', isAuthenticated, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter required' });
    }
    
    const response = await axios.get(`https://api.github.com/search/users?q=${encodeURIComponent(q)}`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error searching users:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

module.exports = router;