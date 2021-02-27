import request from "supertest";
import { app } from "../app";
import { User } from "../models/user";
import { auth } from "../services/auth";

describe("tests signup", () => {
  it("returns a 201 on successful signup", async () => {
    const response = await request(app).post(`/signup`).send({
      username: "someusername",
      password: "password",
    });

    expect(response.status).toEqual(201);
  });

  it("returns a 400 on password invalid length", async () => {
    const response = await request(app).post(`/signup`).send({
      username: "someusername",
      password: "pas",
    });

    expect(response.status).toEqual(400);
  });

  it("returns a 400 on username already exists", async () => {
    await createUser("someuser");

    const response = await request(app).post(`/signup`).send({
      username: "someuser",
      password: "password",
    });

    expect(response.status).toEqual(400);
  });
});

describe("tests signin", () => {
  it("returns a 200 on successful signin", async () => {
    await createUser("someuser");

    const response = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password",
    });

    expect(response.status).toEqual(200);
  });

  it("returns a 400 on no username/password provided", async () => {
    await createUser("someuser");

    const response = await request(app).post(`/signin`).send({
      username: "",
      password: "password",
    });

    expect(response.status).toEqual(400);
  });

  it("returns a 400 on user not exist", async () => {
    await createUser("someuser");

    const response = await request(app).post(`/signin`).send({
      username: "someuser1",
      password: "password",
    });

    expect(response.status).toEqual(400);
  });

  it("returns a 400 on wrong password", async () => {
    await createUser("someuser");

    const response = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password1",
    });

    expect(response.status).toEqual(400);
  });
});

describe("tests me", () => {
  it("returns a 403 when cookie not passed", async () => {
    await createUser("someuser");

    const response1 = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password",
    });

    const response2 = await request(app).get(`/me`);

    expect(response2.status).toEqual(403);
  });

  it("returns a 200 on successfull fetch", async () => {
    await createUser("someuser");

    const response1 = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password",
    });
    const cookie = response1.get("Set-Cookie");

    const response2 = await request(app).get(`/me`).set("Cookie", cookie);

    expect(response2.status).toEqual(200);
  });
});

describe("tests update password", () => {
  it("returns a 200 on successfull password change", async () => {
    await createUser("someuser");

    const response1 = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password",
    });
    const cookie = response1.get("Set-Cookie");

    const response2 = await request(app)
      .put(`/me/update-password`)
      .set("Cookie", cookie)
      .send({
        currentPassword: "password",
        newPassword: "newpassword",
      });

    expect(response2.status).toEqual(200);
  });

  it("returns a 400 on current password missing", async () => {
    await createUser("someuser");

    const response1 = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password",
    });
    const cookie = response1.get("Set-Cookie");

    const response2 = await request(app)
      .put(`/me/update-password`)
      .set("Cookie", cookie)
      .send({
        newPassword: "newpassword",
      });

    expect(response2.status).toEqual(400);
  });

  it("returns a 400 on new password missing", async () => {
    await createUser("someuser");

    const response1 = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password",
    });
    const cookie = response1.get("Set-Cookie");

    const response2 = await request(app)
      .put(`/me/update-password`)
      .set("Cookie", cookie)
      .send({
        currentPassword: "password",
      });

    expect(response2.status).toEqual(400);
  });

  it("returns a 400 on password not matching", async () => {
    await createUser("someuser");

    const response1 = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password",
    });
    const cookie = response1.get("Set-Cookie");

    const response2 = await request(app)
      .put(`/me/update-password`)
      .set("Cookie", cookie)
      .send({
        currentPassword: "wrongpassword",
        newPassword: "newpassword",
      });

    expect(response2.status).toEqual(400);
  });
});

describe("tests fetch user", () => {
  it("returns a 200 on successfull password change", async () => {
    const user = await createUser("someuser");

    const response = await request(app).get(`/user/${user._id}`);

    expect(response.status).toEqual(200);
  });

  it("returns a 400 on invalid mongo id", async () => {
    await createUser("someuser");

    const response = await request(app).get(`/user/asd123`);

    expect(response.status).toEqual(400);
  });

  it("returns a 400 on user not found", async () => {
    await createUser("someuser");

    const response = await request(app).get(`/user/603a52be3fc55cbca986b9b2`);

    expect(response.status).toEqual(404);
  });
});

describe("tests like user", () => {
  it("returns a 200 on successfull like", async () => {
    await createUser("someuser");
    const user2 = await createUser("someuser2");

    const response1 = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password",
    });
    const cookie = response1.get("Set-Cookie");

    const response2 = await request(app)
      .put(`/user/${user2._id}/like`)
      .set("Cookie", cookie);

    expect(response2.status).toEqual(200);

    // cant like user twice
    const response3 = await request(app)
      .put(`/user/${user2._id}/like`)
      .set("Cookie", cookie);

    expect(response3.status).toEqual(400);
  });

  it("returns a 400 on user not found", async () => {
    await createUser("someuser");

    const response1 = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password",
    });

    const cookie = response1.get("Set-Cookie");

    const response2 = await request(app)
      .put(`/user/603a52be3fc55cbca986b9b2/like`)
      .set("Cookie", cookie);

    expect(response2.status).toEqual(404);
  });

  it("returns a 400 on you can not like yourself", async () => {
    const user = await createUser("someuser");

    const response1 = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password",
    });

    const cookie = response1.get("Set-Cookie");

    const response2 = await request(app)
      .put(`/user/${user._id}/like`)
      .set("Cookie", cookie);

    expect(response2.status).toEqual(400);
  });

  it("returns a 400 on invalid mongo id", async () => {
    const user = await createUser("someuser");

    const response1 = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password",
    });

    const cookie = response1.get("Set-Cookie");

    const response2 = await request(app)
      .put(`/user/wrongID/like`)
      .set("Cookie", cookie);

    expect(response2.status).toEqual(400);
  });
});

describe("tests unlike user", () => {
  it("returns a 200 on successfull like", async () => {
    await createUser("someuser");
    const user2 = await createUser("someuser2");

    const response1 = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password",
    });
    const cookie = response1.get("Set-Cookie");

    const response2 = await request(app)
      .put(`/user/${user2._id}/like`)
      .set("Cookie", cookie);

    expect(response2.status).toEqual(200);

    // cant like user twice
    const response3 = await request(app)
      .put(`/user/${user2._id}/unlike`)
      .set("Cookie", cookie);

    expect(response3.status).toEqual(200);
  });

  it("returns a 400 on user not found", async () => {
    await createUser("someuser");

    const response1 = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password",
    });

    const cookie = response1.get("Set-Cookie");

    const response2 = await request(app)
      .put(`/user/603a52be3fc55cbca986b9b2/unlike`)
      .set("Cookie", cookie);

    expect(response2.status).toEqual(404);
  });

  it("returns a 400 on you can not unlike yourself", async () => {
    const user = await createUser("someuser");

    const response1 = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password",
    });

    const cookie = response1.get("Set-Cookie");

    const response2 = await request(app)
      .put(`/user/${user._id}/unlike`)
      .set("Cookie", cookie);

    expect(response2.status).toEqual(400);
  });

  it("returns a 400 on invalid mongo id", async () => {
    const user = await createUser("someuser");

    const response1 = await request(app).post(`/signin`).send({
      username: "someuser",
      password: "password",
    });

    const cookie = response1.get("Set-Cookie");

    const response2 = await request(app)
      .put(`/user/wrongID/unlike`)
      .set("Cookie", cookie);

    expect(response2.status).toEqual(400);
  });
});

const createUser = async (username) => {
  const user = new User();

  user.username = username;
  user.password = "password";

  const response = await user.save();
  return response;
};
