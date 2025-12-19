import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import StudentCoursesScreen from '../screens/StudentCoursesScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import StudentAttendanceReportScreen from '../screens/StudentAttendanceReportScreen';
import StudentSettingsScreen from '../screens/StudentSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CoursesStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentCourses" component={StudentCoursesScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="StudentAttendanceReport" component={StudentAttendanceReportScreen} />
    </Stack.Navigator>
  );
};

const StudentTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 15,
          paddingTop: 10,
          height: 80,
        },
        tabBarActiveTintColor: '#2196f3',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
      sceneContainerStyle={{
        flex: 1,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
          <Tab.Screen
            name="Courses"
            component={CoursesStack}
            options={{
              tabBarLabel: 'Courses',
              tabBarIcon: ({ color, size }) => (
                <Text style={{ fontSize: 20, color }}>📖</Text>
              ),
            }}
          />
      <Tab.Screen
        name="Settings"
        component={StudentSettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 20, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default StudentTabs;
