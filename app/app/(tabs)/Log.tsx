import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import axiosInstance from "@/axiosConfig";
import loadingOverlay from "../components/LoadingOverlay";
import logo from "../../assets/images/logo.png";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "expo-router";

/* =========================
   TABLE COLUMN WIDTHS
========================= */
const COL_DATE = 140;
const COL_DEVICE = 140;
const COL_US = 140;

/* =========================
   TABLE HEADER
========================= */
const renderTableHeading = () => (
  <View className="flex-row bg-zinc-900 border-b border-yellow-600">
    <Text style={{ width: COL_DATE }} className="py-3 text-center text-yellow-400 text-xs font-bold">
      Date
    </Text>
    <Text style={{ width: COL_DEVICE }} className="py-3 text-center text-yellow-400 text-xs font-bold">
      Device ID
    </Text>
    <Text style={{ width: COL_US }} className="py-3 text-center text-yellow-400 text-xs font-bold">
      Ultrasonic 1
    </Text>
    <Text style={{ width: COL_US }} className="py-3 text-center text-yellow-400 text-xs font-bold">
      Ultrasonic 2
    </Text>
    <Text style={{ width: COL_US }} className="py-3 text-center text-yellow-400 text-xs font-bold">
      Ultrasonic 3
    </Text>
  </View>
);

/* =========================
   TABLE ROW
========================= */
const renderTableData = ({ item }) => {
  if (!item) return null;

  return (
    <View className="flex-row border-b border-zinc-700 bg-black">
      <Text style={{ width: COL_DATE }} className="py-2 text-xs text-center text-gray-200">
        {new Date(item.eventDate).toLocaleDateString()}
      </Text>
      <Text style={{ width: COL_DEVICE }} className="py-2 text-xs text-center text-gray-200">
        {item.device?.deviceID ?? "-"}
      </Text>
      <Text style={{ width: COL_US }} className="py-2 text-xs text-center text-gray-200">
        {item.ultrasonic1}
      </Text>
      <Text style={{ width: COL_US }} className="py-2 text-xs text-center text-gray-200">
        {item.ultrasonic2}
      </Text>
      <Text style={{ width: COL_US }} className="py-2 text-xs text-center text-gray-200">
        {item.ultrasonic3}
      </Text>
    </View>
  );
};

const ProfileTab = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [deviceIDs, setDeviceIDs] = useState([]);
  const [selectedDeviceID, setSelectedDeviceID] = useState("");
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showStartDateSelection, setShowStartDateSelection] = useState(false);
  const [showEndDateSelection, setShowEndDateSelection] = useState(false);

  /* =========================
     LOAD DEVICES
  ========================= */
  const reloadDevices = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(
        "/device/get-my-devices",
        { withCredentials: true }
      );

      if (!response.data.success) {
        setDeviceIDs([]);
        Toast.show({
          type: "error",
          text1: "❌ Error retrieving devices!",
          text2: response.data.message
        });
      } else {
        setDeviceIDs(response.data.data.map(d => d.deviceID));
      }
    } catch (error) {
      setDeviceIDs([]);
      Toast.show({
        type: "error",
        text1: "❌ Error retrieving devices!",
        text2: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      reloadDevices();
    }, [])
  );

  const changeStartDate = (event) => {
    setStartDate(new Date(event.nativeEvent.timestamp));
    setShowStartDateSelection(false);
  };

  const changeEndDate = (event) => {
    setEndDate(new Date(event.nativeEvent.timestamp));
    setShowEndDateSelection(false);
  };

  const searchEvents = async () => {
    setData([]);
    setIsLoading(true);

    try {
      const requestData = { startDate, endDate };
      if (selectedDeviceID) requestData.deviceID = selectedDeviceID;

      const response = await axiosInstance.post(
        "/event/sensor-records",
        requestData,
        { withCredentials: true }
      );

      if (!response.data.success) {
        setData([]);
        Toast.show({
          type: "error",
          text1: "❌ Error retrieving records!",
          text2: response.data.message
        });
      } else {
        setData(response.data.data);
      }
    } catch (error) {
      setData([]);
      Toast.show({
        type: "error",
        text1: "❌ Error retrieving records!",
        text2: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {isLoading && loadingOverlay()}

      {/* HEADER */}
      <View className="flex flex-row items-center gap-5 px-5 py-4 bg-black border-b border-yellow-600 pt-10">
        <Image source={logo} style={{ width: 50, height: 50 }} />
        <Text className="text-2xl font-extrabold text-yellow-500">
          Logs
        </Text>
      </View>

      {/* FILTERS */}
      <View className="px-6 py-4 mx-5 my-5 bg-black border border-yellow-600 rounded-lg">

        {/* DEVICE PICKER */}
        <View className="flex-row h-20 items-center gap-4">
          <Text className="text-gray-200">Devices:</Text>
          <View className="flex-1 border border-yellow-600 rounded-xl">
            <Picker
              selectedValue={selectedDeviceID}
              onValueChange={setSelectedDeviceID}
              dropdownIconColor="#D4AF37"
            >
              <Picker.Item label="All" value="" />
              {deviceIDs.map(id => (
                <Picker.Item key={id} label={id} value={id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* DATE PICKERS */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-gray-200">Start Date</Text>
            <TouchableOpacity
              onPress={() => setShowStartDateSelection(true)}
              className="border border-yellow-600 rounded-xl p-4 flex-row justify-between"
            >
              <Text className="text-gray-200">
                {startDate.toLocaleDateString()}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={25} color="#D4AF37" />
            </TouchableOpacity>
            {showStartDateSelection && (
              <DateTimePicker value={startDate} mode="date" onChange={changeStartDate} />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-gray-200">End Date</Text>
            <TouchableOpacity
              onPress={() => setShowEndDateSelection(true)}
              className="border border-yellow-600 rounded-xl p-4 flex-row justify-between"
            >
              <Text className="text-gray-200">
                {endDate.toLocaleDateString()}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={25} color="#D4AF37" />
            </TouchableOpacity>
            {showEndDateSelection && (
              <DateTimePicker
                value={endDate}
                mode="date"
                minimumDate={startDate}
                onChange={changeEndDate}
              />
            )}
          </View>
        </View>

        {/* SEARCH */}
        <View className="mx-10 my-5">
          <TouchableOpacity
            onPress={searchEvents}
            className="bg-yellow-500 py-3 rounded-lg"
          >
            <Text className="text-center text-black font-bold">
              Search
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TABLE */}
      {data.length > 0 && (
        <ScrollView horizontal className="mx-2 bg-black border border-yellow-600 rounded-lg">
          <FlatList
            data={data}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={renderTableHeading}
            renderItem={renderTableData}
            stickyHeaderIndices={[0]}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ProfileTab;