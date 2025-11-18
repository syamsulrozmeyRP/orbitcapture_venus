import { CalendarRange, PenTool, ShieldCheck } from "lucide-react";

export type FeaturePillar = {
  title: string;
  description: string;
  eyebrow: string;
  icon: typeof CalendarRange;
};

export const landingLogos = ["Segment", "Linear", "Figma", "Ramp", "Vercel", "Loom"];

export const featurePillars: FeaturePillar[] = [
  {
    eyebrow: "Planner",
    title: "Unified calendar",
    description: "Drag-and-drop campaigns across every channel with AI briefs and persona context baked in.",
    icon: CalendarRange,
  },
  {
    eyebrow: "Editor",
    title: "Editor.js blocks",
    description: "Collaborative editor with autosave, version control, and real-time presence powered by Liveblocks.",
    icon: PenTool,
  },
  {
    eyebrow: "Approvals",
    title: "Two-step reviews",
    description: "Route drafts through editor and manager lanes with Slack + email notifications on autopilot.",
    icon: ShieldCheck,
  },
];

export const productSections = [
  {
    eyebrow: "Planner",
    title: "AI-assisted planning that keeps calendars full",
    description:
      "Prioritize launches, auto-generate briefs, and see workload heatmaps across every workspace.",
    highlights: [
      "Persona-aware AI outlines + channel guidance",
      "Calendar filters for campaign, owner, or channel",
      "Conflict detection when launch windows overlap",
    ],
    accent: "from-indigo-500 to-purple-500",
  },
  {
    eyebrow: "Editor & Approvals",
    title: "Move content from draft to approved in hours",
    description:
      "Editor.js, Liveblocks, and structured approvals keep collaborators unblocked with instant context.",
    highlights: [
      "Comment threads with resolve + mention",
      "Role-aware actions for Editors vs Managers",
      "Autosave, version history, and template swaps",
    ],
    accent: "from-rose-500 to-orange-400",
  },
  {
    eyebrow: "Distribution & Analytics",
    title: "Publish everywhere and measure impact",
    description:
      "Queue posts to Webflow, LinkedIn, Substack, Mailchimp, and more while tracking KPIs in one view.",
    highlights: [
      "Channel adapters with formatting guardrails",
      "Scheduling + retry queue per platform",
      "Analytics snapshots with AI optimization tips",
    ],
    accent: "from-emerald-500 to-teal-400",
  },
];

export const workflowSteps = [
  { title: "Plan", description: "Attach personas + goals" },
  { title: "Draft", description: "Editor.js + AI copilot" },
  { title: "Approve", description: "Editor & manager lanes" },
  { title: "Publish", description: "Multi-channel queue" },
  { title: "Analyze", description: "Unified KPIs" },
];

export const testimonials = [
  {
    quote: "We cut our campaign planning time in half and approvals now finish overnight instead of in days.",
    author: "Lena Thornton",
    role: "VP Marketing",
    company: "HelioCloud",
  },
  {
    quote: "ContentOS replaced five tools and finally gives RevOps confidence in what’s scheduled where.",
    author: "Marcus Bell",
    role: "Head of RevOps",
    company: "Northwind AI",
  },
  {
    quote: "The analytics snapshots plus AI recommendations helped us grow LinkedIn CTR by 41% in a quarter.",
    author: "Priya Raman",
    role: "Content Director",
    company: "Arcade Labs",
  },
];

export const statHighlights = [
  { label: "Average approval time", value: "18h" },
  { label: "Campaigns shipped / mo", value: "42" },
  { label: "Channels automated", value: "8" },
  { label: "AI credits saved", value: "1.3M" },
];

export const workflowMetrics = [
  { title: "AI briefs generated", value: "320" },
  { title: "Approvals cleared", value: "96%" },
  { title: "Team satisfaction", value: "4.9/5" },
];
