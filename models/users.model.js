import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName:{type: String},
    avatar:{type:String,required:true},
    visibility:{type:Boolean,default:true},
    globalName:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    locationId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Location'
      },
    timestamp: { type: Date, default: Date.now },
  });

const User = mongoose.model('Users', userSchema);

export default User