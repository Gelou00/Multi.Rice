import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';

/* ================= DATE FORMAT FIX (PH TIME + 12H) ================= */
const formatDate = (timestamp) => {
  if (!timestamp || timestamp === 0) return "No Data";

  const date = new Date(timestamp);

  if (isNaN(date)) return "Invalid Date";

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

/* ================= Rice Level Converter ================= */
const cmToPercent = (cm, min = 5, max = 40) => {
  if (cm <= min) return 100;
  if (cm >= max) return 0;
  return Math.round(((max - cm) / (max - min)) * 100);
};

const MetricCard = ({ title, value, unit, iconName }) => {
  const percentage = isNaN(value) ? 0 : value;

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const getColor = (val) => {
    if (val > 70) return '#22c55e';
    if (val > 40) return '#eab308';
    return '#ef4444';
  };

  const barColor = getColor(percentage);

  return (
    <View className="w-full p-2">
      <View className="p-3 rounded-xl border border-yellow-600 bg-zinc-900">

        <View className="flex-row items-center mb-2">
          <MaterialCommunityIcons name={iconName} size={22} color="#D4AF37" />
          <Text className="ml-2 text-sm text-gray-300">{title}</Text>
        </View>

        <Text className="text-lg font-bold mb-2" style={{ color: barColor }}>
          {percentage}{unit}
        </Text>

        <View className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
          <Animated.View
            style={{
              width,
              height: '100%',
              backgroundColor: barColor,
            }}
          />
        </View>
      </View>
    </View>
  );
};

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
            Last Update: {formatDate(device.lastUpdate)}
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
          Servo 1
        </Text>
        <View className="flex-row">
          <MetricCard
            title="Durability"
            value={cmToPercent(device.servo1)}
            unit="%"
            iconName="cog"
          />
        </View>
      </View>

      {/* FIELD 2 */}
      <View className="mx-2 mt-3 border border-yellow-600 rounded-xl bg-black">
        <Text className="text-lg font-bold text-yellow-400 mx-3 my-2">
          Servo 2
        </Text>
        <View className="flex-row">
          <MetricCard
            title="Durability"
            value={cmToPercent(device.servo2)}
            unit="%"
            iconName="cog"
          />
        </View>
      </View>

      {/* FIELD 3 */}
      <View className="mx-2 mt-3 border border-yellow-600 rounded-xl bg-black">
        <Text className="text-lg font-bold text-yellow-400 mx-3 my-2">
          Servo 3
        </Text>
        <View className="flex-row">
          <MetricCard
            title="Durability"
            value={cmToPercent(device.servo3)}
            unit="%"
            iconName="cog"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default DeviceCard;