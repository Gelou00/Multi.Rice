import Device from "../models/device.model.js";
import Event from '../models/event.model.js';
import mongoose from "mongoose";

export const submitData = async(req, res)=>{
    if(!req.body){
        return res.status(400).json({success: false, message: "Invalid values!"});
    }

    const deviceID = req.body.deviceID;

    // ✅ ONLY ESP32 DATA
    const containers = req.body.containers || [];
    const servos = req.body.servos || [];
    const ultrasonicStatus = req.body.ultrasonicStatus || [];
    const servoStatus = req.body.servoStatus || [];

    if(!deviceID){
        return res.status(200).json({success: false, message: "Invalid Device ID!"});
    }

    const session = await mongoose.startSession();

    try{
        const onRecordDevice = await Device.find({"deviceID": deviceID});

        if(!onRecordDevice || onRecordDevice.length < 1){
            return res.status(200).json({success: false, message: "Device not found!"});
        }
        
        session.startTransaction();

        const newEvent = new Event();

        newEvent.device = onRecordDevice[0]._id;
        newEvent.eventDate = Date.now();
        newEvent.eventType = 'Data Submission';

        // ✅ SAVE ONLY WHAT YOU NEED
        newEvent.containers = containers;
        newEvent.servos = servos;
        newEvent.ultrasonicStatus = ultrasonicStatus;
        newEvent.servoStatus = servoStatus;

        await newEvent.save();

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Data successfully saved!"
        });

    }catch(error){
        await session.abortTransaction();
        console.error("Error saving data - " + error.message);
        res.status(500).json({success: false, message:"Server Error"});
    }finally{
        await session.endSession();
    }

    return res;
};


// ✅ USED BY YOUR APP (Home + Device)
export const getLatestSummary = async (req, res) => {
  try {
    const latest = await Event.findOne().sort({ eventDate: -1 });

    if (!latest) {
      return res.status(200).json({
        success: false,
        message: "No data found"
      });
    }

    return res.status(200).json({
      success: true,
      data: [{
        containers: latest.containers || [0,0,0],
        servos: latest.servos || [0,0,0],
        ultrasonicStatus: latest.ultrasonicStatus || [false,false,false],
        servoStatus: latest.servoStatus || [false,false,false],
        lastUpdate: latest.eventDate
      }]
    });

  } catch (error) {
    console.error("Error getting latest summary:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};