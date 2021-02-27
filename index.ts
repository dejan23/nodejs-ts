require("dotenv").config();
import mongoose from "mongoose";

import { app } from "./src/app";

const start = async () => {
  if (!process.env.PORT) {
    throw new Error("PORT must be defined");
  }
  if (!process.env.JWT_KEY) {
    throw new Error("JWT_KEY must be defined");
  }
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI must be defined");
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });

    console.log(
      `Connection established to the "${db.connections[0].name}" mongoDB.`
    );
  } catch (err) {
    console.error(err);
  }

  app.listen(process.env.PORT, () => {
    console.log(`Listening on http://localhost:${process.env.PORT}`);
  });
};

start();
