export type UserRole =
  | "employee"
  | "tech_lead"
  | "department_manager"
  | "hr"
  | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  redirectTo: string;
  user: AuthUser;
}

export interface ActivationTokenRequest {
  token: string;
}

export interface SendOtpResponse {
  message: string;
  email: string;
}

export interface VerifyOtpRequest extends ActivationTokenRequest {
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
  setupToken: string;
}

export interface CreatePasswordRequest {
  setupToken: string;
  password: string;
}

export interface MessageResponse {
  message: string;
}
