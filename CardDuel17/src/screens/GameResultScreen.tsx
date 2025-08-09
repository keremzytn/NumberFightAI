import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  ScrollView,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GameState, Card as CardType } from '@/types/game';

type RootStackParamList = {
  MainMenu: undefined;
  GameScreen: {
    mode: 'singleplayer' | 'online' | 'friend';
    aiDifficulty?: string;
    roomCode?: string;
  };
  GameResult: {
    gameState: GameState;
  };
};

type GameResultRouteProp = RouteProp<RootStackParamList, 'GameResult'>;
type GameResultNavigationProp = StackNavigationProp<RootStackParamList, 'GameResult'>;

interface GameResultScreenProps {
  route: GameResultRouteProp;
  navigation: GameResultNavigationProp;
}

const { width, height } = Dimensions.get('window');

export const GameResultScreen: React.FC<GameResultScreenProps> = ({ route, navigation }) => {
  const { gameState } = route.params;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const [player1, player2] = gameState.players;
  const isPlayerWinner = gameState.winner === player1.id;
  const isTie = !gameState.winner;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getResultTitle = () => {
    if (isTie) return 'It\'s a Tie!';
    if (isPlayerWinner) return 'You Win!';
    return 'You Lose!';
  };

  const getResultColor = () => {
    if (isTie) return '#f39c12';
    if (isPlayerWinner) return '#2ecc71';
    return '#e74c3c';
  };

  const getResultEmoji = () => {
    if (isTie) return '🤝';
    if (isPlayerWinner) return '🎉';
    return '😔';
  };

  const playAgain = () => {
    navigation.navigate('GameScreen', {
      mode: gameState.mode,
      aiDifficulty: player2.difficulty,
    });
  };

  const goToMainMenu = () => {
    navigation.navigate('MainMenu');
  };

  const calculateGameStats = () => {
    const totalRounds = gameState.roundHistory.length;
    const playerWins = gameState.roundHistory.filter(round => round.winner === 'player1').length;
    const opponentWins = gameState.roundHistory.filter(round => round.winner === 'player2').length;
    const ties = gameState.roundHistory.filter(round => round.winner === 'tie').length;

    return { totalRounds, playerWins, opponentWins, ties };
  };

  const stats = calculateGameStats();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* Result Header */}
        <View style={[styles.resultHeader, { backgroundColor: getResultColor() }]}>
          <Text style={styles.resultEmoji}>{getResultEmoji()}</Text>
          <Text style={styles.resultTitle}>{getResultTitle()}</Text>
          <Text style={styles.resultSubtitle}>
            Final Score: {player1.score} - {player2.score}
          </Text>
        </View>

        {/* Game Statistics */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Game Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalRounds}</Text>
              <Text style={styles.statLabel}>Total Rounds</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#2ecc71' }]}>{stats.playerWins}</Text>
              <Text style={styles.statLabel}>Your Wins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#e74c3c' }]}>{stats.opponentWins}</Text>
              <Text style={styles.statLabel}>Opponent Wins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#f39c12' }]}>{stats.ties}</Text>
              <Text style={styles.statLabel}>Ties</Text>
            </View>
          </View>
        </View>

        {/* Round History */}
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Round History</Text>
          <ScrollView style={styles.historyScroll} showsVerticalScrollIndicator={false}>
            {gameState.roundHistory.map((round, index) => (
              <View key={index} style={styles.roundItem}>
                <Text style={styles.roundNumber}>Round {round.round}</Text>
                <View style={styles.roundCards}>
                  <View style={styles.roundCard}>
                    <Text style={styles.cardValue}>{round.playerCards[0]}</Text>
                  </View>
                  <Text style={styles.vsText}>vs</Text>
                  <View style={styles.roundCard}>
                    <Text style={styles.cardValue}>{round.playerCards[1]}</Text>
                  </View>
                </View>
                <View style={styles.roundResult}>
                  <Text style={[
                    styles.roundWinner,
                    {
                      color: round.winner === 'player1' ? '#2ecc71' :
                             round.winner === 'player2' ? '#e74c3c' : '#f39c12'
                    }
                  ]}>
                    {round.winner === 'player1' ? 'You' :
                     round.winner === 'player2' ? player2.name : 'Tie'}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.playAgainButton]}
            onPress={playAgain}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.menuButton]}
            onPress={goToMainMenu}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Main Menu</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  resultHeader: {
    alignItems: 'center',
    borderRadius: 20,
    padding: 30,
    marginBottom: 25,
  },
  resultEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ecf0f1',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  historyContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ecf0f1',
    textAlign: 'center',
    marginBottom: 15,
  },
  historyScroll: {
    flex: 1,
  },
  roundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  roundNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#bdc3c7',
    width: 70,
  },
  roundCards: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundCard: {
    width: 30,
    height: 40,
    backgroundColor: '#34495e',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ecf0f1',
  },
  vsText: {
    fontSize: 12,
    color: '#bdc3c7',
    marginHorizontal: 10,
  },
  roundResult: {
    width: 70,
    alignItems: 'flex-end',
  },
  roundWinner: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  playAgainButton: {
    backgroundColor: '#3498db',
  },
  menuButton: {
    backgroundColor: '#7f8c8d',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});