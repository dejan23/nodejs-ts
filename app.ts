import express, { Request, Response } from "express";
import { json } from "body-parser";
import cookieParser from "cookie-parser";

const app = express();

app.use(json());
app.use(cookieParser());

require("./routes/userRoutes")(app);

app.get("/", (req: Request, res: Response) => res.send("/"));

export { app };
