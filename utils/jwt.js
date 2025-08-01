import jwt from 'jsonwebtoken';

export const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email
        },
        process.env.ACCECC_SECRET,
        {
            expiresIn: '15m'
        }
    )
};

export const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email
        },
        process.env.REFRESH_SECRET,
        {
            expiresIn: '7d'
        }
    )
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.REFRESH_SECRET)
};