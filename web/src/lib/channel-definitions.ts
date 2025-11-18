import { DistributionChannel } from "@prisma/client";

export type ChannelDefinition = {
  label: string;
  description: string;
  accentClass: string;
  recommendedEmoji: string;
  maxCharacters?: number;
  mediaHint?: string;
};

export const CHANNEL_ORDER: DistributionChannel[] = [
  DistributionChannel.WEBFLOW,
  DistributionChannel.WORDPRESS,
  DistributionChannel.LINKEDIN,
  DistributionChannel.FACEBOOK,
  DistributionChannel.INSTAGRAM,
  DistributionChannel.REDDIT,
  DistributionChannel.MAILCHIMP,
  DistributionChannel.SUBSTACK,
];

export const CHANNEL_DEFINITIONS: Record<DistributionChannel, ChannelDefinition> = {
  [DistributionChannel.WEBFLOW]: {
    label: "Webflow",
    description: "Publishes landing pages and CMS blog entries with full metadata control.",
    accentClass: "bg-blue-500/10 text-blue-500",
    recommendedEmoji: "🌐",
    mediaHint: "Supports hero image + rich body",
  },
  [DistributionChannel.WORDPRESS]: {
    label: "WordPress",
    description: "Sync long-form posts via REST API with custom fields.",
    accentClass: "bg-slate-500/10 text-slate-600",
    recommendedEmoji: "📝",
    mediaHint: "Feature image optional",
  },
  [DistributionChannel.LINKEDIN]: {
    label: "LinkedIn",
    description: "Share thought-leadership to company page or personal profile.",
    accentClass: "bg-sky-500/10 text-sky-600",
    recommendedEmoji: "💼",
    maxCharacters: 3000,
  },
  [DistributionChannel.FACEBOOK]: {
    label: "Facebook",
    description: "Page posts with link previews and image carousels.",
    accentClass: "bg-blue-600/10 text-blue-700",
    recommendedEmoji: "📣",
    maxCharacters: 63206,
  },
  [DistributionChannel.INSTAGRAM]: {
    label: "Instagram",
    description: "Feed captions with multi-image carousel + hashtags.",
    accentClass: "bg-pink-500/10 text-pink-600",
    recommendedEmoji: "📸",
    maxCharacters: 2200,
    mediaHint: "Square image recommended",
  },
  [DistributionChannel.REDDIT]: {
    label: "Reddit",
    description: "Community posts with flair-aware formatting.",
    accentClass: "bg-orange-500/10 text-orange-600",
    recommendedEmoji: "👾",
    maxCharacters: 40000,
  },
  [DistributionChannel.MAILCHIMP]: {
    label: "Mailchimp",
    description: "Newsletter campaigns with drag-and-drop blocks.",
    accentClass: "bg-emerald-500/10 text-emerald-600",
    recommendedEmoji: "✉️",
    mediaHint: "Header image + CTA button",
  },
  [DistributionChannel.SUBSTACK]: {
    label: "Substack",
    description: "Email + blog hybrid posts with highlights + paywall toggle.",
    accentClass: "bg-amber-500/10 text-amber-600",
    recommendedEmoji: "📮",
    maxCharacters: 10000,
  },
};

export function getChannelDefinition(channel: DistributionChannel): ChannelDefinition {
  return CHANNEL_DEFINITIONS[channel];
}
