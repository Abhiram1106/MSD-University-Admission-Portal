
const mongoose = require('mongoose');
const ContactSchema = new mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  name: {type:String, required:true},
  email: {type:String, required:true},
  phone: String,
  subject: {type:String, required:true},
  message: {type:String, required:true},
  status: {type:String, enum:['pending','replied','closed'], default:'pending'},
  reply: String,
  repliedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  repliedAt: Date,
  createdAt: {type: Date, default: Date.now}
});
module.exports = mongoose.model('Contact', ContactSchema);
