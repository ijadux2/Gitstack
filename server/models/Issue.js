const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true
  },
  authorAvatar: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const issueSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  labels: [{
    type: String
  }],
  assignees: [{
    type: String
  }],
  comments: [commentSchema],
  githubIssueNumber: {
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

issueSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Issue', issueSchema);