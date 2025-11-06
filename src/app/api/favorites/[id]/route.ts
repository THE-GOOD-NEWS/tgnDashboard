import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import FavoritesModel from "@/app/models/favoritesModel";
import { ObjectId } from "mongodb";

// Connect to database
const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET a single favorite by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const favorite = await FavoritesModel.findById(id);
    
    if (!favorite) {
      return NextResponse.json({ message: "Favorite not found" }, { status: 404 });
    }
    
    return NextResponse.json(favorite, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching favorite:", error);
    return NextResponse.json({ message: "Error fetching favorite", error: error.message }, { status: 500 });
  }
}

// PUT/UPDATE a favorite
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    const updatedFavorite = await FavoritesModel.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );
    
    if (!updatedFavorite) {
      return NextResponse.json({ message: "Favorite not found" }, { status: 404 });
    }
    
    return NextResponse.json(updatedFavorite, { status: 200 });
  } catch (error: any) {
    console.error("Error updating favorite:", error);
    
    if (error.name === "ValidationError") {
      return NextResponse.json({ message: "Validation failed", error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ message: "Error updating favorite", error: error.message }, { status: 500 });
  }
}

// DELETE a favorite
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const deletedFavorite = await FavoritesModel.findByIdAndDelete(id);
    
    if (!deletedFavorite) {
      return NextResponse.json({ message: "Favorite not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Favorite deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting favorite:", error);
    return NextResponse.json({ message: "Error deleting favorite", error: error.message }, { status: 500 });
  }
}