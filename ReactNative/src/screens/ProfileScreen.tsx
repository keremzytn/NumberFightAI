import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../services/ApiService';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar: string;
  statistics: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
    mostUsedCard: number;
    cardUsageCount: { [key: string]: number };
  };
  friends: Array<{
    id: string;
    username: string;
    avatar: string;
    isOnline: boolean;
  }>;
}

const AVATAR_OPTIONS = [
  'https://via.placeholder.com/100/FF6B6B/FFFFFF?text=😀',
  'https://via.placeholder.com/100/4ECDC4/FFFFFF?text=😎',
  'https://via.placeholder.com/100/45B7D1/FFFFFF?text=🤓',
  'https://via.placeholder.com/100/96CEB4/FFFFFF?text=😊',
  'https://via.placeholder.com/100/FFEAA7/FFFFFF?text=🎮',
  'https://via.placeholder.com/100/DDA0DD/FFFFFF?text=🏆',
];

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await ApiService.getProfile();
      setProfile(profileData);
      setNewUsername(profileData.username);
      setSelectedAvatar(profileData.avatar);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const updatedProfile = await ApiService.updateProfile(newUsername, selectedAvatar);
      setProfile(updatedProfile);
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const renderStatistics = () => {
    if (!profile) return null;

    const stats = profile.statistics;
    const cardUsage = Object.entries(stats.cardUsageCount)
      .map(([card, count]) => ({ card: parseInt(card), count }))
      .sort((a, b) => b.count - a.count);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalGames}</Text>
            <Text style={styles.statLabel}>Total Games</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.wins}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(stats.winRate * 100).toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.mostUsedCard}</Text>
            <Text style={styles.statLabel}>Favorite Card</Text>
          </View>
        </View>

        <View style={styles.cardUsageContainer}>
          <Text style={styles.cardUsageTitle}>Card Usage</Text>
          <View style={styles.cardUsageGrid}>
            {cardUsage.map(({ card, count }) => (
              <View key={card} style={styles.cardUsageItem}>
                <Text style={styles.cardUsageCard}>{card}</Text>
                <Text style={styles.cardUsageCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderAvatarSelection = () => {
    return (
      <View style={styles.avatarSelection}>
        <Text style={styles.avatarSelectionTitle}>Choose Avatar</Text>
        <View style={styles.avatarGrid}>
          {AVATAR_OPTIONS.map((avatar, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.avatarOption,
                selectedAvatar === avatar && styles.avatarOptionSelected,
              ]}
              onPress={() => setSelectedAvatar(avatar)}
            >
              <Image source={{ uri: avatar }} style={styles.avatarOptionImage} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Profile</Text>
          
          <TouchableOpacity
            onPress={() => editMode ? saveProfile() : setEditMode(true)}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>
              {editMode ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileContainer}>
          <Image
            source={{ uri: selectedAvatar || 'https://via.placeholder.com/100' }}
            style={styles.profileAvatar}
          />
          
          {editMode ? (
            <TextInput
              style={styles.usernameInput}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Username"
              maxLength={20}
            />
          ) : (
            <Text style={styles.username}>{profile?.username}</Text>
          )}
          
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        {/* Avatar Selection (only in edit mode) */}
        {editMode && renderAvatarSelection()}

        {/* Statistics */}
        {renderStatistics()}

        {/* Friends List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends ({profile?.friends.length || 0})</Text>
          {profile?.friends.length === 0 ? (
            <Text style={styles.emptyText}>No friends yet. Add friends to play together!</Text>
          ) : (
            <View style={styles.friendsList}>
              {profile?.friends.map((friend) => (
                <View key={friend.id} style={styles.friendItem}>
                  <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
                  <Text style={styles.friendName}>{friend.username}</Text>
                  <View style={[
                    styles.onlineIndicator,
                    { backgroundColor: friend.isOnline ? '#4CAF50' : '#ccc' }
                  ]} />
                </View>
              ))}
            </View>
          )}
        </View>

        {editMode && (
          <View style={styles.editActions}>
            <TouchableOpacity
              onPress={() => {
                setEditMode(false);
                setNewUsername(profile?.username || '');
                setSelectedAvatar(profile?.avatar || '');
              }}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  profileContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  usernameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  cardUsageContainer: {
    marginTop: 20,
  },
  cardUsageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  cardUsageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cardUsageItem: {
    alignItems: 'center',
  },
  cardUsageCard: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f0f0f0',
    width: 30,
    height: 30,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 4,
    marginBottom: 5,
  },
  cardUsageCount: {
    fontSize: 12,
    color: '#666',
  },
  friendsList: {
    // Friends list styles
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  friendName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  avatarSelection: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  avatarSelectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  avatarOption: {
    margin: 5,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: '#007AFF',
  },
  avatarOptionImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  editActions: {
    padding: 20,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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

export default ProfileScreen;