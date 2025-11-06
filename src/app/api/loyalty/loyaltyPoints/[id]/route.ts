import { NextRequest, NextResponse } from 'next/server';
import { LoyaltyPointsModel } from '@/app/models/rewardModel';
import mongoose from 'mongoose';
import { ConnectDB } from '@/config/db';

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const point = await LoyaltyPointsModel.findById(params.id).lean();
  if (!point) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(point);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const updated = await LoyaltyPointsModel.findByIdAndUpdate(params.id, data, { new: true });
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const deleted = await LoyaltyPointsModel.findByIdAndDelete(params.id);
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
} 