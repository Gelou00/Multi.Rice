import Device from "../models/device.model.js";
import User from "../models/user.model.js";
import { isDeviceIDExisting } from "../functions/functions.js";

import mongoose from "mongoose";

export const registerNewDevice = async(req, res) =>{
    if(!req.body){
        return res.status(400).json({success: false, message: "Invalid values!"});
    }

    const deviceID =  req.body.deviceID;
    const id=req.body._id;
    
    if(!deviceID){
        return res.status(200).json({success: false, message: "Invalid Device ID!"});
    }

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(200).json({success: false, message: "Authentication Failed!"});
    }

    const session = await mongoose.startSession();
    try{
        const onRecordUser = await User.findById(id);
        if(!onRecordUser){
            return res.status(200).json({success: false, message: "Authentication Failed!"});
        }

        if(await isDeviceIDExisting(deviceID)){
            return res.status(200).json({success: false, message: "Device ID is already in use!"});
        }

        session.startTransaction();

        const newDevice = new Device();
        newDevice.deviceID = deviceID;
        newDevice.owner=id;

        await newDevice.save();

        await session.commitTransaction();
        res.status(200).json({success: true, data: [newDevice]});
    }catch(error){
        await session.abortTransaction();
        console.error("Error in registering Device! - "+error.message);
        res.status(500).json({success: false, message:"Server Error"});
    }finally{
        await session.endSession();
    }
    
    return res;
}

export const getMyDevices = async(req, res) =>{
    if(!req.body){
        return res.status(400).json({success: false, message: "Invalid values!"});
    }
    const id=req.body._id;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(200).json({success: false, message: "Authentication Failed!"});
    }

    try{
        const onRecordUser = await User.findById(id);
        if(!onRecordUser){
            return res.status(200).json({success: false, message: "Authentication Failed!"});
        }

        const devices = await Device.find({"owner": id});

        if(!devices){
            res.status(500).json({success: false, message:"No device found!"});
        }else{
            res.status(200).json({success: true, data: devices});
        }
    }catch(error){
        res.status(500).json({success: false, message:"Server Error"});
    }

    return res;
}

export const updateDevice = async(req, res)=>{
    if(!req.body){
        return res.status(400).json({success: false, message: "Invalid values!"});
    }

    const deviceID =  req.body.deviceID;
    const deviceDBID=req.params.deviceDBID;
    const id=req.body._id;
    
    if(!deviceID){
        return res.status(200).json({success: false, message: "Invalid Device ID!"});
    }

    if(!mongoose.Types.ObjectId.isValid(deviceDBID)){
        return res.status(200).json({success: false, message: "Invalid Device DB ID!"});
    }

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(200).json({success: false, message: "Authentication Failed!"});
    }

    const session = await mongoose.startSession();
    try{
        session.startTransaction();
        const onRecordUser = await User.findById(id);
        if(!onRecordUser){
            return res.status(200).json({success: false, message: "Authentication Failed!"});
        }

        const onRecordDevice = await Device.findById(deviceDBID);
        if(!onRecordDevice){
            return res.status(200).json({success: false, message: "Invalid Device DB ID!"});
        }

        if(await isDeviceIDExisting(deviceID, deviceDBID)){
            return res.status(200).json({success: false, message: "Device ID is already in use!"});
        }

        onRecordDevice.deviceID = deviceID;
        
        const updatedDevice = await Device.findByIdAndUpdate(deviceDBID, onRecordDevice, {runValidators: true, new: true, session});
        if(!updatedDevice || updatedDevice === undefined){
            console.log("Error updating deviceID...");
            return res.status(200).json({success: false, message: "Device ID is already in use!"});
        }
        await session.commitTransaction();

        
        res.status(200).json({success: true, data: [updatedDevice]});

    }catch(error){
        await session.abortTransaction();
        console.error("Error in updating Device ID! - "+error.message);
        res.status(500).json({success: false, message:"Server Error"});
    }finally{
        await session.endSession();
    }
    
    return res;
}


export const deviceOnline = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ success: false, message: "Invalid values!" });
    }

    const deviceID = req.body.deviceID;

    if (!deviceID) {
        return res.status(200).json({ success: false, message: "Invalid Device ID!" });
    }

    const container1 = req.body.container1 || 0;
    const container2 = req.body.container2 || 0;
    const container3 = req.body.container3 || 0;

    const servo1Durability = req.body.servo1Durability || 100;
    const servo2Durability = req.body.servo2Durability || 100;
    const servo3Durability = req.body.servo3Durability || 100;

    const session = await mongoose.startSession();

    try {

        const device = await Device.findOne({ deviceID });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device not registered"
            });
        }

        session.startTransaction();

        device.isOnline = true;
        device.lastUpdate = Date.now();

        // container level tab
        device.container1 = container1;
        device.container2 = container2;
        device.container3 = container3;

        // device tab
        device.servo1Durability = servo1Durability;
        device.servo2Durability = servo2Durability;
        device.servo3Durability = servo3Durability;

        const updatedDevice = await Device.findByIdAndUpdate(
            device._id,
            device,
            { runValidators: true, new: true, session }
        );

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            data: [updatedDevice]
        });

    } catch (error) {

        await session.abortTransaction();
        console.log(error.message);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    } finally {

        await session.endSession();

    }

    return res;

}

export const getADevice = async(req, res) =>{
    if(!req.body){
        return res.status(400).json({success: false, message: "Invalid values!"});
    }

    const id=req.body._id;
    const deviceID=req.params.deviceID;

    if(!deviceID || deviceID.length<1){
        return res.status(200).json({success: false, message: "Invalid Device ID!"});
    }
    
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(200).json({success: false, message: "Authentication Failed!"});
    }

    try{
        const onRecordUser = await User.findById(id);
        if(!onRecordUser){
            return res.status(200).json({success: false, message: "Authentication Failed!"});
        }

        const device = await Device.find({"deviceID": deviceID});
        if(!device){
            res.status(500).json({success: false, message:"No device found!"});
        }else if(device[0].owner.toString() != id){
            res.status(500).json({success: false, message:"Authentication Failed!"});
        }else{
            res.status(200).json({success: true, data: device});
        }
    }catch(error){
        console.log("An error occured retrieving Device! - "+error.message);
        res.status(500).json({success: false, message:"Server Error"});
    }

    return res;
}

export const getNumberOfDevicesOnline = async (req, res) =>{
    if(!req.body){
        return res.status(400).json({success: false, message: "Invalid values!"});
    }

    const ownerId=req.body._id;   
    if(!mongoose.Types.ObjectId.isValid(ownerId)){
        return res.status(200).json({success: false, message: "Authentication Failed!"});
    }

    try{
        const onRecordUser = await User.findById(ownerId);
        if(!onRecordUser){
            return res.status(200).json({success: false, message: "Authentication Failed!"});
        }

        const response = await Device.aggregate([
            {
                $match: {
                owner: onRecordUser._id
                }
            },
            {
                $group: {
                _id: null,
                online: {
                    $sum: {
                    $cond: [{ $eq: ["$isOnline", true] }, 1, 0]
                    }
                },
                offline: {
                    $sum: {
                    $cond: [{ $eq: ["$isOnline", false] }, 1, 0]
                    }
                }
                }
            },
            {
                $project: {
                _id: 0,
                online: 1,
                offline: 1
                }
            }
            ]);

        if(!response || response.length<1){
            res.status(500).json({success: false, message:"No device found!"});
        }else{
            console.log("response: "+JSON.stringify(response));
            res.status(200).json({success: true, data: response});
        }

    }catch(error){
        console.log("An error occured retrieving Device! - "+error.message);
        res.status(500).json({success: false, message:"Server Error"});
    }

    return res;
}