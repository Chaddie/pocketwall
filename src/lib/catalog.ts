import raw from "@/data/operations.json";

export type Operation = {
  id: string;
  method: string;
  path: string;
  title: string;
  description: string;
  group: string;
  example: Record<string, unknown> | null;
};

export const operations = raw as Operation[];

export function groupLabel(group: string) {
  return group
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function groups() {
  const counts = new Map<string, number>();
  for (const operation of operations) {
    if (operation.method === "GET" && !operation.path.includes("{")) {
      counts.set(operation.group, (counts.get(operation.group) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ id, label: groupLabel(id), count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function collections(group: string) {
  const inGroup = operations.filter((operation) => operation.group === group);
  const found: { path: string; title: string; description: string; canCreate: boolean }[] = [];
  for (const operation of inGroup) {
    if (operation.method !== "GET" || operation.path.includes("{") || operation.path.endsWith("/delete") || operation.path.endsWith("/move")) continue;
    found.push({
      path: operation.path,
      title: operation.title,
      description: operation.description,
      canCreate: inGroup.some((item) => item.method === "POST" && item.path === operation.path),
    });
  }
  return found;
}

export function createExample(path: string) {
  return operations.find((operation) => operation.method === "POST" && operation.path === path)?.example ?? { name: "" };
}
