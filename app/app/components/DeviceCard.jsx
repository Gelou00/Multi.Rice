import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';

/* ================= Rice Level Converter =================
   Ultrasonic assumptions:
   FULL  = 5 cm
   EMPTY = 40 cm
========================================================= */
const cmToPercent = (cm, min = 5, max = 40) => {
  if (cm <= min) return 100;
  if (cm >= max) return 0;
  return Math.round(((max - cm) / (max - min)) * 100);
};

/* ================= Metric Card ================= */
const MetricCard = ({ title, value, unit, iconName }) => (
  <View className="w-1/2 p-2">
    <View className="flex-row items-center p-3 rounded-xl border border-yellow-600 bg-zinc-900">
      <MaterialCommunityIcons name={iconName} size={24} color="#D4AF37" />
      <View className="ml-3">
        <Text className="text-lg font-bold text-yellow-500">
          {value}{unit}
        </Text>
        <Text className="text-xs text-gray-300">{title}</Text>
      </View>
    </View>
  </View>
);

/* ================= Device Card ================= */
const DeviceCard = ({ device, pressEventHandler }) => {
  return (
    <TouchableOpacity
      className="bg-black mx-4 mt-4 p-4 rounded-xl border border-yellow-600"
      activeOpacity={0.85}
      onPress={() => pressEventHandler(device)}
    >
      {/* HEADER */}
      <View className="flex-row justify-between items-start pb-3 mb-3 border-b border-yellow-600">
        <View>
          <Text className="text-xl font-extrabold text-yellow-500">
            {device.deviceID}
          </Text>
          <Text className="text-xs text-gray-300">
            Last Update: {new Date(device.lastUpdate).toLocaleString()}
          </Text>
        </View>

        <Octicons
          name="dot-fill"
          size={26}
          color={device.isOnline ? '#22c55e' : '#ef4444'}
        />
      </View>

      {/* FIELD 1 */}
      <View className="mx-2 mt-2 border border-yellow-600 rounded-xl bg-black">
        <Text className="text-lg font-bold text-yellow-400 mx-3 my-2">
          Ultrasonic 1
        </Text>
        <View className="flex-row">
          <MetricCard
            title="Rice Level"
            value={cmToPercent(device.ultrasonic1)}
            unit="%"
            iconName="rice"
          />
        </View>
      </View>

      {/* FIELD 2 */}
      <View className="mx-2 mt-3 border border-yellow-600 rounded-xl bg-black">
        <Text className="text-lg font-bold text-yellow-400 mx-3 my-2">
          Ultrasonic 2
        </Text>
        <View className="flex-row">
          <MetricCard
            title="Rice Level"
            value={cmToPercent(device.ultrasonic2)}
            unit="%"
            iconName="rice"
          />
        </View>
      </View>

      {/* FIELD 3 */}
      <View className="mx-2 mt-3 border border-yellow-600 rounded-xl bg-black">
        <Text className="text-lg font-bold text-yellow-400 mx-3 my-2">
          Ultrasonic 3
        </Text>
        <View className="flex-row">
          <MetricCard
            title="Rice Level"
            value={cmToPercent(device.ultrasonic3)}
            unit="%"
            iconName="rice"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default DeviceCard;
