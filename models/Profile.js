const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Non-Binary', 'Prefer not to say', 'Other', null],
    default: null,
  },
  dob: {
    type: Date,
    default: null,
  },
  about: {
    type: String,
    trim: true,
    default: null,
  },
  contactNumber: {
    type: String,
    minLength: [10, 'Vui lòng cung cấp số điện thoại hợp lệ gồm 10 chữ số'],
    trim: true,
  },
});

module.exports = mongoose.model('Profile', profileSchema);
