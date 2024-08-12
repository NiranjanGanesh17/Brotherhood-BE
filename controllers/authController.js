import User from "../models/users.model.js";
import axios from "axios";
import qs from "qs";
import jwt from "jsonwebtoken";

export const discordAuth = (req, res) => {
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${
    process.env.DISCORD_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    process.env.DISCORD_REDIRECT_URI
  )}&response_type=code&scope=identify+email`;
  res.redirect(discordAuthUrl);
};

export const discordRedirectAuth = async (req, res) => {
  try {
    const code = req.query.code;

    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      qs.stringify({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get(
      "https://discord.com/api/v10/users/@me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userData = userResponse.data;
    let user = await User.findOne({ userId: userData.id });
    if (user) {
        user.email = userData.email;
        user.avatar = userData.avatar;
        user.globalName = userData.global_name;
        await user.save();
      } else {
        user = new User({
          userId: userData.id,
          email: userData.email,
          avatar: userData.avatar,
          globalName: userData.global_name,
        });
        await user.save();
      }
  

    const token = jwt.sign(
      {
        userId: userData.id,
        email: userData.email,
        avatar: userData.avatar,
        globalName: userData.global_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 4 * 60 * 60 * 1000,
    });
    res.redirect(`${process.env.CLIENT_ENDPOINT}`);
    // res.json(user);
  } catch (error) {
    console.error(
      "Error during Discord OAuth2 process:",
      error.response ? error.response.data : error.message
    );
    res.status(500).send("Internal Server Error");
  }
};

export const getUser = async (req, res) => {
    const getUser = await User.find({userId:req.user.userId})
    res.send(getUser);
};
