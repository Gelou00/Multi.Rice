import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({

    deviceID:{ 
        type: String,
        required:true
    },

    isOnline:{
        type:Boolean,
        default:false
    },

    lastUpdate:{
        type:Number,
        required:true,
        default:0
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },

    // Container Level (Ultrasonic Sensors)
    ultrasonic1:{
        type:Number,
        required:true,
        default:0
    },

    ultrasonic2:{
        type:Number,
        required:true,
        default:0
    },

    ultrasonic3:{
        type:Number,
        required:true,
        default:0
    },

    // Servo Motor Durability
    servo1Durability:{
        type:Number,
        required:true,
        default:100
    },

    servo2Durability:{
        type:Number,
        required:true,
        default:100
    },

    servo3Durability:{
        type:Number,
        required:true,
        default:100
    }

});

const Device = mongoose.model('Device', DeviceSchema);

export default Device;