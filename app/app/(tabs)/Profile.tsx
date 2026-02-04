import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Image
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import loadingOverlay from "../components/LoadingOverlay";
import axiosInstance from "@/axiosConfig";
import Toast from "react-native-toast-message";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/images/logo.png";

const ProfileTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [personalData, setPersonalData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    contactNumber: "",
    emailAddress: "",
    address: ""
  });
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isPasswordValidateVisible, setIsPasswordValidateVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [nexRoute, setNextRoute] = useState<string>("");
  const { logout } = useAuth();

  useEffect(() => {
    setIsLoading(true);
    const reloadData = async () => {
      try {
        const response = await axiosInstance.get("/user/my-info", { withCredentials: true });
        if (!response.data.success) {
          Toast.show({
            type: 'error',
            text1: '❌ Error while retrieving your User Account!',
            text2: response.data.message
          });
          setPersonalData({
            firstName: "",
            lastName: "",
            middleName: "",
            contactNumber: "",
            emailAddress: "",
            address: ""
          });
        } else {
          const data = response.data.data[0];
          data._id = "";
          setPersonalData(data);
        }
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: '❌ Error while retrieving your User Account!',
          text2: error.message
        });
      }
    };

    reloadData();
    setIsLoading(false);
  }, []);

  const confirmLogout = async () => {
    setIsLogoutModalVisible(false);
    await logout();
    router.replace("/");
  };

  const confirmPasswordValidate = async () => {
    setIsPasswordValidateVisible(false);
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        "/user/validate-my-password",
        { password },
        { withCredentials: true }
      );

      if (!response.data.success) {
        Toast.show({
          type: 'error',
          text1: '❌ Wrong Password!',
          text2: response.data.message
        });
        setIsPasswordValidateVisible(true);
      } else {
        if (nexRoute) router.push(nexRoute);
        setPassword("");
        setNextRoute("");
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '❌ Error while validating password!',
        text2: error.message
      });
      setPassword("");
      setNextRoute("");
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {isLoading && loadingOverlay()}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View className="flex flex-row items-center gap-5 px-5 py-4 bg-black border-b border-yellow-600 pt-10">
          <Image source={logo} style={{ width: 50, height: 50 }} />
          <Text className="text-2xl font-extrabold text-yellow-500">
            Profile
          </Text>
        </View>

        {/* PROFILE CARD */}
        <View className="px-7 py-8 mx-5 my-5 bg-black border border-yellow-600 rounded-lg">
          {[
            ["Email", personalData.emailAddress],
            ["Name", `${personalData.lastName}, ${personalData.firstName} ${personalData.middleName}`],
            ["Contact#", personalData.contactNumber],
            ["Address", personalData.address],
          ].map(([label, value]) => (
            <View key={label} className="flex-row gap-4 my-2">
              <Text className="text-yellow-300 font-bold text-lg">{label}:</Text>
              <Text className="text-gray-200 text-lg flex-1">{value}</Text>
            </View>
          ))}

          {/* ACTION BUTTONS */}
          <View className="items-center gap-4 mt-8">
            <TouchableOpacity
              onPress={() => { setNextRoute("/UpdatePersonalInfo"); setIsPasswordValidateVisible(true); }}
              className="flex-row gap-2 bg-yellow-500 py-4 px-8 rounded-lg"
            >
              <MaterialIcons name="account-circle" size={28} color="black" />
              <Text className="text-black font-bold text-lg">
                Update Personal Info
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setNextRoute("/UpdatePassword"); setIsPasswordValidateVisible(true); }}
              className="flex-row gap-2 bg-yellow-500 py-4 px-8 rounded-lg"
            >
              <MaterialIcons name="lock" size={28} color="black" />
              <Text className="text-black font-bold text-lg">
                Change Password
              </Text>
            </TouchableOpacity>
          </View>

          {/* LOGOUT */}
          <View className="items-end mt-10">
            <TouchableOpacity
              onPress={() => setIsLogoutModalVisible(true)}
              className="flex-row gap-2 bg-zinc-700 py-4 px-8 rounded-lg"
            >
              <MaterialIcons name="logout" size={28} color="white" />
              <Text className="text-white font-semibold text-lg">
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* LOGOUT MODAL */}
      <Modal visible={isLogoutModalVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-zinc-900 border border-yellow-600 rounded-lg p-6 w-80">
            <Text className="text-lg font-bold text-yellow-500 text-center mb-4">
              Confirm Logout
            </Text>
            <Text className="text-gray-200 text-center mb-6">
              Are you sure you want to logout?
            </Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setIsLogoutModalVisible(false)}
                className="bg-zinc-700 py-2 px-4 rounded-lg"
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmLogout}
                className="bg-red-600 py-2 px-4 rounded-lg"
              >
                <Text className="text-white font-semibold">Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PASSWORD MODAL */}
      <Modal visible={isPasswordValidateVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-zinc-900 border border-yellow-600 rounded-lg p-6 w-80">
            <Text className="text-lg font-bold text-yellow-500 text-center mb-4">
              Verify Password
            </Text>

            <View className="flex-row mb-6">
              <View className="border border-yellow-600 rounded-l-lg px-3 justify-center">
                <MaterialIcons name="lock" size={26} color="#D4AF37" />
              </View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
                placeholderTextColor="#9CA3AF"
                className="flex-1 border border-yellow-600 border-l-0 rounded-r-lg px-4 text-gray-200"
              />
            </View>

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setIsPasswordValidateVisible(false)}
                className="bg-zinc-700 py-2 px-4 rounded-lg"
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmPasswordValidate}
                className="bg-yellow-500 py-2 px-4 rounded-lg"
              >
                <Text className="text-black font-bold">Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileTab;