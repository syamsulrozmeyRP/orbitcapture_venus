import { subDays } from "date-fns";
import {
  ComplianceEventType,
  ConsentPreference,
  PrivacyRequestStatus,
  PrivacyRequestType,
  type ComplianceEvent,
  type PrivacyRequest,
  type Prisma,
} from "@prisma/client";

import { withUserContext } from "@/lib/rls";

export type ConsentPreferenceFlags = {
  emailMarketing: boolean;
  analytics: boolean;
  ads: boolean;
};

export type ConsentSummary = ConsentPreferenceFlags & {
  id: string;
  personEmail: string;
  updatedAt: Date;
};

export type PrivacyRequestSummary = {
  id: string;
  requesterEmail: string;
  type: PrivacyRequestType;
  status: PrivacyRequestStatus;
  reason?: string | null;
  createdAt: Date;
  processedAt?: Date | null;
};

export type ComplianceEventSummary = {
  id: string;
  type: ComplianceEventType;
  description?: string | null;
  actorEmail?: string | null;
  createdAt: Date;
};

export type ComplianceStats = {
  openRequests: number;
  completedThisMonth: number;
  consentedProfiles: number;
  auditsLast30: number;
};

export type ComplianceCenterData = {
  stats: ComplianceStats;
  requests: PrivacyRequestSummary[];
  consents: ConsentSummary[];
  events: ComplianceEventSummary[];
};

export async function loadComplianceCenter(userId: string, workspaceId: string): Promise<ComplianceCenterData> {
  await ensureComplianceSeed(userId, workspaceId);

  return withUserContext(userId, async (tx) => {
    const [requests, consents, events, openRequests, completedThisMonth, consentedProfiles, auditsLast30] = await Promise.all([
      tx.privacyRequest.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 8 }),
      tx.consentPreference.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 6 }),
      tx.complianceEvent.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 8 }),
      tx.privacyRequest.count({ where: { workspaceId, NOT: { status: { in: [PrivacyRequestStatus.COMPLETED, PrivacyRequestStatus.FAILED] } } } }),
      tx.privacyRequest.count({
        where: {
          workspaceId,
          status: PrivacyRequestStatus.COMPLETED,
          processedAt: { gte: subDays(new Date(), 30) },
        },
      }),
      tx.consentPreference.count({ where: { workspaceId } }),
      tx.complianceEvent.count({ where: { workspaceId, createdAt: { gte: subDays(new Date(), 30) } } }),
    ]);

    return {
      stats: {
        openRequests,
        completedThisMonth,
        consentedProfiles,
        auditsLast30,
      },
      requests: requests.map(mapPrivacyRequest),
      consents: consents.map(mapConsentPreference),
      events: events.map(mapComplianceEvent),
    } satisfies ComplianceCenterData;
  });
}

function mapPrivacyRequest(request: PrivacyRequest): PrivacyRequestSummary {
  return {
    id: request.id,
    requesterEmail: request.requesterEmail,
    type: request.type,
    status: request.status,
    reason: request.reason,
    createdAt: request.createdAt,
    processedAt: request.processedAt,
  } satisfies PrivacyRequestSummary;
}

function mapConsentPreference(preference: ConsentPreference): ConsentSummary {
  const flags = parsePreferencePayload(preference.preferences);
  return {
    id: preference.id,
    personEmail: preference.personEmail,
    updatedAt: preference.updatedAt,
    ...flags,
  } satisfies ConsentSummary;
}

function mapComplianceEvent(event: ComplianceEvent): ComplianceEventSummary {
  return {
    id: event.id,
    type: event.type,
    description: event.description,
    actorEmail: event.actorEmail,
    createdAt: event.createdAt,
  } satisfies ComplianceEventSummary;
}

function parsePreferencePayload(value: Prisma.JsonValue | null): ConsentPreferenceFlags {
  const payload = value as Partial<ConsentPreferenceFlags> | null;
  return {
    emailMarketing: payload?.emailMarketing ?? false,
    analytics: payload?.analytics ?? false,
    ads: payload?.ads ?? false,
  } satisfies ConsentPreferenceFlags;
}

async function ensureComplianceSeed(userId: string, workspaceId: string) {
  return withUserContext(userId, async (tx) => {
    const existing = await tx.consentPreference.count({ where: { workspaceId } });
    if (existing > 0) return;

    const consentSeeds = [
      {
        workspaceId,
        personEmail: "privacy@orbitsoft.com",
        preferences: { emailMarketing: true, analytics: true, ads: false },
        source: "import",
      },
      {
        workspaceId,
        personEmail: "ciso@novacontent.com",
        preferences: { emailMarketing: false, analytics: true, ads: false },
        source: "api",
      },
      {
        workspaceId,
        personEmail: "legal@northwindventures.com",
        preferences: { emailMarketing: true, analytics: true, ads: true },
        source: "manual",
      },
    ];

    for (const seed of consentSeeds) {
      await tx.consentPreference.create({ data: seed });
    }

    const exportRequest = await tx.privacyRequest.create({
      data: {
        workspaceId,
        requesterEmail: "counsel@orbitsoft.com",
        type: PrivacyRequestType.EXPORT,
        status: PrivacyRequestStatus.COMPLETED,
        reason: "Annual GDPR data portability audit",
        processedAt: subDays(new Date(), 2),
      },
    });

    await tx.complianceEvent.create({
      data: {
        workspaceId,
        type: ComplianceEventType.DATA_EXPORT,
        description: "Delivered encrypted export bundle via expiring link.",
        actorEmail: exportRequest.requesterEmail,
        privacyRequestId: exportRequest.id,
      },
    });

    const deleteRequest = await tx.privacyRequest.create({
      data: {
        workspaceId,
        requesterEmail: "privacy@arcadeai.io",
        type: PrivacyRequestType.DELETE,
        status: PrivacyRequestStatus.IN_PROGRESS,
        reason: "CCPA deletion request submitted via portal",
      },
    });

    await tx.complianceEvent.create({
      data: {
        workspaceId,
        type: ComplianceEventType.DATA_ERASURE,
        description: "Queued deletion workflow for ArcadeAI contact record.",
        actorEmail: deleteRequest.requesterEmail,
        privacyRequestId: deleteRequest.id,
      },
    });

    await tx.complianceEvent.create({
      data: {
        workspaceId,
        type: ComplianceEventType.CONSENT_CAPTURED,
        description: "Synced 184 consent updates from web preferences center.",
        actorEmail: "system@contentos.ai",
      },
    });
  });
}
