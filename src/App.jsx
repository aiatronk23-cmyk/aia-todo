import { useEffect, useState } from "react";
import {
  clearCalendarSync,
  getCachedCalendarEvents,
  getLastCalendarSync,
  getSavedCalendarUrl,
  saveCalendarUrl,
  syncCalendarFromUrl,
} from "./lib/calendarStore";
import {
  createTask,
  deleteTaskById,
  getStoreModeLabel,
  isCloudSyncConfigured,
  loadTasks,
  removeDuplicateTasks,
  setTaskFocusById,
  subscribeToTaskChanges,
  toggleTaskById,
  updateTaskById,
} from "./lib/taskStore";

const DEFAULT_IMPORTANCE = "Medium";
const DEFAULT_LABEL_FILTER = "All labels";
const DEFAULT_IMPORTANCE_FILTER = "All importance";
const DEFAULT_DATE_FILTER = "All dates";
const DEFAULT_ADD_MODE = "manual";
const DEFAULT_FILTER_MODE = "manual";
const DEFAULT_PAGE = "home";
const FOCUS_STORAGE_KEY = "minimal-todo-focus-task-ids";
const CLOUD_REFRESH_INTERVAL_MS = 15000;

const starterTasks = [
  {
    id: "preset-1",
    text: "Voli per weekend mio compleanno",
    completed: false,
    dueDate: "",
    label: "Personal",
    importance: "High",
  },
  {
    id: "preset-2",
    text: "Mandare mail Andy Clarke",
    completed: true,
    dueDate: "",
    label: "Career",
    importance: "Medium",
  },
  {
    id: "preset-3",
    text: "Pulire AirPods max",
    completed: false,
    dueDate: "",
    label: "Personal",
    importance: "Low",
  },
  {
    id: "preset-4",
    text: "Bending Spoons mandare mail a HR aal@bendingspoons.com",
    completed: false,
    dueDate: "",
    label: "Career",
    importance: "High",
  },
  {
    id: "preset-5",
    text: "Collari full",
    completed: false,
    dueDate: "",
    label: "Personal",
    importance: "Low",
  },
  {
    id: "preset-6",
    text: "Fare new mental map di idee del futuro",
    completed: false,
    dueDate: "",
    label: "Personal",
    importance: "Medium",
  },
  {
    id: "preset-7",
    text: "Application Alessandro",
    completed: false,
    dueDate: "",
    label: "Career",
    importance: "High",
  },
  {
    id: "preset-8",
    text: "Guardare fellowship di Philip",
    completed: false,
    dueDate: "",
    label: "Career",
    importance: "Medium",
  },
  {
    id: "preset-9",
    text: "Leggere roba di Yousif",
    completed: false,
    dueDate: "",
    label: "Reading",
    importance: "Low",
  },
  {
    id: "preset-10",
    text: "Ricerca e application aziende di Jerome",
    completed: false,
    dueDate: "",
    label: "Career",
    importance: "High",
  },
  {
    id: "preset-11",
    text: "Finire di guardare link mandati Henry",
    completed: false,
    dueDate: "",
    label: "Career",
    importance: "Medium",
  },
  {
    id: "preset-12",
    text: "Organizzare tennis",
    completed: false,
    dueDate: "",
    label: "Personal",
    importance: "Low",
  },
  {
    id: "preset-13",
    text: "Mettere rosemary nel mio shampoo",
    completed: false,
    dueDate: "",
    label: "Personal",
    importance: "Low",
  },
  {
    id: "preset-14",
    text: "Data science online course",
    completed: false,
    dueDate: "",
    label: "Learning",
    importance: "Medium",
  },
  {
    id: "preset-15",
    text: "Chiedere a papa rimborsi",
    completed: false,
    dueDate: "",
    label: "Personal",
    importance: "Medium",
  },
  {
    id: "preset-16",
    text: "Ricerca e application aziende di Richa (LinkedIn)",
    completed: false,
    dueDate: "",
    label: "Career",
    importance: "High",
  },
  {
    id: "preset-17",
    text: "Organizzare call Miranda",
    completed: false,
    dueDate: "",
    label: "Personal",
    importance: "Medium",
  },
  {
    id: "preset-18",
    text: "Scrivere mail Mahdi",
    completed: false,
    dueDate: "",
    label: "Career",
    importance: "Medium",
  },
  {
    id: "preset-19",
    text: "Guardare discorso Steve Jobs Stanford",
    completed: false,
    dueDate: "",
    label: "Learning",
    importance: "Low",
  },
  {
    id: "preset-20",
    text: "Opal app dummy phone",
    completed: false,
    dueDate: "",
    label: "Personal",
    importance: "Low",
  },
  {
    id: "preset-21",
    text: "Prenotare dentista",
    completed: false,
    dueDate: "",
    label: "Health",
    importance: "High",
  },
  {
    id: "preset-22",
    text: "Trovare un libro da leggere su phenomenology",
    completed: false,
    dueDate: "",
    label: "Reading",
    importance: "Medium",
  },
  {
    id: "preset-23",
    text: "Alex Grzankowski - mandare mail e chiedere colloquio per parlare di diss",
    completed: false,
    dueDate: "",
    label: "Dissertation",
    importance: "High",
  },
  {
    id: "preset-24",
    text: "Problem sheet quantum 4, 5, 6, 7, 8, 9, 10, 11",
    completed: false,
    dueDate: "2026-05-28",
    label: "University",
    importance: "High",
  },
  {
    id: "preset-25",
    text: "Recuperare classe random structures and algorithms 2/12, 3/12, 9/12, 10/12, 16/12, 17/12",
    completed: false,
    dueDate: "2026-05-29",
    label: "University",
    importance: "High",
  },
  {
    id: "preset-26",
    text: "Week 10 Phil of art presentation for the seminar - find a structure from the text",
    completed: false,
    dueDate: "2026-04-02",
    label: "Deadline",
    importance: "High",
  },
  {
    id: "preset-27",
    text: "Meeting dissertation supervisor",
    completed: false,
    dueDate: "2026-04-02",
    label: "Dissertation",
    importance: "High",
  },
  {
    id: "preset-28",
    text: "Phil of art due",
    completed: false,
    dueDate: "2026-05-05",
    label: "Deadline",
    importance: "High",
  },
  {
    id: "preset-29",
    text: "Topics in applied ethics and politics due",
    completed: false,
    dueDate: "2026-05-05",
    label: "Deadline",
    importance: "High",
  },
  {
    id: "preset-30",
    text: "Dissertation due at 14:00",
    completed: false,
    dueDate: "2026-05-12",
    label: "Dissertation",
    importance: "High",
  },
  {
    id: "preset-31",
    text: "Quantum theory exam",
    completed: false,
    dueDate: "2026-05-28",
    label: "Exam",
    importance: "High",
  },
  {
    id: "preset-32",
    text: "Random structures and algorithms exam",
    completed: false,
    dueDate: "2026-05-29",
    label: "Exam",
    importance: "High",
  },
  {
    id: "preset-33",
    text: "Essay plan ethics",
    completed: false,
    dueDate: "2026-04-05",
    label: "Study Plan",
    importance: "High",
  },
  {
    id: "preset-34",
    text: "Essay plan art",
    completed: false,
    dueDate: "2026-04-12",
    label: "Study Plan",
    importance: "High",
  },
  {
    id: "preset-35",
    text: "Writing draft 1 essay ethics",
    completed: false,
    dueDate: "2026-04-12",
    label: "Study Plan",
    importance: "High",
  },
  {
    id: "preset-36",
    text: "Writing dissertation identity section",
    completed: false,
    dueDate: "2026-04-12",
    label: "Dissertation",
    importance: "High",
  },
  {
    id: "preset-37",
    text: "When bored random structure and algorithms go over theory",
    completed: false,
    dueDate: "2026-04-12",
    label: "Study Plan",
    importance: "Medium",
  },
  {
    id: "preset-38",
    text: "Draft 1 essay art",
    completed: false,
    dueDate: "2026-04-19",
    label: "Study Plan",
    importance: "High",
  },
  {
    id: "preset-39",
    text: "Dissertation Extended mind and AI section",
    completed: false,
    dueDate: "2026-04-19",
    label: "Dissertation",
    importance: "High",
  },
  {
    id: "preset-40",
    text: "When bored quantum theory go over theory",
    completed: false,
    dueDate: "2026-04-19",
    label: "Study Plan",
    importance: "Medium",
  },
  {
    id: "preset-41",
    text: "Finish essay ethics",
    completed: false,
    dueDate: "2026-04-19",
    label: "Study Plan",
    importance: "High",
  },
  {
    id: "preset-42",
    text: "Finish essay art",
    completed: false,
    dueDate: "2026-04-26",
    label: "Study Plan",
    importance: "High",
  },
  {
    id: "preset-43",
    text: "Dissertation write two sections before conclusion",
    completed: false,
    dueDate: "2026-04-26",
    label: "Dissertation",
    importance: "High",
  },
  {
    id: "preset-44",
    text: "Random structure and algorithms go over theory",
    completed: false,
    dueDate: "2026-04-26",
    label: "Study Plan",
    importance: "Medium",
  },
  {
    id: "preset-45",
    text: "Send in essay ethics",
    completed: false,
    dueDate: "2026-05-03",
    label: "Study Plan",
    importance: "High",
  },
  {
    id: "preset-46",
    text: "Send in essay art",
    completed: false,
    dueDate: "2026-05-03",
    label: "Study Plan",
    importance: "High",
  },
  {
    id: "preset-47",
    text: "Dissertation write conclusion",
    completed: false,
    dueDate: "2026-05-03",
    label: "Dissertation",
    importance: "High",
  },
  {
    id: "preset-48",
    text: "Send dissertation to people",
    completed: false,
    dueDate: "2026-05-03",
    label: "Dissertation",
    importance: "High",
  },
  {
    id: "preset-49",
    text: "Dissertation draft 2",
    completed: false,
    dueDate: "2026-05-10",
    label: "Dissertation",
    importance: "High",
  },
  {
    id: "preset-50",
    text: "Quantum go over theory",
    completed: false,
    dueDate: "2026-05-10",
    label: "Study Plan",
    importance: "Medium",
  },
  {
    id: "preset-51",
    text: "Send in dissertation",
    completed: false,
    dueDate: "2026-05-17",
    label: "Dissertation",
    importance: "High",
  },
  {
    id: "preset-52",
    text: "Exercises random structure and algorithms",
    completed: false,
    dueDate: "2026-05-17",
    label: "Study Plan",
    importance: "High",
  },
  {
    id: "preset-53",
    text: "Prepare for exams quantum",
    completed: false,
    dueDate: "2026-05-27",
    label: "Exam",
    importance: "High",
  },
  {
    id: "preset-54",
    text: "Prepare for exam random structure and algorithms",
    completed: false,
    dueDate: "2026-05-27",
    label: "Exam",
    importance: "High",
  },
];

const importanceLevels = ["Low", "Medium", "High"];
const dateFilters = [
  DEFAULT_DATE_FILTER,
  "Due today",
  "Due this week",
  "Due this month",
  "Upcoming",
  "Overdue",
  "No date",
  "Custom range",
];

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

const formatRelativeSyncTime = (value) => {
  if (!value) {
    return "Not synced yet";
  }

  const syncedDate = new Date(value);
  const minutesAgo = Math.round((Date.now() - syncedDate.getTime()) / 60000);

  if (minutesAgo < 1) {
    return "Updated just now";
  }

  if (minutesAgo < 60) {
    return `Updated ${minutesAgo} min ago`;
  }

  const hoursAgo = Math.round(minutesAgo / 60);
  return `Updated ${hoursAgo}h ago`;
};

const parseInputLabels = (value) =>
  [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];

const formatDueDate = (value) => {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
};

const getEndOfWeekKey = () => {
  const date = new Date();
  const day = date.getDay();
  const daysUntilSunday = (7 - day) % 7;
  date.setDate(date.getDate() + daysUntilSunday);
  return date.toISOString().slice(0, 10);
};

const getEndOfMonthKey = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1, 0);
  return date.toISOString().slice(0, 10);
};

const matchesDateFilter = (task, activeDateFilter, rangeStart, rangeEnd) => {
  const todayKey = getTodayKey();
  const endOfWeekKey = getEndOfWeekKey();
  const endOfMonthKey = getEndOfMonthKey();

  if (activeDateFilter === DEFAULT_DATE_FILTER) {
    return true;
  }

  if (activeDateFilter === "No date") {
    return !task.dueDate;
  }

  if (!task.dueDate) {
    return false;
  }

  if (activeDateFilter === "Custom range") {
    if (rangeStart && task.dueDate < rangeStart) {
      return false;
    }

    if (rangeEnd && task.dueDate > rangeEnd) {
      return false;
    }

    return Boolean(rangeStart || rangeEnd);
  }

  if (activeDateFilter === "Due today") {
    return task.dueDate === todayKey;
  }

  if (activeDateFilter === "Due this week") {
    return task.dueDate >= todayKey && task.dueDate <= endOfWeekKey;
  }

  if (activeDateFilter === "Due this month") {
    return task.dueDate >= todayKey && task.dueDate <= endOfMonthKey;
  }

  if (activeDateFilter === "Upcoming") {
    return task.dueDate > todayKey;
  }

  if (activeDateFilter === "Overdue") {
    return task.dueDate < todayKey;
  }

  return true;
};

const getSuggestedFocusTasks = (tasks, selectedTaskIds) => {
  const todayKey = getTodayKey();
  const upcomingThreshold = new Date();
  upcomingThreshold.setDate(upcomingThreshold.getDate() + 3);
  const upcomingThresholdKey = upcomingThreshold.toISOString().slice(0, 10);

  return tasks
    .filter((task) => !task.completed)
    .filter((task) => !selectedTaskIds.includes(task.id))
    .filter((task) => {
      if (task.dueDate && task.dueDate < todayKey) {
        return true;
      }

      if (task.dueDate === todayKey) {
        return true;
      }

      if (task.dueDate && task.dueDate <= upcomingThresholdKey) {
        return true;
      }

      return task.importance === "High";
    })
    .slice(0, 5);
};

const isTaskFocused = (task) => Boolean(task.focused);

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [label, setLabel] = useState("");
  const [importance, setImportance] = useState(DEFAULT_IMPORTANCE);
  const [activeLabel, setActiveLabel] = useState(DEFAULT_LABEL_FILTER);
  const [activeImportance, setActiveImportance] = useState(DEFAULT_IMPORTANCE_FILTER);
  const [activeDateFilter, setActiveDateFilter] = useState(DEFAULT_DATE_FILTER);
  const [activeDateFrom, setActiveDateFrom] = useState("");
  const [activeDateTo, setActiveDateTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [syncMode, setSyncMode] = useState(getStoreModeLabel());
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(true);
  const [isAddLabelPickerOpen, setIsAddLabelPickerOpen] = useState(false);
  const [isFocusPanelOpen, setIsFocusPanelOpen] = useState(true);
  const [isFocusSuggestionsOpen, setIsFocusSuggestionsOpen] = useState(false);
  const [homeDueScope, setHomeDueScope] = useState("today");
  const [calendarUrl, setCalendarUrl] = useState(getSavedCalendarUrl());
  const [calendarEvents, setCalendarEvents] = useState(getCachedCalendarEvents());
  const [calendarError, setCalendarError] = useState("");
  const [lastCalendarSync, setLastCalendarSync] = useState(getLastCalendarSync());
  const [isCalendarSyncing, setIsCalendarSyncing] = useState(false);
  const [addMode, setAddMode] = useState(DEFAULT_ADD_MODE);
  const [filterMode, setFilterMode] = useState(DEFAULT_FILTER_MODE);
  const [aiTaskPrompt, setAiTaskPrompt] = useState("");
  const [aiTaskMessage, setAiTaskMessage] = useState("");
  const [isAiTaskLoading, setIsAiTaskLoading] = useState(false);
  const [aiFilterPrompt, setAiFilterPrompt] = useState("");
  const [aiFilterMessage, setAiFilterMessage] = useState("");
  const [isAiFilterLoading, setIsAiFilterLoading] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [openMenuTaskId, setOpenMenuTaskId] = useState("");
  const [activePage, setActivePage] = useState(DEFAULT_PAGE);
  const [editDraft, setEditDraft] = useState({
    text: "",
    labels: "",
    dueDate: "",
    importance: DEFAULT_IMPORTANCE,
  });

  useEffect(() => {
    if (!openMenuTaskId) {
      return undefined;
    }

    const handlePointerDown = () => {
      setOpenMenuTaskId("");
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenMenuTaskId("");
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuTaskId]);

  useEffect(() => {
    let isMounted = true;

    const fetchTasks = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        let nextTasks = await loadTasks();
        nextTasks = await removeDuplicateTasks(nextTasks);

        try {
          const rawFocusIds = window.localStorage.getItem(FOCUS_STORAGE_KEY);
          const legacyFocusIds = rawFocusIds ? JSON.parse(rawFocusIds) : [];
          const idsToMigrate = legacyFocusIds.filter((taskId) =>
            nextTasks.some((task) => task.id === taskId && !task.focused),
          );

          if (idsToMigrate.length > 0) {
            await Promise.all(idsToMigrate.map((taskId) => setTaskFocusById(taskId, true)));
            nextTasks = await removeDuplicateTasks(await loadTasks());
          }

          if (legacyFocusIds.length > 0) {
            window.localStorage.removeItem(FOCUS_STORAGE_KEY);
          }
        } catch {
          window.localStorage.removeItem(FOCUS_STORAGE_KEY);
        }

        if (isMounted) {
          setTasks(nextTasks);
          setSyncMode(getStoreModeLabel());
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Could not load your tasks right now.");
          setSyncMode(getStoreModeLabel());
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isCloudSyncConfigured()) {
      return undefined;
    }

    let isCancelled = false;

    const refreshTasks = async () => {
      if (isCancelled || editingTaskId) {
        return;
      }

      try {
        const nextTasks = await loadTasks();

        if (!isCancelled) {
          setTasks(nextTasks);
          setSyncMode(getStoreModeLabel());
        }
      } catch {
        if (!isCancelled) {
          setSyncMode(getStoreModeLabel());
        }
      }
    };

    const handleWindowFocus = () => {
      refreshTasks();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshTasks();
      }
    };

    const intervalId = window.setInterval(refreshTasks, CLOUD_REFRESH_INTERVAL_MS);
    const unsubscribeFromTaskChanges = subscribeToTaskChanges(refreshTasks);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      unsubscribeFromTaskChanges();
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [editingTaskId]);

  const handleCalendarSync = async (event) => {
    event.preventDefault();
    const nextUrl = calendarUrl.trim();

    if (!nextUrl) {
      return;
    }

    setIsCalendarSyncing(true);
    setCalendarError("");

    try {
      saveCalendarUrl(nextUrl);
      const events = await syncCalendarFromUrl(nextUrl);
      setCalendarEvents(events);
      setLastCalendarSync(getLastCalendarSync());
    } catch {
      setCalendarError(
        "Could not sync that calendar feed. Make sure it is a public ICS URL with browser access.",
      );
    } finally {
      setIsCalendarSyncing(false);
    }
  };

  const handleCalendarDisconnect = () => {
    clearCalendarSync();
    setCalendarUrl("");
    setCalendarEvents([]);
    setLastCalendarSync("");
    setCalendarError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    const nextLabel = label.trim();

    if (!text) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const createdTask = await createTask({
        text,
        completed: false,
        focused: false,
        dueDate,
        labels: parseInputLabels(nextLabel).length
          ? parseInputLabels(nextLabel)
          : ["General"],
        importance,
      });

      setTasks((currentTasks) => [createdTask, ...currentTasks]);
      setDraft("");
      setDueDate("");
      setLabel("");
      setImportance(DEFAULT_IMPORTANCE);
      setSyncMode(getStoreModeLabel());
    } catch {
      setErrorMessage("Could not save that task.");
      setSyncMode(getStoreModeLabel());
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiTaskSubmit = async (event) => {
    event.preventDefault();
    const prompt = aiTaskPrompt.trim();

    if (!prompt) {
      return;
    }

    setIsAiTaskLoading(true);
    setAiTaskMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/ai/task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          labels: [...new Set(tasks.flatMap((task) => task.labels || [task.label]).filter(Boolean))],
          today: getTodayKey(),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "AI task parsing failed.");
      }

      const createdTask = await createTask({
        text: payload.text,
        completed: payload.completed,
        focused: false,
        dueDate: payload.dueDate,
        labels: [payload.label || "General"],
        importance: payload.importance || DEFAULT_IMPORTANCE,
      });

      setTasks((currentTasks) => [createdTask, ...currentTasks]);
      setAiTaskPrompt("");
      setAiTaskMessage(payload.summary || "Task added with AI.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not add that AI task.",
      );
      setSyncMode(getStoreModeLabel());
    } finally {
      setIsAiTaskLoading(false);
    }
  };

  const handleAiFilterSubmit = async (event) => {
    event.preventDefault();
    const prompt = aiFilterPrompt.trim();

    if (!prompt) {
      return;
    }

    setIsAiFilterLoading(true);
    setAiFilterMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/ai/filter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          labels: [...new Set(tasks.flatMap((task) => task.labels || [task.label]).filter(Boolean))],
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "AI filter parsing failed.");
      }

      setActiveLabel(
        labels.includes(payload.label) ? payload.label : DEFAULT_LABEL_FILTER,
      );
      setActiveImportance(payload.importance || DEFAULT_IMPORTANCE_FILTER);
      setActiveDateFilter(payload.dateFilter || DEFAULT_DATE_FILTER);
      setAiFilterMessage(payload.summary || "Filters updated with AI.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not apply those AI filters.",
      );
    } finally {
      setIsAiFilterLoading(false);
    }
  };

  const handleToggleTask = async (id) => {
    const existingTask = tasks.find((task) => task.id === id);

    if (!existingTask) {
      return;
    }

    const nextCompleted = !existingTask.completed;

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, completed: nextCompleted } : task,
      ),
    );
    setErrorMessage("");

    try {
      await toggleTaskById(id, nextCompleted);
      setSyncMode(getStoreModeLabel());
    } catch {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === id ? { ...task, completed: existingTask.completed } : task,
        ),
      );
      setErrorMessage("Could not update that task.");
      setSyncMode(getStoreModeLabel());
    }
  };

  const handleDeleteTask = async (id) => {
    const previousTasks = tasks;

    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
    setErrorMessage("");

    try {
      await deleteTaskById(id);
      setSyncMode(getStoreModeLabel());
    } catch {
      setTasks(previousTasks);
      setErrorMessage("Could not delete that task.");
      setSyncMode(getStoreModeLabel());
    }
  };

  const handleAddToFocusNow = async (id) => {
    const previousTasks = tasks;

    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === id ? { ...task, focused: true } : task)),
    );
    setOpenMenuTaskId("");
    setErrorMessage("");

    try {
      await setTaskFocusById(id, true);
      setSyncMode(getStoreModeLabel());
    } catch {
      setTasks(previousTasks);
      setErrorMessage("Could not update Focus Now.");
      setSyncMode(getStoreModeLabel());
    }
  };

  const handleRemoveFromFocusNow = async (id) => {
    const previousTasks = tasks;

    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === id ? { ...task, focused: false } : task)),
    );
    setOpenMenuTaskId("");
    setErrorMessage("");

    try {
      await setTaskFocusById(id, false);
      setSyncMode(getStoreModeLabel());
    } catch {
      setTasks(previousTasks);
      setErrorMessage("Could not update Focus Now.");
      setSyncMode(getStoreModeLabel());
    }
  };

  const handleStartEditing = (task) => {
    setEditingTaskId(task.id);
    setOpenMenuTaskId("");
    setEditDraft({
      text: task.text,
      labels: (task.labels || [task.label]).join(", "),
      dueDate: task.dueDate,
      importance: task.importance,
    });
  };

  const handleCancelEditing = () => {
    setEditingTaskId("");
    setEditDraft({
      text: "",
      labels: "",
      dueDate: "",
      importance: DEFAULT_IMPORTANCE,
    });
  };

  const handleSaveEdit = async (id) => {
    const text = editDraft.text.trim();

    if (!text) {
      return;
    }

    setErrorMessage("");

    try {
      const updatedTask = await updateTaskById(id, {
        text,
        labels: parseInputLabels(editDraft.labels).length
          ? parseInputLabels(editDraft.labels)
          : ["General"],
        dueDate: editDraft.dueDate,
        importance: editDraft.importance,
        completed: tasks.find((task) => task.id === id)?.completed ?? false,
        focused: tasks.find((task) => task.id === id)?.focused ?? false,
      });

      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === id ? updatedTask : task)),
      );
      setSyncMode(getStoreModeLabel());
      handleCancelEditing();
    } catch {
      setErrorMessage("Could not save that task edit.");
      setSyncMode(getStoreModeLabel());
    }
  };

  const labels = [
    DEFAULT_LABEL_FILTER,
    ...new Set(tasks.flatMap((task) => task.labels || [task.label]).filter(Boolean)),
  ];

  const visibleTasks = tasks.filter((task) => {
    const matchesLabel =
      activeLabel === DEFAULT_LABEL_FILTER ||
      (task.labels || [task.label]).includes(activeLabel);
    const matchesImportance =
      activeImportance === DEFAULT_IMPORTANCE_FILTER ||
      task.importance === activeImportance;
    const matchesDate = matchesDateFilter(
      task,
      activeDateFilter,
      activeDateFrom,
      activeDateTo,
    );

    return matchesLabel && matchesImportance && matchesDate;
  });

  const remainingCount = visibleTasks.filter((task) => !task.completed).length;
  const dueTodayTasks = tasks.filter(
    (task) => !task.completed && task.dueDate === getTodayKey(),
  );
  const dueThisWeekTasks = tasks.filter(
    (task) =>
      !task.completed &&
      task.dueDate &&
      task.dueDate >= getTodayKey() &&
      task.dueDate <= getEndOfWeekKey(),
  );
  const dueThisMonthTasks = tasks.filter(
    (task) =>
      !task.completed &&
      task.dueDate &&
      task.dueDate >= getTodayKey() &&
      task.dueDate <= getEndOfMonthKey(),
  );
  const focusTasks = tasks.filter((task) => task.focused);
  const suggestedFocusTasks = getSuggestedFocusTasks(
    tasks,
    tasks.filter((task) => task.focused).map((task) => task.id),
  );
  const homeDueTasks =
    homeDueScope === "today"
      ? dueTodayTasks
      : homeDueScope === "week"
        ? dueThisWeekTasks
        : dueThisMonthTasks;

  return (
    <main className="page-shell">
      <section className="todo-card">
        <header className="hero">
          <div className="hero-topbar">
            <div>
              <p className="eyebrow">Aia's To-Do</p>
              <h1>Keep track of what matters.</h1>
              <p className="hero-copy">
                Your tasks stay in sync when the app is connected to Supabase, so
                the same list can follow you across devices.
              </p>
            </div>
            <div className="page-switch" role="tablist" aria-label="App sections">
              <button
                className={activePage === "home" ? "page-chip is-active" : "page-chip"}
                type="button"
                onClick={() => setActivePage("home")}
              >
                Home
              </button>
              <button
                className={activePage === "tasks" ? "page-chip is-active" : "page-chip"}
                type="button"
                onClick={() => setActivePage("tasks")}
              >
                Tasks
              </button>
              <button
                className={activePage === "settings" ? "page-chip is-active" : "page-chip"}
                type="button"
                onClick={() => setActivePage("settings")}
              >
                Settings
              </button>
            </div>
          </div>
        </header>

        {activePage === "home" ? (
          <>
            <section className="panel">
              <div className="panel-header panel-header--row">
                <div>
                  <h2>Focus Now</h2>
                  <p>Pin the tasks you want front and center, with smart suggestions underneath.</p>
                </div>
                <button
                  className="panel-toggle"
                  type="button"
                  onClick={() => setIsFocusPanelOpen((currentValue) => !currentValue)}
                  aria-expanded={isFocusPanelOpen}
                >
                  {isFocusPanelOpen ? "Hide focus now" : "Show focus now"}
                </button>
              </div>

              {isFocusPanelOpen ? (
                <div className="focus-column">
                  <div className="focus-column-header">
                    <strong>Selected tasks</strong>
                    <span>{focusTasks.length} pinned</span>
                  </div>
                  <ul className="focus-list">
                    {focusTasks.length > 0 ? (
                      focusTasks.map((task) => (
                        <li className="focus-item focus-item--selected" key={`focus-${task.id}`}>
                          <label className="focus-task-row">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => handleToggleTask(task.id)}
                            />
                            <span className="task-copy">
                              <span
                                className={task.completed ? "task-text is-complete" : "task-text"}
                              >
                                {task.text}
                              </span>
                              <span className="task-meta">
                                <span className="task-focus-badge">Focus Now</span>
                                {(task.labels || [task.label]).map((taskLabel) => (
                                  <span className="task-label" key={`focus-label-${task.id}-${taskLabel}`}>
                                    {taskLabel}
                                  </span>
                                ))}
                                <span
                                  className={`task-importance task-importance--${task.importance.toLowerCase()}`}
                                >
                                  {task.importance}
                                </span>
                                <span className="task-date">Due {formatDueDate(task.dueDate)}</span>
                              </span>
                            </span>
                          </label>
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => handleRemoveFromFocusNow(task.id)}
                          >
                            Remove
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="empty-state">Use the three-dot menu on a task to add it to Focus Now.</li>
                    )}
                  </ul>

                  <div className="focus-suggestions-toggle">
                    <button
                      className="panel-toggle"
                      type="button"
                      onClick={() =>
                        setIsFocusSuggestionsOpen((currentValue) => !currentValue)
                      }
                      aria-expanded={isFocusSuggestionsOpen}
                    >
                      {isFocusSuggestionsOpen ? "Hide suggestions" : "Show suggestions"}
                    </button>
                  </div>

                  {isFocusSuggestionsOpen ? (
                    <div className="focus-suggestions-section">
                      <div className="focus-column-header">
                        <strong>Suggestions</strong>
                        <span>Due soon or high importance</span>
                      </div>
                      <ul className="focus-list">
                        {suggestedFocusTasks.length > 0 ? (
                          suggestedFocusTasks.map((task) => (
                            <li
                              className={`focus-item ${
                                task.importance === "High" ? "focus-item--important" : "focus-item--urgent"
                              }`}
                              key={`suggested-${task.id}`}
                            >
                              <span className="focus-kind">Suggested</span>
                              <strong>{task.text}</strong>
                              <span>
                                {task.dueDate ? `Due ${formatDueDate(task.dueDate)}` : "No due date"}
                              </span>
                              <button
                                className="secondary-button"
                                type="button"
                                onClick={() => handleAddToFocusNow(task.id)}
                              >
                                Add to Focus Now
                              </button>
                            </li>
                          ))
                        ) : (
                          <li className="empty-state">No extra suggestions right now.</li>
                        )}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="panel-collapsed-copy">
                  Focus Now is hidden so you can keep the task list compact.
                </p>
              )}
            </section>
            <section className="panel">
              <div className="panel-header panel-header--row">
                <div>
                  <h2>
                    {homeDueScope === "today"
                      ? "Due Today"
                      : homeDueScope === "week"
                        ? "Due This Week"
                        : "Due This Month"}
                  </h2>
                  <p>Tasks automatically surfaced for the selected time window.</p>
                </div>
                <div className="mode-switch" role="tablist" aria-label="Due window">
                  <button
                    className={homeDueScope === "today" ? "mode-chip is-active" : "mode-chip"}
                    type="button"
                    onClick={() => setHomeDueScope("today")}
                  >
                    Today
                  </button>
                  <button
                    className={homeDueScope === "week" ? "mode-chip is-active" : "mode-chip"}
                    type="button"
                    onClick={() => setHomeDueScope("week")}
                  >
                    This week
                  </button>
                  <button
                    className={homeDueScope === "month" ? "mode-chip is-active" : "mode-chip"}
                    type="button"
                    onClick={() => setHomeDueScope("month")}
                  >
                    This month
                  </button>
                </div>
              </div>
              <ul className="focus-list">
                {homeDueTasks.length > 0 ? (
                  homeDueTasks.map((task) => (
                    <li className="focus-item focus-item--urgent" key={`due-window-${task.id}`}>
                      <label className="focus-task-row">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id)}
                        />
                        <span className="task-copy">
                          <span className={task.completed ? "task-text is-complete" : "task-text"}>
                            {task.text}
                          </span>
                          <span className="task-meta">
                            {isTaskFocused(task) ? (
                              <span className="task-focus-badge">Focus Now</span>
                            ) : null}
                            {(task.labels || [task.label]).map((taskLabel) => (
                              <span className="task-label" key={`due-today-label-${task.id}-${taskLabel}`}>
                                {taskLabel}
                              </span>
                            ))}
                            <span
                              className={`task-importance task-importance--${task.importance.toLowerCase()}`}
                            >
                              {task.importance}
                            </span>
                            <span className="task-date">Due {formatDueDate(task.dueDate)}</span>
                          </span>
                        </span>
                      </label>
                      <button
                        className="secondary-button focus-inline-action"
                        type="button"
                        onClick={() =>
                          isTaskFocused(task)
                            ? handleRemoveFromFocusNow(task.id)
                            : handleAddToFocusNow(task.id)
                        }
                      >
                        {isTaskFocused(task)
                          ? "Remove from Focus Now"
                          : "Add to Focus Now"}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="empty-state">Nothing is due in this time window.</li>
                )}
              </ul>
            </section>
          </>
        ) : activePage === "tasks" ? (
          <>

        <section className="panel">
          <div className="panel-header panel-header--row">
            <div>
              <h2>Add Task</h2>
              <p>Switch between manual controls and AI-assisted task capture.</p>
            </div>
            <button
              className="panel-toggle"
              type="button"
              onClick={() => setIsAddPanelOpen((currentValue) => !currentValue)}
              aria-expanded={isAddPanelOpen}
            >
              {isAddPanelOpen ? "Hide add task" : "Show add task"}
            </button>
          </div>
          {isAddPanelOpen ? (
            <>
              <div className="mode-switch" role="tablist" aria-label="Add task mode">
                <button
                  className={addMode === "manual" ? "mode-chip is-active" : "mode-chip"}
                  type="button"
                  onClick={() => setAddMode("manual")}
                >
                  Manual
                </button>
                <button
                  className={addMode === "ai" ? "mode-chip is-active" : "mode-chip"}
                  type="button"
                  onClick={() => setAddMode("ai")}
                >
                  AI
                </button>
              </div>

              {addMode === "manual" ? (
                <form className="task-form" onSubmit={handleSubmit}>
                  <div className="form-field form-field--wide">
                    <label className="field-label" htmlFor="task-input">
                      Task
                    </label>
                    <input
                      id="task-input"
                      type="text"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Add a new task"
                    />
                  </div>
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="field-label" htmlFor="task-label">
                        Labels
                      </label>
                      <div className="label-picker">
                        <div className="label-picker-input">
                          <input
                            id="task-label"
                            type="text"
                            value={label}
                            onChange={(event) => setLabel(event.target.value)}
                            placeholder="Work, Urgent, Personal"
                          />
                          <button
                            className="label-picker-toggle"
                            type="button"
                            aria-expanded={isAddLabelPickerOpen}
                            onClick={() =>
                              setIsAddLabelPickerOpen((currentValue) => !currentValue)
                            }
                          >
                            ▾
                          </button>
                        </div>
                        {isAddLabelPickerOpen ? (
                          <div className="label-suggestions-banner">
                            <div className="label-suggestions">
                              {labels
                                .filter((item) => item !== DEFAULT_LABEL_FILTER)
                                .map((item) => (
                                  <button
                                    key={item}
                                    className="label-suggestion"
                                    type="button"
                                    onClick={() =>
                                      setLabel((currentValue) => {
                                        const currentLabels = parseInputLabels(currentValue);

                                        if (currentLabels.includes(item)) {
                                          return currentLabels.join(", ");
                                        }

                                        return [...currentLabels, item].join(", ");
                                      })
                                    }
                                  >
                                    {item}
                                  </button>
                                ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="form-field">
                      <label className="field-label" htmlFor="task-date">
                        Due date
                      </label>
                      <input
                        id="task-date"
                        type="date"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-label" htmlFor="task-importance">
                        Importance
                      </label>
                      <select
                        id="task-importance"
                        value={importance}
                        onChange={(event) => setImportance(event.target.value)}
                      >
                        {importanceLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button className="primary-button" type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Add task"}
                    </button>
                  </div>
                </form>
              ) : (
                <form className="ai-form" onSubmit={handleAiTaskSubmit}>
                  <div className="form-field form-field--wide">
                    <label className="field-label" htmlFor="ai-task-input">
                      Tell the app what to add
                    </label>
                    <textarea
                      id="ai-task-input"
                      value={aiTaskPrompt}
                      onChange={(event) => setAiTaskPrompt(event.target.value)}
                      placeholder="Add a high-priority Health task to book the dentist for next Tuesday"
                      rows={4}
                    />
                  </div>
                  <div className="ai-actions">
                    <p className="assistant-note">
                      The AI will infer the task title, labels, due date, and importance for you.
                    </p>
                    <button className="primary-button" type="submit" disabled={isAiTaskLoading}>
                      {isAiTaskLoading ? "Thinking..." : "Add with AI"}
                    </button>
                  </div>
                  {aiTaskMessage ? <p className="assistant-feedback">{aiTaskMessage}</p> : null}
                </form>
              )}
            </>
          ) : (
            <p className="panel-collapsed-copy">
              The add-task form is hidden so you can focus on your task list.
            </p>
          )}
        </section>

        <section className="panel">
          <div className="panel-header panel-header--row">
            <div>
              <h2>Filters</h2>
              <p>Use direct controls or ask AI to focus the list for you.</p>
            </div>
            <div className="task-summary">
              <span>{remainingCount} remaining</span>
              <span>{visibleTasks.length} shown</span>
            </div>
          </div>

          <div className="mode-switch" role="tablist" aria-label="Filter mode">
            <button
              className={filterMode === "manual" ? "mode-chip is-active" : "mode-chip"}
              type="button"
              onClick={() => setFilterMode("manual")}
            >
              Manual
            </button>
            <button
              className={filterMode === "ai" ? "mode-chip is-active" : "mode-chip"}
              type="button"
              onClick={() => setFilterMode("ai")}
            >
              AI
            </button>
          </div>

          {filterMode === "manual" ? (
            <>
              <div className="filter-bar">
                <div className="filter-field">
                  <label className="filter-label" htmlFor="label-filter">
                    Group
                  </label>
                  <select
                    id="label-filter"
                    className="filter-select"
                    value={activeLabel}
                    onChange={(event) => setActiveLabel(event.target.value)}
                  >
                    {labels.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-field">
                  <label className="filter-label" htmlFor="importance-filter">
                    Importance
                  </label>
                  <select
                    id="importance-filter"
                    className="filter-select"
                    value={activeImportance}
                    onChange={(event) => setActiveImportance(event.target.value)}
                  >
                    <option value={DEFAULT_IMPORTANCE_FILTER}>
                      {DEFAULT_IMPORTANCE_FILTER}
                    </option>
                    {importanceLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-field">
                  <label className="filter-label" htmlFor="date-filter">
                    Date
                  </label>
                  <select
                    id="date-filter"
                    className="filter-select"
                    value={activeDateFilter}
                    onChange={(event) => setActiveDateFilter(event.target.value)}
                  >
                    {dateFilters.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {activeDateFilter === "Custom range" ? (
                <div className="date-range-grid">
                  <div className="filter-field">
                    <label className="filter-label" htmlFor="date-from-filter">
                      From
                    </label>
                    <input
                      id="date-from-filter"
                      type="date"
                      value={activeDateFrom}
                      onChange={(event) => setActiveDateFrom(event.target.value)}
                    />
                  </div>
                  <div className="filter-field">
                    <label className="filter-label" htmlFor="date-to-filter">
                      To
                    </label>
                    <input
                      id="date-to-filter"
                      type="date"
                      value={activeDateTo}
                      onChange={(event) => setActiveDateTo(event.target.value)}
                    />
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <form className="ai-form" onSubmit={handleAiFilterSubmit}>
              <div className="form-field form-field--wide">
                <label className="field-label" htmlFor="ai-filter-input">
                  Tell the app what to show
                </label>
                <textarea
                  id="ai-filter-input"
                  value={aiFilterPrompt}
                  onChange={(event) => setAiFilterPrompt(event.target.value)}
                  placeholder="Show me the urgent dissertation tasks due soon"
                  rows={3}
                />
              </div>
              <div className="ai-actions">
                <p className="assistant-note">
                  The AI will translate your request into group, importance, and date filters.
                </p>
                <button className="primary-button" type="submit" disabled={isAiFilterLoading}>
                  {isAiFilterLoading ? "Thinking..." : "Filter with AI"}
                </button>
              </div>
              {aiFilterMessage ? <p className="assistant-feedback">{aiFilterMessage}</p> : null}
            </form>
          )}
        </section>

        {errorMessage ? <p className="status-message">{errorMessage}</p> : null}

        <ul className="task-list">
          {isLoading ? (
            <li className="empty-state">Loading your tasks…</li>
          ) : null}
          {!isLoading &&
            visibleTasks.map((task) => (
              <li className="task-item" key={task.id}>
                {editingTaskId === task.id ? (
                  <div className="task-editor">
                    <div className="task-editor-header">
                      <div>
                        <strong>Edit task</strong>
                        <p>Update the task title, labels, due date, or importance.</p>
                      </div>
                    </div>
                    <div className="form-field form-field--wide">
                      <label className="field-label" htmlFor={`edit-text-${task.id}`}>
                        Task
                      </label>
                      <input
                        id={`edit-text-${task.id}`}
                        type="text"
                        value={editDraft.text}
                        onChange={(event) =>
                          setEditDraft((currentValue) => ({
                            ...currentValue,
                            text: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="edit-grid">
                      <div className="form-field">
                        <label className="field-label" htmlFor={`edit-labels-${task.id}`}>
                          Labels
                        </label>
                        <div className="label-picker">
                          <input
                            id={`edit-labels-${task.id}`}
                            type="text"
                            value={editDraft.labels}
                            onChange={(event) =>
                              setEditDraft((currentValue) => ({
                                ...currentValue,
                                labels: event.target.value,
                              }))
                            }
                            placeholder="Work, Urgent, Personal"
                          />
                          <div className="label-suggestions">
                            {labels
                              .filter((item) => item !== DEFAULT_LABEL_FILTER)
                              .map((item) => (
                                <button
                                  key={`edit-${task.id}-${item}`}
                                  className="label-suggestion"
                                  type="button"
                                  onClick={() =>
                                    setEditDraft((currentValue) => {
                                      const currentLabels = parseInputLabels(currentValue.labels);

                                      if (currentLabels.includes(item)) {
                                        return {
                                          ...currentValue,
                                          labels: currentLabels.join(", "),
                                        };
                                      }

                                      return {
                                        ...currentValue,
                                        labels: [...currentLabels, item].join(", "),
                                      };
                                    })
                                  }
                                >
                                  {item}
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                      <div className="form-field">
                        <label className="field-label" htmlFor={`edit-date-${task.id}`}>
                          Due date
                        </label>
                        <input
                          id={`edit-date-${task.id}`}
                          type="date"
                          value={editDraft.dueDate}
                          onChange={(event) =>
                            setEditDraft((currentValue) => ({
                              ...currentValue,
                              dueDate: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="form-field">
                        <label className="field-label" htmlFor={`edit-importance-${task.id}`}>
                          Importance
                        </label>
                        <select
                          id={`edit-importance-${task.id}`}
                          value={editDraft.importance}
                          onChange={(event) =>
                            setEditDraft((currentValue) => ({
                              ...currentValue,
                              importance: event.target.value,
                            }))
                          }
                        >
                          {importanceLevels.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="task-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={handleCancelEditing}
                      >
                        Cancel
                      </button>
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => handleSaveEdit(task.id)}
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="task-toggle">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id)}
                      />
                      <span className="task-copy">
                        <span
                          className={task.completed ? "task-text is-complete" : "task-text"}
                        >
                          {task.text}
                        </span>
                        <span className="task-meta">
                          {isTaskFocused(task) ? (
                            <span className="task-focus-badge">Focus Now</span>
                          ) : null}
                          {(task.labels || [task.label]).map((taskLabel) => (
                            <span className="task-label" key={`${task.id}-${taskLabel}`}>
                              {taskLabel}
                            </span>
                          ))}
                          <span
                            className={`task-importance task-importance--${task.importance.toLowerCase()}`}
                          >
                            {task.importance}
                          </span>
                          <span className="task-date">
                            Due {formatDueDate(task.dueDate)}
                          </span>
                        </span>
                      </span>
                    </label>
                    <div
                      className="task-menu"
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <button
                        className="menu-trigger"
                        type="button"
                        aria-label={`Open actions for ${task.text}`}
                        aria-expanded={openMenuTaskId === task.id}
                        aria-haspopup="menu"
                        onClick={() =>
                          setOpenMenuTaskId((currentValue) =>
                            currentValue === task.id ? "" : task.id,
                          )
                        }
                      >
                        <span />
                        <span />
                        <span />
                      </button>
                      {openMenuTaskId === task.id ? (
                        <div className="task-menu-popover" role="menu">
                          {isTaskFocused(task) ? (
                            <button
                              className="task-menu-item"
                              type="button"
                              role="menuitem"
                              onClick={() => handleRemoveFromFocusNow(task.id)}
                            >
                              <span className="task-menu-item-icon">Focus</span>
                              <span className="task-menu-item-copy">Remove from Focus Now</span>
                            </button>
                          ) : (
                            <button
                              className="task-menu-item"
                              type="button"
                              role="menuitem"
                              onClick={() => handleAddToFocusNow(task.id)}
                            >
                              <span className="task-menu-item-icon">Focus</span>
                              <span className="task-menu-item-copy">Add to Focus Now</span>
                            </button>
                          )}
                          <button
                            className="task-menu-item"
                            type="button"
                            role="menuitem"
                            onClick={() => handleStartEditing(task)}
                          >
                            <span className="task-menu-item-icon">Edit</span>
                            <span className="task-menu-item-copy">Open editor</span>
                          </button>
                          <button
                            className="task-menu-item task-menu-item--danger"
                            type="button"
                            role="menuitem"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <span className="task-menu-item-icon">Delete</span>
                            <span className="task-menu-item-copy">Remove task</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </>
                )}
              </li>
            ))}
          {!isLoading && visibleTasks.length === 0 ? (
            <li className="empty-state">
              No tasks match the current filters yet.
            </li>
          ) : null}
        </ul>
          </>
        ) : (
          <section className="panel">
            <div className="panel-header panel-header--row">
              <div>
                <h2>Settings</h2>
                <p>Manage background integrations and app-level connections here.</p>
              </div>
            </div>

            <div className="settings-stack">
              <section className="settings-card">
                <div className="panel-header">
                  <h2>Cloud Sync</h2>
                  <p>
                    {syncMode === "Cloud sync enabled"
                      ? "Changes sync across devices using your online database."
                      : syncMode === "Cloud sync retrying"
                        ? "Supabase requests are retrying automatically. The app will stay in cloud mode unless repeated requests keep failing."
                        : "Supabase is unavailable or not configured, so tasks are currently staying on this device."}
                  </p>
                </div>
                <div className="sync-banner">
                  <span className="sync-badge">{syncMode}</span>
                  <span className="sync-copy">
                    Check this section whenever you want to confirm whether your tasks are syncing to the cloud.
                  </span>
                </div>
              </section>
              <section className="settings-card">
                <div className="panel-header panel-header--row">
                  <div>
                    <h2>Calendar Sync</h2>
                    <p>
                      Paste a public iCal or ICS feed URL to bring your calendar into the app.
                    </p>
                  </div>
                  <button className="panel-toggle" type="button" onClick={handleCalendarDisconnect}>
                    Disconnect
                  </button>
                </div>

                <form className="calendar-form" onSubmit={handleCalendarSync}>
                  <div className="form-field form-field--wide">
                    <label className="field-label" htmlFor="calendar-url">
                      Calendar feed URL
                    </label>
                    <input
                      id="calendar-url"
                      type="url"
                      value={calendarUrl}
                      onChange={(event) => setCalendarUrl(event.target.value)}
                      placeholder="https://example.com/calendar.ics"
                    />
                  </div>
                  <button className="primary-button" type="submit" disabled={isCalendarSyncing}>
                    {isCalendarSyncing ? "Syncing..." : "Sync calendar"}
                  </button>
                </form>

                {calendarError ? <p className="status-message">{calendarError}</p> : null}
              </section>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
