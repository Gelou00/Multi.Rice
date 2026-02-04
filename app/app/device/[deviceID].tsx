import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import {
  MaterialCommunityIcons,
  MaterialIcons,
  AntDesign,
  Octicons,
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import axiosInstance from "@/axiosConfig";
import Toast from "react-native-toast-message";
import loadingOverlay from "../components/LoadingOverlay";

/* ================= Rice Level Converter ================= */
const cmToPercent = (cm, min = 5, max = 40) => {
  if (cm <= min) return 100;
  if (cm >= max) return 0;
  return Math.round(((max - cm) / (max - min)) * 100);
};

/* ================= Metric Card ================= */
const MetricCard = ({ title, value, unit, iconName, color }) => (
  <View className="w-1/2 p-2">
    <View className={`flex-row items-center p-3 rounded-xl border border-gray-100 ${color}`}>
      <MaterialCommunityIcons name={iconName} size={24} color="#374151" />
      <View className="ml-3">
        <Text className="text-lg font-bold text-gray-800">
          {value}{unit}
        </Text>
        <Text className="text-xs text-gray-500">{title}</Text>
      </View>
    </View>
  </View>
);

const DeviceDetails = () => {
  const { deviceID } = useLocalSearchParams();
  const [device, setDevice] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newDeviceID, setNewDeviceID] = useState("");

  // ✅ store stable ID once loaded
  const deviceObjectId = useRef(null);

  useEffect(() => {
    reloadData();
    const interval = setInterval(reloadData, 20000);
    return () => clearInterval(interval);
  }, []);

  const reloadData = async () => {
    try {
      setIsLoading(true);

      // ✅ if device already loaded, reload by _id (SAFE)
      const endpoint = deviceObjectId.current
        ? `/device/get-by-id/${deviceObjectId.current}`
        : `/device/get-a-device/${deviceID}`;

      const response = await axiosInstance.get(endpoint, {
        withCredentials: true,
      });

      if (!response.data.success || !response.data.data?.length) return;

      const fetchedDevice = response.data.data[0];
      deviceObjectId.current = fetchedDevice._id;
      setDevice(fetchedDevice);

    } catch (error) {
      Toast.show({
        type: "error",
        text1: "❌ Error loading device",
        text2: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmRenamePress = async () => {
    try {
      setIsLoading(true);

      const response = await axiosInstance.put(
        `/device/update/${device._id}`,
        { deviceID: newDeviceID },
        { withCredentials: true }
      );

      if (!response.data.success) {
        Toast.show({
          type: "error",
          text1: "❌ Update failed",
          text2: response.data.message,
        });
        return;
      }

      // ✅ update locally, DO NOT refetch by URL param
      const updatedDevice = response.data.data[0];
      deviceObjectId.current = updatedDevice._id;
      setDevice(updatedDevice);
      setNewDeviceID("");
      setShowRenameModal(false);

      Toast.show({
        type: "success",
        text1: "✅ Device ID updated",
      });

    } catch (error) {
      Toast.show({
        type: "error",
        text1: "❌ Error updating device",
        text2: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {isLoading && loadingOverlay()}

      {Object.keys(device).length > 0 && (
        <View className="bg-white mx-4 mt-4 p-4 rounded-xl shadow-md border border-gray-100">
          {/* HEADER */}
          <View className="flex-row justify-between items-start pb-3 mb-3 border-b border-gray-100">
            <View>
              <Text className="text-2xl font-extrabold text-gray-900">
                {device.deviceID}
              </Text>
              <Text className="text-xs text-gray-500">
                Last Update: {new Date(device.lastUpdate).toLocaleString()}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <Octicons
                name="dot-fill"
                size={28}
                color={device.isOnline ? "green" : "red"}
              />
              <TouchableOpacity
                onPress={() => setShowRenameModal(true)}
                className="bg-blue-600 p-2 rounded-lg"
              >
                <MaterialIcons name="edit" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* FIELD 1 */}
          <View className="mx-2 mt-2 border border-gray-200 rounded-xl">
            <Text className="text-lg font-bold text-gray-900 mx-3 my-2">
              Field 1
            </Text>
            <View className="flex-row">
              <MetricCard
                title="Rice Level"
                value={cmToPercent(device.ultrasonic1)}
                unit="%"
                iconName="sack"
                color="bg-cyan-50"
              />
            </View>
          </View>

          {/* FIELD 2 */}
          <View className="mx-2 mt-3 border border-gray-200 rounded-xl">
            <Text className="text-lg font-bold text-gray-900 mx-3 my-2">
              Field 2
            </Text>
            <View className="flex-row">
              <MetricCard
                title="Rice Level"
                value={cmToPercent(device.ultrasonic2)}
                unit="%"
                iconName="sack"
                color="bg-cyan-50"
              />
            </View>
          </View>

          {/* FIELD 3 */}
          <View className="mx-2 mt-3 border border-gray-200 rounded-xl">
            <Text className="text-lg font-bold text-gray-900 mx-3 my-2">
              Field 3
            </Text>
            <View className="flex-row">
              <MetricCard
                title="Rice Level"
                value={cmToPercent(device.ultrasonic3)}
                unit="%"
                iconName="sack"
                color="bg-cyan-50"
              />
            </View>
          </View>
        </View>
      )}

      {/* RENAME MODAL */}
      <Modal transparent visible={showRenameModal} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/40">
          <View className="bg-white rounded-lg p-6 w-80">
            <Text className="text-lg font-bold text-center mb-4">
              New Device ID
            </Text>

            <View className="flex-row mb-6">
              <View className="border border-gray-300 rounded-l-lg justify-center px-2">
                <AntDesign name="barcode" size={26} color="green" />
              </View>
              <TextInput
                value={newDeviceID}
                onChangeText={setNewDeviceID}
                placeholder="Device ID"
                className="flex-1 border border-gray-300 border-l-0 rounded-r-lg px-3"
              />
            </View>

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setShowRenameModal(false)}
                className="bg-gray-300 px-4 py-2 rounded-lg"
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmRenamePress}
                className="bg-blue-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DeviceDetails;
