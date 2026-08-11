const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dns = require("dns");
const { Resend } = require("resend");

require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

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

        // 1. Save contact message to MongoDB
        const newContact = new Contact({
            name,
            email,
            message
        });

        await newContact.save();

        console.log("Contact saved successfully");

        // 2. Send email using Resend
        const { data, error } = await resend.emails.send({

            from: "Portfolio <onboarding@resend.dev>",

            to: [process.env.EMAIL_USER],

            replyTo: email,

            subject: "New Portfolio Contact Message",

            text: `
You received a new message from your portfolio.

Name: ${name}
Email: ${email}

Message:
${message}
`
        });

        if (error) {

            console.error("Resend error:", error);

            throw new Error("Email sending failed");
        }

        console.log(
            "Email sent successfully:",
            data.id
        );

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

// ===============================
// Home Route
// ===============================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});

// ===============================
// Start Server
// ===============================

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Server running on port ${PORT}`
    );

});
