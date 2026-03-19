import React, { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, Image, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import loadingOverlay from "../components/LoadingOverlay";
import axiosInstance from "@/axiosConfig";
import logo from "../../assets/images/logo.png";
import { mapDeviceToUi, RawDeviceStatus } from "../../utils/deviceMapper";

const POLL_INTERVAL_MS = 3000;
const OFFLINE_TIMEOUT_MS = 8000;

const DevicesTab = () => {
  const [isLoading] = useState(false);
  const [servos, setServos] = useState<Array<number | null>>([null, null, null]);
  const [servoStatus, setServoStatus] = useState([false, false, false]);
  const [servoHealth, setServoHealth] = useState<Array<number | null>>([null, null, null]);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [deviceOnline, setDeviceOnline] = useState(false);

  const rotations = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  const shakes = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  const indicatorAnim = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];

  const rotationLoops = useRef<(Animated.CompositeAnimation | null)[]>([null, null, null]);
  const shakeLoops = useRef<(Animated.CompositeAnimation | null)[]>([null, null, null]);
  const indicatorLoops = useRef<(Animated.CompositeAnimation | null)[]>([null, null, null]);

  const startOnlinePulse = (anim: Animated.Value, index: number) => {
    indicatorLoops.current[index]?.stop();
    anim.setValue(1);

    indicatorLoops.current[index] = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );

    indicatorLoops.current[index]?.start();
  };

  const startOfflineBlink = (anim: Animated.Value, index: number) => {
    indicatorLoops.current[index]?.stop();
    anim.setValue(1);

    indicatorLoops.current[index] = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.1, duration: 300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ])
    );

    indicatorLoops.current[index]?.start();
  };

  const startCriticalPulse = (anim: Animated.Value, index: number) => {
    indicatorLoops.current[index]?.stop();
    anim.setValue(1);

    indicatorLoops.current[index] = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.2, duration: 200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ])
    );

    indicatorLoops.current[index]?.start();
  };

  const stopIndicator = (anim: Animated.Value, index: number) => {
    indicatorLoops.current[index]?.stop();
    indicatorLoops.current[index] = null;
    anim.stopAnimation();
    anim.setValue(1);
  };

  const startRotation = (anim: Animated.Value, index: number) => {
    rotationLoops.current[index]?.stop();
    anim.setValue(0);

    rotationLoops.current[index] = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    rotationLoops.current[index]?.start();
  };

  const stopRotation = (anim: Animated.Value, index: number) => {
    rotationLoops.current[index]?.stop();
    rotationLoops.current[index] = null;
    anim.stopAnimation();
    anim.setValue(0);
  };

  const startShake = (anim: Animated.Value, index: number) => {
    shakeLoops.current[index]?.stop();
    anim.setValue(0);

    shakeLoops.current[index] = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 5, duration: 100, useNativeDriver: true }),
        Animated.timing(anim, { toValue: -5, duration: 100, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ])
    );

    shakeLoops.current[index]?.start();
  };

  const stopShake = (anim: Animated.Value, index: number) => {
    shakeLoops.current[index]?.stop();
    shakeLoops.current[index] = null;
    anim.stopAnimation();
    anim.setValue(0);
  };

  const toTimestamp = (value: any) => {
    if (!value) return 0;
    if (typeof value === "number") return value;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const applyOfflineServos = () => {
    setDeviceOnline(false);
    setServos([null, null, null]);
    setServoStatus([false, false, false]);
    setServoHealth([null, null, null]);

    [0, 1, 2].forEach((i) => {
      stopRotation(rotations[i], i);
      stopShake(shakes[i], i);
      startOfflineBlink(indicatorAnim[i], i);
    });
  };

  const reloadData = async () => {
    try {
      const response = await axiosInstance.get("/event/temp-summary");

      if (!(response?.data?.success) || !Array.isArray(response.data.data) || response.data.data.length === 0) {
        applyOfflineServos();
        return;
      }

      const latest = response.data.data[0];
      const latestTs = toTimestamp(latest.lastUpdate);

      setLastUpdate(latestTs);

      const isFresh = latestTs > 0 && Date.now() - latestTs <= OFFLINE_TIMEOUT_MS;

      if (!isFresh) {
        applyOfflineServos();
        return;
      }

      setDeviceOnline(true);

      const newServos = Array.isArray(latest.servos) ? latest.servos : [null, null, null];
      const newStatus = Array.isArray(latest.servoStatus) ? latest.servoStatus : [false, false, false];
      const newHealth = Array.isArray(latest.servoHealth) ? latest.servoHealth : [null, null, null];

      const normalizedStatus = [!!newStatus[0], !!newStatus[1], !!newStatus[2]];

      const normalizedServos: Array<number | null> = [0, 1, 2].map((i) =>
        normalizedStatus[i] ? Number(newServos[i] ?? 0) : null
      );

      const normalizedHealth: Array<number | null> = [0, 1, 2].map((i) =>
        normalizedStatus[i]
          ? Math.max(0, Math.min(100, Number(newHealth[i] ?? 0)))
          : null
      );

      setServos(normalizedServos);
      setServoStatus(normalizedStatus);
      setServoHealth(normalizedHealth);

      normalizedHealth.forEach((healthPercent, i) => {
        const isOnline = normalizedStatus[i];

        if (isOnline) startRotation(rotations[i], i);
        else stopRotation(rotations[i], i);

        if (isOnline && (healthPercent ?? 0) <= 30) startShake(shakes[i], i);
        else stopShake(shakes[i], i);

        if (!isOnline) {
          startOfflineBlink(indicatorAnim[i], i);
        } else if ((healthPercent ?? 0) <= 30) {
          startCriticalPulse(indicatorAnim[i], i);
        } else {
          startOnlinePulse(indicatorAnim[i], i);
        }
      });
    } catch (error: any) {
      console.log("API ERROR:", error?.message);
      applyOfflineServos();
    }
  };

  useEffect(() => {
    reloadData();

    const pollId = setInterval(reloadData, POLL_INTERVAL_MS);
    const staleCheckId = setInterval(() => {
      if (!lastUpdate) {
        applyOfflineServos();
        return;
      }

      const diff = Date.now() - lastUpdate;
      if (diff > OFFLINE_TIMEOUT_MS) {
        applyOfflineServos();
      }
    }, 1000);

    return () => {
      clearInterval(pollId);
      clearInterval(staleCheckId);

      rotations.forEach((anim, i) => stopRotation(anim, i));
      shakes.forEach((anim, i) => stopShake(anim, i));
      indicatorAnim.forEach((anim, i) => stopIndicator(anim, i));
    };
  }, [lastUpdate]);

  const getStatus = (percent: number | null, isOnline: boolean) => {
    if (!isOnline || percent === null) return { label: "OFFLINE", color: "#9ca3af" };
    if (percent <= 30) return { label: "CRITICAL", color: "#fb7185" };
    if (percent <= 60) return { label: "WARNING", color: "#fbbf24" };
    return { label: "GOOD", color: "#34d399" };
  };

  const servoData = [
    {
      id: 1,
      name: "Servo A",
      angle: servos[0],
      percent: servoHealth[0],
      online: deviceOnline ? servoStatus[0] : false,
      rot: rotations[0],
      shake: shakes[0],
    },
    {
      id: 2,
      name: "Servo B",
      angle: servos[1],
      percent: servoHealth[1],
      online: deviceOnline ? servoStatus[1] : false,
      rot: rotations[1],
      shake: shakes[1],
    },
    {
      id: 3,
      name: "Servo C",
      angle: servos[2],
      percent: servoHealth[2],
      online: deviceOnline ? servoStatus[2] : false,
      rot: rotations[2],
      shake: shakes[2],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      {isLoading && loadingOverlay()}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          padding: 20,
          paddingTop: 10,
          borderBottomWidth: 1,
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <Image source={logo} style={{ width: 50, height: 50 }} />

        <View style={{ marginLeft: 12 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: "#e8eefc",
            }}
          >
            Servo Dashboard
          </Text>

          <Text
            style={{
              color: deviceOnline ? "#34d399" : "#fb7185",
              fontSize: 12,
            }}
          >
            {deviceOnline ? "🟢 DEVICE ONLINE" : "🔴 DEVICE OFFLINE"}
          </Text>
        </View>
      </View>

      <FlatList
        data={servoData}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const status = getStatus(item.percent, item.online);

          const rotate = item.rot.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
          });

          return (
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 40,
                padding: 16,
                marginBottom: 25,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Animated.View
                    style={{
                      transform: [{ rotate }, { translateX: item.shake }],
                    }}
                  >
                    <MaterialCommunityIcons name="cogs" size={24} color="#5eead4" />
                  </Animated.View>

                  <Text
                    style={{
                      marginLeft: 10,
                      color: "#e8eefc",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    {item.name}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      color: status.color,
                      fontWeight: "700",
                      marginRight: 6,
                    }}
                  >
                    {status.label}
                  </Text>

                  <Animated.Text style={{ opacity: indicatorAnim[item.id - 1] }}>
                    {item.online ? "🟢" : "🔴"}
                  </Animated.Text>
                </View>
              </View>

              <Text style={{ color: "#aab7df", marginTop: 10 }}>
                {item.percent !== null ? `${item.percent}% Durability` : "Durability: —"}
              </Text>

              <View
                style={{
                  height: 10,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 999,
                  marginTop: 8,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${item.percent ?? 0}%`,
                    height: "100%",
                    backgroundColor: "#5eead4",
                  }}
                />
              </View>

              <Text
                style={{
                  color: "#aab7df",
                  marginTop: 8,
                  fontSize: 12,
                }}
              >
                Angle: {item.angle !== null ? `${item.angle}°` : "—"} •{" "}
                {item.online ? "Servo Online" : "Servo Offline"}
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

export default DevicesTab;