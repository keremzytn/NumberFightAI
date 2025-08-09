import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import { MainMenuScreen } from '@/screens/MainMenuScreen';
import { GameScreen } from '@/screens/GameScreen';
import { GameResultScreen } from '@/screens/GameResultScreen';
import { GameState, AILevel } from '@/types/game';

type RootStackParamList = {
  MainMenu: undefined;
  GameScreen: {
    mode: 'singleplayer' | 'online' | 'friend';
    aiDifficulty?: AILevel;
    roomCode?: string;
  };
  GameResult: {
    gameState: GameState;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#2c3e50" />
      <Stack.Navigator
        initialRouteName="MainMenu"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2c3e50',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#ecf0f1',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          gestureEnabled: true,
          cardStyle: { backgroundColor: '#2c3e50' },
        }}
      >
        <Stack.Screen
          name="MainMenu"
          component={MainMenuScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="GameScreen"
          component={GameScreen}
          options={({ route }) => ({
            title: route.params.mode === 'singleplayer' 
              ? `vs AI (${route.params.aiDifficulty})` 
              : route.params.mode === 'online' 
              ? 'Online Match' 
              : 'Friend Match',
            headerBackTitleVisible: false,
            gestureEnabled: false, // Prevent back swipe during game
          })}
        />
        <Stack.Screen
          name="GameResult"
          component={GameResultScreen}
          options={{
            title: 'Game Result',
            headerBackTitleVisible: false,
            gestureEnabled: false,
            headerLeft: () => null, // Remove back button
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;