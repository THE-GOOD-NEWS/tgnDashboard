import subCategoryModel from "@/app/models/subCategoryModel";
import { NextResponse } from "next/server";
import categoriesModel from "@/app/models/categoriesModel";
import { ConnectDB } from "@/config/db";
import mongoose from "mongoose";
import productsModel from "@/app/models/productsModel";

const loadDB = async () => {
  await ConnectDB();
};
loadDB();
console.log("CategoryModel registered:", categoriesModel, subCategoryModel);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageParam = searchParams.get("page");
  console.log("Registered models:", Object.keys(mongoose.models));

  const products = await productsModel.find().populate({
    path: "subCategoryID",
    model: "subCategories",
    populate: {
      path: "categoryID",
      model: "categories", // or your actual category model name
    },
  });
  console.log(
    "products[0].subCategoryID",
    products[0].subCategoryID.categoryID._id,
  );
  console.log("products", products);
  return NextResponse.json({ data: products }, { status: 200 });
}
// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const pageParam = searchParams.get("page");
//   console.log("Registered models:", Object.keys(mongoose.models));

//   const subCategories = await subCategoryModel.find().populate({
//     path: "categoryID",
//     model: "categories", // Explicitly specify the model
//   });
//   console.log("subCategories", subCategories);
//   return NextResponse.json({ data: subCategories }, { status: 200 });
// }
