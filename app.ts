import express from "express";
import { json } from "body-parser";
import cookieParser from "cookie-parser";

const app = express();

app.use(json());
app.use(cookieParser());

require("./routes/userRoutes")(app);

export { app };
