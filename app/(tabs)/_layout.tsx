import {Tabs} from "expo-router";
import HomeIcon from "@/assets/icons/home";
import StatisticsIcon from "@/assets/icons/statistics";
import GroupIcon from "@/assets/icons/group";

export default function TapLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#FF7F11',
                tabBarInactiveTintColor: '#696969',
                tabBarLabelStyle: {
                  fontFamily: "PretendardMedium",
                  fontSize: 10,
                },
                tabBarStyle: {
                    backgroundColor: '#1C1C1E',
                    height: 82,
                    paddingVertical: 26,
                    borderWidth: 0.36,
                    borderColor: '#545458',
                }
            }}
        >
            <Tabs.Screen
                name="statistics"
                options={{
                    tabBarIcon: ({color}) => <StatisticsIcon fill={color}/>,
                    tabBarLabel: '통계'
                }}
            />
            <Tabs.Screen
                name="home"
                options={{
                    tabBarIcon: ({color}) => <HomeIcon fill={color}/>,
                    tabBarLabel: '홈'
                }}
            />
            <Tabs.Screen
                name="group"
                options={{
                    tabBarIcon: ({color}) => <GroupIcon fill={color}/>,
                    tabBarLabel: '그룹'
                }}
            />
        </Tabs>
    )
}