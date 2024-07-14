const express = require('express');
const mongoose = require('mongoose');
const { model } = require('./Model');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'https://loudmusics.vercel.app',
    credentials: true, // Allow cookies and authentication headers
}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// JWT encoding function
function encoding(email, password) {
    return jwt.sign(password, email);
}

// Login endpoint
app.post('/login', async (req, res) => {
    console.log(req.body);
    try {
        let result = await model.findOne({ email: req.body.email, password: encoding(req.body.email, req.body.password) });
        console.log(result);
        if (result) {
            // Example of setting cookies based on browser compatibility
            const cookieSettings = {
                maxAge: 900 * 2000,  // Adjust as needed
                httpOnly: true,
                secure: true,  // Ensure cookies are only sent over HTTPS
                sameSite: 'None'  // Ensure cross-site cookies are allowed
            };

            // Set the appropriate SameSite attribute based on browser
            const userAgent = req.headers['user-agent'];
            if (userAgent.includes('Chrome/') || userAgent.includes('Chromium/')) {
                // Google Chrome and Chromium-based browsers
                cookieSettings.sameSite = 'None';
            } else if (userAgent.includes('Firefox/')) {
                // Mozilla Firefox
                cookieSettings.sameSite = 'Lax';
            } else {
                // Default to Strict for other browsers (including Safari)
                cookieSettings.sameSite = 'Strict';
            }

            res.cookie('auth', JSON.stringify({ email: result.email }), cookieSettings).send({ message: "Cookie Set" });
        } else {
            res.sendStatus(401);
        }
        console.log("Done");
    } catch (err) {
        console.error(err);  // Log the error for debugging
        res.sendStatus(500);
    }
});

// Signup endpoint
app.post('/signup', async (req, res) => {
    try {
        let check = await model.findOne({ email: req.body.email });
        if (!check) {
            await model.create({ email: req.body.email, password: encoding(req.body.email, req.body.password) });
            res.sendStatus(200);
        } else {
            res.sendStatus(403); // User already exists
        }
    } catch (err) {
        console.error(err);  // Log the error for debugging
        res.sendStatus(500);
    }
});

// Forgot password endpoint
app.post('/forgot', async (req, res) => {
    console.log("requesting", req.body);
    try {
        let user = await model.findOne({ email: req.body.email });
        if (user) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'sanj25524@gmail.com',
                    pass: 'jidj oapr hkgi bnpv' // Use the 16-character app password generated from Google
                }
            });

            async function sendMail(email, password) {
                const info = await transporter.sendMail({
                    from: '"From Sanjay Password Regarding..." <sanj25524@gmail.com>',
                    to: email,
                    subject: "Password Recovery",
                    text: `Your password is: ${password}`,
                    html: `<b>Your password is: ${password}</b>`,
                });

                console.log("Message sent: %s", info.messageId);
            }

            sendMail(req.body.email, jwt.verify(user.password, user.email));
            res.status(201).json({ "message": "Email sent successfully" });
        } else {
            res.status(401).json({ "message": "User not found" });
        }
    } catch (err) {
        console.error(err);  // Log the error for debugging
        res.sendStatus(500);
    }
});

// MongoDB Connection
mongoose.connect('mongodb+srv://sanjaysoman46:sanjay123@frisson.1nliflp.mongodb.net/?retryWrites=true&w=majority&appName=frisson')
    .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch(err => console.error("Error at MongoDB connection:", err));

