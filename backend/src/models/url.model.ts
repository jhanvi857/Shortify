import mongoose, { Schema } from "mongoose";

const urlSchema = new Schema(
  {
    longUrl: {
      type: String,
      required: true,
    },

    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    shortUrl: {
      type: String,
      required: true,
    },

    clicks: {
      type: Number,
      default: 0
    },

    expiresAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// auto-delete expired links.
urlSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default mongoose.model("Url", urlSchema);