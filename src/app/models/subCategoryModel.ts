import mongoose from "mongoose";
import path from "path";

const subCategorySchema = new mongoose.Schema({
  subCategoryName: { type: String, required: true },
  categoryID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "categories",
    // path: path.join(__dirname, "categoriesModel"),
  },
  description: { type: String },
});
console.log("Registering subCategoryModel");
const subCategoryModel =
  mongoose.models.subCategories ||
  mongoose.model("subCategories", subCategorySchema);

export default subCategoryModel;
