import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import SuperAdminCoursesScreen from '../screens/SuperAdminCoursesScreen';
import SuperAdminSettingsScreen from '../screens/SuperAdminSettingsScreen';
import CourseManagementScreen from '../screens/CourseManagementScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import TeacherAttendanceReportScreen from '../screens/TeacherAttendanceReportScreen';
import IndividualStudentReportScreen from '../screens/IndividualStudentReportScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CoursesStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CourseManagement" component={CourseManagementScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="TeacherAttendanceReport" component={TeacherAttendanceReportScreen} />
      <Stack.Screen name="IndividualStudentReport" component={IndividualStudentReportScreen} />
    </Stack.Navigator>
  );
};

const SuperAdminTabs = () => {
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
        tabBarActiveTintColor: '#007AFF',
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
        name="UserManagement"
        component={UserManagementScreen}
        options={{
          tabBarLabel: 'Users',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 20, color }}>👥</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesStack}
        options={{
          tabBarLabel: 'Courses',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 20, color }}>📚</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SuperAdminSettingsScreen}
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

export default SuperAdminTabs;
