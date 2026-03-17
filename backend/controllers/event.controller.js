import Device from "../models/device.model.js";
import Event from "../models/event.model.js";

export const submitData = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ success: false, message: "Invalid values!" });
    }

    const deviceID = req.body.deviceID;

    const containers = req.body.containers || [];
    const servos = req.body.servos || [];
    const ultrasonicStatus = req.body.ultrasonicStatus || [];
    const servoStatus = req.body.servoStatus || [];

    if (!deviceID) {
        return res.status(200).json({ success: false, message: "Invalid Device ID!" });
    }

    try {
        // ✅ AUTO REGISTER DEVICE
        let device = await Device.findOne({ deviceID });

        if (!device) {
            console.log("New device detected → creating...");

            device = new Device({
                deviceID: deviceID
            });

            await device.save();

            console.log("Device registered:", deviceID);
        }

        const newEvent = new Event();

        // ✅ use auto-registered device
        newEvent.device = device._id;
        newEvent.eventDate = Date.now();
        newEvent.eventType = 'Data Submission';

        newEvent.containers = containers;
        newEvent.servos = servos;
        newEvent.ultrasonicStatus = ultrasonicStatus;
        newEvent.servoStatus = servoStatus;

        await newEvent.save();

        return res.status(200).json({
            success: true,
            message: "Data successfully saved!"
        });

    } catch (error) {
        console.error("Error saving data - " + error.message);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ✅ MOVED OUTSIDE submitData (ONLY CHANGE)
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
                containers: latest.containers || [0, 0, 0],
                servos: latest.servos || [0, 0, 0],
                ultrasonicStatus: latest.ultrasonicStatus || [false, false, false],
                servoStatus: latest.servoStatus || [false, false, false],
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