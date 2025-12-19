import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import StudentRegisterScreen from '../screens/StudentRegisterScreen';
import LoadingScreen from '../components/LoadingScreen';

// Tab Navigators
import SuperAdminTabs from './SuperAdminTabs';
import TeacherTabs from './TeacherTabs';
import StudentTabs from './StudentTabs';

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="StudentRegister" component={StudentRegisterScreen} />
  </Stack.Navigator>
);

const AppStack = () => {
  const { isSuperAdmin, isTeacher, isStudent } = useAuth();
  
  if (isSuperAdmin) {
    return <SuperAdminTabs />;
  } else if (isTeacher) {
    return <TeacherTabs />;
  } else if (isStudent) {
    return <StudentTabs />;
  }
  
  // Fallback to student tabs if role is not recognized
  return <StudentTabs />;
};

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
