const express = require('express');
const mongoose = require('mongoose');
const { model } = require('./Model');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000', 'https://loudmusics.vercel.app'],
    credentials: true,
}));
app.use(cookieParser());

// JWT token encoding function
function encoding(email, password) {
    return jwt.sign(password, email);
}

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = encoding(email, password);
        const user = await model.findOne({ email, password: hashedPassword });

        if (user) {
            const cookieSettings = {
                maxAge: 900 * 2000,
                httpOnly: true,
                secure: true,
                sameSite: 'None',
            };

            res.cookie('auth', JSON.stringify({ email: user.email }), cookieSettings).send({ message: 'Cookie Set' });
        } else {
            res.sendStatus(401); // Unauthorized
        }
    } catch (err) {
        console.error(err);
        res.sendStatus(500); // Internal Server Error
    }
});

// Signup endpoint
app.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await model.findOne({ email });

        if (!existingUser) {
            await model.create({ email, password: encoding(email, password) });
            res.sendStatus(200); // OK
        } else {
            res.sendStatus(403); // Forbidden (user already exists)
        }
    } catch (err) {
        console.error(err);
        res.sendStatus(500); // Internal Server Error
    }
});

// Forgot password endpoint
app.post('/forgot', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await model.findOne({ email });

        if (user) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'your-email@gmail.com',
                    pass: 'your-password',
                },
            });

            const info = await transporter.sendMail({
                from: '"From Sanjay Password Regarding..." <sanj25524@gmail.com>',
                to: email,
                subject: 'Password Recovery',
                text: `Your password is: ${jwt.verify(user.password, user.email)}`,
                html: `<b>Your password is: ${jwt.verify(user.password, user.email)}</b>`,
            });

            console.log('Message sent: %s', info.messageId);
            res.status(201).json({ message: 'Email sent successfully' });
        } else {
            res.status(401).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.sendStatus(500); // Internal Server Error
    }
});

// Start the server
mongoose.connect('mongodb+srv://sanjaysoman46:sanjay123@frisson.1nliflp.mongodb.net/frisson?retryWrites=true&w=majority&appName=frisson')
    .then(() => app.listen(8080, () => console.log("Server Connected")))
    .catch(err => console.error("Error connecting to MongoDB:", err));

