export interface RegisterRequest {
  email: string;
  password: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
}