import { ConnectDB } from "@/config/db";
import playlistModel from "@/app/models/playlistModel";

async function main() {
  await ConnectDB();
  const playlists = await playlistModel.find({}).sort({ createdAt: 1 });
  for (let i = 0; i < playlists.length; i++) {
    playlists[i].order = i;
    await playlists[i].save();
  }
  console.log(`Initialized 'order' field for ${playlists.length} playlists.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 