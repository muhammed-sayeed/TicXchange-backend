import mongoose from "mongoose";

const connectDB = async() => {
    try {
        mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log('Database connecting successfully...')
    } catch (error) {
         console.error('MongoDB connection failed:', error.message);
         process.exit(1); 
    }
} 

export default connectDB;