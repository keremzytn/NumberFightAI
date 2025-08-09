import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AILevel } from '@/types/game';

type RootStackParamList = {
  MainMenu: undefined;
  GameScreen: {
    mode: 'singleplayer' | 'online' | 'friend';
    aiDifficulty?: AILevel;
    roomCode?: string;
  };
  GameResult: {
    gameState: any;
  };
};

type MainMenuNavigationProp = StackNavigationProp<RootStackParamList, 'MainMenu'>;

interface MainMenuScreenProps {
  navigation: MainMenuNavigationProp;
}

const { width, height } = Dimensions.get('window');

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({ navigation }) => {
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  const handleSinglePlayer = () => {
    setShowDifficultyModal(true);
  };

  const handleDifficultySelect = (difficulty: AILevel) => {
    setShowDifficultyModal(false);
    navigation.navigate('GameScreen', {
      mode: 'singleplayer',
      aiDifficulty: difficulty,
    });
  };

  const handleOnlinePlay = () => {
    // TODO: Implement matchmaking
    Alert.alert(
      'Online Play',
      'Searching for opponents...\n(Feature coming soon)',
      [{ text: 'OK' }]
    );
  };

  const handleFriendMatch = () => {
    setShowRoomModal(true);
  };

  const createRoom = () => {
    // TODO: Implement room creation
    Alert.alert(
      'Create Room',
      'Room created!\n(Feature coming soon)',
      [{ text: 'OK' }]
    );
    setShowRoomModal(false);
  };

  const joinRoom = () => {
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }
    // TODO: Implement room joining
    Alert.alert(
      'Join Room',
      `Joining room ${roomCode}...\n(Feature coming soon)`,
      [{ text: 'OK' }]
    );
    setShowRoomModal(false);
    setRoomCode('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Card Duel</Text>
        <Text style={styles.subtitle}>1-7</Text>
        <Text style={styles.description}>
          Strategic card battle game
        </Text>
      </View>

      {/* Game Mode Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.gameButton, styles.singlePlayerButton]}
          onPress={handleSinglePlayer}
          activeOpacity={0.8}
        >
          <View style={styles.buttonIcon}>
            <Text style={styles.buttonIconText}>🤖</Text>
          </View>
          <Text style={styles.buttonTitle}>Single Player</Text>
          <Text style={styles.buttonSubtitle}>Play against AI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gameButton, styles.onlineButton]}
          onPress={handleOnlinePlay}
          activeOpacity={0.8}
        >
          <View style={styles.buttonIcon}>
            <Text style={styles.buttonIconText}>🌐</Text>
          </View>
          <Text style={styles.buttonTitle}>Online Match</Text>
          <Text style={styles.buttonSubtitle}>Find random opponent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gameButton, styles.friendButton]}
          onPress={handleFriendMatch}
          activeOpacity={0.8}
        >
          <View style={styles.buttonIcon}>
            <Text style={styles.buttonIconText}>👥</Text>
          </View>
          <Text style={styles.buttonTitle}>Friend Match</Text>
          <Text style={styles.buttonSubtitle}>Play with friends</Text>
        </TouchableOpacity>
      </View>

      {/* Game Rules Summary */}
      <View style={styles.rulesContainer}>
        <Text style={styles.rulesTitle}>How to Play</Text>
        <Text style={styles.rulesText}>
          • Each player has cards 1-7{'\n'}
          • Higher card wins the round{'\n'}
          • Adjacent cards get locked{'\n'}
          • First to 4 points wins!
        </Text>
      </View>

      {/* Difficulty Selection Modal */}
      <Modal
        visible={showDifficultyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDifficultyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Difficulty</Text>
            
            <TouchableOpacity
              style={[styles.difficultyButton, styles.easyButton]}
              onPress={() => handleDifficultySelect('easy')}
            >
              <Text style={styles.difficultyTitle}>Easy</Text>
              <Text style={styles.difficultyDescription}>
                Random card selection
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.difficultyButton, styles.mediumButton]}
              onPress={() => handleDifficultySelect('medium')}
            >
              <Text style={styles.difficultyTitle}>Medium</Text>
              <Text style={styles.difficultyDescription}>
                Basic strategy, 30% mistakes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.difficultyButton, styles.hardButton]}
              onPress={() => handleDifficultySelect('hard')}
            >
              <Text style={styles.difficultyTitle}>Hard</Text>
              <Text style={styles.difficultyDescription}>
                Advanced AI strategy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDifficultyModal(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Room Modal */}
      <Modal
        visible={showRoomModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRoomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Friend Match</Text>
            
            <TouchableOpacity
              style={[styles.roomButton, styles.createRoomButton]}
              onPress={createRoom}
            >
              <Text style={styles.roomButtonText}>Create Room</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <Text style={styles.dividerText}>OR</Text>
            </View>

            <TouchableOpacity
              style={[styles.roomButton, styles.joinRoomButton]}
              onPress={joinRoom}
            >
              <Text style={styles.roomButtonText}>Join Room</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowRoomModal(false);
                setRoomCode('');
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: height * 0.05,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ecf0f1',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3498db',
    marginTop: -5,
  },
  description: {
    fontSize: 16,
    color: '#bdc3c7',
    marginTop: 10,
    textAlign: 'center',
  },
  buttonsContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  gameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34495e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  singlePlayerButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  onlineButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  friendButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
  },
  buttonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  buttonIconText: {
    fontSize: 24,
  },
  buttonTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#ecf0f1',
  },
  buttonSubtitle: {
    flex: 1,
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 2,
  },
  rulesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 20,
    padding: 20,
    borderRadius: 15,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ecf0f1',
    marginBottom: 10,
    textAlign: 'center',
  },
  rulesText: {
    fontSize: 14,
    color: '#bdc3c7',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#34495e',
    borderRadius: 20,
    padding: 30,
    width: width * 0.85,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginBottom: 25,
  },
  difficultyButton: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  easyButton: {
    backgroundColor: '#2ecc71',
  },
  mediumButton: {
    backgroundColor: '#f39c12',
  },
  hardButton: {
    backgroundColor: '#e74c3c',
  },
  difficultyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  difficultyDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  roomButton: {
    width: '100%',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  createRoomButton: {
    backgroundColor: '#3498db',
  },
  joinRoomButton: {
    backgroundColor: '#2ecc71',
  },
  roomButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  divider: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerText: {
    fontSize: 14,
    color: '#bdc3c7',
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 10,
    padding: 15,
  },
  cancelText: {
    fontSize: 16,
    color: '#bdc3c7',
    fontWeight: '600',
  },
});