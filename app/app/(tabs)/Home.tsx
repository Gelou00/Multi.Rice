import { BackHandler } from "react-native";
import { useFocusEffect } from "expo-router";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, SafeAreaView, Image, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axiosInstance from "../../axiosConfig.js";
import loadingOverlay from "../components/LoadingOverlay";
import logo from "../../assets/images/logo.png";

const IrrigationDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const [containers, setContainers] = useState([
    { id: 1, name: "Rice Container A", percent: 0, status: false },
    { id: 2, name: "Rice Container B", percent: 0, status: false },
    { id: 3, name: "Rice Container C", percent: 0, status: false },
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

  const startBounce = (anim) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: -5, duration: 300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopBounce = (anim) => {
    anim.stopAnimation();
    anim.setValue(0);
  };

  const startShake = (anim) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 6, duration: 80, useNativeDriver: true }),
        Animated.timing(anim, { toValue: -6, duration: 80, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopShake = (anim) => {
    anim.stopAnimation();
    anim.setValue(0);
  };

  const getStatus = (percent, isOnline) => {
    if (!isOnline) return { label: "OFFLINE", color: "#9ca3af" };
    if (percent <= 20) return { label: "CRITICAL", color: "#fb7185" };
    if (percent <= 50) return { label: "LOW", color: "#fbbf24" };
    return { label: "GOOD", color: "#34d399" };
  };

  const fetchData = async () => {
    try {
      const res = await axiosInstance.get("/event/temp-summary");

      if (res.data.success) {
        const latest = res.data.data[0];

        setLastUpdate(latest.lastUpdate);

        const updated = containers.map((item, i) => {
          const percent = Math.round(latest.containers[i] || 0);
          const isOnline = latest.ultrasonicStatus[i] || false;

          if (!isOnline) {
            stopBounce(bounce[i]);
            stopShake(shake[i]);
          } else {
            startBounce(bounce[i]);
            if (percent <= 20) startShake(shake[i]);
            else stopShake(shake[i]);
          }

          stopIndicator(indicatorAnim[i]);

          if (!isOnline) startOfflineBlink(indicatorAnim[i]);
          else if (percent <= 20) startCriticalPulse(indicatorAnim[i]);
          else startOnlinePulse(indicatorAnim[i]);

          return { ...item, percent, status: isOnline };
        });

        setContainers(updated);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(useCallback(() => {}, []));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      {isLoading && loadingOverlay()}

      {/* HEADER */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        padding: 20,
         paddingTop: 50,
        borderBottomWidth: 1,
        borderColor: "rgba(255,255,255,0.1)"
      }}>
        <Image source={logo} style={{ width: 50, height: 50 }} />
        <Text style={{
          fontSize: 22,
          fontWeight: "800",
          color: "#e8eefc",
          marginLeft: 12
        }}>
          Multi Rice Dashboard
        </Text>
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
                borderColor: "rgba(255,255,255,0.1)"
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>

                {/* LEFT */}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Animated.View
                    style={{
                      transform: [
                        { translateY: bounce[i] },
                        { translateX: shake[i] }
                      ]
                    }}
                  >
                    <MaterialCommunityIcons name="rice" size={24} color="#5eead4" />
                  </Animated.View>

                  <Text style={{
                    marginLeft: 10,
                    color: "#e8eefc",
                    fontSize: 16,
                    fontWeight: "700"
                  }}>
                    {item.name}
                  </Text>
                </View>

                {/* RIGHT */}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{
                    color: status.color,
                    fontWeight: "700",
                    marginRight: 6
                  }}>
                    {status.label}
                  </Text>

                  <Animated.Text style={{ opacity: indicatorAnim[i] }}>
                    {item.status ? "🟢" : "🔴"}
                  </Animated.Text>
                </View>
              </View>

              <Text style={{
                color: "#aab7df",
                marginTop: 10
              }}>
                {item.percent}% remaining
              </Text>

              {/* PROGRESS BAR */}
              <View style={{
                height: 10,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 999,
                marginTop: 8,
                overflow: "hidden"
              }}>
                <View
                  style={{
                    width: `${item.percent}%`,
                    height: "100%",
                    backgroundColor: "#5eead4"
                  }}
                />
              </View>

              <Text style={{
                color: "#aab7df",
                marginTop: 8,
                fontSize: 12
              }}>
                {item.status ? "Sensor Online" : "Sensor Offline"}
              </Text>
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

export default IrrigationDashboard;