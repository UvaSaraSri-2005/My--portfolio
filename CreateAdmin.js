const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("./models/Admin");

require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const username = "admin";
        const password = "Sara2005Sri";

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = new Admin({
            username: username,
            password: hashedPassword
        });

        await admin.save();

        console.log("Admin created successfully");

        await mongoose.connection.close();

    } catch (error) {
        console.error("Error:", error);
    }
}

createAdmin();