import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const baseOptions = {
  discriminatorKey: "role",
  timestamps: true,
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
    },
    password:{
      type: String,
      required: true,
      trim: true,
    }
    photo: {
      type: String,
      default: "",
    },
    
  },
  baseOptions
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);



const Owner = User.discriminator(
  "owner",
  new mongoose.Schema({
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
    },
   
  })
);

const Trainer = User.discriminator(
  "trainer",
  new mongoose.Schema({
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
    },
  
  })
);

export default User;
export { Admin, Owner, Trainer };