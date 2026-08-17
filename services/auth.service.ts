import api from "@/lib/api";

export const registerUser = async (data: {
  email: string;
  password: string;
  role: string;
}) => {
  const response = await api.post("/auth/register", data);

  return response.data;
};