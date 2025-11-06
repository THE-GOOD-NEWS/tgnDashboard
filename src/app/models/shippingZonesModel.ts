import { price } from '@/interfaces/interfaces';
import mongoose, { Schema } from 'mongoose';


const priceSchema = new Schema<price>({
  local: { type: Number, required: true, min: 0 },
  global: { type: Number, required: false, min: 0 ,default:0 },
});
const ShippingZonesSchema = new mongoose.Schema({
  zone_name: { type: String, required: true },
  zone_rate: { type: priceSchema, required: true },
  localGlobal: { type: String, enum: ["global", "local"] },
  states: [{ type: String }], // array of state IDs
  countries: [{ type: String }], // array of country IDs
}, { timestamps: true });
const shippingZonesModel = mongoose.models.shipping_zones || mongoose.model('shipping_zones', ShippingZonesSchema);
export default shippingZonesModel