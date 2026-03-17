import React, { useState, useEffect, useRef } from "react";
import { useIsFocused } from '@react-navigation/native';
import { View, Text, FlatList, Image, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import loadingOverlay from "../components/LoadingOverlay";
import axiosInstance from "@/axiosConfig";
import logo from "../../assets/images/logo.png";

const DevicesTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [servos, setServos] = useState([0, 0, 0]);
  const [servoStatus, setServoStatus] = useState([false, false, false]);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [deviceOnline, setDeviceOnline] = useState(false);

  const isFocused = useIsFocused();

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

  const startOnlinePulse = (anim) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  };

  const startOfflineBlink = (anim) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.1, duration: 300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ])
    ).start();
  };

  const startCriticalPulse = (anim) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.2, duration: 200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopIndicator = (anim) => {
    anim.stopAnimation();
    anim.setValue(1);
  };

  const startRotation = (anim) => {
    anim.setValue(0);
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopRotation = (anim) => {
    anim.stopAnimation();
    anim.setValue(0);
  };

  const startShake = (anim) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 5, duration: 100, useNativeDriver: true }),
        Animated.timing(anim, { toValue: -5, duration: 100, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopShake = (anim) => {
    anim.stopAnimation();
    anim.setValue(0);
  };

  // ✅ FIXED reloadData (ignore 502 errors)
  const reloadData = async () => {
    try {
      const response = await axiosInstance.get("/event/temp-summary");

      if (response?.data?.success && response.data.data.length > 0) {
        const latest = response.data.data[0];

        setLastUpdate(latest.lastUpdate);

        const newServos = latest.servos || [0, 0, 0];
        const newStatus = latest.servoStatus || [false, false, false];

        setServos(newServos);
        setServoStatus(newStatus);

        newServos.forEach((percent, i) => {
          const isOnline = newStatus[i];

          if (isOnline) startRotation(rotations[i]);
          else stopRotation(rotations[i]);

          if (isOnline && percent <= 30) startShake(shakes[i]);
          else stopShake(shakes[i]);

          stopIndicator(indicatorAnim[i]);

          if (!isOnline) {
            startOfflineBlink(indicatorAnim[i]);
          } else if (percent <= 30) {
            startCriticalPulse(indicatorAnim[i]);
          } else {
            startOnlinePulse(indicatorAnim[i]);
          }
        });
      }

    } catch (error) {
      // ❗ DO NOTHING (prevents flicker)
      console.log("API ERROR (ignored):", error.message);
    }
  };

  useEffect(() => {
    reloadData();

    const interval = setInterval(reloadData, 20000);

    return () => {
      clearInterval(interval);

      rotations.forEach(anim => anim.stopAnimation());
      shakes.forEach(anim => anim.stopAnimation());
      indicatorAnim.forEach(anim => anim.stopAnimation());
    };
  }, []);

  // ✅ FIXED threshold (40s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastUpdate) return;

      const now = Date.now();
      const diff = now - lastUpdate;

      if (diff > 40000) {
        setDeviceOnline(false);
      } else {
        setDeviceOnline(true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  // ✅ KEEP your offline override
  useEffect(() => {
    if (!deviceOnline) {
      setServos([0, 0, 0]);
      setServoStatus([false, false, false]);
    }
  }, [deviceOnline]);

  const getStatus = (percent, isOnline) => {
    if (!isOnline) return { label: "OFFLINE", color: "#9ca3af" };
    if (percent <= 30) return { label: "CRITICAL", color: "#fb7185" };
    if (percent <= 60) return { label: "WARNING", color: "#fbbf24" };
    return { label: "GOOD", color: "#34d399" };
  };

  const servoData = [
    { id: 1, name: "Servo A", percent: servos[0], online: deviceOnline ? servoStatus[0] : false, rot: rotations[0], shake: shakes[0] },
    { id: 2, name: "Servo B", percent: servos[1], online: deviceOnline ? servoStatus[1] : false, rot: rotations[1], shake: shakes[1] },
    { id: 3, name: "Servo C", percent: servos[2], online: deviceOnline ? servoStatus[2] : false, rot: rotations[2], shake: shakes[2] },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      {isLoading && loadingOverlay()}

      <View style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        padding: 20,
        paddingTop: 10,
        borderBottomWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
      }}>
        <Image source={logo} style={{ width: 50, height: 50 }} />

        <View style={{ marginLeft: 12 }}>
          <Text style={{
            fontSize: 22,
            fontWeight: "800",
            color: "#e8eefc",
          }}>
            Servo Dashboard
          </Text>

          <Text style={{
            color: deviceOnline ? "#34d399" : "#fb7185",
            fontSize: 12
          }}>
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
            <View style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 40,
              padding: 16,
              marginBottom: 25,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Animated.View style={{
                    transform: [
                      { rotate },
                      { translateX: item.shake }
                    ],
                  }}>
                    <MaterialCommunityIcons name="cogs" size={24} color="#5eead4" />
                  </Animated.View>

                  <Text style={{
                    marginLeft: 10,
                    color: "#e8eefc",
                    fontSize: 16,
                    fontWeight: "700",
                  }}>
                    {item.name}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{
                    color: status.color,
                    fontWeight: "700",
                    marginRight: 6,
                  }}>
                    {status.label}
                  </Text>

                  <Animated.Text style={{ opacity: indicatorAnim[item.id - 1] }}>
                    {item.online ? "🟢" : "🔴"}
                  </Animated.Text>
                </View>
              </View>

              <Text style={{ color: "#aab7df", marginTop: 10 }}>
                {item.percent}% Durability
              </Text>

              <View style={{
                height: 10,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 999,
                marginTop: 8,
                overflow: "hidden",
              }}>
                <View style={{
                  width: `${item.percent}%`,
                  height: "100%",
                  backgroundColor: "#5eead4",
                }} />
              </View>

              <Text style={{
                color: "#aab7df",
                marginTop: 8,
                fontSize: 12,
              }}>
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