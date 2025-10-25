import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/dbConnection.js';
import authRotes from './routes/auth_routes.js';

dotenv.config();

const app = express();

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

app.use(express.json({ limit: '10mb' })); 
app.use(cookieParser());

app.use('/', authRotes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;