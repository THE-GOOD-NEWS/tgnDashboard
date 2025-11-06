const mongoose = require("mongoose");

const categoriesSchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
});
console.log('Registering CategoryModel');
const categoriesModel =
  mongoose.models.categories || mongoose.model("categories", categoriesSchema);

export default categoriesModel;
