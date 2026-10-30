# GrievEase Guard Security Console Manual (English)

## 1. Overview & Terminal Setup

The **Guard Security Console** (`/guard`) runs on touchscreens, tablets, or desktop PCs located at society gates. It is optimized for rapid check-ins, offline gate token verification, and real-time emergency alarms.

---

## 2. Daily Shift Log-In

1. Open `https://<society-domain>/login`.
2. Enter security guard username and gate terminal password.
3. The interface opens directly to the **Guard Console** (`/guard`).

---

## 3. Validating Pre-Approved Visitor Passes

When a guest, delivery person, or contractor arrives:
1. Tap **Scan Pass** on the touchscreen.
2. Point the device camera at the visitor's QR code (or type the 12-character alphanumeric token e.g. `VP-9K2M-4X7L`).
3. The console queries the database and displays:
   - **Green Badge**: Pass is valid and active.
   - Flat number and resident name.
   - Visitor category (`GUEST`, `DELIVERY`, `CAB`, `VENDOR`).
4. For contractor visits (`type: VENDOR`), the console shows the approved visit window and contractor company name.
5. Tap **Confirm Check-In**.
6. The resident receives an in-app check-in notification.

---

## 4. Unannounced / Walk-In Visitors

If a visitor arrives without a pre-generated pass:
1. Tap **Log Walk-In**.
2. Select destination Flat (e.g., `A-304`).
3. Enter visitor's Name and Mobile Number.
4. Select Purpose (Delivery, Service, Guest).
5. Tap **Send Entry Request**.
6. The resident's phone immediately receives a real-time prompt: **"Allow entry for [Visitor Name]?"**
7. Once the resident taps **Approve**, the guard console turns green. Tap **Admit Visitor**.

---

## 5. Responding to Emergency SOS Alarms

If a resident presses their emergency SOS button:
1. The guard console sounds an **audible siren** and flashes a full-screen **RED SOS ALERT**.
2. The alert displays the exact **Flat Number, Wing, and Timestamp**.
3. Security protocol:
   - Immediately dispatch gate patrol officer to the designated flat.
   - Contact the resident via intercom.
   - Tap **Acknowledge Alert** on the console to silence the siren while response is in progress.
   - Once resolved, tap **Mark Resolved** with an incident note.

