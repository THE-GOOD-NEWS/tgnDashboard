import mongoose, { Schema, Document } from "mongoose";

// Define the Cart Item schema

const attributeSchema = new Schema({
    name: { type: String, required: true },
    stock: { type: Number, required: true },
  }, { _id: false });
  
  const mediaSchema = new Schema({
    url: { type: String, required: true },
    type: { type: String, default: 'image' }, // Optional if you're supporting videos etc.
  }, { _id: false });
  
  const variantSchema = new Schema({
    name: { type: String, required: true },
    attributeName: { type: String, required: true },
    attributes: { type: [attributeSchema], required: true },
    images: { type: [mediaSchema], default: [] },
  }, { _id: false });
  
  const CartItemSchema = new Schema({
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    attributes: { type: attributeSchema, required: false },
    variant: { type: variantSchema, required: false },
    collections: [{ type: String }], // optional
  });

// Define the Order schema
const OrderSchema = new Schema(
    { email:{type: String, required: false}
        ,country: { type: String, required: false },
        firstName: { type: String, required: false },
        lastName: { type: String, required: false },
        address: { type: String, required: false },
        apartment: { type: String,required: false },
        postalZip: { type: String, required: false },
        city: { type: String, required: false },
        state: { type: String, required: false },
        phone: { type: String, required: false },
        cash: { type: String, required: false, default: true }, // Payment method: Cash or not
        cart: {
            type: [CartItemSchema],required:false // Array of cart items
        },
        subTotal: { type: Number, required: false}, 
        shipping: { type: Number, required: false}, 
        total: { type: Number, required: false}, 
        currency: { type: String, required: false}, 
        status: {
            type: String,
            enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
            default: "pending",
        },
        payment:{
            type: String,
            enum: ["pending","failed" ,"confirmed"],
            default: "pending",
        },
        billingCountry:{ type: String, required: false },
        billingFirstName: { type: String, required: false },
        billingState:{ type: String, required: false },
        billingLastName:  { type: String, required: false },
        billingAddress:  { type: String, required: false },
        billingApartment:{ type: String, required: false },
        billingPostalZip:{ type: String, required: false },
        billingCity:{ type: String, required: false },
        billingPhone:{ type: String, required: false },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Define the Order model
const ordersModel = mongoose.models.orders || mongoose.model<Document & mongoose.Model<any>>("orders", OrderSchema);

export default ordersModel;
