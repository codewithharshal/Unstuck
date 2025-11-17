const mongoose = require("mongoose");
const { MONGODB_URI: url } = require("./utils/config");

const connectToDB = async () => {
  await mongoose.connect(url);

  console.log("Connected to MongoDB!");
};

module.exports = connectToDB;
