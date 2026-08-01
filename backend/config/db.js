import mongoose from "mongoose";

export default async function connectDB(){
    try{
        const conn=await mongoose.connect(process.env.MONGO_URI);
        console.log(`Mongo DB Connected : ${conn.connection.host}`);

    } catch(error){
        console.log(`mongo connection failed: ${error.message}`);
        process.exit(1);

    }

}