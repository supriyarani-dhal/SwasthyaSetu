const mongoose = require('mongoose');

const BloodSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ["Donate", "Request", "RequestCheck"] 
  },
  bloodType: { 
    type: String, 
    required: true, 
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] 
  },
  quantity:{
    type:Number,
    required:true,
  },
  donaerName:{
    type:String,
    required:true
  },
  contact:{
    type:Number,
    required:true,
  },
  location:{
    type:String,
    required:true,
  }
  // ... rest of the Blood schema fields
});

module.exports = mongoose.model("Blood", BloodSchema);