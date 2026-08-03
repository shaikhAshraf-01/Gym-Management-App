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
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      default: null,
      select: false,
      trim: true,
    },

    photo: {
      type: String,
      default: "",
    },

    otp: {
      type: String,
      default: null,
      select: false,
    },

    otpExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  baseOptions
);

userSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

 next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

/* -------------------- Admin -------------------- */

const Admin = User.discriminator(
  "admin",
  new mongoose.Schema({})
);

/* -------------------- Owner -------------------- */

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

/* -------------------- Trainer -------------------- */

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