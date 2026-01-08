import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
export async function sendVerificationEmail(to, code) {
    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: 'Verify Your ElectroCare Account',
        text: `Your verification code is ${code}`,
    });
}
//# sourceMappingURL=email.js.map