const { default: mongoose } = require("mongoose");

const visitesShcema =mongoose.Schema({
    countryCode:{
        type:String,
        required:true,
    },
    deviceType:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
    }
    });

    const visitesModel= mongoose.models.visites || mongoose.model('visites', visitesShcema)

    export default visitesModel;