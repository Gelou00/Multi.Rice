import { BackHandler, ScrollView } from "react-native";
import { useFocusEffect } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, Dimensions, Image } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axiosInstance from "../../axiosConfig.js";
import loadingOverlay from "../components/LoadingOverlay";
import logo from "../../assets/images/logo.png";

/* ✅ UPDATED: PH TIME + 12-HOUR FORMAT */
const formatDateTime = (timestamp) => {
  if (!timestamp) return "No Data";

  const date = new Date(timestamp);

  const formatted = date.toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  // convert "MM/DD/YY, HH:MM AM" → "MM-DD-YY HH:MM AM"
  return formatted.replace(",", "").replace(/\//g, "-");
};

const IrrigationDashboard = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [width, setWidth] = useState(0);

  const [lastUpdate, setLastUpdate] = useState(null);

  const screenWidth = Dimensions.get("window").width;

  const [containers, setContainers] = useState([
    { id: 1, name: "Rice Container A", percent: 0 },
    { id: 2, name: "Rice Container B", percent: 0 },
    { id: 3, name: "Rice Container C", percent: 0 },
  ]);

  const getStatus = (percent) => {
    if (percent <= 20) return { label: "EMPTY", color: "text-red-500" };
    if (percent <= 50) return { label: "LOW", color: "text-yellow-400" };
    return { label: "GOOD", color: "text-green-400" };
  };

  useEffect(() => {
    setIsLoading(true);

    const func = async () => {
      try {
        const response = await axiosInstance.get("/event/temp-summary", { withCredentials: true });

        if (!response.data.success) {
          setData([]);
        } else {
          setData(response.data.data);

          const latest = response.data.data?.[0]?.lastUpdate || Date.now();
          setLastUpdate(latest);
        }
      } catch (error) {
        console.error("Data retrieval error:", error.message);
      }
    };

    func();
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await axiosInstance.get("/event/temp-summary", { withCredentials: true });

        if (response.data.success) {
          setData(response.data.data);

          const latest = response.data.data?.[0]?.lastUpdate || Date.now();
          setLastUpdate(latest);
        }
      } catch (err) {
        console.log(err);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => true
      );
      return () => subscription.remove();
    }, [])
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      {isLoading && loadingOverlay()}

      <View className="flex flex-row items-center gap-5 px-5 py-4 bg-black border-b border-yellow-600 pt-10">
        <Image source={logo} style={{ width: 50, height: 50 }} />
        <Text className="text-2xl font-extrabold text-yellow-500">
         Container Level
        </Text>
      </View>

      <View
        className="flex flex-col py-6 mx-5 my-5 bg-black border border-yellow-600 rounded-lg"
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        <View className="px-5 mb-3">
          <Text className="text-yellow-500 text-2xl font-extrabold">
            Rice Availability Dashboard
          </Text>
          <Text className="font-bold text-gray-200 mt-1">
            Monitor rice levels for community distribution
          </Text>

          {/* ✅ NOW 12-HOUR FORMAT */}
          <Text className="font-bold text-gray-200 text-sm mt-1">
            Last updated: {formatDateTime(lastUpdate)}
          </Text>
        </View>

        <View className="w-full px-5 mt-4">
          {containers.map((item) => {
            const status = getStatus(item.percent);

            return (
              <View
                key={item.id}
                className="bg-zinc-900 rounded-lg p-4 mb-4 border border-yellow-600"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center gap-2">
                    <MaterialCommunityIcons
                      name="rice"
                      size={24}
                      color="#D4AF37"
                    />
                    <Text className="text-lg font-semibold text-yellow-300">
                      {item.name}
                    </Text>
                  </View>

                  <Text className={`text-sm font-bold ${status.color}`}>
                    {status.label}
                  </Text>
                </View>

                <Text className="text-yellow-500 font-bold mb-2">
                  {item.percent}% remaining
                </Text>

                <View className="w-full h-4 bg-zinc-700 rounded-full overflow-hidden">
                  <View
                    style={{ width: `${item.percent}%` }}
                    className="h-full bg-yellow-500 rounded-full"
                  />
                </View>

                <Text className="text-gray-200 text-sm mt-2">
                  {item.percent <= 20
                    ? "Immediate refill required"
                    : item.percent <= 50
                    ? "Plan refill soon"
                    : "Sufficient rice available"}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default IrrigationDashboard;