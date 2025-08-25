# Data Protection Impact Assessment (DPIA) – Template

This document is a starter template. Consult counsel before production use.

## 1. Scope and Objectives
- System: Whistleblower reporting and case management
- Data subjects: Reporters, handlers, organization members
- Jurisdictions: Specify

## 2. Processing Activities
- Intake of reports (anonymous or identified)
- Storage of encrypted messages and attachments
- Case handling, SLA tracking, audit logging

## 3. Lawful Basis
- Legal obligation and/or legitimate interests (confirm with counsel)

## 4. Data Categories
- Personal data: Optional reporter contact details
- Special categories: Free-text fields may contain sensitive data

## 5. Risks
- Re-identification risk from metadata
- Unauthorized access to case content
- Data exfiltration in transit or at rest

## 6. Mitigations
- Field-level AES‑GCM encryption per‑org envelope keys
- Access controls with Clerk; RBAC (ADMIN/HANDLER/AUDITOR)
- Rate limiting and CAPTCHA on public endpoints
- Storage scanning hooks (planned), strict CSP and headers
- Audit log for privileged actions

## 7. Retention & Deletion
- Org-configurable retention window (days)
- Automated purge routines for expired data

## 8. Data Subject Rights
- Establish request handling for access, rectification, deletion where applicable

## 9. Processors
- Supabase (database/storage), Resend (email), Vercel/hosting

## 10. Residual Risk & Sign‑off
- Residual risk: Low/Medium/High
- Sign‑off: DPO / Legal / Engineering

