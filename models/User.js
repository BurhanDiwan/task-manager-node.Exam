const M = require('mongoose');

const UserSchema = new M.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin']
  },
  tasks: [{
    type: M.Schema.Types.ObjectId,
    ref: 'Task'
  }]
});

module.exports = M.model('User', UserSchema);