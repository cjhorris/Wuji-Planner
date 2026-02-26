import { MONTHS, DATE_KEYS, LS_KEY } from "../constants";

export const uid = () =>
  `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const fmt = (d) =>
  `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;

export const fmtS = (d) =>
  `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;

export const toISO = (d) => {
  const x = new Date(d);
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

export const sameD = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const inRange = (d, s, e) => d >= s && d <= e;

export const nightsBetween = (a, b) =>
  Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));

export function serializeTrip(trip) {
  return JSON.parse(
    JSON.stringify(trip, (k, v) => (v instanceof Date ? v.toISOString() : v)),
  );
}

export function deserializeTrip(raw) {
  return JSON.parse(JSON.stringify(raw), (k, v) => {
    if (DATE_KEYS.has(k) && typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v))
      return new Date(v);
    return v;
  });
}

export function getOwnedIds() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addOwnedId(id) {
  const ids = getOwnedIds();
  if (!ids.includes(id))
    localStorage.setItem(LS_KEY, JSON.stringify([...ids, id]));
}

export function removeOwnedId(id) {
  localStorage.setItem(
    LS_KEY,
    JSON.stringify(getOwnedIds().filter((x) => x !== id)),
  );
}
