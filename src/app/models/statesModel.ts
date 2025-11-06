import mongoose from 'mongoose';

const StatesSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  country_id: { type: Number, required: true },
  country_code: { type: String, required: true },
  country_name: { type: String, required: true },
  state_code: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  shipping_zone: { type: String, required: true }, // or use `type: mongoose.Schema.Types.ObjectId, ref: 'ShippingZone'` if you prefer referencing
}, { timestamps: true });

export default mongoose.models.states || mongoose.model('states', StatesSchema);
