import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function _Layout() {
  return (
    <Tabs 
        screenOptions={{
            tabBarShowLabel: false,
            tabBarItemStyle: { 
                width: '100%', 
                height: '100%', 
                justifyContent: 'center', 
                alignItems: 'center'
            },

            // ✅ UPDATED THEME
            tabBarStyle: {
                backgroundColor: 'rgba(255,255,255,0.05)', // glass effect
                paddingHorizontal: 20,
                paddingBottom: 20,
                paddingTop: 10,
                height: 70,
                position: "absolute",
                overflow: "hidden",
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)', // soft border
                borderRadius: 20,
                marginHorizontal: 10,
                marginBottom: 10,
            },

            tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '600'
            },

            // ✅ MATCH HOME COLORS
            tabBarActiveTintColor: '#5eead4', // cyan accent
            tabBarInactiveTintColor: '#aab7df', // muted text
        }}
    >

        <Tabs.Screen 
            name="Home"
            options={{
                title: 'Home',
                headerShown: false,
                tabBarIcon: ({focused})=>(
                    <MaterialIcons 
                        name={"home"} 
                        size={30} 
                        color={focused ? "#5eead4" : "#aab7df"} 
                    />
                )
            }}
        />

        <Tabs.Screen 
            name="Devices"
            options={{
                title: 'Devices',
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                    <MaterialCommunityIcons
                        name="cog"
                        size={30}
                        color={focused ? "#5eead4" : "#aab7df"}
                    />
                )
            }}
        />

        <Tabs.Screen 
            name="Log"
            options={{
                title: 'Log',
                headerShown: false,
                tabBarIcon: ({focused})=>(
                    <MaterialIcons 
                        name={"edit-document"} 
                        size={30} 
                        color={focused ? "#5eead4" : "#aab7df"} 
                    />
                )
            }}
        />

        <Tabs.Screen 
            name="Profile"
            options={{
                title: 'Profile',
                headerShown: false,
                tabBarIcon: ({focused})=>(
                    <MaterialIcons 
                        name={"manage-accounts"} 
                        size={30} 
                        color={focused ? "#5eead4" : "#aab7df"} 
                    />
                )
            }}
        />
        
    </Tabs>
  );
}