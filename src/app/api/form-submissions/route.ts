import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import FormSubmissionModel from "@/app/models/formSubmissionModel";
import mongoose from "mongoose";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const formType = searchParams.get("formType") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const all = searchParams.get("all") === "true";

    const query: any = {};
    if (formType) query.formType = formType;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    const total = await FormSubmissionModel.countDocuments(query);
    const skip = all ? 0 : (page - 1) * limit;
    const submissions = await FormSubmissionModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(all ? 0 : limit)
      .lean();

    return NextResponse.json(
      {
        data: submissions,
        total,
        currentPage: page,
        totalPages: all ? 1 : Math.ceil(total / limit),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch form submissions", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const allowedFormTypes = ["join_team", "contact", "partner", "share_news"];
    if (!body.formType || !allowedFormTypes.includes(body.formType)) {
      return NextResponse.json(
        { error: "Invalid or missing formType" },
        { status: 400 }
      );
    }
    const created = await FormSubmissionModel.create(body);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create submission", details: error.message },
      { status: 500 }
    );
  }
}
