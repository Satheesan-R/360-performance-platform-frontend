import type { HierarchyEmployee } from "@/types/organization";

export function unavailableManagers(employees: HierarchyEmployee[], employeeId: string): Set<string> {
  const blocked = new Set([employeeId]);
  const children = new Map<string, string[]>();
  for (const employee of employees) {
    if (!employee.reportingManagerId) continue;
    const siblings = children.get(employee.reportingManagerId) ?? [];
    siblings.push(employee._id);
    children.set(employee.reportingManagerId, siblings);
  }
  const queue = [employeeId];
  for (let index = 0; index < queue.length; index++) {
    for (const child of children.get(queue[index]) ?? []) {
      if (!blocked.has(child)) { blocked.add(child); queue.push(child); }
    }
  }
  return blocked;
}

export function hierarchyRows(employees: HierarchyEmployee[]) {
  const ids = new Set(employees.map((employee) => employee._id));
  const children = new Map<string, HierarchyEmployee[]>();
  for (const employee of employees) {
    if (!employee.reportingManagerId) continue;
    const siblings = children.get(employee.reportingManagerId) ?? [];
    siblings.push(employee);
    children.set(employee.reportingManagerId, siblings);
  }
  const rows: { employee: HierarchyEmployee; depth: number; disconnected: boolean }[] = [];
  const visited = new Set<string>();
  function visit(root: HierarchyEmployee, disconnected: boolean) {
    const stack = [{ employee: root, depth: 0 }];
    while (stack.length) {
      const current = stack.pop()!;
      if (visited.has(current.employee._id)) continue;
      visited.add(current.employee._id);
      rows.push({ ...current, disconnected });
      const reports = children.get(current.employee._id) ?? [];
      for (let index = reports.length - 1; index >= 0; index--) stack.push({ employee: reports[index], depth: current.depth + 1 });
    }
  }
  for (const employee of employees) {
    if (!employee.reportingManagerId || !ids.has(employee.reportingManagerId)) visit(employee, Boolean(employee.reportingManagerId));
  }
  // Surface invalid cycles as disconnected groups instead of hiding employees.
  for (const employee of employees) if (!visited.has(employee._id)) visit(employee, true);
  return rows;
}
