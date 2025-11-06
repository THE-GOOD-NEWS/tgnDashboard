import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { ISubscription } from "./subscriptionsModel";

// Define the User interface
export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: "admin" | "moderator" | "customer";
  emailVerified?:boolean;
  firstName?:string;
  lastName?:string;
  subscription:ISubscription;
  // isSubscribed: boolean;
  createdAt: Date;
  updatedAt: Date;
  imageURL?:string;
  points?: number;
  comparePassword(candidatePassword: string): Promise<boolean>;
}


// Define the User schema
const UserSchema = new Schema<IUser>(
  {
    username: { 
      type: String, 
      required: true, 
      unique: false,
      trim: true,
      minlength: 3
    },
    firstName:{
      type: String,
      required: false,
      default: ""
    },
    lastName:{
      type: String,
      required: false,
      default: ""
    },
    email: {
      type: String,
      required: false,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    password: { 
      type: String, 
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      default: "customer",
      required: false,
    },
    // isSubscribed: {
    //   type: Boolean,
    //   default: false,
    //   required: false,
    // },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subscriptions",
      required: false,
    },
    imageURL:{
      type: String,
      required: false,
      default: ""
    },
    emailVerified:{type:Boolean,default:true},
    points: {
      type: Number,
      default: 0,
      required: false,
    },

  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    console.log('=== Password Comparison Debug ===');
    console.log('Stored hash:', this.password);
    console.log('Hash length:', this.password.length);
    console.log('Hash starts with:', this.password.substring(0, 7));
    console.log('Candidate password:', candidatePassword);
    
    const result = await bcrypt.compare(candidatePassword, this.password);
    console.log('Comparison result:', result);
    console.log('=== End Debug ===');
    
    return result;
  } catch (error) {
    console.error('Error in comparePassword:', error);
    return false;
  }
};

// Create and export the User model
const UserModel = mongoose.models.users || mongoose.model<IUser>("users", UserSchema);

export default UserModel;