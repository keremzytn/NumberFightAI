import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';

interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  statistics: {
    totalGames: number;
    wins: number;
    winRate: number;
  };
}

const MainMenuScreen: React.FC = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await ApiService.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Navigate to login if profile fetch fails
      navigation.navigate('Login' as never);
    } finally {
      setLoading(false);
    }
  };

  const startAIGame = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
    Alert.alert(
      `Start ${difficulty} AI Game`,
      `Are you ready to play against ${difficulty} AI?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Game',
          onPress: async () => {
            try {
              const gameState = await ApiService.startMatch('AI', difficulty);
              navigation.navigate('Game' as never, { gameState } as never);
            } catch (error) {
              Alert.alert('Error', 'Failed to start game');
            }
          },
        },
      ]
    );
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    navigation.navigate('Login' as never);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: user?.avatar || 'https://via.placeholder.com/50' }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>{user?.username}</Text>
            <Text style={styles.stats}>
              {user?.statistics.totalGames} games • {(user?.statistics.winRate * 100).toFixed(1)}% win rate
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile' as never)} style={styles.profileButton}>
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Game Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.gameTitle}>Card Battle</Text>
        <Text style={styles.gameSubtitle}>Strategic Card Game</Text>
      </View>

      {/* Menu Options */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Play Against AI</Text>
        
        <TouchableOpacity
          style={[styles.menuButton, styles.easyButton]}
          onPress={() => startAIGame('Easy')}
        >
          <Text style={styles.menuButtonText}>Easy AI</Text>
          <Text style={styles.menuButtonSubtext}>Random moves</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, styles.mediumButton]}
          onPress={() => startAIGame('Medium')}
        >
          <Text style={styles.menuButtonText}>Medium AI</Text>
          <Text style={styles.menuButtonSubtext}>Pattern recognition</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, styles.hardButton]}
          onPress={() => startAIGame('Hard')}
        >
          <Text style={styles.menuButtonText}>Hard AI</Text>
          <Text style={styles.menuButtonSubtext}>Strategic play</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, styles.friendsButton]}
          onPress={() => navigation.navigate('Friends' as never)}
        >
          <Text style={styles.menuButtonText}>Play with Friends</Text>
          <Text style={styles.menuButtonSubtext}>Coming soon</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, styles.historyButton]}
          onPress={() => navigation.navigate('History' as never)}
        >
          <Text style={styles.menuButtonText}>Match History</Text>
          <Text style={styles.menuButtonSubtext}>View past games</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stats: {
    fontSize: 14,
    color: '#666',
  },
  profileButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  profileButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
    padding: 30,
  },
  gameTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  gameSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  menuButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  menuButtonSubtext: {
    fontSize: 14,
    color: '#666',
  },
  easyButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  mediumButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  hardButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  friendsButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  historyButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#607D8B',
  },
  footer: {
    padding: 20,
  },
  logoutButton: {
    alignItems: 'center',
    padding: 15,
  },
  logoutText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
});

export default MainMenuScreen;