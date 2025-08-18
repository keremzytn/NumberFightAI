import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer';
import ApiService from '../services/ApiService';

interface CardInfo {
  value: number;
  isLocked: boolean;
  isUsed: boolean;
  isAvailable: boolean;
}

interface PlayerGameInfo {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isAI: boolean;
  aiLevel: string;
  hand: CardInfo[];
}

interface GameState {
  gameId: string;
  currentRound: number;
  state: string;
  player1: PlayerGameInfo;
  player2: PlayerGameInfo;
  lastRoundResult?: {
    round: number;
    player1Card: number;
    player2Card: number;
    winner?: PlayerGameInfo;
    player1Score: number;
    player2Score: number;
    specialRuleApplied: boolean;
  };
  isPlayerTurn: boolean;
  roundStartTime: string;
  round5SpecialRuleApplied: boolean;
}

const GameScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [gameState, setGameState] = useState<GameState>(route.params?.gameState);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showRoundResult, setShowRoundResult] = useState(false);

  useEffect(() => {
    if (gameState?.lastRoundResult && gameState.currentRound > 1) {
      setShowRoundResult(true);
      setTimeout(() => setShowRoundResult(false), 3000);
    }
  }, [gameState?.lastRoundResult]);

  const getCurrentPlayer = (): PlayerGameInfo => {
    // Assuming current user is always player1 for simplicity
    return gameState.player1;
  };

  const getOpponent = (): PlayerGameInfo => {
    return gameState.player2;
  };

  const playCard = async (cardValue: number) => {
    if (!selectedCard) {
      setSelectedCard(cardValue);
      return;
    }

    if (selectedCard === cardValue) {
      // Confirm the move
      try {
        const newGameState = await ApiService.submitMove(gameState.gameId, cardValue);
        setGameState(newGameState);
        setSelectedCard(null);
        setTimeLeft(30); // Reset timer

        // Check if game is complete
        if (newGameState.state === 'Completed') {
          showGameResult(newGameState);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to submit move');
        setSelectedCard(null);
      }
    } else {
      setSelectedCard(cardValue);
    }
  };

  const showGameResult = (finalGameState: GameState) => {
    const currentPlayer = finalGameState.player1;
    const opponent = finalGameState.player2;
    
    let message = '';
    if (currentPlayer.score > opponent.score) {
      message = `You won! ${currentPlayer.score} - ${opponent.score}`;
    } else if (opponent.score > currentPlayer.score) {
      message = `You lost! ${currentPlayer.score} - ${opponent.score}`;
    } else {
      message = `It's a tie! ${currentPlayer.score} - ${opponent.score}`;
    }

    Alert.alert(
      'Game Over',
      message,
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const renderCard = (card: CardInfo) => {
    const isSelected = selectedCard === card.value;
    const canPlay = card.isAvailable;

    return (
      <TouchableOpacity
        key={card.value}
        style={[
          styles.card,
          !canPlay && styles.cardDisabled,
          card.isLocked && styles.cardLocked,
          card.isUsed && styles.cardUsed,
          isSelected && styles.cardSelected,
        ]}
        onPress={() => canPlay && playCard(card.value)}
        disabled={!canPlay}
      >
        <Text style={[
          styles.cardText,
          !canPlay && styles.cardTextDisabled,
          isSelected && styles.cardTextSelected,
        ]}>
          {card.value}
        </Text>
        {card.isLocked && (
          <Text style={styles.lockIcon}>🔒</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderRoundResult = () => {
    if (!showRoundResult || !gameState.lastRoundResult) return null;

    const result = gameState.lastRoundResult;
    return (
      <View style={styles.roundResultOverlay}>
        <View style={styles.roundResultContainer}>
          <Text style={styles.roundResultTitle}>Round {result.round} Result</Text>
          <View style={styles.roundResultCards}>
            <View style={styles.roundResultCard}>
              <Text style={styles.roundResultCardLabel}>You</Text>
              <Text style={styles.roundResultCardValue}>{result.player1Card}</Text>
            </View>
            <Text style={styles.roundResultVs}>VS</Text>
            <View style={styles.roundResultCard}>
              <Text style={styles.roundResultCardLabel}>Opponent</Text>
              <Text style={styles.roundResultCardValue}>{result.player2Card}</Text>
            </View>
          </View>
          {result.winner && (
            <Text style={styles.roundResultWinner}>
              {result.winner.id === getCurrentPlayer().id ? 'You won!' : 'Opponent won!'}
            </Text>
          )}
          {!result.winner && (
            <Text style={styles.roundResultTie}>It's a tie!</Text>
          )}
          {result.specialRuleApplied && (
            <Text style={styles.specialRuleText}>⭐ Special Rule Applied!</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Game Header */}
      <View style={styles.gameHeader}>
        <View style={styles.roundInfo}>
          <Text style={styles.roundText}>Round {gameState.currentRound}/7</Text>
          <CountdownCircleTimer
            isPlaying={true}
            duration={30}
            colors={['#004777', '#F7B801', '#A30000', '#A30000']}
            colorsTime={[30, 20, 10, 0]}
            size={60}
            strokeWidth={4}
            onComplete={() => {
              // Auto-play lowest available card if time runs out
              const availableCards = getCurrentPlayer().hand.filter(c => c.isAvailable);
              if (availableCards.length > 0) {
                playCard(availableCards[0].value);
              }
            }}
          >
            {({ remainingTime }) => (
              <Text style={styles.timerText}>{remainingTime}</Text>
            )}
          </CountdownCircleTimer>
        </View>
        
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Score Board */}
      <View style={styles.scoreBoard}>
        <View style={styles.playerScore}>
          <Image
            source={{ uri: getCurrentPlayer().avatar || 'https://via.placeholder.com/40' }}
            style={styles.playerAvatar}
          />
          <Text style={styles.playerName}>{getCurrentPlayer().name}</Text>
          <Text style={styles.score}>{getCurrentPlayer().score}</Text>
        </View>
        
        <Text style={styles.scoreVs}>VS</Text>
        
        <View style={styles.playerScore}>
          <Image
            source={{ uri: getOpponent().avatar || 'https://via.placeholder.com/40' }}
            style={styles.playerAvatar}
          />
          <Text style={styles.playerName}>
            {getOpponent().name}
            {getOpponent().isAI && ` (${getOpponent().aiLevel})`}
          </Text>
          <Text style={styles.score}>{getOpponent().score}</Text>
        </View>
      </View>

      {/* Player's Hand */}
      <View style={styles.handContainer}>
        <Text style={styles.handTitle}>Your Cards</Text>
        <View style={styles.cardsContainer}>
          {getCurrentPlayer().hand.map(renderCard)}
        </View>
        
        {selectedCard && (
          <View style={styles.selectedCardInfo}>
            <Text style={styles.selectedCardText}>
              Selected: {selectedCard} - Tap again to confirm
            </Text>
          </View>
        )}
      </View>

      {/* Game Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          🎯 Play the highest card to win the round
        </Text>
        <Text style={styles.instructionsText}>
          🔒 Neighbor cards get locked after each round
        </Text>
        {gameState.currentRound === 5 && (
          <Text style={styles.specialRuleText}>
            ⭐ Round 5: Play middle card of 3 consecutive cards to skip next lock!
          </Text>
        )}
      </View>

      {/* Round Result Overlay */}
      {renderRoundResult()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  roundInfo: {
    alignItems: 'center',
  },
  roundText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  playerScore: {
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  scoreVs: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginHorizontal: 20,
  },
  handContainer: {
    flex: 1,
    padding: 20,
  },
  handTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  card: {
    width: 60,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  cardDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  cardLocked: {
    backgroundColor: '#e0e0e0',
    borderColor: '#999',
  },
  cardUsed: {
    backgroundColor: '#ccc',
    opacity: 0.4,
  },
  cardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  cardText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  cardTextDisabled: {
    color: '#999',
  },
  cardTextSelected: {
    color: '#007AFF',
  },
  lockIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 12,
  },
  selectedCardInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedCardText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  instructionsContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  specialRuleText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
  roundResultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundResultContainer: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 300,
  },
  roundResultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  roundResultCards: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  roundResultCard: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  roundResultCardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  roundResultCardValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f0f0f0',
    width: 60,
    height: 60,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 8,
  },
  roundResultVs: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  roundResultWinner: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  roundResultTie: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
  },
});

export default GameScreen;