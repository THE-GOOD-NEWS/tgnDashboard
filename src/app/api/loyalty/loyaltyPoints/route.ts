import { NextRequest, NextResponse } from 'next/server';
import { LoyaltyPointsModel } from '@/app/models/rewardModel';
import mongoose from 'mongoose';
import { ConnectDB } from '@/config/db';

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

export async function GET() {
  const points = await LoyaltyPointsModel.find()

  return NextResponse.json(points.length>0?points:[]);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const created = await LoyaltyPointsModel.create(data);
  return NextResponse.json(created, { status: 201 });
} 