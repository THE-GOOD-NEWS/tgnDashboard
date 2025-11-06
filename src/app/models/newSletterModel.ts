const { default: mongoose } = require("mongoose");

const newSletterShcema =mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },


    });

    const newSletterModel= mongoose.models.newSletter || mongoose.model('newSletter', newSletterShcema)

    export default newSletterModel;