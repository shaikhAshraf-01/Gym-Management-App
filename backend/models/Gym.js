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
    // ===== Pricing catalog — set once by the owner in "Manage Plans", =====
    // then used to auto-fill amount in Add Member / Extend forms so
    // nobody has to type/calculate it by hand each time. Plan amount
    // is LOCKED to these values in those forms — the owner can only
    // change prices here, not per-member.
    pricing:{
        plans:{
            "1_month":{ type:Number, default:0, min:0 },
            "3_month":{ type:Number, default:0, min:0 },
            "6_month":{ type:Number, default:0, min:0 },
            "1_year":{ type:Number, default:0, min:0 },
        },
        // Add-on activities (Workout, Cardio, ...) — each with its own
        // price PER PLAN DURATION (e.g. Cardio might be ₹300 for 1
        // month but ₹900 for 3 months, not just a flat add-on), added
        // on top of the selected plan's amount. Gym-managed list,
        // replacing the old hardcoded 4-option list.
        activities:{
            type:[
                {
                    name:{ type:String, required:true, trim:true },
                    prices:{
                        "1_month":{ type:Number, default:0, min:0 },
                        "3_month":{ type:Number, default:0, min:0 },
                        "6_month":{ type:Number, default:0, min:0 },
                        "1_year":{ type:Number, default:0, min:0 },
                    },
                },
            ],
            default:[],
        },
        // Named offer campaigns (e.g. "Diwali Offer", "New Year
        // Offer") — each is its OWN complete price list, used instead
        // of `plans` above when a member is admitted as "offer" and
        // this specific offer is picked. `active` lets the owner
        // retire one without losing the historical name/prices.
        offers:{
            type:[
                {
                    name:{ type:String, required:true, trim:true },
                    active:{ type:Boolean, default:true },
                    plans:{
                        "1_month":{ type:Number, default:0, min:0 },
                        "3_month":{ type:Number, default:0, min:0 },
                        "6_month":{ type:Number, default:0, min:0 },
                        "1_year":{ type:Number, default:0, min:0 },
                    },
                },
            ],
            default:[],
        },
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