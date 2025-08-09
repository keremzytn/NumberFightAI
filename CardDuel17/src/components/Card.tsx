import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  Dimensions,
} from 'react-native';
import { Card as CardType } from '@/types/game';

interface CardProps {
  value: CardType;
  isSelected?: boolean;
  isLocked?: boolean;
  isPlayable?: boolean;
  isRevealed?: boolean;
  onPress?: (card: CardType) => void;
  size?: 'small' | 'medium' | 'large';
  animationDelay?: number;
}

const { width } = Dimensions.get('window');

export const Card: React.FC<CardProps> = ({
  value,
  isSelected = false,
  isLocked = false,
  isPlayable = true,
  isRevealed = false,
  onPress,
  size = 'medium',
  animationDelay = 0,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;
  const translateYAnim = React.useRef(new Animated.Value(0)).current;

  const cardSizes = {
    small: { width: width * 0.12, height: width * 0.16 },
    medium: { width: width * 0.18, height: width * 0.25 },
    large: { width: width * 0.24, height: width * 0.32 },
  };

  React.useEffect(() => {
    // Entrance animation
    if (animationDelay > 0) {
      opacityAnim.setValue(0);
      translateYAnim.setValue(20);
      
      Animated.sequence([
        Animated.delay(animationDelay),
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [animationDelay]);

  React.useEffect(() => {
    // Selection animation
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.1 : 1,
      friction: 6,
      useNativeDriver: true,
    }).start();

    Animated.spring(translateYAnim, {
      toValue: isSelected ? -10 : 0,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);

  React.useEffect(() => {
    // Locked state animation
    Animated.timing(opacityAnim, {
      toValue: isLocked ? 0.4 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isLocked]);

  const handlePress = () => {
    if (isPlayable && !isLocked && onPress) {
      // Press animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      onPress(value);
    }
  };

  const getCardColor = (cardValue: CardType): string => {
    // Color gradient based on card value
    const colors = {
      1: '#FF6B6B', // Red
      2: '#4ECDC4', // Teal
      3: '#45B7D1', // Blue
      4: '#96CEB4', // Green
      5: '#FECA57', // Yellow
      6: '#FF9FF3', // Pink
      7: '#9B59B6', // Purple
    };
    return colors[cardValue];
  };

  const cardStyle = [
    styles.card,
    {
      width: cardSizes[size].width,
      height: cardSizes[size].height,
      backgroundColor: isRevealed ? getCardColor(value) : '#2C3E50',
      borderColor: isSelected ? '#3498db' : isLocked ? '#e74c3c' : '#34495e',
      borderWidth: isSelected ? 3 : isLocked ? 2 : 1,
    },
    !isPlayable && styles.disabledCard,
    isLocked && styles.lockedCard,
  ];

  const textStyle = [
    styles.cardText,
    {
      fontSize: size === 'small' ? 18 : size === 'medium' ? 24 : 30,
      color: isRevealed ? '#fff' : '#bdc3c7',
    },
  ];

  return (
    <Animated.View
      style={[
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={cardStyle}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={!isPlayable || isLocked}
      >
        <Text style={textStyle}>
          {isRevealed ? value : '?'}
        </Text>
        
        {isLocked && (
          <View style={styles.lockIcon}>
            <Text style={styles.lockText}>🔒</Text>
          </View>
        )}
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    margin: 4,
  },
  cardText: {
    fontWeight: 'bold',
    fontFamily: 'System',
    textAlign: 'center',
  },
  disabledCard: {
    opacity: 0.5,
  },
  lockedCard: {
    backgroundColor: '#7f8c8d',
  },
  lockIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    fontSize: 8,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: '#27ae60',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
});