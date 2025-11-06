import { NextRequest, NextResponse } from "next/server";
import { LoyaltyTransactionModel } from "@/app/models/loyaltyTransactionModel";
import { ConnectDB } from "@/config/db";
import { LoyaltyPointsModel } from "@/app/models/rewardModel";
ConnectDB();
console.log("registering" + LoyaltyPointsModel);
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  let lifeTimePoints = 0;
  let SpentLoyaltyPoints = 0;
  const transactions = await LoyaltyTransactionModel.find({
    email: email,
  }).populate({ path: "bonusID", options: { strictPopulate: false } });
  console.log("Transactions" + transactions.length);
  for (const tx of transactions) {
    if (tx.type === "earn") {
      if (tx.reason === "purchase") {
        lifeTimePoints += tx.amount;
      } else if (tx.bonusID && tx.bonusID.bonusPoints) {
        lifeTimePoints += tx.bonusID.bonusPoints;
      }
    } else if (tx.type === "spend") {
      SpentLoyaltyPoints += tx.amount;
    }
  }

  const loyaltyPoints = {
    lifeTimePoints: lifeTimePoints,
    realLoyaltyPoints: lifeTimePoints - SpentLoyaltyPoints,
  };

  return NextResponse.json({ loyaltyPoints });
}
