import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  BackHandler,
  Dimensions,
  StatusBar,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Card } from '@/components/Card';
import { GameHUD, RoundHistory } from '@/components/GameHUD';
import { GameState, Player, Card as CardType, AILevel, AIContext } from '@/types/game';
import { GameLogic } from '@/utils/gameLogic';
import { AIPlayer } from '@/utils/aiPlayer';

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

type GameScreenRouteProp = RouteProp<RootStackParamList, 'GameScreen'>;
type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GameScreen'>;

interface GameScreenProps {
  route: GameScreenRouteProp;
  navigation: GameScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export const GameScreen: React.FC<GameScreenProps> = ({ route, navigation }) => {
  const { mode, aiDifficulty = 'medium', roomCode } = route.params;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [remainingTime, setRemainingTime] = useState(30);
  const [opponentSelectedCard, setOpponentSelectedCard] = useState<CardType | null>(null);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
  const [showCardReveal, setShowCardReveal] = useState(false);

  // Initialize game
  useEffect(() => {
    const player1: Player = {
      id: 'player1',
      name: 'You',
      cards: [1, 2, 3, 4, 5, 6, 7],
      lockedCards: [],
      score: 0,
    };

    const player2: Player = {
      id: 'player2',
      name: mode === 'singleplayer' ? `AI (${aiDifficulty})` : 'Opponent',
      cards: [1, 2, 3, 4, 5, 6, 7],
      lockedCards: [],
      score: 0,
      isAI: mode === 'singleplayer',
      difficulty: aiDifficulty,
    };

    const initialGameState = GameLogic.initializeGame(player1, player2, mode);
    setGameState(initialGameState);
    setRemainingTime(initialGameState.roundDuration);
  }, [mode, aiDifficulty]);

  // Timer logic
  useEffect(() => {
    if (!gameState || gameState.phase !== 'card_selection') return;

    const timer = setInterval(() => {
      const newRemainingTime = GameLogic.getRemainingTime(gameState);
      setRemainingTime(newRemainingTime);

      if (newRemainingTime <= 0) {
        handleTimeExpired();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [gameState]);

  // AI move logic
  useEffect(() => {
    if (!gameState || mode !== 'singleplayer') return;
    if (gameState.phase !== 'card_selection') return;
    if (selectedCard && !opponentSelectedCard) {
      // AI makes move after player selects
      setTimeout(() => {
        makeAIMove();
      }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds
    }
  }, [selectedCard, gameState]);

  // Back button handler
  useEffect(() => {
    const backAction = () => {
      Alert.alert('Exit Game', 'Are you sure you want to leave the game?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => navigation.goBack() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigation]);

  const handleTimeExpired = useCallback(() => {
    if (!gameState) return;

    // Auto-select a random available card if time expires
    if (!selectedCard) {
      const availableCards = GameLogic.getAvailableCards(gameState, 'player1');
      if (availableCards.length > 0) {
        const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        handleCardSelect(randomCard);
      }
    }
  }, [gameState, selectedCard]);

  const makeAIMove = useCallback(() => {
    if (!gameState || !selectedCard) return;

    const player2 = gameState.players[1];
    const aiContext: AIContext = {
      playerCards: player2.cards,
      opponentPlayedCards: gameState.roundHistory
        .map(round => round.playerCards[0])
        .filter(card => card !== null) as CardType[],
      lockedCards: player2.lockedCards,
      currentRound: gameState.currentRound,
      scores: [gameState.players[1].score, gameState.players[0].score], // AI perspective
      roundHistory: gameState.roundHistory,
      difficulty: aiDifficulty,
    };

    try {
      const aiCard = AIPlayer.selectCard(aiContext);
      setOpponentSelectedCard(aiCard);
      
      // Process the round after both cards are selected
      setTimeout(() => {
        processRound(selectedCard, aiCard);
      }, 1000);
    } catch (error) {
      console.error('AI move error:', error);
      // Fallback to random card
      const availableCards = GameLogic.getAvailableCards(gameState, 'player2');
      if (availableCards.length > 0) {
        const randomCard = availableCards[0];
        setOpponentSelectedCard(randomCard);
        setTimeout(() => {
          processRound(selectedCard, randomCard);
        }, 1000);
      }
    }
  }, [gameState, selectedCard, aiDifficulty]);

  const handleCardSelect = (card: CardType) => {
    if (!gameState || selectedCard) return;
    
    if (!GameLogic.canPlayCard(gameState, 'player1', card)) {
      Alert.alert('Invalid Move', 'This card cannot be played right now.');
      return;
    }

    setSelectedCard(card);

    if (mode === 'singleplayer') {
      // AI will make its move in useEffect
      setIsWaitingForOpponent(true);
    } else {
      // Handle online/friend mode here
      setIsWaitingForOpponent(true);
      // TODO: Send card selection to server
    }
  };

  const processRound = (player1Card: CardType, player2Card: CardType) => {
    if (!gameState) return;

    setShowCardReveal(true);

    setTimeout(() => {
      try {
        const newGameState = GameLogic.processRound(gameState, player1Card, player2Card);
        setGameState(newGameState);

        // Reset for next round
        setSelectedCard(null);
        setOpponentSelectedCard(null);
        setIsWaitingForOpponent(false);
        setShowCardReveal(false);

        // Check if game is over
        if (GameLogic.isGameOver(newGameState)) {
          setTimeout(() => {
            navigation.navigate('GameResult', { gameState: newGameState });
          }, 2000);
        } else {
          // Start new round
          setRemainingTime(newGameState.roundDuration);
        }
      } catch (error) {
        console.error('Round processing error:', error);
        Alert.alert('Game Error', 'An error occurred while processing the round.');
      }
    }, 2000); // Show cards for 2 seconds
  };

  if (!gameState) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Initializing game...</Text>
      </SafeAreaView>
    );
  }

  const player1 = gameState.players[0];
  const player2 = gameState.players[1];
  const availableCards = GameLogic.getAvailableCards(gameState, 'player1');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      
      {/* Game HUD */}
      <GameHUD gameState={gameState} remainingTime={remainingTime} />

      {/* Round History */}
      <RoundHistory gameState={gameState} />

      {/* Opponent's Area */}
      <View style={styles.opponentArea}>
        <Text style={styles.areaLabel}>
          {player2.name} {player2.isAI ? `(${player2.difficulty})` : ''}
        </Text>
        
        <View style={styles.cardRow}>
          {player2.cards.map((card, index) => (
            <Card
              key={`opponent-${card}`}
              value={card}
              size="small"
              isRevealed={false}
              isPlayable={false}
              animationDelay={index * 100}
            />
          ))}
        </View>

        {/* Opponent's played card */}
        {(showCardReveal && opponentSelectedCard) && (
          <View style={styles.playedCardArea}>
            <Card
              value={opponentSelectedCard}
              size="large"
              isRevealed={true}
              isPlayable={false}
            />
          </View>
        )}
      </View>

      {/* Center Area - Battle Zone */}
      <View style={styles.centerArea}>
        {isWaitingForOpponent && !showCardReveal && (
          <Text style={styles.waitingText}>
            {mode === 'singleplayer' ? 'AI is thinking...' : 'Waiting for opponent...'}
          </Text>
        )}
        
        {showCardReveal && selectedCard && opponentSelectedCard && (
          <View style={styles.battleCards}>
            <View style={styles.battleCard}>
              <Text style={styles.battleLabel}>You</Text>
              <Card
                value={selectedCard}
                size="large"
                isRevealed={true}
                isPlayable={false}
              />
            </View>
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.battleCard}>
              <Text style={styles.battleLabel}>{player2.name}</Text>
              <Card
                value={opponentSelectedCard}
                size="large"
                isRevealed={true}
                isPlayable={false}
              />
            </View>
          </View>
        )}
      </View>

      {/* Player's Area */}
      <View style={styles.playerArea}>
        <Text style={styles.areaLabel}>Your Cards</Text>
        
        <View style={styles.cardRow}>
          {player1.cards.map((card, index) => (
            <Card
              key={`player-${card}`}
              value={card}
              size="medium"
              isSelected={selectedCard === card}
              isLocked={player1.lockedCards.includes(card)}
              isPlayable={!selectedCard && availableCards.includes(card)}
              isRevealed={true}
              onPress={handleCardSelect}
              animationDelay={index * 100}
            />
          ))}
        </View>

        {/* Status text */}
        <View style={styles.statusArea}>
          {selectedCard ? (
            <Text style={styles.statusText}>
              You selected card {selectedCard}
            </Text>
          ) : (
            <Text style={styles.statusText}>
              Select a card to play ({remainingTime}s remaining)
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34495e',
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 18,
    color: '#fff',
  },
  opponentArea: {
    flex: 0.25,
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  centerArea: {
    flex: 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  playerArea: {
    flex: 0.35,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  areaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ecf0f1',
    marginBottom: 10,
    textAlign: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playedCardArea: {
    marginTop: 15,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 18,
    color: '#ecf0f1',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  battleCards: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  battleCard: {
    alignItems: 'center',
  },
  battleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ecf0f1',
    marginBottom: 5,
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginHorizontal: 20,
  },
  statusArea: {
    marginTop: 15,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
  },
});