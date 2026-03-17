import mongoose from 'mongoose';

const types = ['Data Submission'];

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

    // ✅ KEEP (important for user filtering)
    owner:{
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: false
    },

    // ===== ✅ ESP32 DATA =====

    containers:{
        type: [Number],
        default: [0,0,0]
    },

    servos:{
        type: [Number],
        default: [0,0,0]
    },

    ultrasonicStatus:{
        type: [Boolean],
        default: [false,false,false]
    },

    servoStatus:{
        type: [Boolean],
        default: [false,false,false]
    }

});

const Event = mongoose.model('Event', EventSchema);

export default Event;