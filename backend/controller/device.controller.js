import Device from "../models/device.model.js";
import mongoose from "mongoose";


export const registerNewDevice = async( req, res) =>{
  const deviceID =  req.body.deviceID;

try { 
    var newDevice = new Device ();
    newDevice.deviceID = deviceID;

    await newDevice.save();
    res.status(200).json({success: true,data: [newDevice]});
}catch(error){
    res.status (500).json ({success: false, message:"server Error"});
}


return res;

}

export const getDevices = async (req, res) =>{
  try{
      const device = await Device.find({});
      if(!device){
        res.status(500).json({success: false, message:"No Device Found"});
      }else{
        res.status(200).json({success: true, data: device});
        }
      }catch(error){
        res.status(500).json({success: false, message:"Server Error"});
      }

      return res;

  }
export const updateDevice = async () =>{}