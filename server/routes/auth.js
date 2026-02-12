const express = require('express');
const passport = require('passport');
const router = express.Router();

// GitHub OAuth login
router.get('/github',
  passport.authenticate('github', { scope: ['user', 'repo', 'read:org'] })
);

// GitHub OAuth callback
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: 'http://localhost:3000/#landing' }),
  (req, res) => {
    // Successful authentication - redirect to frontend dashboard
    res.redirect('http://localhost:3000/#dashboard');
  }
);

// Get current user
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        displayName: req.user.displayName,
        email: req.user.email,
        avatar: req.user.avatar,
        profileUrl: req.user.profileUrl
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
  });
});

// Check authentication status middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

router.isAuthenticated = isAuthenticated;
module.exports = router;