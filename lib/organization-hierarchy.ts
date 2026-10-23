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

export function departmentKey(employee: HierarchyEmployee): string {
  return employee.departmentId || employee.departmentName || "";
}

export function teamKey(employee: HierarchyEmployee): string {
  return employee.teamId || employee.teamName || "";
}

export function reportingManagerChoices(employees: HierarchyEmployee[], employeeId: string) {
  const blocked = unavailableManagers(employees, employeeId);
  const invalidChains = new Set(hierarchyRows(employees).filter((row) => row.disconnected).map((row) => row.employee._id));
  return employees.filter((employee) => !blocked.has(employee._id) && !invalidChains.has(employee._id));
}

export function visibleHierarchyRows(employees: HierarchyEmployee[], filters: { search: string; department: string; team: string }) {
  const query = filters.search.trim().toLowerCase();
  const matches = new Set(employees.filter((employee) =>
    (!filters.department || departmentKey(employee) === filters.department) &&
    (!filters.team || teamKey(employee) === filters.team) &&
    `${employee.fullName} ${employee.employeeNumber ?? ""} ${employee.designation ?? ""} ${employee.departmentName ?? ""} ${employee.teamName ?? ""}`.toLowerCase().includes(query)
  ).map((employee) => employee._id));
  const included = new Set(matches);
  const byId = new Map(employees.map((employee) => [employee._id, employee]));

  for (const employeeId of matches) {
    const visited = new Set([employeeId]);
    let managerId = byId.get(employeeId)?.reportingManagerId;
    while (managerId && !visited.has(managerId)) {
      visited.add(managerId);
      const manager = byId.get(managerId);
      if (!manager) break;
      included.add(managerId);
      managerId = manager.reportingManagerId;
    }
  }

  return hierarchyRows(employees)
    .filter((row) => included.has(row.employee._id))
    .map((row) => ({ ...row, contextOnly: !matches.has(row.employee._id) }));
}
