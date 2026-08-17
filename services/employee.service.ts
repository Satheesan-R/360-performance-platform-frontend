import api from "@/lib/api";
import type { CreateEmployeeRequest, CreateEmployeeResponse } from "@/types/employee";

export async function createEmployee(data: CreateEmployeeRequest, token: string) {
  const response = await api.post<CreateEmployeeResponse>("/employees", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
