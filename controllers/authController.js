import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library'

import redisClient from '../config/redisClient.js';
import auth_user from '../models/auth_user.js';
import {
       generateAccessToken,
       generateRefreshToken,
       verifyRefreshToken
                } from '../utils/jwt.js'
import { sentOtp } from '../utils/otp.js';

export const userSignup = async(req, res) => {
    const {firstname, lastname, email, mobile, password} = req.body;
    try {
        if (!email && !mobile) {
        return res.status(400).json({ message: 'Email or mobile is required' });
        }
        if(email){
            const isUserExist = await auth_user.findOne({email: email});
        if(isUserExist){
            return res.status(400).json({ message: 'Email already registered'});
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await redisClient.set(
            `pending:email:${email}`,
            JSON.stringify({firstname, lastname, email, hashedPassword}),
            {EX: 600}
        );
        await sentOtp(email,'email');
        return res.status(200).json({ message: 'OTP sent to email.' });
        };
        if(mobile){
          // logic to send otp to mobile
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
}
export const verifyUser = async(req, res) => {
    const {email, otp} = req.body;
    try {
        const redisKey = `otp:email:${email}`;
        const saveOtp = await redisClient.get(redisKey);
    if(!saveOtp || saveOtp != otp){
        return res.status(401).json({ message: "Invalid or expired OTP." });
    }
    await redisClient.del(`otp:email:${email}`);
    const pendingData = await redisClient.get(`pending:email:${email}`);
    if (!pendingData) return res.status(403).json({ message: "No pending registration found." });
    const {firstname, lastname, hashedPassword} = JSON.parse(pendingData);
    const newUser = new auth_user({
        firstname,
        lastname,
        email,
        password: hashedPassword
    })
    await newUser.save();
    await redisClient.del(`pending:email:${email}`);
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);
    res.cookie(
        'refreshtoken', refreshToken, {
         httpOnly: true,
         sameSite: 'strict',
         maxAge: 7 * 24 * 60 * 60 * 1000
        }
    )
    res.status(201).json({
      message: "Registration successful.",
      accessToken: accessToken,
      refreshToken: refreshToken
    });
    } catch (error) {
         console.error('set-password error:', error);
         res.status(500).json({ message: "Server error" });
    }
}
export const userLogin = async(req, res) => {
    const { email, password} = req.body;
    try {
        
    } catch (error) {
        
    }
}