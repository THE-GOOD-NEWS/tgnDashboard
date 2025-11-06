const { default: mongoose } = require("mongoose");

const collectionsShcema =mongoose.Schema({
    collectionName:{
        type:String,
        required:true,
    },
    imageURL:{type:String},
    description:{type:String},
    products:{type:[String]},
    });

    const collectionsModel= mongoose.models.collections || mongoose.model('collections', collectionsShcema)

    export default collectionsModel;