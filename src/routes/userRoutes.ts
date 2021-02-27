import { Application } from "express";
import {
  signup,
  signin,
  me,
  updatePassword,
  fetchUser,
  likeUser,
  unlikeUser,
  mostLiked,
} from "../controllers/user";
import { body } from "express-validator";
import { auth } from "../services/auth";

module.exports = function (app: Application) {
  app.post(
    "/signup",
    [
      body("username")
        .isLength({ min: 4, max: 20 })
        .withMessage("Username not provided"),
      body("password")
        .trim()
        .isLength({ min: 4, max: 20 })
        .withMessage("Password must be between 4 and 20 characters"),
    ],
    signup
  );

  app.post(
    "/signin",
    [
      body("username").notEmpty().withMessage("Username not provided"),
      body("password").trim().notEmpty().withMessage("Password not provided"),
    ],
    signin
  );

  app.get("/me", auth, me);
  app.put("/me/update-password", auth, updatePassword);
  app.get("/user/:id", fetchUser);
  app.put("/user/:id/like", auth, likeUser);
  app.put("/user/:id/unlike", auth, unlikeUser);
  app.get("/most-liked", mostLiked);
};
