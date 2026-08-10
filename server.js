const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dns = require("dns");
const Contact = require("./models/Contact");
const Admin = require("./models/Admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const cookieParser = require("cookie-parser");
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
const app = express();
const PORT = 5000;
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error);
    });

// Serve static files
app.use(express.static(__dirname));
app.use(express.json());
app.use(cookieParser());
app.post("/contact", async (req, res) => {
    const { name, email, message } = req.body;

    try {

        // 1. Save message to MongoDB
        const newContact = new Contact({
            name: name,
            email: email,
            message: message
        });

        await newContact.save();

        console.log("Contact saved successfully");


        // 2. Send email to Sara
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: "New Portfolio Contact Message",
            text: `
You received a new message from your portfolio.

Name: ${name}
Email: ${email}

Message:
${message}
            `
        };

        await transporter.sendMail(mailOptions);

        console.log("Email sent successfully");


        // 3. Send success response to frontend
        res.status(201).json({
            success: true,
            message: "Message sent successfully"
        });

    } catch (error) {

        console.error("Contact error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to send message"
        });
    }
});
// Save contact message
app.post("/contact", async (req, res) => {
    const { name, email, message } = req.body;

    try {
        const newContact = new Contact({
            name,
            email,
            message
        });

        await newContact.save();

        console.log("Contact saved successfully");

        res.status(201).json({
            success: true,
            message: "Message sent successfully"
        });

    } catch (error) {
        console.error("Error saving contact:", error);

        res.status(500).json({
            success: false,
            message: "Failed to save contact"
        });
    }
});
function verifyToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized. Please login."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.admin = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
}
app.post("/admin-logout", (req, res) => {
    res.clearCookie("token");

    res.json({
        success: true,
        message: "Logged out successfully"
    });
});
app.get("/contacts", verifyToken, async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });

        res.json(contacts);

    } catch (error) {
        console.error("Error fetching contacts:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch contacts"
        });
    }
});
app.post("/admin-login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            admin.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        res.json({
            success: true,
            message: "Login successful"
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});
// Home Route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});