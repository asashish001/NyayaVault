import type { Classification, Role } from "@prisma/client";

export const CLASSIFICATION_RANK: Record<Classification, number> = {
  PUBLIC: 0,
  INTERNAL: 1,
  CONFIDENTIAL: 2,
  RESTRICTED: 3,
  PROTECTED_VICTIM_WITNESS: 4,
};

export type AccessAction =
  | "view_case"
  | "view_document"
  | "upload"
  | "approve"
  | "transfer_custody"
  | "share"
  | "export"
  | "view_audit"
  | "manage_demo"
  | "ask_assistant";

export type Policy = {
  requiresAssignment: boolean;
  readOnly: boolean;
  maxClassification: Classification;
  allowed: AccessAction[];
};

export const ROLE_POLICY: Record<Role, Policy> = {
  IO: {
    requiresAssignment: true,
    readOnly: false,
    maxClassification: "PROTECTED_VICTIM_WITNESS",
    allowed: ["view_case", "view_document", "upload", "transfer_custody", "share", "ask_assistant"],
  },
  SHO: {
    requiresAssignment: true,
    readOnly: false,
    maxClassification: "PROTECTED_VICTIM_WITNESS",
    allowed: [
      "view_case",
      "view_document",
      "upload",
      "approve",
      "transfer_custody",
      "share",
      "view_audit",
      "ask_assistant",
    ],
  },
  FORENSIC_EXPERT: {
    requiresAssignment: true,
    readOnly: false,
    maxClassification: "PROTECTED_VICTIM_WITNESS",
    allowed: ["view_case", "view_document", "upload", "ask_assistant"],
  },
  PROSECUTOR: {
    requiresAssignment: true,
    readOnly: true,
    maxClassification: "PROTECTED_VICTIM_WITNESS",
    allowed: ["view_case", "view_document", "export", "ask_assistant"],
  },
  JUDGE_AUDITOR: {
    requiresAssignment: true,
    readOnly: true,
    maxClassification: "PROTECTED_VICTIM_WITNESS",
    allowed: ["view_case", "view_document", "view_audit", "export", "ask_assistant"],
  },
  ADMIN: {
    requiresAssignment: true,
    readOnly: true,
    maxClassification: "INTERNAL",
    allowed: ["view_audit", "manage_demo"],
  },
};

export type AccessInput = {
  role: Role;
  assigned: boolean;
  caseClassification: Classification;
  action: AccessAction;
};

export type AccessDecision = {
  allowed: boolean;
  reason: string;
};

export function evaluateAccess(input: AccessInput): AccessDecision {
  const policy = ROLE_POLICY[input.role];

  if (!policy.allowed.includes(input.action)) {
    return { allowed: false, reason: `Role ${input.role} cannot perform ${input.action}` };
  }

  if (policy.requiresAssignment && !input.assigned) {
    return {
      allowed: false,
      reason: "Not assigned to this case",
    };
  }

  if (
    CLASSIFICATION_RANK[input.caseClassification] >
    CLASSIFICATION_RANK[policy.maxClassification]
  ) {
    return {
      allowed: false,
      reason: `Classification ${input.caseClassification} exceeds clearance for ${input.role}`,
    };
  }

  return { allowed: true, reason: "Authorized" };
}
