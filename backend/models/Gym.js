import mongoose from "mongoose";
const gymSchema= new mongoose.Schema({
    gymCode:{
        type:String,
        required:true,
        unique:true,
        trim:true,
    },
    gymName:{
        type:String,
        required:true,
        trim:true,
    },
    location:{
        type:String,
        required:true,
        trim:true,
    },
    gymLogo:{
        type:String,
        default:"",
    },
    gymLogoPublicId:{
        type:String,
        default:""
    },
    // GST is optional — set by the owner from their profile. When
    // present, receipts/invoices are generated as GST tax invoices;
    // when empty, plain (non-GST) receipts are generated instead.
    gstNumber:{
        type:String,
        default:"",
        trim:true,
        uppercase:true,
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    status:{
        type:String,
        enum:["active","inactive"],
        default:"active",
    }
},
{
    timestamps:true,
}
);
const Gym=mongoose.model("Gym",gymSchema);
export default Gym;