import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

//to handle CORS errors
app.use(cors({  
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

//to handle JSON data
app.use(express.json({ limit: "20kb" })); 

//to encode URL
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

//to store files
app.use(express.static("public"));

//to extract cookies from browser
app.use(cookieParser());

//Routes import
import userRouter from './routes/user.routes.js'; //we have given manchaha naam to "router -> userRouter"

//Routes declaration
app.use("/api/v1/user", userRouter) //http://localhost:3000/api/v1/user/register


export { app };