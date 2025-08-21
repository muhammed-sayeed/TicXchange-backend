import nodemailer from 'nodemailer';

export const    sentOtpByMail = async (otp, email) => {
    const transpoter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        }
    });
    await transpoter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: 'otp code',
        text: `your otp is ${otp}`
    })
}