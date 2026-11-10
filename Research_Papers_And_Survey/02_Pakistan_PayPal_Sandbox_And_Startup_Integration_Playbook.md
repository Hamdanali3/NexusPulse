# Pakistan Developer Playbook: PayPal Sandbox, REST APIs, SDKs, MCP Server & Post-Hackathon Startup Launch

---

## 1. Executive Summary: Can You Compete, Integrate PayPal & Win from Pakistan?

1. **Hackathon Eligibility from Pakistan:** **100% Eligible.** Under Section 3 of the Official Rules, only residents of comprehensively sanctioned jurisdictions (Cuba, Iran, North Korea, Crimea, Russia) and Brazil/Quebec are excluded. Pakistan is fully eligible.
2. **Receiving Prize Money in Pakistan:** **No Live PayPal Account Required.** Under Section 8 (Prize Delivery), Devpost pays international winners via **electronic bank wire transfer** or check after completing a winner affidavit and **IRS Form W-8BEN**.
3. **Using PayPal Sandbox APIs (`api-m.sandbox.paypal.com`) from Pakistan:** **Zero IP or Geo-Blocking.** Once you have a `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`, every PayPal Sandbox REST API (`Orders v2`, `Payouts v1`, `Invoicing v2`, `Subscriptions v1`, `Disputes v1`, `Transaction Search v1`), the **PayPal JS SDK v6** (`https://www.sandbox.paypal.com/web-sdk/v6/core`), the **PayPal Agent Toolkit** (`@paypal/agent-toolkit`), the **PayPal Server SDK** (`@paypal/paypal-server-sdk`), and the **PayPal Sandbox MCP Server** (`https://mcp.sandbox.paypal.com/sse`) work directly from Pakistani internet connections without any VPN.

---

## 2. How We Solve the Pakistan Sign-Up Bottleneck (3 Official Routes + Dual-Mode Engine)

Because `developer.paypal.com` uses PayPal's consumer login form—which does not list Pakistan (`+92`) in the self-serve phone verification dropdown—**never use fake details or VoIP tricks**. Instead, use our **Dual-Track Strategy**:

### Track A: Architectural Solution Inside Our Codebase (Zero-Blocker Dual-Mode PayPal Engine)
Our application is engineered with a **Transparent Dual-Mode PayPal Gateway (`lib/paypal-gateway.ts`)**:
1. **Live PayPal Sandbox Mode (`PAYPAL_MODE=sandbox`):**
   - Automatically activates whenever `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set in `.env.local`.
   - Calls `https://api-m.sandbox.paypal.com` using `@paypal/paypal-server-sdk` (v2.5.0), `@paypal/agent-toolkit` (v1.11.0), and cached OAuth 2.0 `client_credentials` tokens (`POST /v1/oauth2/token`), and renders the live PayPal JS SDK v6 `<paypal-button>` web component.
2. **Spec-Exact Sandbox Mirror Fallback (`PAYPAL_MODE=mirror` or Auto-Fallback):**
   - Allows you (and hackathon judges who clone the repo without setting up keys) to develop, test, and run **100% of the end-to-end flows immediately** even before your Sandbox keys arrive.
   - Emulates the exact JSON payloads, HTTP status codes, HATEOAS `links[]`, PayPal T-codes (`T0001`, `T0006`), `PayPal-Request-Id` idempotency headers, and interactive Sandbox Buyer Approval popups (`sb-buyer@personal.example.com`).
   - Can be toggled live in the UI header (`[Live PayPal Sandbox API]` <-> `[Offline Spec Mirror]`) so development is never blocked for a single second!

### Track B: 3 Official, Policy-Compliant Ways to Get Real `PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET`
1. **Method 1 — Official PayPal Discord Request (Explicitly Endorsed in Devpost FAQs):**
   - The Official Hackathon FAQ states: *"PayPal account sign-up options vary by country, so if you can't complete sign-up from where you live (for example, your country or phone number isn't offered), please ask the PayPal team in the PayPal Discord."*
   - Join `http://developer.paypal.com/discord` and message the PayPal DevRel team (**Jo Franchetti**, **Marco Podien**, or **Eddie Jaoude**) in the hackathon channel using the ready-to-send template below:
     > *"Hi PayPal DevRel Team! I am an eligible participant in the PayPal AI Hackathon ('Build What's Next with PayPal and AI') based in Pakistan. Because Pakistan (+92) isn't listed on the self-serve developer.paypal.com registration form, I'm following the Official Hackathon FAQ instructions to request a Sandbox Client ID, Secret, and Sandbox buyer/seller test accounts for my hackathon submission. Thank you!"*
2. **Method 2 — Trusted Friend/Relative/Teammate in a Supported Country (Fastest — Takes 3 Minutes):**
   - PayPal's official Sandbox Testing Guide explicitly encourages sharing a dedicated developer sandbox account across a development team.
   - Any friend, family member, or teammate in the **UK, US, UAE, Saudi Arabia, Canada, EU, or Australia** can:
     1. Log into `https://developer.paypal.com/dashboard/applications/sandbox`
     2. Click **Create App** under **REST API apps** -> copy the **Sandbox `Client ID`** and **`Secret`**.
     3. Before generating the first token, scroll down to **Features** on that Sandbox App page and check **Payouts**, **Transaction Search**, **Subscriptions**, and **Invoicing** (important because PayPal Sandbox OAuth tokens cache permissions for up to 9 hours!).
     4. Go to **Testing Tools -> Sandbox Accounts** and copy the email and password of the auto-generated **Personal (`sb-...personal.example.com`)** and **Business (`sb-...business.example.com`)** sandbox accounts.
     5. Send those 4 sandbox strings to you—you paste them into `.env.local` in Pakistan and you are 100% connected to `https://api-m.sandbox.paypal.com`!
3. **Method 3 — Postman Public PayPal Workspace & APIMatic Context Plugin:**
   - Use PayPal's official Postman collection and the locally cloned APIMatic plugin ([`Toolkits_And_SDKs/server-sdk-context-plugin-preview`](file:///d:/StartUp/PayPal_AI_Hackathon/Toolkits_And_SDKs/server-sdk-context-plugin-preview)) to validate all request/response contracts immediately.

---

## 3. Technical Checklist for PayPal Best Practices (From `AI-Toolkit`)

Every PayPal integration in our project strictly enforces the 13 rules from [`AI-Toolkit/skills/paypal-best-practices/SKILL.md`](file:///d:/StartUp/PayPal_AI_Hackathon/AI-Toolkit/skills/paypal-best-practices/SKILL.md):
1. **No Hardcoded Credentials:** All keys read from `.env.local` (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `GEMINI_API_KEY`).
2. **Idempotency Header:** Include `PayPal-Request-Id: <UUID>` on every `POST` request (`orders`, `payouts`, `invoices`, `subscriptions`).
3. **OAuth Token Caching:** Cache the `Bearer A21AA...` token in memory until `expires_in - 60` seconds; refresh automatically on `401` and retry with exponential backoff on `429` / `5xx`.
4. **PayPal JS SDK v6 (`web-sdk/v6/core`):**
   - Load `<script async src="https://www.sandbox.paypal.com/web-sdk/v6/core"></script>`.
   - Initialize via `await window.paypal.createInstance({ clientId, components: ["paypal-payments", "venmo-payments", "paypal-messages"], pageType: "checkout" })`.
   - Check eligibility via `await sdkInstance.findEligibleMethods({ currencyCode: "USD", paymentFlow: "ONE_TIME_PAYMENT" })`.
   - Pass an invoked Promise `session.start({ presentationMode: "auto" }, createOrder())` where `createOrder()` returns `{ orderId: "..." }` and `onApprove(data)` reads `data.orderId` (lowercase `d`).
5. **Webhook Signature Verification:** Verify incoming webhooks via `POST /v1/notifications/verify-webhook-signature` using the raw unparsed body and the 5 `PAYPAL-*` delivery headers.

---

## 4. Post-Hackathon Startup Roadmap: Going Live Globally from Pakistan

When transitioning **Sovereign Pulse (AuraPay)** from the hackathon into a venture-backed startup serving global users with **Live PayPal**:
1. **Incorporate a US Delaware C-Corp or LLC** (via Stripe Atlas, Doola, or Firstbase — takes ~5 business days online from Pakistan, no US visa or travel required).
2. **Obtain a US EIN (Employer Identification Number)** from the IRS (included in the formation package).
3. **Open a US Business Bank Account** (Mercury or Wise Business) using your US Incorporation Documents, EIN, and Pakistani Passport.
4. **Open a Verified US PayPal Business & Braintree Account** linked to your US entity and US bank account—giving your startup full legal access to Live PayPal Checkout, Live Payouts, Live Subscriptions, Fastlane, and Agentic Commerce globally!
