const express = require('express');
const axios = require('axios');
const router = express.Router();
const { isAuthenticated } = require('./auth');
const PullRequest = require('../models/PullRequest');

// Get pull requests for a repository
router.get('/:owner/:repo', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { state = 'open', page = 1, per_page = 30 } = req.query;
    
    // Fetch from GitHub API
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      },
      params: {
        state,
        page,
        per_page
      }
    });
    
    // Also fetch local pull requests
    const localPRs = await PullRequest.find({ repoOwner: owner, repoName: repo, status: state });
    
    res.json({
      github: response.data,
      local: localPRs
    });
  } catch (error) {
    console.error('Error fetching pull requests:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch pull requests' });
  }
});

// Get a specific pull request
router.get('/:owner/:repo/:pull_number', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, pull_number } = req.params;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching pull request:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch pull request' });
  }
});

// Create a new pull request
router.post('/:owner/:repo', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { title, body, head, base, useGithub = true } = req.body;
    
    if (useGithub) {
      // Create on GitHub
      const response = await axios.post(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
        title,
        body,
        head,
        base
      }, {
        headers: {
          Authorization: `token ${req.user.githubToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      
      res.status(201).json(response.data);
    } else {
      // Create locally
      const pr = new PullRequest({
        repoOwner: owner,
        repoName: repo,
        title,
        description: body,
        author: req.user.username,
        authorAvatar: req.user.avatar,
        headBranch: head,
        baseBranch: base
      });
      
      await pr.save();
      res.status(201).json(pr);
    }
  } catch (error) {
    console.error('Error creating pull request:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create pull request' });
  }
});

// Update a pull request
router.patch('/:owner/:repo/:pull_number', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, pull_number } = req.params;
    const { title, body, state } = req.body;
    
    const response = await axios.patch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}`, {
      title,
      body,
      state
    }, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error updating pull request:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to update pull request' });
  }
});

// Merge a pull request
router.put('/:owner/:repo/:pull_number/merge', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, pull_number } = req.params;
    const { commit_title, commit_message, sha } = req.body;
    
    const response = await axios.put(`https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/merge`, {
      commit_title,
      commit_message,
      sha
    }, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error merging pull request:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to merge pull request' });
  }
});

// Get pull request files (diff)
router.get('/:owner/:repo/:pull_number/files', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, pull_number } = req.params;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/files`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching pull request files:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch pull request files' });
  }
});

// Get pull request commits
router.get('/:owner/:repo/:pull_number/commits', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, pull_number } = req.params;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/commits`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching pull request commits:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch pull request commits' });
  }
});

// Get pull request reviews
router.get('/:owner/:repo/:pull_number/reviews', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, pull_number } = req.params;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/reviews`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching reviews:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create a review
router.post('/:owner/:repo/:pull_number/reviews', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, pull_number } = req.params;
    const { body, event, comments } = req.body;
    
    const response = await axios.post(`https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/reviews`, {
      body,
      event,
      comments
    }, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating review:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Request reviewers
router.post('/:owner/:repo/:pull_number/requested_reviewers', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, pull_number } = req.params;
    const { reviewers } = req.body;
    
    const response = await axios.post(`https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/requested_reviewers`, {
      reviewers
    }, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error requesting reviewers:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to request reviewers' });
  }
});

// Check if pull request is merged
router.get('/:owner/:repo/:pull_number/merge', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, pull_number } = req.params;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/merge`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json({ merged: response.status === 204 });
  } catch (error) {
    if (error.response?.status === 404) {
      res.json({ merged: false });
    } else {
      console.error('Error checking merge status:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to check merge status' });
    }
  }
});

module.exports = router;