import type { ExpenseCategory } from "@/lib/types";

export function buildCategoryOptions(categories: ExpenseCategory[]) {
  const hasChildren = new Set(
    categories.filter((c) => c.parent_id).map((c) => c.parent_id),
  );
  const byId = new Map(categories.map((c) => [c.id, c]));

  return categories
    .filter((c) => !hasChildren.has(c.id))
    .map((c) => {
      const parent = c.parent_id ? byId.get(c.parent_id) : null;
      return {
        id: c.id,
        label: parent ? `${parent.name} > ${c.name}` : c.name,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
