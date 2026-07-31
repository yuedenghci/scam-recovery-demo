import type { RightPanelKey } from "@/lib/onboardingFlow";
import type { Locale } from "./types";

export type LocalizedQuestionNode = {
  id: string;
  section: string;
  prompt: string;
  hintLead?: string;
  hintCards?: string[];
  rightPanelKey: RightPanelKey;
};

const ZH_QUESTIONS: LocalizedQuestionNode[] = [
  {
    id: "q1-scam",
    section: "Part 1",
    prompt:
      "可以先和我说说，这件事大概是怎么发生的吗？不用讲得特别完整，先说你觉得重要的部分就好。",
    rightPanelKey: "scamSituation",
  },
  {
    id: "q2-impact-near",
    section: "Part 2",
    prompt:
      "谢谢你告诉我这些。这件事是什么时候发生的呢？它现在还会怎样影响你呢？",
    rightPanelKey: "scamImpact",
  },
  {
    id: "q3-impact-main",
    section: "Part 2",
    prompt:
      "那现在最困扰你的是什么呢？主要从心理方面（比如自责）和日常生活方面（比如睡眠不好）来说的话。",
    rightPanelKey: "scamImpact",
  },
  {
    id: "q4-personality",
    section: "Part 3",
    prompt:
      "除了诈骗这件事，我也想更了解你。你会怎么形容自己呢？比如比较敏感、内向、容易多想，或者大大咧咧。你觉得自己更像什么样的人呢？",
    rightPanelKey: "personality",
  },
  {
    id: "q5-activity",
    section: "Part 4",
    prompt:
      "那平时有没有什么事，能让你稍微平静、放松，或者心情好一点？比如看书、运动、听歌、散步，或者别的什么。",
    rightPanelKey: "likedActivities",
  },
  {
    id: "q6-role-core",
    section: "Part 5",
    prompt:
      "好的～我不仅希望了解你，我更想成为你心里期待的那个我。你会希望我像什么样的存在呢？",
    hintLead:
      "这些词只是辅助你想一想，你完全可以用自己的话来描述，说得更具体更贴切一些哦",
    hintCards: ["朋友", "另一个自己", "树洞"],
    rightPanelKey: "expectedRole",
  },
  {
    id: "q7-role-background",
    section: "Part 5",
    prompt:
      "你会希望我有自己的人生故事吗？比如一个经历过类似事情的人，一个内心更稳定、成长后的的你自己，那个骗了你的骗子，或者其他你心里想象中的特定对象等等。\n\n你可以自由发挥，不要局限在我给你的例子里。请注意要和上一题你的答案对应起来，不要出现前后矛盾的情况哦",
    rightPanelKey: "expectedRole",
  },
  {
    id: "q8-role-feeling",
    section: "Part 5",
    prompt:
      "那对于我们之间，你会希望我怎么对待你呢？比如让你感觉被重视、不过分亲密、一直站在你这边等等。\n\n你可以自由发挥，不要局限在我给你的例子里。请注意要和上两题你的回答对应起来，不要出现前后矛盾的情况哦",
    rightPanelKey: "expectedRole",
  },
  {
    id: "q9-tone-style",
    section: "Part 6",
    prompt: "你会更喜欢我怎么和你说话呢？",
    hintLead:
      "这些词只是辅助你想一想，你完全可以用自己的话来描述，说得更具体更贴切一些哦",
    hintCards: ["温柔的", "幽默的", "毒舌的"],
    rightPanelKey: "toneStyle",
  },
  {
    id: "q10-tone-framework",
    section: "Part 6",
    prompt:
      "如果我陪你时会带一些自己的理解方式，你会更喜欢我偏哪一种呢？比如更心理学一点、更哲学一点，或者其他你熟悉的理解方式。",
    hintLead:
      "这些词只是辅助你想一想，你完全可以用自己的话来描述，说得更具体更贴切一些哦",
    hintCards: ["心理学", "哲学", "佛学"],
    rightPanelKey: "toneStyle",
  },
  {
    id: "q11-tone-avoid",
    section: "Part 6",
    prompt: "有没有什么说话方式，是你特别不想要的？想到什么都可以直接说。",
    hintLead:
      "这些词只是辅助你想一想，你完全可以用自己的话来描述，说得更具体更贴切一些哦",
    hintCards: ["不要总是顺着我", "不要问太细", "不要一上来就讲道理"],
    rightPanelKey: "toneStyle",
  },
  {
    id: "q12-proactive-contact",
    section: "Part 7",
    prompt:
      "我还想了解一下“主动”这件事。当你没有主动和我聊天的时候，你希望我主动和你聊天吗？比如我只在你来找我时回应，或者我偶尔主动先给你发消息。",
    rightPanelKey: "proactiveLevel",
  },
  {
    id: "q13-proactive-guide",
    section: "Part 7",
    prompt: "你希望我们聊天的时候我要不要多引导你一些？",
    hintLead:
      "这些词只是辅助你想一想，你完全可以用自己的话来描述，说得更具体更贴切一些哦",
    hintCards: [
      "只能等我自己主动说",
      "可以轻轻追问我，帮助我说清楚",
      "可以指出我没提到但可能重要的感受或问题",
      "可以根据我的喜好，主动和我聊一些事",
    ],
    rightPanelKey: "proactiveLevel",
  },
  {
    id: "q14-help-goals",
    section: "Part 8",
    prompt: "最后一个问题。你最希望我主要帮你什么？",
    hintLead:
      "这些词只是辅助你想一想，你完全可以用自己的话来描述，说得更具体更贴切一些哦",
    hintCards: [
      "情绪承接：接住我、理解我、安抚我",
      "情绪宣泄：陪我吐槽、把气说出来",
      "认知整理：帮我把事情理清、慢慢复盘",
      "意义整理：帮我看见一些对自己有用的理解",
      "风险提醒：提醒我可能的二次诈骗风险",
      "注意力转移：当我太陷进去时，提醒我换个角度或先做点别的",
    ],
    rightPanelKey: "helpGoals",
  },
];

const EN_QUESTIONS: LocalizedQuestionNode[] = [
  {
    id: "q1-scam",
    section: "Part 1",
    prompt:
      "Could you briefly tell me what happened? You don’t need to give every detail and just share what feels important.",
    rightPanelKey: "scamSituation",
  },
  {
    id: "q2-impact-near",
    section: "Part 2",
    prompt:
      "Thank you for sharing. When did this happen, and how does it still affect you now?",
    rightPanelKey: "scamImpact",
  },
  {
    id: "q3-impact-main",
    section: "Part 2",
    prompt:
      "What is troubling you most right now, emotionally (e.g., self-blame) or in your daily life (e.g., poor sleep)?",
    rightPanelKey: "scamImpact",
  },
  {
    id: "q4-personality",
    section: "Part 3",
    prompt:
      "Beyond the scam, I'd like to know you better. How would you describe yourself (e.g., sensitive, introverted, prone to overthinking, or more easygoing)? What kind of person do you feel you are?",
    rightPanelKey: "personality",
  },
  {
    id: "q5-activity",
    section: "Part 4",
    prompt:
      "Is there anything that usually helps you feel a bit calmer, relaxed, or lighter, such asreading, exercise, music, walking, or something else?",
    rightPanelKey: "likedActivities",
  },
  {
    id: "q6-role-core",
    section: "Part 5",
    prompt:
      "I'd like to become the kind of presence you're hoping for. What would you want me to be like?",
    hintLead:
      "These words are just prompts. Feel free to describe in your own words, more specifically.",
    hintCards: ["A friend", "Another version of you", "A safe space to vent"],
    rightPanelKey: "expectedRole",
  },
  {
    id: "q7-role-background",
    section: "Part 5",
    prompt:
      "Would you want me to have my own backstory? For example, someone who went through something similar, a more stable grown-up version of you, the person who scammed you, or someone else you imagine.\n\nFeel free to go beyond these examples. Please keep it consistent with your previous answer.",
    rightPanelKey: "expectedRole",
  },
  {
    id: "q8-role-feeling",
    section: "Part 5",
    prompt:
      "How would you want me to treat you in our relationship? For example, making you feel valued, not too intimate, or always on your side.\n\nFeel free to go beyond these examples. Please keep it consistent with your last two answers.",
    rightPanelKey: "expectedRole",
  },
  {
    id: "q9-tone-style",
    section: "Part 6",
    prompt: "How would you prefer me to talk with you?",
    hintLead:
      "These words are just prompts. Feel free to describe in your own words.",
    hintCards: ["Gentle", "Humorous", "sharp-tongued"],
    rightPanelKey: "toneStyle",
  },
  {
    id: "q10-tone-framework",
    section: "Part 6",
    prompt:
      "If I bring my own way of understanding things, which would you prefer, such as more psychological, more philosophical, or another lens you know?",
    hintLead:
      "These words are just prompts. Feel free to describe in your own words.",
    hintCards: ["Psychology", "Philosophy", "Buddhism"],
    rightPanelKey: "toneStyle",
  },
  {
    id: "q11-tone-avoid",
    section: "Part 6",
    prompt:
      "Are there ways of talking you especially don't want? Say whatever comes to mind.",
    hintLead:
      "These words are just prompts. Feel free to describe in your own words.",
    hintCards: [
      "Don't always agree with me",
      "Don't ask too many details",
      "Don't lecture right away",
    ],
    rightPanelKey: "toneStyle",
  },
  {
    id: "q12-proactive-contact",
    section: "Part 7",
    prompt:
      "When you're not reaching out, would you want me to message first sometimes or only respond when you come to me?",
    rightPanelKey: "proactiveLevel",
  },
  {
    id: "q13-proactive-guide",
    section: "Part 7",
    prompt: "During our chats, should I guide you more?",
    hintLead:
      "These words are just prompts. Feel free to describe in your own words.",
    hintCards: [
      "Only when I bring things up myself",
      "Gently ask follow-ups to help me clarify",
      "Point out feelings or issues I might have missed",
      "Proactively chat about things based on my preferences",
    ],
    rightPanelKey: "proactiveLevel",
  },
  {
    id: "q14-help-goals",
    section: "Part 8",
    prompt: "what do you most want my help with?",
    hintLead:
      "These words are just prompts. Feel free to describe in your own words.",
    hintCards: [
      "Comfort and reassurance: help me feel understood, supported, and calmer",
      "Venting: give me space to express my anger and frustration",
      "Clarifying my thoughts: help me sort through what happened and make sense of it",
      "Finding meaning: help me see the situation from a more helpful perspective",
      "Risk warnings: alert me to signs that I might be scammed again",
      "Shifting my attention: when I feel stuck, suggest a different way of thinking or something else I can do",
    ],
    rightPanelKey: "helpGoals",
  },
];

export function getLocalizedQuestions(locale: Locale): LocalizedQuestionNode[] {
  return locale === "en" ? EN_QUESTIONS : ZH_QUESTIONS;
}

export function getLocalizedQuestionById(
  locale: Locale,
  id: string,
): LocalizedQuestionNode | undefined {
  return getLocalizedQuestions(locale).find((q) => q.id === id);
}
