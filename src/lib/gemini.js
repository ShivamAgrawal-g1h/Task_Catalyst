import { GoogleGenerativeAI } from '@google/generative-ai';

let _client = null;

export function initGemini(apiKey) {
  if (!apiKey) return null;
  _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

export function getGeminiClient(apiKey) {
  if (_client) return _client;
  if (apiKey) return initGemini(apiKey);
  return null;
}

/**
 * Attempts to generate a motivational quote from Gemini.
 * Returns the raw AI text on success, or null on failure / no key.
 * The caller (Dashboard) passes the result to resolveQuote() in quotes.js.
 */
export async function generateMotivationalQuote(context, apiKey) {
  const client = getGeminiClient(apiKey);
  if (!client) return null;
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(
      `Generate ONE short powerful motivational quote (max 2 sentences) for a student: ${context}. Make it personal and energizing. No quote marks, no author attribution.`
    );
    return { text: result.response.text().trim(), source: 'ai' };
  } catch {
    return null;
  }
}

export async function generateTaskRecommendation(tasks, profile, apiKey) {
  const client = getGeminiClient(apiKey);
  if (!client) return "Start with your smallest pending tasks to build momentum, then tackle high-priority items with upcoming deadlines.";
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const pending = tasks
      .filter(t => t.status === 'pending' || t.status === 'in_progress')
      .slice(0, 8)
      .map(t => `"${t.title}" (importance:${t.importance}/5, ${t.deadline ? `deadline:${new Date(t.deadline).toLocaleDateString()}` : 'no deadline'}, est:${t.time_estimate}h)`);
    const result = await model.generateContent(
      `You are a productivity coach. Student tasks:\n${pending.join('\n')}\nProductivity type: "${profile?.productivity_type || 'unknown'}". Give a 3-4 sentence specific recommendation on what to tackle first and why. Be encouraging but direct.`
    );
    return result.response.text().trim();
  } catch {
    return "Focus on your most urgent tasks first, then systematically work through lower-priority items.";
  }
}

export async function analyzeProductivityPersonality(stats, apiKey) {
  const client = getGeminiClient(apiKey);
  if (!client) return analyzeLocalPersonality(stats);
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(
      `Determine productivity personality from stats:\n- Completed: ${stats.completed}\n- Postponed: ${stats.postponed}\n- On time: ${stats.onTime}\n- Late: ${stats.late}\n- Avg/week: ${stats.avgPerWeek.toFixed(1)}\n\nTypes: Sprinter, Consistent Worker, Perfectionist, Procrastinator\nRespond ONLY with valid JSON: {"type":"...","description":"2 sentences","strengths":["...","..."],"tips":["...","..."]}`
    );
    return JSON.parse(result.response.text().trim());
  } catch {
    return analyzeLocalPersonality(stats);
  }
}

export async function chatWithCoach(messages, userMessage, tasks, apiKey) {
  const client = getGeminiClient(apiKey);
  if (!client) return "Add your Gemini API key in Settings to enable AI coaching. Get a free key from Google AI Studio at aistudio.google.com/apikey";
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const now     = new Date();
    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'completed');
    const dueIn72 = pending.filter(t => t.deadline && (new Date(t.deadline) - now) / 36e5 <= 72 && (new Date(t.deadline) - now) > 0);
    const chronics = pending.filter(t => (t.postpone_count || 0) >= 2);
    const today = now.toLocaleDateString();
    const overdueContext = overdue.length ? overdue.slice(0, 5)
                                                   .map(t => `• ${t.title}`)
                                                   .join('\n')
                                          : 'None';
    const dueSoonContext = dueIn72.length ? dueIn72.slice(0, 5)
                                                   .map(t => `• ${t.title}`)
                                                   .join('\n')
                                          : 'None';

    const topTasks = [...pending]
            .sort((a, b) => b.priority_score - a.priority_score)
            .slice(0, 10);
    const taskContext = topTasks
      .map(t => {
        const h = t.deadline
        ? Math.round((new Date(t.deadline) - now) / 36e5)
        : null;

        return `• "${t.title}"
         Priority Score:${t.priority_score}
         Status:${t.status}
         Estimated Time:${t.time_estimate}h
         Importance:${t.importance}/5
         ${h !== null ? `Due in : ${h}h` : 'No Deadline'}
         ${t.postpone_count ? `Postponed :  ${t.postpone_count}x` : ''}`;
      })
      .join('\n\n');

    const situationSummary = [
      overdue.length  > 0 ? `⚠️ ${overdue.length} OVERDUE tasks` : '',
      dueIn72.length  > 0 ? `⏰ ${dueIn72.length} tasks due within 72h` : '',
      chronics.length > 0 ? `🔁 ${chronics.length} tasks postponed 2+ times` : '',
    ].filter(Boolean).join(' · ') || 'No urgent issues';

    const history = messages.slice(-8).map(m => `${m.role === 'user' ? 'Student' : 'Coach'}: ${m.content}`).join('\n');

    const result = await model.generateContent(
      `You are Task Catalyst — an AI productivity AGENT for students. You don't just answer questions; you reason about priorities, spot risks, and propose concrete actions.

Priority Score is computed by Task Catalyst using deadline urgency, importance, estimated effort and postponement history.
Use it as guidance, not an absolute rule.

Today : ${today}

CURRENT TASK SITUATION:
${situationSummary}
OVERDUE TASKS :
${overdueContext}
TASKS DUE WITHIN 72 HOURS :
${dueSoonContext}

PENDING TASKS:
${taskContext || 'No pending tasks.'}

RULES:
- Be direct and specific. Name actual tasks by title.
- If multiple tasks compete for attention,rank them internally and recommend only the highest-impact one unless the student explicitly asks for a full plan.
- When recommending a task,always explain why it is more important than the other pending tasks.
- If you notice a risk the student hasn't mentioned, say so.
- If you suggest splitting/adding tasks, describe them concretely.
- Max 4 sentences unless asked for a detailed plan.
- Avoid generic productivity advice. Always reference their actual tasks titles whenever possible.

(refer history below ONLY if needed)

CONVERSATION:
${history}

Student :
${userMessage}

Coach:`
    );
    return result.response.text().trim();
  } catch {
    return "I'm having trouble connecting. Please verify your API key in Settings."+
    "\nPossibly the rpm(requests per minute) or rpd(requests per day) for the current API's model in-use might have exceeded there limits.";
  }
}

function analyzeLocalPersonality(stats) {
  const postponeRate = stats.postponed / Math.max(1, stats.completed + stats.postponed);
  const lateRate = stats.late / Math.max(1, stats.completed);
  if (postponeRate > 0.4 && lateRate > 0.4) return { type: 'Procrastinator', description: 'You tend to delay tasks, but awareness is the first step to change.', strengths: ['Can handle pressure', 'Resourceful under constraints'], tips: ['Break tasks into 25-min Pomodoro sessions', 'Use the 2-minute rule: if under 2 min, do it now'] };
  if (lateRate > 0.5 && postponeRate < 0.2) return { type: 'Sprinter', description: 'You thrive under deadline pressure and produce great work in bursts.', strengths: ['High intensity focus', 'Deadline-driven performance'], tips: ['Create artificial deadlines to trigger sprint mode earlier', 'Use time estimates to plan your sprints'] };
  if (stats.avgPerWeek < 2 && stats.completed > 5) return { type: 'Perfectionist', description: 'You invest deeply in each task, ensuring high quality output.', strengths: ['High quality work', 'Thorough approach'], tips: ['Set a "good enough" standard to ship faster', 'Timebox tasks to prevent over-engineering'] };
  return { type: 'Consistent Worker', description: 'You work steadily and complete tasks reliably.', strengths: ['Reliable', 'Steady pace'], tips: ['Try time-blocking to maximize efficiency', 'Take on stretch goals'] };
}
