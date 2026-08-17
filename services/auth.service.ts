import api from "@/lib/api";
import type {
  ActivationTokenRequest,
  CreatePasswordRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "@/types/auth";

export const authService = {
  async login(data: LoginRequest) {
    const response = await api.post<LoginResponse>("/auth/login", data);
    return response.data;
  },

  async sendOtp(data: ActivationTokenRequest) {
    const response = await api.post<SendOtpResponse>("/auth/activation/send-otp", data);
    return response.data;
  },

  async verifyOtp(data: VerifyOtpRequest) {
    const response = await api.post<VerifyOtpResponse>("/auth/activation/verify-otp", data);
    return response.data;
  },

  async createPassword(data: CreatePasswordRequest) {
    const response = await api.post<MessageResponse>("/auth/activation/create-password", data);
    return response.data;
  },
};
