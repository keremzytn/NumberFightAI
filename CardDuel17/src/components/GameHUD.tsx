import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { GameState } from '@/types/game';

interface GameHUDProps {
  gameState: GameState;
  remainingTime: number;
}

const { width } = Dimensions.get('window');

export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  remainingTime,
}) => {
  const timerColorAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Timer color animation when time is running low
    if (remainingTime <= 10) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerColorAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(timerColorAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      timerColorAnim.setValue(0);
    }
  }, [remainingTime]);

  React.useEffect(() => {
    // Pulse animation for timer when below 5 seconds
    if (remainingTime <= 5) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [remainingTime]);

  const formatTime = (seconds: number): string => {
    return Math.ceil(seconds).toString().padStart(2, '0');
  };

  const getTimerColor = () => {
    return timerColorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#2ecc71', '#e74c3c'],
    });
  };

  const getProgressWidth = () => {
    const progress = remainingTime / gameState.roundDuration;
    return Math.max(0, progress * 100);
  };

  const [player1, player2] = gameState.players;

  return (
    <View style={styles.container}>
      {/* Round Counter */}
      <View style={styles.roundContainer}>
        <Text style={styles.roundLabel}>ROUND</Text>
        <Text style={styles.roundNumber}>
          {gameState.currentRound}/{gameState.maxRounds}
        </Text>
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Animated.View
          style={[
            styles.timerCircle,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.timerText,
              {
                color: getTimerColor(),
              },
            ]}
          >
            {formatTime(remainingTime)}
          </Animated.Text>
        </Animated.View>
        
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${getProgressWidth()}%`,
                backgroundColor: remainingTime <= 10 ? '#e74c3c' : '#2ecc71',
              },
            ]}
          />
        </View>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreContainer}>
        <View style={styles.playerScore}>
          <Text style={styles.playerName} numberOfLines={1}>
            {player1.name}
          </Text>
          <Text style={styles.scoreText}>{player1.score}</Text>
        </View>
        
        <Text style={styles.scoreSeparator}>-</Text>
        
        <View style={styles.playerScore}>
          <Text style={styles.playerName} numberOfLines={1}>
            {player2.name}
          </Text>
          <Text style={styles.scoreText}>{player2.score}</Text>
        </View>
      </View>
    </View>
  );
};

export const RoundHistory: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [gameState.roundHistory.length]);

  if (gameState.roundHistory.length === 0) {
    return null;
  }

  const lastRound = gameState.roundHistory[gameState.roundHistory.length - 1];

  return (
    <Animated.View
      style={[
        styles.historyContainer,
        {
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <Text style={styles.historyTitle}>Last Round</Text>
      <View style={styles.historyCards}>
        <View style={styles.historyCard}>
          <Text style={styles.historyCardText}>
            {lastRound.playerCards[0]}
          </Text>
        </View>
        <Text style={styles.historyVs}>vs</Text>
        <View style={styles.historyCard}>
          <Text style={styles.historyCardText}>
            {lastRound.playerCards[1]}
          </Text>
        </View>
      </View>
      <Text style={styles.historyResult}>
        {lastRound.winner === 'tie' ? 'Tie!' : 
         lastRound.winner === 'player1' ? `${gameState.players[0].name} won!` :
         `${gameState.players[1].name} won!`}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    marginHorizontal: 10,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  roundContainer: {
    alignItems: 'center',
    flex: 1,
  },
  roundLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 2,
  },
  roundNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  timerContainer: {
    alignItems: 'center',
    flex: 1,
  },
  timerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#bdc3c7',
  },
  timerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    width: 60,
    height: 4,
    backgroundColor: '#ecf0f1',
    borderRadius: 2,
    marginTop: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  playerScore: {
    alignItems: 'center',
    flex: 1,
  },
  playerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 2,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  scoreSeparator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#bdc3c7',
    marginHorizontal: 10,
  },
  historyContainer: {
    backgroundColor: 'rgba(52, 73, 94, 0.9)',
    padding: 15,
    borderRadius: 10,
    margin: 10,
    alignItems: 'center',
  },
  historyTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  historyCards: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyCard: {
    width: 30,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  historyCardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  historyVs: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  historyResult: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});