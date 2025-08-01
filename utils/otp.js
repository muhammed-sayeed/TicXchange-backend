import redisClient from "../config/redisClient.js";
import { sentOtpByMail } from "./mailer.js";

export const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const seveOtpToRedis = async (key, otp, ttl = 300 ) => {
    const redisKey = `otp:email:${key}`;
    await redisClient.set(redisKey, otp, { EX: ttl });
};

export const verifyRedisOtp = async(key, otp) => {
    const savedOtp = await redisClient.get(key);
    return savedOtp == otp;
};

export const sentOtp = async (key, type) => {
    
    if(!key && !type ){
        throw new Error('Valid email or mobile is required');
    }
    const otp = generateOtp();
    // const type = email ? 'email' : 'mobile';
    // const key = email || mobile;
    await seveOtpToRedis(key, otp);
    if (type === 'email') {
        await sentOtpByMail(otp, key);
    } else if (type === 'mobile') {
        // send OTP to mobile here
    }
    return {
        success: true,
        message: `otp successfully sent to ${type}`
    }
}
export const verifyOtp = async(req, res) => {
    const { email, mobile, otp } = req.body;

    const key = email || mobile;
    
    if(!otp || !key){
        return res.status(400).json({ message: 'OTP and identifier are required' });
    }
    const isValid = verifyRedisOtp(key, otp);
    if (!isValid) {
    return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    return res.status(200).json({ message: 'OTP verified successfully' });
}