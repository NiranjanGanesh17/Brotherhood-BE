import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName:{type: String},
    avatar:{type:String,required:false,default:''},
    visibility:{type:Boolean,default:true},
    avatarHash:{type:String},
    globalName:{type:String,required:true},
    cloudinaryId:{type:String},
    email:{type:String,required:true,unique:true},
    locationId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Location'
      },
    timestamp: { type: Date, default: Date.now },
  });

const User = mongoose.model('Users', userSchema);

export default User