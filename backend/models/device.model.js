import mongoose from 'mongoose';

<<<<<<< HEAD
const DeviceSchema = new mongoose.Schema({
    deviceID:{
        type: String,
        required: true
    },
    isOnline:{
        type: Boolean,
        default: false
    },
    lastUpdate:{
        type: Number,
        required: true,
        default: 0
    },
    owner:{
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    temperature:{
        type: Number,
        required: true,
        default: 0
    },
    humidity:{
        type: Number,
        required: true,
        default: 0
    },
    tankLevel:{
        type: Number,
        default: 0
    },
    isRaining:{
        type: Boolean,
        default: false
    },
    isIrrigating:{
        type: Boolean,
        default: false
    }
});

const Device = mongoose.model('Device', DeviceSchema);
=======

const DeviceSchema = new mongoose.Schema({
    deviceID:{ 
          type: String,
          require:true
    },
isOnline:{
     type:Boolean,
     default:false
},
lastUpdate:{
    type: Number,
    require: true,
    default: 0
},
owner:{
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
},
ultrasonic1:{

    type: Number,
    required: true,
    default: 0
},
ultrasonic2:{

    type: Number,
    required: true,
    default: 0

},
ultrasonic3:{

    type: Number,
    required: true,
    default: 0

},

});


 const Device = mongoose.model('Device', DeviceSchema);
>>>>>>> 994538b5ffb4d4c2c2feb029fef1a3f2a01b1060

export default Device;