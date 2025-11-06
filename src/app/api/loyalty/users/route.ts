import { NextRequest, NextResponse } from 'next/server';
import UserModel from '@/app/models/userModel';
import { LoyaltyTransactionModel } from '@/app/models/loyaltyTransactionModel';
import { ConnectDB } from '../../../../config/db';

export async function GET(req: NextRequest) {
  await ConnectDB();
  const { searchParams } = new URL(req.url);
  const minPoints = searchParams.get('minPoints');
  const maxPoints = searchParams.get('maxPoints');
  const rewardId = searchParams.get('rewardId');

  if (rewardId) {
    // Find users who redeemed a specific reward
    const transactions = await LoyaltyTransactionModel.find({ rewardId, type: 'spend' });
    const userIds = transactions.map(t => t.userId);
    const users = await UserModel.find({ _id: { $in: userIds } });
    return NextResponse.json(users);
  }

  // Filter by points range
  const query: any = {};
  if (minPoints) query.points = { $gte: Number(minPoints) };
  if (maxPoints) query.points = { ...(query.points || {}), $lte: Number(maxPoints) };
  const users = await UserModel.find(query);
  return NextResponse.json(users);
} 