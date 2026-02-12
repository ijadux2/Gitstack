const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: String,
    required: true
  },
  reviewerAvatar: {
    type: String
  },
  state: {
    type: String,
    enum: ['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED'],
    required: true
  },
  content: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const pullRequestSchema = new mongoose.Schema({
  repoOwner: {
    type: String,
    required: true
  },
  repoName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  author: {
    type: String,
    required: true
  },
  authorAvatar: {
    type: String
  },
  headBranch: {
    type: String,
    required: true
  },
  baseBranch: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'merged'],
    default: 'open'
  },
  reviewers: [{
    type: String
  }],
  reviews: [reviewSchema],
  additions: {
    type: Number,
    default: 0
  },
  deletions: {
    type: Number,
    default: 0
  },
  changedFiles: {
    type: Number,
    default: 0
  },
  githubPRNumber: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

pullRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PullRequest', pullRequestSchema);