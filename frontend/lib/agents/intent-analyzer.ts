/**
 * Intent Analyzer Agent
 * Feature: 003-ai-todo-chatbot
 * Task: T008
 *
 * Analyzes user messages to determine intent and extract entities.
 * Uses Cohere API with a structured prompt template.
 */

import { cohereChat } from './cohere-adapter';
import {
  AgentContext,
  AgentResult,
  IntentAnalyzerOutput,
  ChatIntent,
  IntentType,
  IntentEntities,
  MIN_CONFIDENCE_THRESHOLD,
  INTENT_ANALYZER_TEMPERATURE,
} from './types';

/**
 * System prompt for intent analysis
 */
const INTENT_ANALYZER_PREAMBLE = `You are a friendly multilingual intent analyzer for a todo task management chatbot. You understand English, Urdu, and Roman Urdu (Urdu written in English letters).

SUPPORTED INTENTS:
- add_task: User wants to create a new task
  Examples: "Add buy groceries", "Gym daily add kardo", "Meeting schedule karo", "mujhe remind karo ki...", "task banana hai", "task add karo k kal mujhey project submit karna hai"

- list_tasks: User wants to see their tasks
  Examples: "Show my tasks", "Meri tasks dikhao", "kya kya karna hai", "pending tasks", "completed dikhao"

- update_task: User wants to modify a task's title or description
  Examples: "Change task 5 title", "Task 3 ka naam badlo", "update kardo task 2", "update buy milk 1st to buy coffee"

- complete_task: User wants to mark a task as done
  Examples: "Mark task 3 done", "Task 1 complete kardo", "ho gaya task 2", "done hai", "finish task", "complete 1st task", "pehla task complete karo"

- delete_task: User wants to remove a task
  Examples: "Delete task 7", "Task 3 delete kardo", "hata do task 5", "remove kardo", "delete task 1st" (=delete newest), "delete buy milk 2nd" (=delete second newest "buy milk"), "aakhri task delete karo" (=delete oldest)

- set_due_date: User wants to set a due date
  Examples: "Set task 2 due tomorrow", "Task 1 kal tak", "Friday ko due hai task 3"

- get_task_dates: User wants to check due dates
  Examples: "When is task 3 due?", "Task 5 kab tak karna hai?"

- help: User asking what the bot can do
  Examples: "help", "kya kar sakte ho", "what can you do", "commands", "madad", "features"

- greeting: User is greeting
  Examples: "hi", "hello", "salam", "assalam o alaikum", "hey"

- set_priority: User wants to change a task's priority
  Examples: "set task 5 to high priority", "make it urgent", "priority high kardo task 3"

- add_tags: User wants to tag a task
  Examples: "tag task 3 as work, urgent", "add tag #personal to task 5", "task 2 ko work tag karo"

- search_tasks: User wants to search for tasks by keyword
  Examples: "search for meeting tasks", "find grocery", "meeting wale tasks dhundo"

- set_recurring: User wants to make a task repeat
  Examples: "make task daily", "set task 5 as weekly", "task 3 repeat karo daily"

- unknown: Intent is unclear

SMART ENTITY EXTRACTION FOR add_task:
When user says something like "task add karo k kal mujhey project submit karna hai" or "task add karo k 09-02-2026 ko mujhey biryani khani hai":

1. TITLE: Create a SHORT, CONCISE title (2-5 words max) that captures the main action
   - "task add karo k kal mujhey project submit karna hai" → title: "Project Submission"
   - "task add karo k 09-02-2026 ko mujhey biryani khani hai" → title: "Biryani khani hai"
   - "remind me to buy groceries tomorrow" → title: "Buy Groceries"
   - "kal doctor ke paas jana hai" → title: "Doctor Appointment"

2. DESCRIPTION: The FULL context/details from the message
   - "task add karo k kal mujhey project submit karna hai" → description: "kal mujhey project submit karna hai"
   - "task add karo k 09-02-2026 ko mujhey biryani khani hai" → description: "09-02-2026 ko mujhey biryani khani hai"

3. DUE_DATE: Extract date if mentioned (convert to ISO format YYYY-MM-DD)
   - "kal" / "tomorrow" → Calculate tomorrow's date
   - "parso" / "day after tomorrow" → Calculate day after tomorrow
   - "09-02-2026" → "2026-02-09"
   - "Friday" → Next Friday's date
   - "next week" → Date 7 days from now
   - If no date mentioned → null

4. PRIORITY: Extract priority if mentioned
   - "high priority", "urgent", "important", "zaroori" → "high"
   - "medium priority" → "medium"
   - "low priority", "not urgent" → "low"
   - If not mentioned → null

5. TAGS: Extract hashtags or tag keywords
   - "#work #urgent" → ["work", "urgent"]
   - "tag it as personal" → ["personal"]
   - If not mentioned → null

ENTITY EXTRACTION RULES:
- task_id: Extract task identifier if mentioned (for update/complete/delete). Return null for add_task.
- title: SHORT, CONCISE task name (2-5 words) - capitalize first letter
- description: Full context/details from the message
- status_filter: For list_tasks - "pending", "completed", or "all"
- due_date: ISO format date (YYYY-MM-DD) or relative date string
- priority: "high", "medium", "low", or null
- tags: Array of tag strings, or null
- search: Search query for list_tasks, or null
- ordinal: Positional reference for task selection (1=newest, 2=second newest, -1=oldest/last). Extract from words like "1st"/"first"/"pehla" (=1), "2nd"/"second"/"doosra" (=2), "3rd"/"third"/"teesra" (=3), "last"/"oldest"/"aakhri" (=-1). Return null if no ordinal.

RESPONSE FORMAT (JSON only):
{
  "intent": "<intent_type>",
  "entities": {
    "task_id": <string or null>,
    "title": "<string or null>",
    "description": "<string or null>",
    "status_filter": "<pending|completed|all or null>",
    "due_date": "<YYYY-MM-DD or null>",
    "priority": "<high|medium|low or null>",
    "tags": <array of strings or null>,
    "search": "<string or null>",
    "ordinal": <number or null>
  },
  "confidence": <0.0 to 1.0>
}

EXAMPLES:
Input: "task add karo k kal mujhey apna project submit karna hai"
Output: {"intent":"add_task","entities":{"task_id":null,"title":"Project Submission","description":"kal mujhey apna project submit karna hai","status_filter":null,"due_date":"tomorrow"},"confidence":0.95}

Input: "task add karo k 09-02-2026 ko mujhey biryani khani hai"
Output: {"intent":"add_task","entities":{"task_id":null,"title":"Biryani khani hai","description":"09-02-2026 ko mujhey biryani khani hai","status_filter":null,"due_date":"2026-02-09"},"confidence":0.95}

Input: "remind me to call mom tomorrow"
Output: {"intent":"add_task","entities":{"task_id":null,"title":"Call Mom","description":"remind me to call mom tomorrow","status_filter":null,"due_date":"tomorrow"},"confidence":0.95}

CRITICAL RULES:
1. Respond ONLY with valid JSON, no explanations
2. For add_task: ALWAYS extract title (short), description (full context), and due_date (if any)
3. Understand natural Urdu/Roman Urdu phrases
4. Be lenient with confidence - if user clearly wants something, confidence should be 0.8+
5. For greetings and help, confidence should be 1.0
6. TITLE must be SHORT (2-5 words) and DESCRIPTIVE
7. DESCRIPTION should contain the full user message context`;

/**
 * Pre-check for clear add_task intent to avoid LLM misinterpretation
 * Returns true if message clearly indicates adding a task
 */
function isObviousAddTaskIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Clear add task patterns in English and Urdu
  const addPatterns = [
    /^(add|create|new)\s+(a\s+)?(task|todo)/i,
    /^task\s+(add|bana|create)/i,
    /(add|bana|create)\s+(kar|karo|kardo|karein|karna)/i,
    /^remind\s+me/i,
    /^mujhe\s+remind/i,
    /task\s+add\s+karo/i,
    /add\s+karo\s+k/i,
    /task\s+bana/i,
  ];

  return addPatterns.some(pattern => pattern.test(lowerMessage));
}

/**
 * Pre-check for clear complete_task intent
 */
function isObviousCompleteTaskIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  const completePatterns = [
    /^complete\s+/i,
    /^done\s+/i,
    /^finish\s+/i,
    /^mark\s+(as\s+)?(done|complete|finished)/i,
    /\s+complete\s*(kar|karo|kardo|karein|karna|kiya)?$/i,
    /\s+done\s*(kar|karo|kardo|karein|karna|kiya|hai)?$/i,
    /^(ho\s+gaya|hogaya|mukammal)/i,
    /complete\s+(kar|karo|kardo)/i,
    /done\s+(kar|karo|kardo)/i,
  ];

  return completePatterns.some(pattern => pattern.test(lowerMessage));
}

/**
 * Pre-check for clear update_task intent
 */
function isObviousUpdateTaskIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  const updatePatterns = [
    /^update\s+/i,
    /^edit\s+/i,
    /^change\s+/i,
    /^modify\s+/i,
    /^rename\s+/i,
    /\s+update\s*(kar|karo|kardo|karein|karna)?$/i,
    /\s+edit\s*(kar|karo|kardo|karein|karna)?$/i,
    /(naam|title|name)\s+(badal|change)/i,
    /update\s+(kar|karo|kardo)/i,
    /badal\s*(kar|karo|kardo|do)/i,
  ];

  return updatePatterns.some(pattern => pattern.test(lowerMessage));
}

/**
 * Pre-check for clear delete_task intent
 */
function isObviousDeleteTaskIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  const deletePatterns = [
    /^delete\s+/i,
    /^remove\s+/i,
    /^hata\s+/i,
    /\s+delete\s*(kar|karo|kardo|karein|karna)?$/i,
    /\s+remove\s*(kar|karo|kardo|karein|karna)?$/i,
    /delete\s+(kar|karo|kardo)/i,
    /hata\s*(kar|karo|kardo|do|dey)/i,
    /nikal\s*(kar|karo|kardo|do|dey)/i,
  ];

  return deletePatterns.some(pattern => pattern.test(lowerMessage));
}

/**
 * Pre-check for clear set_due_date intent
 */
function isObviousSetDueDateIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  const dueDatePatterns = [
    /^set\s+(due\s+)?date/i,
    /^due\s+date\s+set/i,
    /\s+due\s+(kal|tomorrow|today|aaj|parso)/i,
    /\s+(kal|tomorrow|today|aaj|parso)\s+tak/i,
    /\s+deadline/i,
    /due\s+(kar|karo|kardo|set)/i,
  ];

  return dueDatePatterns.some(pattern => pattern.test(lowerMessage));
}

/**
 * Pre-check for clear set_priority intent
 */
function isObviousSetPriorityIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  const patterns = [
    /\bset\s+(priority|task)\b.*\b(high|medium|low|urgent)\b/i,
    /\b(high|medium|low)\s+priority\s+(set|kar|karo|kardo)\b/i,
    /\bpriority\s+(high|medium|low)\s+(kar|karo|kardo|set)\b/i,
    /\b(make|set)\s+(it|this|task)\s+(urgent|important|high\s+priority|low\s+priority)\b/i,
    /\bpriority\s+(badal|change)\b/i,
  ];

  return patterns.some(p => p.test(lowerMessage));
}

/**
 * Pre-check for clear add_tags intent
 */
function isObviousAddTagsIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  const patterns = [
    /\b(tag|label)\s+(task|it|this)\b/i,
    /\badd\s+tag\b/i,
    /\btag\s+(add|kar|karo|kardo|laga)\b/i,
    /\btag\s+(as|with)\b/i,
    /\b(tag|label)\s+#/i,
  ];

  return patterns.some(p => p.test(lowerMessage));
}

/**
 * Pre-check for clear search_tasks intent
 */
function isObviousSearchTasksIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  const patterns = [
    /^(search|find|look\s+for|dhundo|talaash)\b/i,
    /\b(search|find|dhundo|talaash)\s+(for\s+)?(task|tasks)\b/i,
    /\btask(s)?\s+(dhundo|talaash|search)\b/i,
    /\bwale\s+task(s)?\s*(dhundo|dikhao)?\b/i,
  ];

  return patterns.some(p => p.test(lowerMessage));
}

/**
 * Pre-check for clear set_recurring intent
 */
function isObviousSetRecurringIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  const patterns = [
    /\b(make|set)\s+(task\s+)?(daily|weekly|monthly)\b/i,
    /\brepeat\s+(daily|weekly|monthly|har\s+din|har\s+hafta)\b/i,
    /\b(daily|weekly|monthly)\s+(repeat|set|kar|karo|kardo|bana)\b/i,
    /\brecurring\s+(set|kar|karo|kardo|bana)\b/i,
    /\bhar\s+(din|roz|hafta|mahina)\s+(repeat|karo|karna)\b/i,
  ];

  return patterns.some(p => p.test(lowerMessage));
}

/**
 * Extract ordinal from a title string. Returns { ordinal, cleanedTitle }.
 * Supports: 1st/first/pehla, 2nd/second/doosra, 3rd/third/teesra, last/aakhri, etc.
 */
function extractOrdinalFromTitle(title: string): { ordinal: number | null; cleanedTitle: string } {
  let ordinal: number | null = null;
  let cleaned = title;

  const ordinalPatterns: [RegExp, number][] = [
    [/\b(1st|first|pehla|pehli|pahla|pahli|newest|latest)\b/i, 1],
    [/\b(2nd|second|doosra|doosri|dusra|dusri)\b/i, 2],
    [/\b(3rd|third|teesra|teesri|tisra|tisri)\b/i, 3],
    [/\b(4th|fourth|chautha|chauthi)\b/i, 4],
    [/\b(5th|fifth|panchwa|panchvi)\b/i, 5],
    [/\b(last|oldest|aakhri|akhri)\b/i, -1],
  ];

  for (const [pattern, value] of ordinalPatterns) {
    if (pattern.test(cleaned)) {
      ordinal = value;
      cleaned = cleaned.replace(pattern, '').trim();
      break;
    }
  }

  // If the title is just a number like "1", "2", treat as ordinal
  if (!ordinal && /^\d+$/.test(cleaned)) {
    ordinal = parseInt(cleaned, 10);
    cleaned = '';
  }

  // If the title starts with a number followed by text like "2 buy milk"
  if (!ordinal) {
    const leadingNumMatch = cleaned.match(/^(\d+)\s+(.+)$/);
    if (leadingNumMatch) {
      ordinal = parseInt(leadingNumMatch[1], 10);
      cleaned = leadingNumMatch[2];
    }
  }

  return { ordinal, cleanedTitle: cleaned };
}

/**
 * Extract priority details for set_priority intent
 */
function extractSetPriorityDetails(message: string): IntentEntities {
  const priority = extractPriority(message) || 'medium';

  // Extract task reference (remove priority-related words)
  const cleaned = message
    .replace(/\b(set|make|change)\s+(priority|task)\s*/gi, '')
    .replace(/\b(to|as)\s*/gi, '')
    .replace(/\b(high|medium|low)\s*(priority)?\b/gi, '')
    .replace(/\b(urgent|important|zaroori)\b/gi, '')
    .replace(/\b(priority)\s*(badal|change|set|kar|karo|kardo)?\b/gi, '')
    .trim();

  const { ordinal, cleanedTitle } = extractOrdinalFromTitle(cleaned);

  return {
    task_id: null,
    title: cleanedTitle || null,
    description: null,
    status_filter: null,
    due_date: null,
    priority,
    tags: null,
    search: null,
    ordinal,
  };
}

/**
 * Extract tags details for add_tags intent
 */
function extractAddTagsDetails(message: string): IntentEntities {
  // Extract tags from #hashtags or comma-separated after "as"/"with"
  let tags = extractTags(message);

  if (!tags) {
    // Try to extract from "tag task as work, urgent" pattern
    const asMatch = message.match(/\b(?:as|with)\s+(.+)$/i);
    if (asMatch) {
      tags = asMatch[1].split(/[,\s]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
    }
  }

  // Extract task reference
  const cleaned = message
    .replace(/\b(tag|label|add\s+tag)\s*/gi, '')
    .replace(/\b(task|it|this)\s*/gi, '')
    .replace(/\b(as|with)\s+.+$/gi, '')
    .replace(/#[a-zA-Z0-9-]+/g, '')
    .trim();

  const { ordinal, cleanedTitle } = extractOrdinalFromTitle(cleaned);

  return {
    task_id: null,
    title: cleanedTitle || null,
    description: null,
    status_filter: null,
    due_date: null,
    priority: null,
    tags: tags && tags.length > 0 ? tags : null,
    search: null,
    ordinal,
  };
}

/**
 * Extract search query for search_tasks intent
 */
function extractSearchQuery(message: string): IntentEntities {
  const cleaned = message
    .replace(/^(search|find|look\s+for|dhundo|talaash)\s*/gi, '')
    .replace(/\b(for\s+)?(task|tasks)\b/gi, '')
    .replace(/\bwale\s+task(s)?\s*(dhundo|dikhao)?/gi, '')
    .trim();

  return {
    task_id: null,
    title: null,
    description: null,
    status_filter: null,
    due_date: null,
    priority: null,
    tags: null,
    search: cleaned || null,
    ordinal: null,
  };
}

/**
 * Extract recurrence details for set_recurring intent
 */
function extractRecurringDetails(message: string): IntentEntities {
  const lower = message.toLowerCase();
  let pattern: string | null = null;

  if (/\b(daily|har\s*(din|roz))\b/.test(lower)) pattern = 'daily';
  else if (/\b(weekly|har\s*hafta|hafta\s*war)\b/.test(lower)) pattern = 'weekly';
  else if (/\b(monthly|har\s*mahina|mahina\s*war)\b/.test(lower)) pattern = 'monthly';

  // Extract task reference
  const cleaned = message
    .replace(/\b(make|set|repeat)\s*/gi, '')
    .replace(/\b(task\s*)?/gi, '')
    .replace(/\b(daily|weekly|monthly|recurring)\b/gi, '')
    .replace(/\b(har\s*(din|roz|hafta|mahina))\b/gi, '')
    .replace(/\b(repeat|karo|karna|bana|set|kar|kardo)\b/gi, '')
    .trim();

  const { ordinal, cleanedTitle } = extractOrdinalFromTitle(cleaned);

  return {
    task_id: null,
    title: cleanedTitle || null,
    description: pattern, // Store pattern in description for the executor
    status_filter: null,
    due_date: null,
    priority: null,
    tags: null,
    search: null,
    ordinal,
  };
}

/**
 * Extract task reference and due date for set_due_date intent
 */
function extractDueDateDetails(message: string): IntentEntities {
  let title: string | null = null;
  let dueDate: string | null = null;

  const lowerMessage = message.toLowerCase();

  // Extract due date
  if (lowerMessage.includes('kal') || lowerMessage.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDate = formatDateToISO(tomorrow);
  } else if (lowerMessage.includes('aaj') || lowerMessage.includes('today')) {
    dueDate = formatDateToISO(new Date());
  } else if (lowerMessage.includes('parso') || lowerMessage.includes('day after tomorrow')) {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dueDate = formatDateToISO(dayAfter);
  }

  // Check for explicit date format
  const dateMatch = message.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    dueDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Extract task title (remove date-related words)
  let cleanedMessage = message
    .replace(/^set\s+(due\s+)?date\s*/i, '')
    .replace(/\s*(kal|tomorrow|today|aaj|parso|due|deadline|tak)\s*/gi, ' ')
    .replace(/\s*(kar|karo|kardo|set)\s*/gi, ' ')
    .replace(/^(for|of|task)\s*/i, '')
    .replace(/\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/g, '')
    .trim();

  if (cleanedMessage) {
    title = cleanedMessage;
  }

  const { ordinal, cleanedTitle } = extractOrdinalFromTitle(title || '');

  return {
    task_id: null,
    title: cleanedTitle || null,
    description: null,
    status_filter: null,
    due_date: dueDate,
    priority: null,
    tags: null,
    search: null,
    ordinal,
  };
}

/**
 * Extract task title/reference from complete/update/delete commands
 * For update: handles "update taskname newvalue" or "update taskname 'newvalue'" formats
 */
function extractTaskReference(message: string, intentType: string): IntentEntities {
  let cleanedMessage = message;
  let newTitle: string | null = null;

  // Remove command prefixes based on intent
  if (intentType === 'complete_task') {
    cleanedMessage = message
      .replace(/^(complete|done|finish|mark\s+(as\s+)?(done|complete|finished))\s*/i, '')
      .replace(/\s*(complete|done|finish)\s*(kar|karo|kardo|karein|karna|kiya|hai)?$/i, '')
      .replace(/^(ho\s+gaya|hogaya|mukammal)\s*/i, '')
      .replace(/^task\s*/i, '')
      .trim();
  } else if (intentType === 'update_task') {
    cleanedMessage = message
      .replace(/^(update|edit|change|modify|rename)\s*/i, '')
      .replace(/\s*(update|edit|change)\s*(kar|karo|kardo|karein|karna)?$/i, '')
      .replace(/^task\s*/i, '')
      .trim();

    // For update, check if there's a quoted new value: update gfhg "new title"
    const quotedMatch = cleanedMessage.match(/^(\S+)\s+["'](.+?)["']$/);
    if (quotedMatch) {
      cleanedMessage = quotedMatch[1]; // task reference
      newTitle = quotedMatch[2]; // new title in quotes
    } else {
      // Check for "to" keyword: update gfhg to new title
      const toMatch = cleanedMessage.match(/^(\S+)\s+(?:to|se|main|mein)\s+(.+)$/i);
      if (toMatch) {
        cleanedMessage = toMatch[1];
        newTitle = toMatch[2];
      } else {
        // Check for space-separated: update gfhg newtitle (two parts)
        const parts = cleanedMessage.split(/\s+/);
        if (parts.length >= 2) {
          cleanedMessage = parts[0]; // first part is task reference
          newTitle = parts.slice(1).join(' '); // rest is new title
        }
      }
    }
  } else if (intentType === 'delete_task') {
    cleanedMessage = message
      .replace(/^(delete|remove|hata)\s*/i, '')
      .replace(/\s*(delete|remove)\s*(kar|karo|kardo|karein|karna)?$/i, '')
      .replace(/\s*(hata|nikal)\s*(kar|karo|kardo|do|dey)?$/i, '')
      .replace(/^task\s*/i, '')
      .trim();
  }

  // The remaining text is the task title/reference
  const { ordinal, cleanedTitle } = extractOrdinalFromTitle(cleanedMessage.trim());

  return {
    task_id: null,
    title: cleanedTitle || null,
    description: newTitle, // For update, description holds the new title value
    status_filter: null,
    due_date: null,
    priority: null,
    tags: null,
    search: null,
    ordinal,
  };
}

/**
 * Extracts task details from a message for add_task intent
 */
function extractAddTaskDetails(message: string): IntentEntities {
  // Remove common add task prefixes
  let cleanedMessage = message
    .replace(/^(add|create|new)\s+(a\s+)?(task|todo)\s*:?\s*/i, '')
    .replace(/^task\s+(add|bana|create)\s*(kar|karo|kardo|karein|karna)?\s*:?\s*/i, '')
    .replace(/^(remind\s+me\s+(to\s+)?)/i, '')
    .replace(/^mujhe\s+remind\s+(karo|karna|kardo)?\s*(k|ke|ki)?\s*/i, '')
    .replace(/^task\s+add\s+karo\s*(k|ke|ki)?\s*/i, '')
    .replace(/add\s+karo\s*(k|ke|ki)?\s*/i, '')
    .trim();

  // Try to extract a short title (first few words, max 5-6 words)
  const words = cleanedMessage.split(/\s+/);
  let title = words.slice(0, Math.min(5, words.length)).join(' ');

  // Capitalize first letter
  if (title) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // Extract due date if mentioned
  let dueDate: string | null = null;
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('kal') || lowerMessage.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDate = formatDateToISO(tomorrow);
  } else if (lowerMessage.includes('aaj') || lowerMessage.includes('today')) {
    dueDate = formatDateToISO(new Date());
  } else if (lowerMessage.includes('parso') || lowerMessage.includes('day after tomorrow')) {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dueDate = formatDateToISO(dayAfter);
  }

  // Check for explicit date format DD-MM-YYYY or YYYY-MM-DD
  const dateMatch = message.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    dueDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Extract priority if mentioned
  const priority = extractPriority(message);

  // Extract tags if mentioned (#tag format)
  const tags = extractTags(message);

  return {
    task_id: null,
    title: title || cleanedMessage.slice(0, 50),
    description: cleanedMessage,
    status_filter: null,
    due_date: dueDate,
    priority,
    tags,
    search: null,
    ordinal: null,
  };
}

/**
 * Analyzes a user message to determine intent and extract entities
 */
export async function analyzeIntent(
  context: AgentContext
): Promise<AgentResult<IntentAnalyzerOutput>> {
  try {
    // Quick check for obvious add_task intent to avoid LLM misinterpretation
    if (isObviousAddTaskIntent(context.message)) {
      console.log('[Intent-Analyzer] Detected obvious add_task intent via pattern matching');
      const entities = extractAddTaskDetails(context.message);
      return {
        success: true,
        data: {
          intent: {
            intent: 'add_task',
            entities,
            confidence: 0.95,
            raw_message: context.message,
          },
        },
      };
    }

    // Quick check for obvious complete_task intent
    if (isObviousCompleteTaskIntent(context.message)) {
      console.log('[Intent-Analyzer] Detected obvious complete_task intent via pattern matching');
      const entities = extractTaskReference(context.message, 'complete_task');
      return {
        success: true,
        data: {
          intent: {
            intent: 'complete_task',
            entities,
            confidence: 0.95,
            raw_message: context.message,
          },
        },
      };
    }

    // Quick check for obvious update_task intent
    if (isObviousUpdateTaskIntent(context.message)) {
      console.log('[Intent-Analyzer] Detected obvious update_task intent via pattern matching');
      const entities = extractTaskReference(context.message, 'update_task');
      return {
        success: true,
        data: {
          intent: {
            intent: 'update_task',
            entities,
            confidence: 0.95,
            raw_message: context.message,
          },
        },
      };
    }

    // Quick check for obvious delete_task intent
    if (isObviousDeleteTaskIntent(context.message)) {
      console.log('[Intent-Analyzer] Detected obvious delete_task intent via pattern matching');
      const entities = extractTaskReference(context.message, 'delete_task');
      return {
        success: true,
        data: {
          intent: {
            intent: 'delete_task',
            entities,
            confidence: 0.95,
            raw_message: context.message,
          },
        },
      };
    }

    // Quick check for obvious set_due_date intent
    if (isObviousSetDueDateIntent(context.message)) {
      console.log('[Intent-Analyzer] Detected obvious set_due_date intent via pattern matching');
      const entities = extractDueDateDetails(context.message);
      return {
        success: true,
        data: {
          intent: {
            intent: 'set_due_date',
            entities,
            confidence: 0.95,
            raw_message: context.message,
          },
        },
      };
    }

    // Quick check for obvious set_priority intent
    if (isObviousSetPriorityIntent(context.message)) {
      console.log('[Intent-Analyzer] Detected obvious set_priority intent via pattern matching');
      const entities = extractSetPriorityDetails(context.message);
      return {
        success: true,
        data: {
          intent: {
            intent: 'set_priority',
            entities,
            confidence: 0.95,
            raw_message: context.message,
          },
        },
      };
    }

    // Quick check for obvious add_tags intent
    if (isObviousAddTagsIntent(context.message)) {
      console.log('[Intent-Analyzer] Detected obvious add_tags intent via pattern matching');
      const entities = extractAddTagsDetails(context.message);
      return {
        success: true,
        data: {
          intent: {
            intent: 'add_tags',
            entities,
            confidence: 0.95,
            raw_message: context.message,
          },
        },
      };
    }

    // Quick check for obvious search_tasks intent
    if (isObviousSearchTasksIntent(context.message)) {
      console.log('[Intent-Analyzer] Detected obvious search_tasks intent via pattern matching');
      const entities = extractSearchQuery(context.message);
      return {
        success: true,
        data: {
          intent: {
            intent: 'search_tasks',
            entities,
            confidence: 0.95,
            raw_message: context.message,
          },
        },
      };
    }

    // Quick check for obvious set_recurring intent
    if (isObviousSetRecurringIntent(context.message)) {
      console.log('[Intent-Analyzer] Detected obvious set_recurring intent via pattern matching');
      const entities = extractRecurringDetails(context.message);
      return {
        success: true,
        data: {
          intent: {
            intent: 'set_recurring',
            entities,
            confidence: 0.95,
            raw_message: context.message,
          },
        },
      };
    }

    const userPrompt = `Analyze this user message and respond with JSON only:\n\n"${context.message}"`;

    const response = await cohereChat(userPrompt, INTENT_ANALYZER_PREAMBLE, {
      temperature: INTENT_ANALYZER_TEMPERATURE,
      maxTokens: 256,
    });

    // Parse the JSON response
    const parsedIntent = parseIntentResponse(response.text, context.message);

    return {
      success: true,
      data: {
        intent: parsedIntent,
      },
    };
  } catch (error) {
    // If it's a ChatError, propagate it
    if (error && typeof error === 'object' && 'type' in error) {
      const err = error as unknown as { type: string; message?: string };
      return {
        success: false,
        error: {
          code: err.type,
          message: err.message || 'An error occurred during intent analysis.',
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'intent_analysis_failed',
        message: 'Failed to analyze your message. Please try rephrasing.',
      },
    };
  }
}

/**
 * Parses the LLM response into a ChatIntent object
 */
function parseIntentResponse(responseText: string, rawMessage: string): ChatIntent {
  // Debug logging for LLM response
  console.log('[Intent-Analyzer] Raw LLM response:', responseText);

  try {
    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    // Validate and normalize the response
    const intent = normalizeIntent(parsed.intent);
    const entities = normalizeEntities(parsed.entities || {});
    const confidence = normalizeConfidence(parsed.confidence);

    return {
      intent,
      entities,
      confidence,
      raw_message: rawMessage,
    };
  } catch {
    // If parsing fails, return unknown intent
    return {
      intent: 'unknown',
      entities: createEmptyEntities(),
      confidence: 0.3,
      raw_message: rawMessage,
    };
  }
}

/**
 * Normalizes intent type to valid enum value
 */
function normalizeIntent(intent: unknown): IntentType {
  const validIntents: IntentType[] = [
    'add_task',
    'list_tasks',
    'update_task',
    'complete_task',
    'delete_task',
    'set_due_date',
    'get_task_dates',
    'set_priority',
    'add_tags',
    'search_tasks',
    'set_recurring',
    'help',
    'greeting',
    'unknown',
  ];

  if (typeof intent === 'string' && validIntents.includes(intent as IntentType)) {
    return intent as IntentType;
  }

  return 'unknown';
}

/**
 * Normalizes entities object
 */
function normalizeEntities(entities: Record<string, unknown>): IntentEntities {
  // Handle task_id - could be number, string, or null
  let taskId: string | null = null;
  if (typeof entities.task_id === 'string' && entities.task_id.trim().length > 0) {
    taskId = entities.task_id.trim();
  } else if (typeof entities.task_id === 'number') {
    // Convert number to string for consistency with UUID-based backend
    taskId = String(entities.task_id);
  }

  // Normalize due_date - convert relative dates to ISO format
  let dueDate: string | null = null;
  if (typeof entities.due_date === 'string' && entities.due_date.trim().length > 0) {
    dueDate = normalizeDueDate(entities.due_date.trim());
  }

  // Normalize priority
  let priority: 'high' | 'medium' | 'low' | null = null;
  if (typeof entities.priority === 'string') {
    const p = entities.priority.toLowerCase();
    if (p === 'high' || p === 'medium' || p === 'low') priority = p;
  }

  // Normalize tags
  let tags: string[] | null = null;
  if (Array.isArray(entities.tags) && entities.tags.length > 0) {
    tags = entities.tags.map((t: unknown) => String(t).trim().toLowerCase()).filter(Boolean);
  }

  // Normalize search
  const search = typeof entities.search === 'string' && entities.search.trim() ? entities.search.trim() : null;

  // Normalize ordinal
  let ordinal: number | null = null;
  if (typeof entities.ordinal === 'number' && !isNaN(entities.ordinal)) {
    ordinal = entities.ordinal;
  }

  return {
    task_id: taskId,
    title: typeof entities.title === 'string' ? entities.title.trim() : null,
    description: typeof entities.description === 'string' ? entities.description.trim() : null,
    status_filter: normalizeStatusFilter(entities.status_filter),
    due_date: dueDate,
    priority,
    tags,
    search,
    ordinal,
  };
}

/**
 * Normalizes due date to ISO format (YYYY-MM-DD)
 */
function normalizeDueDate(dateStr: string): string | null {
  const lowerDate = dateStr.toLowerCase().trim();
  const today = new Date();

  // Handle relative dates in English and Urdu
  if (lowerDate === 'today' || lowerDate === 'aaj') {
    return formatDateToISO(today);
  }

  if (lowerDate === 'tomorrow' || lowerDate === 'kal') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateToISO(tomorrow);
  }

  if (lowerDate === 'day after tomorrow' || lowerDate === 'parso' || lowerDate === 'parson') {
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return formatDateToISO(dayAfter);
  }

  if (lowerDate === 'next week' || lowerDate === 'agle hafte') {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return formatDateToISO(nextWeek);
  }

  // Handle day names
  const dayNames: Record<string, number> = {
    'sunday': 0, 'itwaar': 0,
    'monday': 1, 'somwar': 1, 'peer': 1,
    'tuesday': 2, 'mangal': 2,
    'wednesday': 3, 'budh': 3,
    'thursday': 4, 'jumerat': 4,
    'friday': 5, 'juma': 5,
    'saturday': 6, 'hafta': 6, 'sanichar': 6,
  };

  for (const [dayName, dayNum] of Object.entries(dayNames)) {
    if (lowerDate.includes(dayName)) {
      const targetDay = new Date(today);
      const currentDay = today.getDay();
      let daysToAdd = dayNum - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
      targetDay.setDate(targetDay.getDate() + daysToAdd);
      return formatDateToISO(targetDay);
    }
  }

  // Handle explicit date formats: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD
  const ddmmyyyyMatch = dateStr.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const yyyymmddMatch = dateStr.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // If already in ISO format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Return original if we can't parse
  return dateStr;
}

/**
 * Formats a Date object to ISO string (YYYY-MM-DD)
 */
function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes status filter value
 */
function normalizeStatusFilter(
  filter: unknown
): 'pending' | 'completed' | 'all' | null {
  if (filter === 'pending' || filter === 'completed' || filter === 'all') {
    return filter;
  }
  return null;
}

/**
 * Normalizes confidence value to 0-1 range
 */
function normalizeConfidence(confidence: unknown): number {
  if (typeof confidence === 'number' && !isNaN(confidence)) {
    return Math.max(0, Math.min(1, confidence));
  }
  return 0.5;
}

/**
 * Creates empty entities object
 */
function createEmptyEntities(): IntentEntities {
  return {
    task_id: null,
    title: null,
    description: null,
    status_filter: null,
    due_date: null,
    priority: null,
    tags: null,
    search: null,
    ordinal: null,
  };
}

/**
 * Extract priority from message text
 */
function extractPriority(message: string): 'high' | 'medium' | 'low' | null {
  const lower = message.toLowerCase();
  if (/\b(high\s+priority|urgent|important|zaroori|fori)\b/.test(lower)) return 'high';
  if (/\b(low\s+priority|not\s+urgent|kam\s+zaroori)\b/.test(lower)) return 'low';
  if (/\b(medium\s+priority)\b/.test(lower)) return 'medium';
  return null;
}

/**
 * Extract tags from message (hashtag format: #work #personal)
 */
function extractTags(message: string): string[] | null {
  const tagMatches = message.match(/#([a-zA-Z0-9-]+)/g);
  if (tagMatches && tagMatches.length > 0) {
    return tagMatches.map(t => t.slice(1).toLowerCase());
  }
  return null;
}

/**
 * Checks if the intent confidence meets the minimum threshold
 */
export function isConfidentIntent(intent: ChatIntent): boolean {
  return intent.confidence >= MIN_CONFIDENCE_THRESHOLD;
}
