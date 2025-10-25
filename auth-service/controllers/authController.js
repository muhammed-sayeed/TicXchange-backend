import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";

import redisClient from "../config/redisClient.js";
import auth_user from "../models/auth_user.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { sentOtp } from "../utils/otp.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const userSignup = async (req, res) => {
  const { firstname, lastname, email, role, password } = req.body;
  try {
    if (!email && !mobile) {
      return res.status(400).json({ message: "Email or mobile is required" });
    }
    if (email) {
      const isUserExist = await auth_user.findOne({ email: email });
      if (isUserExist) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await redisClient.set(
        `pending:email:${email}`,
        JSON.stringify({ firstname, lastname, email, role, hashedPassword }),
        { EX: 600 }
      );
      await sentOtp(email, "email");
      return res.status(200).json({
        success: true,
        data: {},
        message: "OTP sent to email.",
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong, please try again later." });
  }
};
export const verifyUser = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const redisKey = `otp:email:${email}`;
    const saveOtp = await redisClient.get(redisKey);
    if (!saveOtp || saveOtp != otp) {
      return res.status(401).json({ message: "Invalid or expired OTP." });
    }
    await redisClient.del(`otp:email:${email}`);
    const pendingData = await redisClient.get(`pending:email:${email}`);
    if (!pendingData)
      return res
        .status(403)
        .json({ message: "No pending registration found." });
    const { firstname, lastname, role, hashedPassword } =
      JSON.parse(pendingData);
    const newUser = new auth_user({
      firstname,
      lastname,
      email,
      role,
      password: hashedPassword,
    });
    await newUser.save();
    await redisClient.del(`pending:email:${email}`);
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);
    res.cookie("refreshtoken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: newUser._id,
          firstname: newUser.firstname,
          lastname: newUser.lastname,
          role: newUser.role,
        },
      },
      message: "Registration successful.",
    });
  } catch (error) {
    console.error("set-password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const userLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await auth_user.findOne({ email });
    if (!user)
      return res.status(400).json({
        message: "Invalid credentials",
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({
        message: "Invalid credentials",
      });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    res.cookie("refreshtoken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role,
        },
      },
      message: "Login successful.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

export const googeLogin = async(req, res) =>{
     try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google ID token is required",
      });
    }

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      console.error("Google token verification failed:", error);
      return res.status(401).json({
        success: false,
        message: "Invalid Google token",
      });
    }

    const payload = ticket.getPayload();
    
    if (!payload.email || !payload.email_verified) {
      return res.status(400).json({
        success: false,
        message: "Google email not verified or invalid",
      });
    }

    const {
      sub: googleId,
      email,
      given_name: firstName,
      family_name: lastName,
      picture: avatar,
    } = payload;

    let user = await auth_user.findOne({ email });

    if (user) {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      return res.status(200).json({
        success: true,
        data: {
          token: accessToken,
          refreshToken: refreshToken,
          user: {
            id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
          },
        },
        message: "Google login successful",
      });
    } else {
      const newUser = new auth_user({
        firstname: firstName || "",
        lastname: lastName || "",
        email,
        role: "user"
      });

      await newUser.save();

      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);

      return res.status(201).json({
        success: true,
        data: {
          token: accessToken,
          refreshToken: refreshToken,
          user: {
            id: newUser._id,
            firstname: newUser.firstname,
            lastname: newUser.lastname,
            email: newUser.email,
            role: newUser.role,
          },
        },
        message: "Google account created and logged in successfully",
      });
    }
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({
      success: false,
      message: "Google authentication failed. Please try again.",
    });
  }
}