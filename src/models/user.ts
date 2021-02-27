import mongoose from "mongoose";
import { Password } from "../services/password";

interface PeopleWhoLikedMe {
  id: string;
}

interface UserAttrs {
  username: string;
  password: string;
  likes?: number;
  peopleWhoLikedMe?: Array<PeopleWhoLikedMe>;
}

interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}

interface UserDoc extends mongoose.Document {
  username: string;
  password: string;
  likes?: number;
  peopleWhoLikedMe?: Array<PeopleWhoLikedMe>;
}

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    peopleWhoLikedMe: [{ type: mongoose.Types.ObjectId, ref: "User" }],
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
        delete ret.__v;
      },
    },
  }
);

userSchema.pre("save", async function (done) {
  if (this.isModified("password")) {
    const hashed = await Password.toHash(this.get("password"));
    this.set("password", hashed);
  }
  done();
});

userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export { User };
