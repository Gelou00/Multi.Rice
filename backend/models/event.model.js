import mongoose from 'mongoose';

const types = ['Irrigation Activation', 'Data Submission', 'Seedling Sow', 'Seedling Ready'];
const reservoirLevels = ['OK', 'LOW', 'FULL'];
const waterLevels = ['OK', 'LOW', 'FULL']

const EventSchema = new mongoose.Schema({
    device:{
        type: mongoose.Types.ObjectId,
        ref: 'Device',
        required: true
    },
    eventDate:{
        type: Number,
        required: true,
        default: Date.now()
    },
    eventType:{
        type: String,
        enum: types,
        required: true,
        default: 'Data Submission'
    },
<<<<<<< HEAD
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
=======
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
>>>>>>> 994538b5ffb4d4c2c2feb029fef1a3f2a01b1060
});

const Event=mongoose.model('Event', EventSchema);

export default Event;