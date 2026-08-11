const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dns = require("dns");
const nodemailer = require("nodemailer");

require("dotenv").config();

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const Contact = require("./models/Contact");

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// MongoDB Connection
// ===============================

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error);
    });

// ===============================
// Gmail Transporter
// ===============================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ===============================
// Middleware
// ===============================

app.use(express.static(__dirname));
app.use(express.json());

// ===============================
// Contact Form
// ===============================

app.post("/contact", async (req, res) => {

    const { name, email, message } = req.body;

    try {

        // Save contact message to MongoDB
        const newContact = new Contact({
            name,
            email,
            message
        });

        await newContact.save();

        console.log("Contact saved successfully");

        // Send email to your Gmail
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

        // Send response to frontend
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

// ===============================
// Home Route
// ===============================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ===============================
// Start Server
// ===============================

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});