const CALENDAR_URL_KEY = "minimal-todo-calendar-url";
const CALENDAR_CACHE_KEY = "minimal-todo-calendar-cache";
const CALENDAR_SYNC_KEY = "minimal-todo-calendar-last-sync";

const unfoldLines = (rawValue) =>
  rawValue.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");

const decodeText = (value = "") =>
  value
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");

const parseDateValue = (rawValue) => {
  if (!rawValue) {
    return null;
  }

  if (/^\d{8}$/.test(rawValue)) {
    const year = Number(rawValue.slice(0, 4));
    const month = Number(rawValue.slice(4, 6)) - 1;
    const day = Number(rawValue.slice(6, 8));
    return new Date(year, month, day);
  }

  const normalizedValue = rawValue.endsWith("Z")
    ? rawValue
    : rawValue.replace(/(\d{8})T(\d{6})$/, "$1T$2Z");

  const isoValue = normalizedValue.replace(
    /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/,
    "$1-$2-$3T$4:$5:$6Z",
  );

  const parsedDate = new Date(isoValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const parseEventBlock = (block) => {
  const event = {
    id: crypto.randomUUID(),
    title: "Untitled event",
    start: null,
    end: null,
    location: "",
  };

  for (const line of block) {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const rawKey = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);
    const key = rawKey.split(";")[0];

    if (key === "UID") {
      event.id = decodeText(value);
    }

    if (key === "SUMMARY") {
      event.title = decodeText(value);
    }

    if (key === "DTSTART") {
      event.start = parseDateValue(value);
    }

    if (key === "DTEND") {
      event.end = parseDateValue(value);
    }

    if (key === "LOCATION") {
      event.location = decodeText(value);
    }
  }

  if (!event.start) {
    return null;
  }

  return event;
};

export const parseIcsEvents = (rawValue) => {
  const lines = unfoldLines(rawValue).split(/\r?\n/);
  const events = [];
  let currentBlock = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      currentBlock = [];
      continue;
    }

    if (line === "END:VEVENT") {
      if (currentBlock) {
        const event = parseEventBlock(currentBlock);

        if (event) {
          events.push(event);
        }
      }

      currentBlock = null;
      continue;
    }

    if (currentBlock) {
      currentBlock.push(line);
    }
  }

  return events.sort((left, right) => left.start - right.start);
};

export const getSavedCalendarUrl = () =>
  window.localStorage.getItem(CALENDAR_URL_KEY) || "";

export const saveCalendarUrl = (url) => {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    window.localStorage.removeItem(CALENDAR_URL_KEY);
    return;
  }

  window.localStorage.setItem(CALENDAR_URL_KEY, trimmedUrl);
};

export const getCachedCalendarEvents = () => {
  const rawValue = window.localStorage.getItem(CALENDAR_CACHE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    return JSON.parse(rawValue).map((event) => ({
      ...event,
      start: new Date(event.start),
      end: event.end ? new Date(event.end) : null,
    }));
  } catch {
    return [];
  }
};

export const getLastCalendarSync = () =>
  window.localStorage.getItem(CALENDAR_SYNC_KEY) || "";

export const syncCalendarFromUrl = async (url) => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/calendar,text/plain;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error("calendar_fetch_failed");
  }

  const rawValue = await response.text();
  const events = parseIcsEvents(rawValue);

  window.localStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify(events));
  window.localStorage.setItem(CALENDAR_SYNC_KEY, new Date().toISOString());

  return events;
};

export const clearCalendarSync = () => {
  window.localStorage.removeItem(CALENDAR_URL_KEY);
  window.localStorage.removeItem(CALENDAR_CACHE_KEY);
  window.localStorage.removeItem(CALENDAR_SYNC_KEY);
};
