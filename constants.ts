
import type { Theme, Translation } from './types';

export const ANIMAL_THEMES: Record<string, Theme> = {
    "Ferrari": {"primary": "#D32F2F", "secondary": "#1E1E1E", "accent": "#FF5252", "emoji": "🏎️"},
    "Lion": {"primary": "#FFA726", "secondary": "#5D4037", "accent": "#FFD54F", "emoji": "🦁"},
    "Eagle": {"primary": "#8D6E63", "secondary": "#3E2723", "accent": "#BCAAA4", "emoji": "🦅"},
    "Dolphin": {"primary": "#29B6F6", "secondary": "#01579B", "accent": "#81D4FA", "emoji": "🐬"},
    "Tiger": {"primary": "#FF6F00", "secondary": "#E65100", "accent": "#FFB74D", "emoji": "🐯"},
    "Panda": {"primary": "#424242", "secondary": "#212121", "accent": "#9E9E9E", "emoji": "🐼"},
    "Phoenix": {"primary": "#D32F2F", "secondary": "#B71C1C", "accent": "#EF5350", "emoji": "🔥"},
    "Wolf": {"primary": "#607D8B", "secondary": "#37474F", "accent": "#90A4AE", "emoji": "🐺"},
    "Butterfly": {"primary": "#AB47BC", "secondary": "#6A1B9A", "accent": "#CE93D8", "emoji": "🦋"},
    "Owl": {"primary": "#795548", "secondary": "#4E342E", "accent": "#A1887F", "emoji": "🦉"},
    "Shark": {"primary": "#0277BD", "secondary": "#01579B", "accent": "#4FC3F7", "emoji": "🦈"},
    "Fox": {"primary": "#EF6C00", "secondary": "#E65100", "accent": "#FF9800", "emoji": "🦊"},
    "Peacock": {"primary": "#00897B", "secondary": "#00695C", "accent": "#4DB6AC", "emoji": "🦚"},
    "Elephant": {"primary": "#78909C", "secondary": "#546E7A", "accent": "#B0BEC5", "emoji": "🐘"},
    "Dragon": {"primary": "#C62828", "secondary": "#B71C1C", "accent": "#EF5350", "emoji": "🐉"},
    "Penguin": {"primary": "#263238", "secondary": "#000000", "accent": "#546E7A", "emoji": "🐧"},
    "Flamingo": {"primary": "#EC407A", "secondary": "#C2185B", "accent": "#F48FB1", "emoji": "🦩"},
    "Cheetah": {"primary": "#F9A825", "secondary": "#F57F17", "accent": "#FDD835", "emoji": "🐆"},
    "Octopus": {"primary": "#5E35B1", "secondary": "#4527A0", "accent": "#9575CD", "emoji": "🐙"},
    "Koala": {"primary": "#90A4AE", "secondary": "#607D8B", "accent": "#CFD8DC", "emoji": "🐨"}
};

export const TRANSLATIONS: Translation = {
    "en": {
        "title": "Ferrari FDA Evidence Extractor + Comparator",
        "subtitle": "A YAML-driven multi-agent pipeline with an interactive dashboard",
        "settings": "Settings",
        "theme": "Theme",
        "language": "Language",
        "api_keys": "API Keys",
        "upload_parse": "Upload & Parse",
        "summary": "Summary",
        "checklist": "Checklist",
        "agents": "Advanced Agents",
        "dashboard": "Dashboard",
        "reports": "Reports",
        "agent_config": "Agent Configuration",
        "select_agents": "Select Agents to Use",
        "agent_pipeline": "Agent Pipeline",
        "execute": "Execute",
        "input": "Input",
        "output": "Output",
        "modify": "Modify",
        "next": "Next",
        "completion_rate": "Completion Rate",
        "tokens": "Tokens",
        "latency": "Latency",
        "generate": "Generate",
        "download": "Download",
        "light": "Light",
        "dark": "Dark"
    },
    "zh": {
        "title": "Ferrari FDA 證據提取器 + 比較器",
        "subtitle": "基於 YAML 驅動的多代理管道與互動式儀表板",
        "settings": "設定",
        "theme": "主題",
        "language": "語言",
        "api_keys": "API 金鑰",
        "upload_parse": "上傳與解析",
        "summary": "摘要",
        "checklist": "檢查清單",
        "agents": "進階代理",
        "dashboard": "儀表板",
        "reports": "報告",
        "agent_config": "代理配置",
        "select_agents": "選擇要使用的代理",
        "agent_pipeline": "代理管道",
        "execute": "執行",
        "input": "輸入",
        "output": "輸出",
        "modify": "修改",
        "next": "下一步",
        "completion_rate": "完成率",
        "tokens": "標記",
        "latency": "延遲",
        "generate": "生成",
        "download": "下載",
        "light": "淺色模式",
        "dark": "深色模式"
    }
};

export const DEFAULT_SAMPLE_AGENTS = `version: 1
agents:
  - id: summarizer
    name: Summary Generator
    description: Generate a complete, structured summary of the submission
    enabled: true
    model:
      provider: gemini
      name: gemini-2.5-flash
      temperature: 0.25
      max_tokens: 4096
    prompt: |
      You are a senior FDA medical device submission summarization expert.
      Goals:
      - Read the input document text (parsed from PDFs or pasted content).
      - Produce a structured, precise, and complete summary in English.
      - Cover device description, indications for use, summary of safety and effectiveness, substantial equivalence, clinical data synopsis, labeling notes, and known risks.
      - Be concise, but thorough. Cite sections by quoting brief phrases when useful.
      Formatting:
      - Use clear sections with headings.
      - Use bullet points for lists.
      - Include a "Key Risks and Mitigations" section at the end.
      Quality:
      - Avoid hallucinations. If info is missing, explicitly say "Not Provided".
      - Do not include internal chain-of-thought; provide final conclusions only.
  - id: evidence_extractor
    name: Evidence Extractor
    description: Extract clinical evidence and safety data
    enabled: true
    model:
      provider: openai
      name: gpt-4o-mini
      temperature: 0.25
      max_tokens: 4096
    prompt: |
      You are a clinical evidence and safety data extraction expert for FDA 510(k) submissions.
      Task:
      - Extract all clinical evidence, safety data, adverse events, performance testing, bench testing, biocompatibility, sterilization validations, and usability findings.
      - Provide source anchors when possible by quoting short text segments.
      Output:
      - Return a structured JSON object with keys: clinical_evidence, safety_data, adverse_events, performance_testing, bench_testing, biocompatibility, sterilization, usability, notes.
      - Use concise bullet-like strings inside lists; no markdown code fences in the JSON text.
  - id: compliance_checker
    name: Compliance Checker
    description: Check 510(k) compliance across key categories
    enabled: true
    model:
      provider: gemini
      name: gemini-2.5-flash
      temperature: 0.2
      max_tokens: 4096
    prompt: |
      You are an FDA 510(k) compliance checker.
      Task:
      - Review content and assess compliance across categories: Indications for Use, Substantial Equivalence, Labeling, Device Description, Performance Testing, Biocompatibility, Sterilization, Software/Usability, Risk Management, Clinical Evidence.
      - Mark each item as [YES] or [NO] for compliance presence, and provide short justification.
      Output:
      - Provide a clear, human-readable report. For each category:
        - Category: <name> [YES|NO]
        - Rationale: <1-3 sentences>
      - End with a "Summary PASS/FAIL" line with rationale. Avoid chain-of-thought; report findings only.
`;
