const mongoose = require("mongoose");

const connect = async () => {
  try {
    await mongoose.connect(process.env.mongo_uri);
    console.log("db connected!");
  } catch (error) {
    console.log(error);
  }
};

connect();
