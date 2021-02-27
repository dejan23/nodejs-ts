import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user";
import { validationResult } from "express-validator";
import { Password } from "../services/password";
import mongoose from "mongoose";

export const signup = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).send({ errors: errors.array() });
  }

  const existingUser = await User.findOne({ username });

  if (existingUser) {
    return res.status(400).send({ errors: { msg: "Username in use" } });
  }

  const user = User.build({ username, password });
  await user.save();

  // Generate JWT
  const userJwt = jwt.sign(
    {
      id: user.id,
      username: user.username,
    },
    process.env.JWT_KEY!
  );

  res.cookie("token", userJwt);

  return res.status(201).send({ user, msg: "User successfully created" });
};

export const signin = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).send({ errors: errors.array() });
  }

  const existingUser = await User.findOne({ username });
  if (!existingUser) {
    return res.status(400).send({ errors: { msg: "Invalid credentials" } });
  }

  const passwordsMatch = await Password.compare(
    existingUser.password,
    password
  );
  if (!passwordsMatch) {
    return res.status(400).send({ errors: { msg: "Invalid credentials" } });
  }

  // Generate JWT
  const userJwt = jwt.sign(
    {
      id: existingUser.id,
      username: existingUser.username,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // expires in 1 hour
    },
    process.env.JWT_KEY!
  );

  res.cookie("token", userJwt);

  return res.status(200).send({ user: existingUser, msg: "Login successful" });
};

export const me = async (req: Request, res: Response) => {
  const user = await User.findById(req.currentUser?.id);

  if (!user) return res.status(404).send({ errors: { msg: "User not found" } });

  return res.status(200).send({ user, msg: "Current user info" });
};

export const updatePassword = async (req: Request, res: Response) => {
  const user = await User.findById(req.currentUser?.id);

  if (!user) return res.status(404).send({ errors: { msg: "User not found" } });

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword)
    return res.status(400).send({
      errors: {
        msg: "Current password not provided",
        param: "currentPassword",
      },
    });

  if (!newPassword)
    return res.status(400).send({
      errors: { msg: "New password not provided", param: "newPassword" },
    });

  const passwordsMatch = await Password.compare(user.password, currentPassword);

  if (!passwordsMatch) {
    return res.status(400).send({ errors: { msg: "Passwords do not match" } });
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).send({ msg: "Password successfully changed" });
};

export const fetchUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id)
    return res
      .status(400)
      .send({ errors: { msg: "Id of the user not provided", param: "id" } });

  if (!mongoose.Types.ObjectId.isValid(id))
    return res
      .status(400)
      .send({ errors: { msg: "Mongo id is not valid", param: "id" } });

  const user = await User.findById(id).select("-_id");

  if (!user) return res.status(404).send({ errors: { msg: "User not found" } });

  return res.status(200).send({ user });
};

export const likeUser = async (req: Request, res: Response) => {
  const currentUser = await User.findById(req.currentUser?.id);

  if (!currentUser)
    return res.status(404).send({ errors: { msg: "Current user not found" } });

  const { id } = req.params;

  if (!id)
    return res
      .status(400)
      .send({ errors: { msg: "Id of the user not provided", param: "id" } });

  if (!mongoose.Types.ObjectId.isValid(id))
    return res
      .status(400)
      .send({ errors: { msg: "Mongo id is not valid", param: "id" } });

  const user = await User.findById(id);

  if (!user) return res.status(404).send({ errors: { msg: "User not found" } });

  if (currentUser._id.equals(user._id)) {
    return res
      .status(400)
      .send({ errors: { msg: "You can not like yourself" } });
  }

  for (let i = 0; i < user.peopleWhoLikedMe!.length; i++) {
    if (currentUser._id.equals(user.peopleWhoLikedMe![i])) {
      return res
        .status(400)
        .send({ errors: { msg: "You have already liked this user" } });
    }
  }

  user.likes = user.likes! + 1;
  user.peopleWhoLikedMe!.push(currentUser._id);

  await user.save();

  return res.status(200).send({ msg: `User ${user.username} - liked` });
};

export const unlikeUser = async (req: Request, res: Response) => {
  const currentUser = await User.findById(req.currentUser?.id);

  if (!currentUser)
    return res.status(404).send({ errors: { msg: "Current user not found" } });

  const { id } = req.params;

  if (!id)
    return res
      .status(400)
      .send({ errors: { msg: "Id of the user not provided", param: "id" } });

  if (!mongoose.Types.ObjectId.isValid(id))
    return res
      .status(400)
      .send({ errors: { msg: "Mongo id is not valid", param: "id" } });

  const user = await User.findById(id);

  if (!user) return res.status(404).send({ errors: { msg: "User not found" } });

  if (currentUser._id.equals(user._id)) {
    return res
      .status(400)
      .send({ errors: { msg: "You can not unlike yourself" } });
  }

  let found = false;

  for (let i = 0; i < user.peopleWhoLikedMe!.length; i++) {
    if (currentUser._id.equals(user.peopleWhoLikedMe![i])) {
      found = true;
    }
  }

  if (found) {
    await User.findByIdAndUpdate(
      { _id: user._id },
      { $pull: { peopleWhoLikedMe: currentUser._id } }
    );

    user.likes = user.likes! - 1;

    await user.save();

    return res.status(200).send({ msg: `User ${user.username} - unliked` });
  } else {
    return res
      .status(400)
      .send({ msg: `Cant unlike user. Must like it first.` });
  }
};

export const mostLiked = async (req: Request, res: Response) => {
  const users = await User.find().sort({ likes: -1 });
  return res
    .status(200)
    .send({ users, msg: `Users with most likes descending order.` });
};
