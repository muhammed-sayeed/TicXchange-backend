import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import connectDB from './config/dbConnection';

dotenv.config()

const app = express();

connectDB();

app.use(cors);
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> {
   console.log(`server running on port ${PORT}`)
})