import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser'
import cors from 'cors';


dotenv.config();

const app = express();

app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

export default app;