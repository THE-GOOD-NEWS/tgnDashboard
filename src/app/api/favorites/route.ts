import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import FavoritesModel from "@/app/models/favoritesModel";

// Connect to database
const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET all favorites
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const subCategory = searchParams.get("subCategory");
    
    let query = {};
    
    if (category) {
      query = { ...query, category };
    }
    
    if (subCategory) {
      query = { ...query, subCategory };
    }
    
    const favorites = await FavoritesModel.find(query).sort({ createdAt: -1 });
    return NextResponse.json(favorites, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ message: "Error fetching favorites", error: error.message }, { status: 500 });
  }
}

// POST new favorite
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newFavorite = await FavoritesModel.create(data);
    return NextResponse.json(newFavorite, { status: 201 });
  } catch (error: any) {
    console.error("Error creating favorite:", error);
    
    if (error.name === "ValidationError") {
      return NextResponse.json({ message: "Validation failed", error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ message: "Error creating favorite", error: error.message }, { status: 500 });
  }
}