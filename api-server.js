import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-5.2";
const importanceLevels = ["Low", "Medium", "High"];
const dateFilters = ["All dates", "Due today", "Upcoming", "Overdue", "No date"];

const client = apiKey ? new OpenAI({ apiKey }) : null;

app.use(express.json());

const ensureClient = (response) => {
  if (client) {
    return true;
  }

  response.status(400).json({
    error: "missing_openai_key",
    message: "Set OPENAI_API_KEY in your .env file to enable AI features.",
  });
  return false;
};

const parseStructuredResponse = async (schemaName, schema, systemPrompt, payload) => {
  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: systemPrompt }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: JSON.stringify(payload) }],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        strict: true,
        schema,
      },
    },
  });

  return JSON.parse(response.output_text);
};

app.post("/api/ai/task", async (request, response) => {
  if (!ensureClient(response)) {
    return;
  }

  const { prompt = "", labels = [], today = "" } = request.body ?? {};

  try {
    const result = await parseStructuredResponse(
      "todo_task",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          dueDate: { type: "string" },
          label: { type: "string" },
          importance: { type: "string", enum: importanceLevels },
          completed: { type: "boolean" },
          summary: { type: "string" },
        },
        required: ["text", "dueDate", "label", "importance", "completed", "summary"],
      },
      [
        "You turn natural language into one todo item.",
        "Infer a short task title, due date, label, and importance.",
        "Use YYYY-MM-DD for dueDate, or an empty string if no date is clearly implied.",
        "Interpret relative dates using the supplied today date.",
        "Choose a label from the provided labels list when it fits, otherwise use General.",
        "Default completed to false unless the user explicitly says the task is already done.",
        "Keep the summary short and helpful.",
      ].join(" "),
      { prompt, labels, today },
    );

    response.json(result);
  } catch (error) {
    response.status(500).json({
      error: "ai_task_parse_failed",
      message: "The AI could not turn that request into a task.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/ai/filter", async (request, response) => {
  if (!ensureClient(response)) {
    return;
  }

  const { prompt = "", labels = [] } = request.body ?? {};

  try {
    const result = await parseStructuredResponse(
      "todo_filter",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          importance: { type: "string", enum: ["All importance", ...importanceLevels] },
          dateFilter: { type: "string", enum: dateFilters },
          summary: { type: "string" },
        },
        required: ["label", "importance", "dateFilter", "summary"],
      },
      [
        "You turn natural language into filter settings for a todo app.",
        "Use one label from the provided labels list, or All labels if no label is requested.",
        "Choose one importance level from All importance, Low, Medium, or High.",
        "Choose one date filter from All dates, Due today, Upcoming, Overdue, or No date.",
        "Keep the summary short and helpful.",
      ].join(" "),
      { prompt, labels: ["All labels", ...labels] },
    );

    response.json(result);
  } catch (error) {
    response.status(500).json({
      error: "ai_filter_parse_failed",
      message: "The AI could not turn that request into filters.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/ai/suggestions", async (request, response) => {
  if (!ensureClient(response)) {
    return;
  }

  const { tasks = [], today = "" } = request.body ?? {};

  try {
    const result = await parseStructuredResponse(
      "focus_suggestions",
      {
        type: "object",
        additionalProperties: false,
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "string" },
                reason: { type: "string" },
              },
              required: ["id", "reason"],
            },
          },
        },
        required: ["suggestions"],
      },
      [
        "You are a productivity assistant helping a user decide what to focus on right now.",
        "Given a list of incomplete tasks, pick up to 5 that the user should focus on today.",
        "Consider urgency (overdue or due soon), importance level, and task relevance.",
        "For each chosen task, provide a concise one-sentence reason (max 12 words) explaining why it deserves focus.",
        "Return only the task id and reason for each suggestion.",
        "Today's date is provided — use it to determine urgency.",
      ].join(" "),
      { tasks, today },
    );

    response.json(result);
  } catch (error) {
    response.status(500).json({
      error: "ai_suggestions_failed",
      message: "The AI could not generate suggestions.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(port, () => {
  console.log(`AI API server listening on http://localhost:${port}`);
});
