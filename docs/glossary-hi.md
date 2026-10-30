# GrievEase Hindi (HI) Standardization Glossary & Style Guide

This document defines the official Hindi terminology for all GrievEase interfaces, public pages, audit trails, and resident workflows. Adherence to this glossary ensures consistency across all components, notifications, receipts, and administrative consoles.

---

## 1. Core Governance & Escalation Terminology

| English Term | Standard Hindi (Devanagari) | Romanized | Context & Guidelines |
| :--- | :--- | :--- | :--- |
| **GrievEase** | **GrievEase** / **ग्रीवईज़** | GrievEase | Keep brand name intact; Devanagari transliteration allowed in headings. |
| **Grievance / Complaint** | **शिकायत** | Shikayat | Standard term for any residential ticket or issue. |
| **Escalation** | **स्वचालित अग्रेषण** | Swachalit Agreshan | Automatic routing up the SLA chain when a deadline expires. |
| **SLA (Service Level Agreement)** | **सेवा स्तर समय-सीमा (SLA)** | Seva Star Samay-Seema | The guaranteed countdown window for ticket resolution. |
| **SLA Countdown Timer** | **उलटी गिनती टाइमर** | Ulti Ginti Timer | Real-time countdown clock displayed on complaint tickets. |
| **Level 1 (L1) - Secretary** | **स्तर १ (L1) - सचिव** | Star 1 - Sachiv | First-line resolver (48 hours). |
| **Level 2 (L2) - Committee** | **स्तर २ (L2) - प्रबंध समिति** | Star 2 - Prabandh Samiti | Managing Committee tier (72 hours). |
| **Level 3 (L3) - Chairman** | **स्तर ३ (L3) - अध्यक्ष** | Star 3 - Adhyaksh | Chairman executive tier (96 hours). |
| **Level 4 (L4) - Governing Body** | **स्तर ४ (L4) - शासी निकाय** | Star 4 - Shasi Nikay | Full General Body oversight tier (120 hours). |
| **Resolver** | **निवारक / समाधानकर्ता** | Nivarak / Samadhankarta | Designated person responsible for resolving a complaint. |
| **Anonymous Complaint** | **गोपनीय / अनाम शिकायत** | Gopneeya / Anaam Shikayat | Ticket filed without disclosing flat number or resident name. |
| **Audit Log / Audit Trail** | **अपरिवर्तनीय ऑडिट लॉग** | Apariwartaneeya Audit Log | SHA-256 hash-chained immutable activity ledger. |
| **Proof of Resolution** | **समाधान प्रमाण** | Samadhan Pramaan | Compulsory photo and digital signature verification. |

---

## 2. Maintenance Billing & Cash Ledger Terminology

| English Term | Standard Hindi (Devanagari) | Romanized | Context & Guidelines |
| :--- | :--- | :--- | :--- |
| **Maintenance Bill** | **रखरखाव बिल** | Rakhrakhav Bill | Monthly/quarterly society dues statement. |
| **Cash Payment** | **नकद भुगतान** | Nakad Bhugtan | GrievEase operates strictly on manually recorded cash transactions. |
| **Ledger** | **बहीखाता / लेजर** | Bahikhata / Ledger | Append-only financial record table. |
| **Payment Receipt** | **भुगतान रसीद** | Bhugtan Raseed | Numbered receipt generated upon cash collection. |
| **Amount in Words** | **शब्दों में राशि** | Shabdon Mein Rashi | Indian currency notation (e.g. Five Thousand Rupees Only). |
| **Maker-Checker** | **निर्माता-जांचकर्ता नियम** | Nirmata-Janchkarta Niyam | Separation of duties preventing self-approval of waivers/voids. |
| **Reversal Entry** | **प्रत्यावर्तन प्रविष्टि** | Pratyavartan Pravishti | Corrective entry for accounting mistakes without hard deletes. |
| **Billing Head** | **बिलिंग मद** | Billing Mad | Component charge (e.g. Sinking Fund, Water Charges). |
| **Outstanding Dues** | **बकाया राशि** | Bakaya Rashi | Unpaid maintenance charges. |

---

## 3. Security, Guard Console & Visitor Passes

| English Term | Standard Hindi (Devanagari) | Romanized | Context & Guidelines |
| :--- | :--- | :--- | :--- |
| **Security Guard** | **सुरक्षा गार्ड** | Suraksha Guard | Main gate security personnel. |
| **Guard Console** | **गार्ड कंसोल** | Guard Console | High-contrast, offline-tolerant touch tablet interface. |
| **Visitor Gate Pass** | **आगंतुक गेट पास** | Aagantuk Gate Pass | Entry authorization token for visitors, cabs, and deliveries. |
| **Pre-approved Pass** | **पूर्व-स्वीकृत पास** | Poorva-Sweekrit Pass | Pass generated in advance by a resident. |
| **Emergency SOS** | **आपातकालीन एसओएस (SOS)** | Aapatkaleen SOS | Red-alert panic button broadcasting to main gate and guards. |
| **Vendor Task** | **विक्रेता कार्य आदेश** | Vikreta Karya Aadesh | Assigned maintenance task for external plumbing, electrical, etc. |
| **Domestic Staff** | **सहायक स्टाफ** | Sahayak Staff | Maids, drivers, cooks with daily entry logging. |

---

## 4. Resident Experience & General UI

| English Term | Standard Hindi (Devanagari) | Romanized | Context & Guidelines |
| :--- | :--- | :--- | :--- |
| **Resident** | **निवासी** | Niwasi | Apartment owner or tenant. |
| **Housing Society** | **आवासीय सोसायटी** | Aawasiya Society | Gated community or apartment complex. |
| **Amenity Booking** | **सुविधा आरक्षण** | Suvidha Aarakshan | Booking clubhouse, tennis court, swimming pool, etc. |
| **Notice Board** | **सूचना पट्ट** | Soochna Patt | Official society circulars and committee announcements. |
| **Community Poll** | **सामुदायिक मतदान** | Samudayik Matdan | Resident voting on society resolutions. |
| **Transparency Dashboard** | **पारदर्शिता डैशबोर्ड** | Pardarshita Dashboard | Public metrics on resolution times, SLA adherence, and satisfaction. |
| **In-App Notification** | **ऐप सूचना** | App Soochna | Strictly local in-app alert; zero third-party push or SMS. |
| **Activate Account** | **खाता सक्रिय करें** | Khaata Sakriya Karein | Initial activation for pre-imported residents. |

---

## 5. Devanagari Typography & Number Formatting Rules
1. **Numbers**: All financial amounts use standard Indian digit grouping (e.g. `₹1,23,456.00`). In Hindi UI, Latin digits (`1, 2, 3...`) are preferred for readability alongside Rupee symbol (`₹`).
2. **Line Heights**: Devanagari requires 1.65–1.75 line-height for body copy and 1.35–1.4 for headings to accommodate ascenders (matras like ौ, ै, ो) and descenders (ु, ू, ृ).
3. **Accessibility**: All interactive elements must maintain minimum 44×44px touch targets.

