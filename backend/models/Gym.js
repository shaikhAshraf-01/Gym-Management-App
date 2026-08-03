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
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"owner",
        required:true,
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