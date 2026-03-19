import Device from "../models/device.model.js";
import Event from "../models/event.model.js";

const OFFLINE_TIMEOUT_MS = 8000;

const normalizeNumberArray = (value, fallback = [0, 0, 0]) => {
    if (!Array.isArray(value)) return fallback;

    return [
        Number(value[0] ?? fallback[0] ?? 0),
        Number(value[1] ?? fallback[1] ?? 0),
        Number(value[2] ?? fallback[2] ?? 0)
    ];
};

const normalizeBooleanArray = (value, fallback = [false, false, false]) => {
    if (!Array.isArray(value)) return fallback;

    return [
        !!value[0],
        !!value[1],
        !!value[2]
    ];
};

const toTimestamp = (value) => {
    if (!value) return 0;
    if (typeof value === "number") return value;

    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
};

const calculateServoHealth = ({
    servoCycles = 0,
    servoMoveTimeMs = 0,
    servoExtremeHits = 0,
    servoInstallDays = 0
}) => {
    const MAX_CYCLES = 100000;
    const MAX_MOVE_HOURS = 500;
    const MAX_EXTREME_HITS = 20000;
    const MAX_INSTALL_DAYS = 365;

    const cycleWear = Math.min(45, (servoCycles / MAX_CYCLES) * 45);

    const moveHours = servoMoveTimeMs / (1000 * 60 * 60);
    const moveWear = Math.min(25, (moveHours / MAX_MOVE_HOURS) * 25);

    const extremeWear = Math.min(15, (servoExtremeHits / MAX_EXTREME_HITS) * 15);

    const ageWear = Math.min(15, (servoInstallDays / MAX_INSTALL_DAYS) * 15);

    const health = 100 - cycleWear - moveWear - extremeWear - ageWear;

    return Math.max(0, Math.min(100, Math.round(health)));
};

const buildOfflineSummary = () => {
    return {
        deviceOnline: false,
        containers: [null, null, null],
        servos: [null, null, null],
        ultrasonicStatus: [false, false, false],
        servoStatus: [false, false, false],
        servoCycles: [0, 0, 0],
        servoMoveTimeMs: [0, 0, 0],
        servoExtremeHits: [0, 0, 0],
        servoInstallDays: [0, 0, 0],
        servoHealth: [null, null, null],
        lastUpdate: 0
    };
};

export const submitData = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({
            success: false,
            message: "Invalid values!"
        });
    }

    const deviceID = req.body.deviceID;

    const containers = normalizeNumberArray(req.body.containers, [0, 0, 0]);
    const servos = normalizeNumberArray(req.body.servos, [0, 0, 0]);
    const ultrasonicStatus = normalizeBooleanArray(req.body.ultrasonicStatus, [false, false, false]);
    const servoStatus = normalizeBooleanArray(req.body.servoStatus, [false, false, false]);

    const servoCycles = normalizeNumberArray(req.body.servoCycles, [0, 0, 0]);
    const servoMoveTimeMs = normalizeNumberArray(req.body.servoMoveTimeMs, [0, 0, 0]);
    const servoExtremeHits = normalizeNumberArray(req.body.servoExtremeHits, [0, 0, 0]);
    const servoInstallDays = normalizeNumberArray(req.body.servoInstallDays, [0, 0, 0]);

    if (!deviceID) {
        return res.status(200).json({
            success: false,
            message: "Invalid Device ID!"
        });
    }

    try {
        let device = await Device.findOne({ deviceID });

        if (!device) {
            console.log("New device detected → creating...");

            device = new Device({
                deviceID
            });

            await device.save();

            console.log("Device registered:", deviceID);
        }

        const newEvent = new Event({
            device: device._id,
            eventDate: Date.now(),
            eventType: "Data Submission",

            containers,
            servos,
            ultrasonicStatus,
            servoStatus,

            servoCycles,
            servoMoveTimeMs,
            servoExtremeHits,
            servoInstallDays
        });

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

export const getLatestSummary = async (req, res) => {
    try {
        const latest = await Event.findOne().sort({ eventDate: -1 });

        if (!latest) {
            return res.status(200).json({
                success: true,
                data: [buildOfflineSummary()]
            });
        }

        const latestTs = toTimestamp(latest.eventDate);
        const deviceOnline =
            latestTs > 0 && (Date.now() - latestTs <= OFFLINE_TIMEOUT_MS);

        const servoCycles = normalizeNumberArray(latest.servoCycles, [0, 0, 0]);
        const servoMoveTimeMs = normalizeNumberArray(latest.servoMoveTimeMs, [0, 0, 0]);
        const servoExtremeHits = normalizeNumberArray(latest.servoExtremeHits, [0, 0, 0]);
        const servoInstallDays = normalizeNumberArray(latest.servoInstallDays, [0, 0, 0]);

        const computedServoHealth = [
            calculateServoHealth({
                servoCycles: servoCycles[0],
                servoMoveTimeMs: servoMoveTimeMs[0],
                servoExtremeHits: servoExtremeHits[0],
                servoInstallDays: servoInstallDays[0]
            }),
            calculateServoHealth({
                servoCycles: servoCycles[1],
                servoMoveTimeMs: servoMoveTimeMs[1],
                servoExtremeHits: servoExtremeHits[1],
                servoInstallDays: servoInstallDays[1]
            }),
            calculateServoHealth({
                servoCycles: servoCycles[2],
                servoMoveTimeMs: servoMoveTimeMs[2],
                servoExtremeHits: servoExtremeHits[2],
                servoInstallDays: servoInstallDays[2]
            })
        ];

        return res.status(200).json({
            success: true,
            data: [{
                deviceOnline,

                containers: deviceOnline
                    ? normalizeNumberArray(latest.containers, [0, 0, 0])
                    : [null, null, null],

                servos: deviceOnline
                    ? normalizeNumberArray(latest.servos, [0, 0, 0])
                    : [null, null, null],

                ultrasonicStatus: deviceOnline
                    ? normalizeBooleanArray(latest.ultrasonicStatus, [false, false, false])
                    : [false, false, false],

                servoStatus: deviceOnline
                    ? normalizeBooleanArray(latest.servoStatus, [false, false, false])
                    : [false, false, false],

                servoCycles,
                servoMoveTimeMs,
                servoExtremeHits,
                servoInstallDays,

                servoHealth: deviceOnline
                    ? computedServoHealth
                    : [null, null, null],

                lastUpdate: latestTs
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