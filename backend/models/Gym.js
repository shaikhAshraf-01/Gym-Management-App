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
    },
    // ===== WhatsApp Business Account (Meta) — owned & managed by the
    // gym owner themselves, we only orchestrate sends through it. =====
    whatsappIntegration:{
        connected:{ type:Boolean, default:false },
        phoneNumberId:{ type:String, default:"" },
        wabaId:{ type:String, default:"" },
        // Encrypted at rest via the User-supplied Mongoose field-level
        // encryption / KMS layer — never returned in plain API responses.
        accessToken:{ type:String, default:"", select:false },
        connectedAt:{ type:Date, default:null },
    },
    // ===== WhatsApp automation settings (Plus/Pro only — enforced =====
    // server-side in the controller, not just hidden in the UI).
    whatsappAutomationSettings:{
        enabled:{ type:Boolean, default:false },
        expiryReminder:{
            enabled:{ type:Boolean, default:false },
            daysBefore:{ type:Number, default:3, min:1, max:14 },
            templateName:{ type:String, default:"" },
        },
        memberWelcome:{
            enabled:{ type:Boolean, default:false },
            templateName:{ type:String, default:"" },
        },
        extendRenewal:{
            enabled:{ type:Boolean, default:false },
            templateName:{ type:String, default:"" },
        },
        balanceConfirmation:{
            enabled:{ type:Boolean, default:false },
            templateName:{ type:String, default:"" },
        },
    }
},
{
    timestamps:true,
}
);
const Gym=mongoose.model("Gym",gymSchema);
export default Gym;