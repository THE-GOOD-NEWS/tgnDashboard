const mongoose = require("mongoose");

const bannersSchema = new mongoose.Schema({
  announcementBar: {
    type: String,
    required: false,
  },
});

const BannersModel =
  mongoose.models.banners || mongoose.model("banners", bannersSchema);

export async function getBanners() {
  // Only one record expected
  let banner = await BannersModel.findOne();
  if (!banner) {
    banner = await BannersModel.create({ announcementBar: "" });
  }
  return banner;
}

// export async function updateBanner(data: { announcementBar: string }) {
//   let banner = await BannersModel.findById("6899f4226d5cdf79c1908292");
//   if (!banner) {
//     banner = await BannersModel.create({
//       announcementBar: data.announcementBar,
//     });
//   } else {
//     banner.announcementBar = data.announcementBar;
//     await banner.save();
//   }
//   return banner;
// }

export default BannersModel;
