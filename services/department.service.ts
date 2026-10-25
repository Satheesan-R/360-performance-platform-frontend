import api from "@/lib/api";

export interface DepartmentOption {
  _id: string;
  name: string;
}

export async function getActiveDepartments(token: string, signal?: AbortSignal) {
  const departments: DepartmentOption[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await api.get<{
      departments: DepartmentOption[];
      pagination: { totalPages: number };
    }>("/departments", {
      headers: { Authorization: `Bearer ${token}` },
      params: { status: "active", page, limit: 100 },
      signal,
    });

    departments.push(...response.data.departments);
    totalPages = response.data.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);

  return departments;
}
