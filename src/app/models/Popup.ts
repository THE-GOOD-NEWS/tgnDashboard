import mongoose, { Schema } from "mongoose";

const PopupSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    buttonText: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Popup = mongoose.models.Popup || mongoose.model("Popup", PopupSchema);

export default Popup;
