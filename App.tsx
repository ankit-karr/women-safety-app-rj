// Imports React for creating the main app component.
import React from 'react';

// Imports navigation container that wraps the full app navigation.
import {NavigationContainer} from '@react-navigation/native';

// Imports native stack navigator creator.
import {createNativeStackNavigator} from '@react-navigation/native-stack';

// Imports Home screen component.
import HomeScreen from './src/screens/HomeScreen';

// Imports Notifications screen component.
import NotificationsScreen from './src/screens/NotificationsScreen';

// Imports Alert Details screen component.
import AlertDetailsScreen from './src/screens/AlertDetailsScreen';

// Imports SOS alert message type used in navigation params.
import {SosAlertMessage} from './src/types/contact.types';

// Defines all screen names and their navigation params.
export type RootStackParamList = {
  // Home screen does not need any params.
  Home: undefined;

  // Notifications screen does not need any params.
  Notifications: undefined;

  // AlertDetails screen needs one alert object as param.
  AlertDetails: {
    alert: SosAlertMessage;
  };
};

// Creates native stack navigator with typed route params.
const Stack = createNativeStackNavigator<RootStackParamList>();

// Main app component.
export default function App() {
  // Renders app navigation structure.
  return (
    <NavigationContainer>
      {/* Stack navigator contains all app screens. */}
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          // Header background color for all screens.
          headerStyle: {
            backgroundColor: '#050816',
          },

          // Header text and back button color.
          headerTintColor: '#ffffff',

          // Header title text style.
          headerTitleStyle: {
            fontWeight: '900',
          },

          // Screen content background color.
          contentStyle: {
            backgroundColor: '#050816',
          },
        }}>
        {/* Home screen route. */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Women Safety',
          }}
        />

        {/* Notifications screen route. */}
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            title: 'SOS Notifications',
          }}
        />

        {/* Alert details screen route. */}
        <Stack.Screen
          name="AlertDetails"
          component={AlertDetailsScreen}
          options={{
            title: 'SOS Alert Details',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}