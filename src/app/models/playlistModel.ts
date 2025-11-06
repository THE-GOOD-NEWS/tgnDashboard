import mongoose, { Schema, Document } from "mongoose";
import { Playlist } from "@/interfaces/interfaces";

// Define the Playlist schema
const PlaylistSchema = new Schema({
  title: { type: String, required: true },
  description: { type: [String], required: false },
  category:{type:String,required:false},
  isPublic:{type:Boolean,default:false},
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "videos",
    required: false
  }],
  thumbnailUrl: { type: String, required: true },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, {
  timestamps: true // This will automatically add createdAt and updatedAt fields
});

// Create and export the Playlist model
const playlistModel = mongoose.models.playlists || mongoose.model<Playlist>("playlists", PlaylistSchema);
export default playlistModel; 