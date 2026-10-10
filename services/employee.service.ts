import api from "@/lib/api";
import type { CreateEmployeeRequest, CreateEmployeeResponse, Employee } from "@/types/employee";

export async function getEmployees(token: string, signal?: AbortSignal) {
  const response = await api.get<Employee[] | { employees: Employee[] }>("/employees", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  return Array.isArray(response.data) ? response.data : response.data.employees;
}

export async function createEmployee(data: CreateEmployeeRequest, token: string) {
  const response = await api.post<CreateEmployeeResponse>("/employees", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
