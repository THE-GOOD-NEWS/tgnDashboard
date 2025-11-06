import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import FavoritesModel from "@/app/models/favoritesModel";

// Connect to database
const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// POST to increment click count
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const updatedFavorite = await FavoritesModel.findByIdAndUpdate(
      id,
      { $inc: { clickCount: 1 } },
      { new: true }
    );
    
    if (!updatedFavorite) {
      return NextResponse.json({ message: "Favorite not found" }, { status: 404 });
    }
    
    return NextResponse.json(updatedFavorite, { status: 200 });
  } catch (error: any) {
    console.error("Error updating click count:", error);
    return NextResponse.json({ message: "Error updating click count", error: error.message }, { status: 500 });
  }
}