import mongoose from "mongoose";
const inquirySchema=new mongoose.Schema({
    gym:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Gym",
        required:true,
          index: true,   // 👈 add karo

    },
    name:{
        type:String,
        required:true,
        trim:true,
    },
    mobile:{
        type:String,
        required:true,
        trim:true,
    },
    willingToJoin:{
        type:String,
        trim:true,
    },
},
{timestamps:true})
const Inquiry=mongoose.model("Inquiry",inquirySchema);
export default Inquiry;