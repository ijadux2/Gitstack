const express = require('express');
const axios = require('axios');
const router = express.Router();
const { isAuthenticated } = require('./auth');
const Issue = require('../models/Issue');

// Get issues for a repository (combined GitHub + local)
router.get('/:owner/:repo', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { state = 'open', page = 1, per_page = 30 } = req.query;
    
    // Fetch from GitHub API
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues`, {
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
    
    // Also fetch local issues
    const localIssues = await Issue.find({ repoOwner: owner, repoName: repo, status: state });
    
    res.json({
      github: response.data,
      local: localIssues
    });
  } catch (error) {
    console.error('Error fetching issues:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// Get a specific issue
router.get('/:owner/:repo/:issue_number', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, issue_number } = req.params;
    
    // Try GitHub first
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    // If not found on GitHub, check local
    const localIssue = await Issue.findById(issue_number);
    if (localIssue) {
      return res.json(localIssue);
    }
    
    console.error('Error fetching issue:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
});

// Create a new issue
router.post('/:owner/:repo', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { title, body, labels, assignees, useGithub = true } = req.body;
    
    if (useGithub) {
      // Create on GitHub
      const response = await axios.post(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        title,
        body,
        labels,
        assignees
      }, {
        headers: {
          Authorization: `token ${req.user.githubToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      
      res.status(201).json(response.data);
    } else {
      // Create locally
      const issue = new Issue({
        repoOwner: owner,
        repoName: repo,
        title,
        description: body,
        author: req.user.username,
        authorAvatar: req.user.avatar,
        labels: labels || [],
        assignees: assignees || []
      });
      
      await issue.save();
      res.status(201).json(issue);
    }
  } catch (error) {
    console.error('Error creating issue:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// Update an issue
router.patch('/:owner/:repo/:issue_number', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, issue_number } = req.params;
    const { title, body, state, labels, assignees } = req.body;
    
    const response = await axios.patch(`https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}`, {
      title,
      body,
      state,
      labels,
      assignees
    }, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error updating issue:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// Close an issue
router.patch('/:owner/:repo/:issue_number/close', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, issue_number } = req.params;
    
    const response = await axios.patch(`https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}`, {
      state: 'closed'
    }, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error closing issue:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to close issue' });
  }
});

// Reopen an issue
router.patch('/:owner/:repo/:issue_number/reopen', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, issue_number } = req.params;
    
    const response = await axios.patch(`https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}`, {
      state: 'open'
    }, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error reopening issue:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to reopen issue' });
  }
});

// Get issue comments
router.get('/:owner/:repo/:issue_number/comments', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, issue_number } = req.params;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}/comments`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching comments:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add comment to issue
router.post('/:owner/:repo/:issue_number/comments', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, issue_number } = req.params;
    const { body } = req.body;
    
    const response = await axios.post(`https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}/comments`, {
      body
    }, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error adding comment:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Assign issue to user
router.post('/:owner/:repo/:issue_number/assignees', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, issue_number } = req.params;
    const { assignees } = req.body;
    
    const response = await axios.post(`https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}/assignees`, {
      assignees
    }, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error assigning issue:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to assign issue' });
  }
});

// Remove assignees from issue
router.delete('/:owner/:repo/:issue_number/assignees', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, issue_number } = req.params;
    const { assignees } = req.body;
    
    const response = await axios.delete(`https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}/assignees`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      },
      data: { assignees }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error removing assignees:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to remove assignees' });
  }
});

// Add labels to issue
router.post('/:owner/:repo/:issue_number/labels', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, issue_number } = req.params;
    const { labels } = req.body;
    
    const response = await axios.post(`https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}/labels`, {
      labels
    }, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error adding labels:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to add labels' });
  }
});

// Remove label from issue
router.delete('/:owner/:repo/:issue_number/labels/:label', isAuthenticated, async (req, res) => {
  try {
    const { owner, repo, issue_number, label } = req.params;
    
    await axios.delete(`https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}/labels/${encodeURIComponent(label)}`, {
      headers: {
        Authorization: `token ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    res.json({ message: 'Label removed' });
  } catch (error) {
    console.error('Error removing label:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to remove label' });
  }
});

module.exports = router;