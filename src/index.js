//require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./env" });

connectDB()
.then(() => { //we get a promise from async function connectDB
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server running on port ${process.env.PORT}`);
    });
})
.catch((error) => {
    console.log("Error connecting to the database: ", error);
    process.exit(1);
})

















/*         ***** First Method to connect to the database *****
import mongoose from "mongoose";
import { DB_NAME } from "./constants";

import express from "express";
const app = express();

*** ifi: Immediately Invoked Function Expression ***

;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("Error connecting to the database");
            throw error;
        });
        app.listen(process.env.PORT, () => { 
            console.log(`Server running on port ${process.env.PORT}`);
        });
    }
    catch (error) {
        console.error("ERROR: ", error);
        throw error;
    }
})()
*/