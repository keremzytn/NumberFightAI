import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://your-api-domain.com/api'; // Replace with your actual API URL

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Add auth token to requests
    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('auth_token');
          // Navigate to login screen
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(email: string, username: string, password: string) {
    const response = await this.api.post('/auth/register', {
      email,
      username,
      password,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async googleLogin(idToken: string) {
    const response = await this.api.post('/auth/google-login', {
      idToken,
    });
    return response.data;
  }

  async appleLogin(identityToken: string, authorizationCode: string) {
    const response = await this.api.post('/auth/apple-login', {
      identityToken,
      authorizationCode,
    });
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.api.post('/auth/forgot-password', {
      email,
    });
    return response.data;
  }

  async getProfile() {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  async updateProfile(username?: string, avatar?: string) {
    const response = await this.api.put('/auth/profile', {
      username,
      avatar,
    });
    return response.data;
  }

  // Game endpoints
  async startMatch(opponentId: string, aiLevel?: string) {
    const response = await this.api.post('/game/start', {
      opponentId,
      aiLevel,
    });
    return response.data;
  }

  async submitMove(gameId: string, cardValue: number) {
    const response = await this.api.post('/game/move', {
      gameId,
      cardValue,
    });
    return response.data;
  }

  async getGameState(gameId: string) {
    const response = await this.api.get(`/game/${gameId}`);
    return response.data;
  }

  async getMatchHistory(page: number = 1, pageSize: number = 20) {
    const response = await this.api.get('/game/history', {
      params: { page, pageSize },
    });
    return response.data;
  }

  async getLeaderboard(limit: number = 50) {
    const response = await this.api.get('/game/leaderboard', {
      params: { limit },
    });
    return response.data;
  }
}

export default new ApiService();