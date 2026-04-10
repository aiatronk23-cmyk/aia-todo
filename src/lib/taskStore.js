import { createClient } from "@supabase/supabase-js";

const STORAGE_KEY = "minimal-todo-tasks";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 400;
const LOCAL_ONLY_THRESHOLD = 2;
const LABEL_SEPARATOR = " | ";

const supabase = hasSupabaseConfig
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let consecutiveCloudFailures = 0;

const sleep = (delayMs) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });

const sortTasks = (tasks) =>
  [...tasks].sort((left, right) => {
    if (left.completed !== right.completed) {
      return left.completed ? -1 : 1;
    }

    if (left.dueDate && right.dueDate && left.dueDate !== right.dueDate) {
      return left.dueDate.localeCompare(right.dueDate);
    }

    if (left.dueDate && !right.dueDate) {
      return -1;
    }

    if (!left.dueDate && right.dueDate) {
      return 1;
    }

    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });

const parseLabels = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  }

  if (typeof value === "string") {
    return [
      ...new Set(
        value
          .split(/\s*\|\s*|\s*,\s*/)
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ];
  }

  return [];
};

const serializeLabels = (labels) => {
  const normalizedLabels = parseLabels(labels);
  return normalizedLabels.length > 0 ? normalizedLabels.join(LABEL_SEPARATOR) : "General";
};

const normalizeTaskKey = (text = "") =>
  String(text).trim().replace(/\s+/g, " ").toLowerCase();

const importanceRank = {
  Low: 1,
  Medium: 2,
  High: 3,
};

const normalizeTask = (task) => ({
  id: String(task.id),
  text: task.text,
  completed: Boolean(task.completed),
  focused: Boolean(task.focused || task.focus_now),
  dueDate: task.dueDate || "",
  labels: parseLabels(task.labels || task.label).length
    ? parseLabels(task.labels || task.label)
    : ["General"],
  label: parseLabels(task.labels || task.label).length
    ? parseLabels(task.labels || task.label)[0]
    : "General",
  importance: task.importance || "Medium",
  createdAt: task.createdAt || task.created_at || new Date().toISOString(),
});

const readLocalTasks = () => {
  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    return sortTasks(JSON.parse(rawValue).map(normalizeTask));
  } catch {
    return [];
  }
};

const writeLocalTasks = (tasks) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortTasks(tasks)));
};

const localCreateTask = (task) => {
  const newTask = normalizeTask({
    ...task,
    id: task.id || crypto.randomUUID(),
    createdAt: task.createdAt || new Date().toISOString(),
  });
  const nextTasks = [newTask, ...readLocalTasks()];
  writeLocalTasks(nextTasks);
  return newTask;
};

const localToggleTaskById = (id, completed) => {
  const nextTasks = readLocalTasks().map((task) =>
    task.id === id ? { ...task, completed } : task,
  );
  writeLocalTasks(nextTasks);
};

const localDeleteTaskById = (id) => {
  const nextTasks = readLocalTasks().filter((task) => task.id !== id);
  writeLocalTasks(nextTasks);
};

const localUpdateTaskById = (id, updates) => {
  const nextTasks = readLocalTasks().map((task) =>
    task.id === id ? normalizeTask({ ...task, ...updates }) : task,
  );
  writeLocalTasks(nextTasks);
  return nextTasks.find((task) => task.id === id) || null;
};

const normalizeCloudTask = (task) =>
  normalizeTask({
    ...task,
    dueDate: task.due_date,
    createdAt: task.created_at,
  });

const mergeDuplicateTasks = (tasks) => {
  const groupedTasks = new Map();

  for (const task of sortTasks(tasks)) {
    const key = normalizeTaskKey(task.text);

    if (!key) {
      continue;
    }

    const existingTask = groupedTasks.get(key);

    if (!existingTask) {
      groupedTasks.set(key, {
        keep: normalizeTask(task),
        removeIds: [],
      });
      continue;
    }

    const currentKeep = existingTask.keep;
    const mergedLabels = [
      ...new Set([...(currentKeep.labels || []), ...(task.labels || parseLabels(task.label))]),
    ];
    const nextDueDate =
      !currentKeep.dueDate
        ? task.dueDate
        : !task.dueDate
          ? currentKeep.dueDate
          : currentKeep.dueDate <= task.dueDate
            ? currentKeep.dueDate
            : task.dueDate;
    const nextImportance =
      importanceRank[task.importance] > importanceRank[currentKeep.importance]
        ? task.importance
        : currentKeep.importance;

    existingTask.keep = normalizeTask({
      ...currentKeep,
      completed: currentKeep.completed || task.completed,
      focused: currentKeep.focused || task.focused,
      labels: mergedLabels,
      dueDate: nextDueDate,
      importance: nextImportance,
    });
    existingTask.removeIds.push(task.id);
  }

  return {
    uniqueTasks: sortTasks([...groupedTasks.values()].map((entry) => entry.keep)),
    duplicateGroups: [...groupedTasks.values()].filter((entry) => entry.removeIds.length > 0),
  };
};

const markCloudSuccess = () => {
  consecutiveCloudFailures = 0;
};

const markCloudFailure = () => {
  consecutiveCloudFailures += 1;
};

const shouldStayLocalOnly = () =>
  !hasSupabaseConfig || consecutiveCloudFailures >= LOCAL_ONLY_THRESHOLD;

const executeWithRetry = async (operation) => {
  let lastError = null;

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt += 1) {
    try {
      const result = await operation();
      markCloudSuccess();
      return result;
    } catch (error) {
      lastError = error;

      if (attempt < RETRY_ATTEMPTS - 1) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  markCloudFailure();
  throw lastError;
};

export const getStoreModeLabel = () => {
  if (!hasSupabaseConfig) {
    return "Local only";
  }

  if (consecutiveCloudFailures >= LOCAL_ONLY_THRESHOLD) {
    return "Local only";
  }

  if (consecutiveCloudFailures > 0) {
    return "Cloud sync retrying";
  }

  return "Cloud sync enabled";
};

export const removeDuplicateTasks = async (tasks = null) => {
  const sourceTasks = tasks ? tasks.map(normalizeTask) : await loadTasks();
  const { uniqueTasks, duplicateGroups } = mergeDuplicateTasks(sourceTasks);

  if (duplicateGroups.length === 0) {
    writeLocalTasks(uniqueTasks);
    return uniqueTasks;
  }

  if (!supabase || shouldStayLocalOnly()) {
    writeLocalTasks(uniqueTasks);
    return uniqueTasks;
  }

  try {
    await executeWithRetry(async () => {
      for (const group of duplicateGroups) {
        const { keep, removeIds } = group;

        const { error: updateError } = await supabase
          .from("tasks")
          .update({
            text: keep.text,
            completed: keep.completed,
            focus_now: keep.focused,
            due_date: keep.dueDate || null,
            label: serializeLabels(keep.labels),
            importance: keep.importance,
          })
          .eq("id", keep.id);

        if (updateError) {
          throw updateError;
        }

        const { error: deleteError } = await supabase
          .from("tasks")
          .delete()
          .in("id", removeIds);

        if (deleteError) {
          throw deleteError;
        }
      }
    });

    writeLocalTasks(uniqueTasks);
    return uniqueTasks;
  } catch (error) {
    if (shouldStayLocalOnly()) {
      writeLocalTasks(uniqueTasks);
      return uniqueTasks;
    }

    throw error;
  }
};

export const loadTasks = async () => {
  if (!supabase) {
    return readLocalTasks();
  }

  try {
    const data = await executeWithRetry(async () => {
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("id, text, completed, focus_now, due_date, label, importance, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return tasks.map(normalizeCloudTask);
    });

    writeLocalTasks(data);
    return data;
  } catch (error) {
    if (shouldStayLocalOnly()) {
      return readLocalTasks();
    }

    throw error;
  }
};

export const seedTasks = async (tasks) => {
  if (!supabase) {
    const existingTasks = readLocalTasks();

    if (existingTasks.length > 0) {
      return existingTasks;
    }

    const seededTasks = tasks.map((task) =>
      normalizeTask({
        ...task,
        createdAt: new Date().toISOString(),
      }),
    );
    writeLocalTasks(seededTasks);
    return sortTasks(seededTasks);
  }

  try {
    const count = await executeWithRetry(async () => {
      const { count: nextCount, error } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true });

      if (error) {
        throw error;
      }

      return nextCount ?? 0;
    });

    if (count > 0) {
      return loadTasks();
    }

    await executeWithRetry(async () => {
      const payload = tasks.map((task) => ({
        text: task.text,
        completed: task.completed,
        focus_now: Boolean(task.focused),
        due_date: task.dueDate || null,
        label: serializeLabels(task.labels || task.label),
        importance: task.importance,
      }));

      const { error } = await supabase.from("tasks").insert(payload);

      if (error) {
        throw error;
      }
    });

    return loadTasks();
  } catch (error) {
    if (shouldStayLocalOnly()) {
      const existingTasks = readLocalTasks();

      if (existingTasks.length > 0) {
        return existingTasks;
      }

      const seededTasks = tasks.map((task) =>
        normalizeTask({
          ...task,
          createdAt: new Date().toISOString(),
        }),
      );
      writeLocalTasks(seededTasks);
      return sortTasks(seededTasks);
    }

    throw error;
  }
};

export const ensureTasks = async (tasks) => {
  if (!supabase) {
    const existingTasks = readLocalTasks();
    const existingTexts = new Set(existingTasks.map((task) => task.text));
    const missingTasks = tasks
      .filter((task) => !existingTexts.has(task.text))
      .map((task) =>
        normalizeTask({
          ...task,
          id: task.id || crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }),
      );

    if (missingTasks.length === 0) {
      return existingTasks;
    }

    const nextTasks = [...missingTasks, ...existingTasks];
    writeLocalTasks(nextTasks);
    return sortTasks(nextTasks);
  }

  try {
    const currentTasks = await loadTasks();
    const existingTexts = new Set(currentTasks.map((task) => task.text));
    const missingTasks = tasks.filter((task) => !existingTexts.has(task.text));

    if (missingTasks.length === 0) {
      return currentTasks;
    }

    await executeWithRetry(async () => {
      const payload = missingTasks.map((task) => ({
        text: task.text,
        completed: task.completed,
        focus_now: Boolean(task.focused),
        due_date: task.dueDate || null,
        label: serializeLabels(task.labels || task.label),
        importance: task.importance,
      }));

      const { error } = await supabase.from("tasks").insert(payload);

      if (error) {
        throw error;
      }
    });

    return loadTasks();
  } catch (error) {
    if (shouldStayLocalOnly()) {
      const existingTasks = readLocalTasks();
      const existingTexts = new Set(existingTasks.map((task) => task.text));
      const missingTasks = tasks
        .filter((task) => !existingTexts.has(task.text))
        .map((task) =>
          normalizeTask({
            ...task,
            id: task.id || crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          }),
        );

      if (missingTasks.length === 0) {
        return existingTasks;
      }

      const nextTasks = [...missingTasks, ...existingTasks];
      writeLocalTasks(nextTasks);
      return sortTasks(nextTasks);
    }

    throw error;
  }
};

export const createTask = async (task) => {
  const newTask = normalizeTask({
    ...task,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });

  if (!supabase) {
    return localCreateTask(newTask);
  }

  try {
    const createdTask = await executeWithRetry(async () => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          text: newTask.text,
          completed: newTask.completed,
          focus_now: newTask.focused,
          due_date: newTask.dueDate || null,
          label: serializeLabels(newTask.labels || newTask.label),
          importance: newTask.importance,
        })
        .select("id, text, completed, focus_now, due_date, label, importance, created_at")
        .single();

      if (error) {
        throw error;
      }

      return normalizeCloudTask(data);
    });

    localCreateTask(createdTask);
    return createdTask;
  } catch (error) {
    if (shouldStayLocalOnly()) {
      return localCreateTask(newTask);
    }

    throw error;
  }
};

export const toggleTaskById = async (id, completed) => {
  if (!supabase) {
    localToggleTaskById(id, completed);
    return;
  }

  try {
    await executeWithRetry(async () => {
      const { error } = await supabase.from("tasks").update({ completed }).eq("id", id);

      if (error) {
        throw error;
      }
    });

    localToggleTaskById(id, completed);
  } catch (error) {
    if (shouldStayLocalOnly()) {
      localToggleTaskById(id, completed);
      return;
    }

    throw error;
  }
};

export const deleteTaskById = async (id) => {
  if (!supabase) {
    localDeleteTaskById(id);
    return;
  }

  try {
    await executeWithRetry(async () => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) {
        throw error;
      }
    });

    localDeleteTaskById(id);
  } catch (error) {
    if (shouldStayLocalOnly()) {
      localDeleteTaskById(id);
      return;
    }

    throw error;
  }
};

export const setTaskFocusById = async (id, focused) => {
  if (!supabase) {
    return localUpdateTaskById(id, { focused });
  }

  try {
    const updatedTask = await executeWithRetry(async () => {
      const { data, error } = await supabase
        .from("tasks")
        .update({ focus_now: focused })
        .eq("id", id)
        .select("id, text, completed, focus_now, due_date, label, importance, created_at")
        .single();

      if (error) {
        throw error;
      }

      return normalizeCloudTask(data);
    });

    localUpdateTaskById(id, updatedTask);
    return updatedTask;
  } catch (error) {
    if (shouldStayLocalOnly()) {
      return localUpdateTaskById(id, { focused });
    }

    throw error;
  }
};

export const updateTaskById = async (id, updates) => {
  const normalizedUpdates = normalizeTask({ id, ...updates });

  if (!supabase) {
    return localUpdateTaskById(id, normalizedUpdates);
  }

  try {
    const updatedTask = await executeWithRetry(async () => {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          text: normalizedUpdates.text,
          completed: normalizedUpdates.completed,
          focus_now: normalizedUpdates.focused,
          due_date: normalizedUpdates.dueDate || null,
          label: serializeLabels(normalizedUpdates.labels || normalizedUpdates.label),
          importance: normalizedUpdates.importance,
        })
        .eq("id", id)
        .select("id, text, completed, focus_now, due_date, label, importance, created_at")
        .single();

      if (error) {
        throw error;
      }

      return normalizeCloudTask(data);
    });

    localUpdateTaskById(id, updatedTask);
    return updatedTask;
  } catch (error) {
    if (shouldStayLocalOnly()) {
      return localUpdateTaskById(id, normalizedUpdates);
    }

    throw error;
  }
};

export const isCloudSyncConfigured = () => hasSupabaseConfig;

export const subscribeToTaskChanges = (onChange) => {
  if (!supabase || shouldStayLocalOnly()) {
    return () => {};
  }

  const channel = supabase
    .channel("tasks-sync")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tasks",
      },
      () => {
        onChange();
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
