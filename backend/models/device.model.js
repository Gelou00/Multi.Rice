import mongoose from 'mongoose';


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
    dafault:0
},
chamber1:{
    type:Number,
    require: true,
    default:0
},
chamber2:{
    type:Number,
    require: true,
    default:0
},
chamber2:{
    type:Number,
    require: true,
    default:0
}

});


 const Device = mongoose.model('Device', DeviceSchema);

export default Device;