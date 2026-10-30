# GrievEase Marathi (MR) Removal Audit & Migration Report

## 1. Executive Summary & Policy Shift

Per architectural directive, GrievEase has streamlined its internationalization model from tri-lingual (`EN`, `HI`, `MR`) to **dual-language** (`EN`, `HI`):
- **English (`en`)**: Primary default interface language.
- **Hindi (`hi`)**: National official language, providing complete parity across every public, resident, administrative, guard, and vendor surface.

### Core Objectives:
1. **Zero Data Destruction**: All existing Marathi user-generated content, translations, and historical descriptions are archived safely into an internal PostgreSQL table `legacy_marathi_content`.
2. **User Migration**: Any user accounts previously set to `language = 'mr'` are automatically migrated to `language = 'hi'`.
3. **Removal from Interfaces**: All 3-option dropdowns/switchers are replaced by an accessible 2-option segmented toggle (`EN | हिन्दी`).
4. **CI Guard**: Automated build guard script `scripts/guard-no-marathi.js` permanently fails the build if `mr` locales, enum values, or columns reappear.
5. **Resident Input Freedom**: Residents remain fully able to type Marathi (or any Devanagari script text) in grievances, comments, and messages. Full Devanagari font shaping and rendering is retained.

---

## 2. Complete Inventory & Disposition of Matches

A full repository scan across all source code, configuration files, schemas, and markdown files identified **220 text matches**.

### 2.1 Allow-Listed Legitimate Non-Language Hits
The following occurrences of `mr` were verified as legitimate non-language uses and are permanently allow-listed:
| File | Context / Line | Classification | Action |
| :--- | :--- | :--- | :--- |
| `apps/web/src/lib/fallback-community.ts:180` | `Mr. S. Rao` | Honorific title ("Mister") | **PRESERVED** |
| `apps/web/src/app/admin/users/import/page.tsx:139` | `file:mr-4` | Tailwind CSS margin-right class | **PRESERVED** |
| `apps/web/src/app/admin/users/[id]/page.tsx:119,149,154,164,168` | `w-4 h-4 mr-1`, `mr-2` | Tailwind CSS margin-right classes | **PRESERVED** |
| `apps/web/src/app/admin/support/page.tsx:225` | `w-3.5 h-3.5 mr-1` | Tailwind CSS margin-right class | **PRESERVED** |
| `apps/web/src/app/app/grievances/[id]/page.tsx:508,518` | `w-3.5 h-3.5 mr-1` | Tailwind CSS margin-right classes | **PRESERVED** |
| `apps/web/src/app/app/messages/page.tsx:276` | `w-3.5 h-3.5 mr-1` | Tailwind CSS margin-right class | **PRESERVED** |
| `apps/web/src/app/testimonials/page.tsx:77` | `w-3.5 h-3.5 mr-1` | Tailwind CSS margin-right class | **PRESERVED** |
| `apps/web/src/app/vendor/page.tsx:270,280` | `w-3.5 h-3.5 mr-1` | Tailwind CSS margin-right classes | **PRESERVED** |
| `apps/web/src/app/vendor/tasks/[id]/page.tsx:348,357,409,435,531` | `w-4 h-4 mr-1.5`, `mr-1` | Tailwind CSS margin-right classes | **PRESERVED** |
| `apps/web/src/components/InstallPrompt.tsx:84` | `-mr-1 -mt-1` | Tailwind CSS margin-right class | **PRESERVED** |
| `packages/ui/src/LanguageSwitcher.tsx:38` | `ml-2 mr-1` | Tailwind CSS margin-right class | **PRESERVED** |

---

### 2.2 Database Migrations & Schemas
| File / Table | Original Marathi References | Removal & Migration Action |
| :--- | :--- | :--- |
| `0002_grievance_module.sql` (`category`) | `name_mr VARCHAR(100)` | Archived into `legacy_marathi_content`; column dropped via `0008_remove_marathi_archive.sql`. |
| `0004_community_modules.sql` (`notice_category`) | `name_mr VARCHAR(100)` | Archived into `legacy_marathi_content`; column dropped via `0008_remove_marathi_archive.sql`. |
| `0004_community_modules.sql` (`notice_translation`) | `lang = 'mr'`, `title`, `body` | Archived into `legacy_marathi_content`; rows deleted; constraint `CHECK (lang IN ('en', 'hi'))` added. |
| `0004_community_modules.sql` (`poll_option`) | `label_mr VARCHAR(200)` | Archived into `legacy_marathi_content`; column dropped via `0008_remove_marathi_archive.sql`. |
| `0006_phase7_amenities_billing.sql` (`amenity`) | `name_mr`, `description_mr`, `rules_mr` | Archived into `legacy_marathi_content`; columns dropped via `0008_remove_marathi_archive.sql`. |
| `0006_phase7_amenities_billing.sql` (`billing_head`)| `name_mr VARCHAR(100)` | Archived into `legacy_marathi_content`; column dropped via `0008_remove_marathi_archive.sql`. |
| `0007_phase8_vendors_cms_privacy_ops.sql` (`cms_faq`)| `question_mr`, `answer_mr` | Archived into `legacy_marathi_content`; columns dropped via `0008_remove_marathi_archive.sql`. |
| `0007_phase8_vendors_cms_privacy_ops.sql` (`site_setting`)| `value_mr TEXT` | Archived into `legacy_marathi_content`; column dropped via `0008_remove_marathi_archive.sql`. |
| `app_user` (`language` column) | `language = 'mr'` | Migrated to `'hi'`: `UPDATE app_user SET language = 'hi' WHERE language = 'mr'`. |

---

### 2.3 Backend Services & CLI Seeds
| File | Action Taken |
| :--- | :--- |
| `apps/api/src/modules/amenities/amenities.service.ts` | Removed `name_mr`, `description_mr`, `rules_mr` from SQL SELECT, INSERT, and UPDATE queries. Removed `WHEN 'mr'` fallback. |
| `apps/api/src/modules/billing/billing.service.ts` | Removed `name_mr` from billing head queries. |
| `apps/api/src/modules/cms/cms.service.ts` | Removed `question_mr`, `answer_mr`, `value_mr` from FAQ and site setting handlers. |
| `apps/api/src/modules/governance/governance.service.ts`| Removed `name_mr` from category creation and update queries. |
| `apps/api/src/modules/notices/notices.service.ts` | Removed `name_mr` from notice categories; removed `dto.translations?.mr` handling; removed `'mr'` notice translations. |
| `apps/api/src/modules/polls/polls.service.ts` | Removed `label_mr` from poll option insertions and group-by clauses. |
| `apps/api/src/cli/seed-analytics.ts` | Removed `name_mr` and `cat.mr` from analytics category seeding. |
| `apps/api/src/database/seed.ts` | Removed `name_mr` from default category seeding. |

---

### 2.4 Contracts & Shared Schemas
| File | Action Taken |
| :--- | :--- |
| `packages/contracts/src/cms.schema.ts` | Removed `question_mr` and `answer_mr` from `FaqItemSchema`. |
| `packages/contracts/src/index.ts` | Removed `mr` from `CreateNoticeSchema` and `UpdateNoticeSchema` translations. Added validation rejecting `language: 'mr'`. |
| `packages/contracts/src/money.ts` | Updated documentation comments referring to EN/HI/MR to reflect EN/HI. |

---

### 2.5 Frontend Applications, Switchers & Pages
| File / Area | Action Taken |
| :--- | :--- |
| `apps/web/src/i18n/locales/mr.json` | Removed file completely. |
| `apps/web/src/lib/i18n.ts` | Redefined `Locale = 'en' | 'hi'`. Removed import of `mr.json`. |
| `apps/web/src/components/LanguageSelector.tsx` | Replaced 3-option menu with 2-option segmented toggle: `EN | हिन्दी`. |
| `apps/web/src/components/Navbar.tsx` | Replaced dropdown with direct `EN | हिन्दी` segmented toggle (44px touch targets). |
| `apps/web/src/components/Footer.tsx` | Replaced footer language links with `EN` and `हिन्दी`. |
| `packages/ui/src/LanguageSwitcher.tsx` | Redefined `SupportedLocale = 'en' | 'hi'`. Replaced UI with accessible segmented button. |
| `apps/web/src/components/AccessibilityProvider.tsx`| Updated profile language check to `['en', 'hi'].includes(...)`. |
| `apps/web/src/app/admin/amenities/page.tsx` | Removed Marathi tab (`langTab`) and inputs (`name_mr`, `description_mr`, `rules_text_mr`). |
| `apps/web/src/app/admin/billing/heads/page.tsx` | Removed Marathi tab and `name_mr` inputs. |
| `apps/web/src/app/admin/cms/page.tsx` | Removed Marathi FAQ and site setting tabs and inputs. |
| `apps/web/src/app/admin/notices/new/page.tsx` | Removed `MR` language pill and Marathi editor. |
| `apps/web/src/app/admin/notices/[id]/edit/page.tsx`| Removed `MR` language pill and Marathi editor. |
| `apps/web/src/app/admin/settings/categories/page.tsx`| Removed Marathi category name input. |
| `apps/web/src/app/admin/settings/notices/page.tsx` | Removed Marathi notice category input. |
| `apps/web/src/app/admin/users/import/page.tsx` | Updated spreadsheet validator to reject `'mr'` with clear error: `Language must be 'en' or 'hi'`. |
| `apps/web/src/app/onboarding/profile/page.tsx` | Removed Marathi selection button. |
| `apps/web/src/app/app/settings/security/page.tsx` | Removed Marathi toggle option. |
| `apps/web/src/app/layout.tsx` | Updated `availableLanguage: ['en', 'hi']`. |
| `apps/web/src/content/ecosystem.ts` & `roleTabs.ts` | Updated public marketing copy from "English, Hindi, and Marathi" to "English and Hindi". |

---

### 2.6 User Guides & Documentation
| File | Action Taken |
| :--- | :--- |
| `docs/guides/resident-guide.mr.md` | Removed. Guides maintained in `resident-guide.en.md` and `resident-guide.hi.md`. |
| `docs/guides/guard-guide.mr.md` | Removed. Guides maintained in `guard-guide.en.md` and `guard-guide.hi.md`. |
| `docs/guides/vendor-guide.mr.md` | Removed. Guides maintained in `vendor-guide.en.md` and `vendor-guide.hi.md`. |
| `docs/guides/secretary-guide.md` | Updated notice description to reference EN/HI support. |
| `docs/uat/uat-test-plan.md` | Updated i18n parity threshold to `en.json` and `hi.json`. |

---

### 2.7 Tooling & Automated CI Guards
- **`scripts/check-i18n.js`**: Updated to validate 100% key parity strictly between `en.json` and `hi.json`.
- **`scripts/guard-no-marathi.js`**: Created automated scanner failing CI if any `mr` locale identifier, `*_mr` database column, or `mr.json` file is introduced.

---

## 3. Verification & Compliance Sign-Off

1. **Archival Completeness**: Table `legacy_marathi_content` stores all historical Marathi texts with source table, row ID, field name, and timestamp.
2. **User Integrity**: All users with `language = 'mr'` successfully updated to `language = 'hi'`.
3. **No Marathi in Chrome**: Zero instances of `MR` or `मराठी` appear in interface navigation, headers, footers, forms, or system menus.
4. **Devanagari Font Integrity**: Noto Sans Devanagari and Latin fonts support Devanagari text input seamlessly for resident grievances and comments.

