const { default: mongoose } = require("mongoose");

const newSletterShcema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true },
);

const newSletterModel =
  mongoose.models.newSletter ||
  mongoose.model("newSletter", newSletterShcema);

export default newSletterModel;
