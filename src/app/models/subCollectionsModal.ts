const { default: mongoose } = require("mongoose");

const Shcema =mongoose.Schema({
    subCollectionName:{
        type:String,
        required:true
    },
    collectionID:{type:String},

    imageUrl:{
        type:String,
        default:""
    },
    products:{type:[String]},
    description:{
        type:String,
    },


    });

    const subCollectionsModel= mongoose.models.subCollections || mongoose.model('subCollections', Shcema)

    export default subCollectionsModel;