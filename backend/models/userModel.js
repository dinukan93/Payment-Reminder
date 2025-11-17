import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{type:String,required:true},
    phone:{type:String},
    email:{type:String,required:true,unique:true},
    password:{type:String},
    googleId:{type:String},
    avatar:{type:String},
    isVerified:{type:Boolean,default:false},
    isLoggedIn:{type:Boolean,default:false},
    token:{type:String,default:null},
    opt:{type:String,default:null},
    optExpiry:{type:Date,default:null},
},{timestamps:true})
const userModel =mongoose.model('user',userSchema);

export default userModel;