import React, { useState, useEffect, useRef } from "react";
import { View, Text, SafeAreaView, Image, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axiosInstance from "../../axiosConfig.js";
import loadingOverlay from "../components/LoadingOverlay";
import logo from "../../assets/images/logo.png";
import { mapDeviceToUi, RawDeviceStatus } from "../../utils/deviceMapper";

type ContainerState = {
  id: number;
  name: string;
  percent: number | null;
  status: boolean;
};

const POLL_INTERVAL_MS = 3000;
const OFFLINE_TIMEOUT_MS = 8000;

const IrrigationDashboard = () => {
  const [isLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [deviceOnline, setDeviceOnline] = useState(false);

  const [containers, setContainers] = useState<ContainerState[]>([
    { id: 1, name: "Rice Container A", percent: null, status: false },
    { id: 2, name: "Rice Container B", percent: null, status: false },
    { id: 3, name: "Rice Container C", percent: null, status: false },
  ]);

  const bounce = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  const shake = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  const indicatorAnim = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];

  const bounceLoops = useRef<(Animated.CompositeAnimation | null)[]>([null, null, null]);
  const shakeLoops = useRef<(Animated.CompositeAnimation | null)[]>([null, null, null]);
  const indicatorLoops = useRef<(Animated.CompositeAnimation | null)[]>([null, null, null]);

  const toTimestamp = (value: any) => {
    if (!value) return 0;
    if (typeof value === "number") return value;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

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

  const startBounce = (anim: Animated.Value, index: number) => {
    bounceLoops.current[index]?.stop();
    anim.setValue(0);

    bounceLoops.current[index] = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: -5, duration: 300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ])
    );

    bounceLoops.current[index]?.start();
  };

  const stopBounce = (anim: Animated.Value, index: number) => {
    bounceLoops.current[index]?.stop();
    bounceLoops.current[index] = null;
    anim.stopAnimation();
    anim.setValue(0);
  };

  const startShake = (anim: Animated.Value, index: number) => {
    shakeLoops.current[index]?.stop();
    anim.setValue(0);

    shakeLoops.current[index] = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 6, duration: 80, useNativeDriver: true }),
        Animated.timing(anim, { toValue: -6, duration: 80, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 80, useNativeDriver: true }),
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

  const applyOfflineContainers = () => {
    setDeviceOnline(false);

    setContainers((prev) =>
      prev.map((item) => ({
        ...item,
        percent: null,
        status: false,
      }))
    );

    [0, 1, 2].forEach((i) => {
      stopBounce(bounce[i], i);
      stopShake(shake[i], i);
      startOfflineBlink(indicatorAnim[i], i);
    });
  };

  const getStatus = (percent: number | null, isOnline: boolean) => {
    if (!isOnline || percent === null) return { label: "OFFLINE", color: "#9ca3af" };
    if (percent <= 20) return { label: "CRITICAL", color: "#fb7185" };
    if (percent <= 50) return { label: "LOW", color: "#fbbf24" };
    return { label: "GOOD", color: "#34d399" };
  };

  const fetchData = async () => {
    try {
      const res = await axiosInstance.get("/event/temp-summary");

      if (!(res?.data?.success) || !Array.isArray(res.data.data) || res.data.data.length === 0) {
        applyOfflineContainers();
        return;
      }

      const latest = res.data.data[0];
      const latestTs = toTimestamp(latest.lastUpdate);

      setLastUpdate(latestTs);

      const isFresh = latestTs > 0 && Date.now() - latestTs <= OFFLINE_TIMEOUT_MS;

      if (!isFresh) {
        applyOfflineContainers();
        return;
      }

      setDeviceOnline(true);

      const latestContainers = Array.isArray(latest.containers)
        ? latest.containers
        : [null, null, null];

      const latestUltrasonicStatus = Array.isArray(latest.ultrasonicStatus)
        ? latest.ultrasonicStatus
        : [false, false, false];

      const updated: ContainerState[] = [0, 1, 2].map((i) => {
        const online = !!latestUltrasonicStatus[i];
        const rawPercent = latestContainers[i];

        return {
          id: i + 1,
          name: `Rice Container ${String.fromCharCode(65 + i)}`,
          percent: online ? Math.max(0, Math.min(100, Math.round(Number(rawPercent ?? 0)))) : null,
          status: online,
        };
      });

      updated.forEach((item, i) => {
        if (!item.status) {
          stopBounce(bounce[i], i);
          stopShake(shake[i], i);
          startOfflineBlink(indicatorAnim[i], i);
        } else {
          startBounce(bounce[i], i);

          if ((item.percent ?? 0) <= 20) {
            startShake(shake[i], i);
            startCriticalPulse(indicatorAnim[i], i);
          } else {
            stopShake(shake[i], i);
            startOnlinePulse(indicatorAnim[i], i);
          }
        }
      });

      setContainers(updated);
    } catch (err) {
      console.log("Home fetch error:", err);
      applyOfflineContainers();
    }
  };

  useEffect(() => {
    fetchData();

    const pollId = setInterval(fetchData, POLL_INTERVAL_MS);
    const staleCheckId = setInterval(() => {
      if (!lastUpdate) {
        applyOfflineContainers();
        return;
      }

      const diff = Date.now() - lastUpdate;
      if (diff > OFFLINE_TIMEOUT_MS) {
        applyOfflineContainers();
      }
    }, 1000);

    return () => {
      clearInterval(pollId);
      clearInterval(staleCheckId);

      bounce.forEach((anim, i) => stopBounce(anim, i));
      shake.forEach((anim, i) => stopShake(anim, i));
      indicatorAnim.forEach((anim, i) => stopIndicator(anim, i));
    };
  }, [lastUpdate]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      {isLoading && loadingOverlay()}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          padding: 20,
          paddingTop: 50,
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
            Multi Rice Dashboard
          </Text>

          <Text
            style={{
              color: deviceOnline ? "#34d399" : "#fb7185",
              fontSize: 12,
              marginTop: 4,
            }}
          >
            {deviceOnline ? "🟢 DEVICE ONLINE" : "🔴 DEVICE OFFLINE"}
          </Text>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        {containers.map((item, i) => {
          const status = getStatus(item.percent, item.status);

          return (
            <View
              key={item.id}
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 40,
                padding: 16,
                marginBottom: 25,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Animated.View
                    style={{
                      transform: [{ translateY: bounce[i] }, { translateX: shake[i] }],
                    }}
                  >
                    <MaterialCommunityIcons name="rice" size={24} color="#5eead4" />
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

                  <Animated.Text style={{ opacity: indicatorAnim[i] }}>
                    {item.status ? "🟢" : "🔴"}
                  </Animated.Text>
                </View>
              </View>

              <Text
                style={{
                  color: "#aab7df",
                  marginTop: 10,
                }}
              >
                {item.percent !== null ? `${item.percent}% remaining` : "—"}
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
                {item.status ? "Sensor Online" : "Sensor Offline"}
              </Text>
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

export const Home = IrrigationDashboard;
export default IrrigationDashboard;