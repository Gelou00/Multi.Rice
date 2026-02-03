import mongoose from 'mongoose';
<<<<<<< HEAD
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

export const dbConnection = async () => {
    try {

        if (!process.env.DB_ACCESS) {
            throw new Error("DB_ACCESS is not defined in .env file");
        }

        // ✅ FIX: remove unsupported options
        await mongoose.connect(process.env.DB_ACCESS);

    } catch (error) {
        console.error("Error: " + error.message);
        process.exit(1);
    }

    mongoose.connection.on("connected", () => {
        console.log("Connected to database successfully!");
    });

    mongoose.connection.on("error", (err) => {
        console.error("Error while connecting to database! " + err.message);
    });

    mongoose.connection.on("disconnected", () => {
        console.error("MongoDB disconnected!");
    });
};
=======

export const dbConnection = async () => {
    try{
        await mongoose.connect(process.env.DB_ACCESS);

        
    }catch(error){
        console.error("Error: "+error.message);
        process.exit(1);
    }
    mongoose.connection.on("connected", ()=>{
        console.log("Connected to database successfully!");
    });

    mongoose.connection.on("error", (err)=>{
        console.error("Error while connecting to database!"+err.message);
    });

    mongoose.connection.on("disconnected", ()=>{
        console.error("MongoDB disconnected!");
    });
}
>>>>>>> 994538b5ffb4d4c2c2feb029fef1a3f2a01b1060
