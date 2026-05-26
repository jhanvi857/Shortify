import mongoose from "mongoose";
export const connectDB = async()=> {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/urlshortener");
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
    }
}