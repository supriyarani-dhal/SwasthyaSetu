const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://supriyadhal50:oOPZgWY3Zvx7b0a5@cluster0.lo7g9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );

    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
