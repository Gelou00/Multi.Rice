export type RawServo = {
  index: number;
  status: "online" | "disconnected" | "unknown";
  angle: number | null;
  percent: number | null;
};

export type RawUltrasonic = {
  index: number;
  status: "online" | "disconnected";
  connected: boolean;
  distanceCm: number | null;
  percent: number | null;
};

export type RawDeviceStatus = {
  deviceOnline: boolean;
  lastSeen: number | null;
  servos: RawServo[];
  ultrasonics: RawUltrasonic[];
};

export type UiStatus = "online" | "offline" | "disconnected" | "unknown";

export type UiServo = {
  index: number;
  status: UiStatus;
  angle: number | null;
  percent: number | null;
};

export type UiUltrasonic = {
  index: number;
  status: UiStatus;
  distanceCm: number | null;
  percent: number | null;
};

export type UiDevice = {
  deviceOnline: boolean;
  servos: UiServo[];
  ultrasonics: UiUltrasonic[];
};

const OFFLINE_TIMEOUT_MS = 1000;

export function mapDeviceToUi(
  raw: RawDeviceStatus | null,
  now: number = Date.now()
): UiDevice {
  const isOnline =
    !!raw &&
    raw.deviceOnline === true &&
    typeof raw.lastSeen === "number" &&
    now - raw.lastSeen <= OFFLINE_TIMEOUT_MS;

  if (!raw || !isOnline) {
    return {
      deviceOnline: false,
      servos: [0, 1, 2].map((index) => ({
        index,
        status: "offline",
        angle: null,
        percent: null,
      })),
      ultrasonics: [0, 1, 2].map((index) => ({
        index,
        status: "offline",
        distanceCm: null,
        percent: null,
      })),
    };
  }

  return {
    deviceOnline: true,
    servos: raw.servos.map((servo) => ({
      index: servo.index,
      status:
        servo.status === "disconnected"
          ? "disconnected"
          : servo.status === "unknown"
          ? "unknown"
          : "online",
      angle:
        servo.status === "online" || servo.status === "unknown"
          ? servo.angle
          : null,
      percent:
        servo.status === "online" || servo.status === "unknown"
          ? servo.percent
          : null,
    })),
    ultrasonics: raw.ultrasonics.map((u) => ({
      index: u.index,
      status: u.status === "disconnected" ? "disconnected" : "online",
      distanceCm: u.connected ? u.distanceCm : null,
      percent: u.connected ? u.percent : null,
    })),
  };
}