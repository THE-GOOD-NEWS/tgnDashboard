// models/Country.js
import mongoose from 'mongoose';

const countrySchema = new mongoose.Schema({
  _id: String, // Optional if _id is enough
  shipping_zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'shipping_zones',
  },
  name: String,
  iso3: String,
  iso2: String,
  numeric_code: String,
  phone_code: String,
  capital: String,
  currency: String,
  currency_name: String,
  currency_symbol: String,
  tld: String,
  native: String,
  region: String,
  region_id: String,
  subregion: String,
  subregion_id: String,
  nationality: String,
  timezones: String, // or a subdocument if timezones are objects
  latitude: String,
  longitude: String,
  emoji: String,
  emojiU: String,
  status: {
    type: String,
    enum: ['global', 'local'], // optional control
  }
}, { timestamps: true });

export default mongoose.models.Country || mongoose.model('Country', countrySchema);
