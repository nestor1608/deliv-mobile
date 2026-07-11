// src/utils/params.ts
// Helper functions for useLocalSearchParams type handling

export function paramToString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

export function paramToStringArray(param: string | string[] | undefined): string[] {
  if (Array.isArray(param)) return param;
  return param ? [param] : [];
}
