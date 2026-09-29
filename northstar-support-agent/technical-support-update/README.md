# Northstar Support — AI Customer Support Agent

A polished portfolio demo of a customer support workflow. Visitors can chat with Nova, ask about fictional orders, inspect the knowledge base, continue a multi-turn conversation, and create a simulated human handoff.

## Live-demo features

- **Support chat:** contextual answers to shipping, returns, cancellation, billing, warranty, and account questions.
- **Grounded content:** nine visible knowledge articles; response source chips link to their articles.
- **Order lookup:** five synthetic orders across three customers. Try `NS-20481` (in transit) or `NS-20512` (processing).
- **Conversation context:** follow up with “Can I cancel it?” after asking about an order.
- **Technical support:** three guided checks for device connectivity, login, and app errors; source articles, explicit resolution, and a handoff containing the issue and checks attempted. Technical checks are deterministic in both demo and hosted modes.
- **Human escalation:** explicit human requests, billing disputes, and some order actions offer a simulated handoff and summary. No ticket is actually sent.
- **Optional hosted AI:** a Vercel serverless endpoint uses OpenAI when configured; the app falls back to a deterministic demo agent if unavailable.

All names, emails, policies, order IDs, statuses, tracking references, and handoffs are fictional. The demo is not connected to a real CRM, order system, or support queue. Chat state lives in browser memory and resets on refresh.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates the production site in `dist/`.

The Vite dev server has no `/api/chat` endpoint; it automatically uses the built-in demo responses. To test the hosted AI endpoint locally, use `vercel dev` with the environment variables below.

## Publish on GitHub and deploy to Vercel

1. Create an empty GitHub repository, then from this folder run:

   ```bash
   git init
   git add .
   git commit -m "Build Northstar AI support demo"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. In Vercel, select **Add New → Project**, import that repository, and deploy. Vercel should detect **Vite**. Build command: `npm run build`; output directory: `dist`. The serverless route is `api/chat.js`.
3. Optional: add `OPENAI_API_KEY` as a Vercel environment variable, then redeploy to enable hosted AI responses. Optionally set `OPENAI_MODEL` (default: `gpt-4o-mini`). Keep the key in Vercel settings, never in client code or GitHub.
4. Share the Vercel deployment URL and GitHub repository link in your portfolio.

The app is fully interactive without an API key. Hosted AI incurs provider charges and depends on the configured model being available to your account.

## Architecture

`src/main.js` renders the interface and manages the conversation; `src/data.js` contains synthetic records and policies; `src/agent.js` handles local lookup, retrieval, follow-up context, and escalation; `src/technical.js` provides the shared guided troubleshooting flow; `api/chat.js` is the optional Vercel serverless AI adapter. The API receives the recent conversation, selects relevant policy context and an exact matching demo order, then instructs the model to stay within those facts. If the endpoint is unconfigured or fails, the client uses the local agent.

## Portfolio walkthrough

1. Select **Where is my order?**, then ask “Can I cancel it?” to show context and the shipped-order constraint.
2. Select **Can I return this?**, then open the `KB-102` source chip.
3. Select **Talk to a person**, then click **Create handoff** to show the preserved issue summary.
4. Explore **Customers** and **Knowledge base** to show where the responses come from.

## Technical support walkthrough

Select **Technical support**, then reply `still not working` after each of the three checks. Click **Create handoff** to see the original issue and checks with customer results. Alternatively reply `resolved` to close troubleshooting or `human` to escalate early. Start a new conversation for `I cannot log in` or `My app crashes`.

The checks are general fictional-demo guidance. Nova cannot inspect or control a device, reset accounts, verify identity, or create a real ticket. A simple `yes` does not close troubleshooting; use an explicit result such as `resolved`.

Run `npm test` to check connectivity progression, resolution, sensitive login escalation, topic switching, and the technical serverless route without an AI key.

## Current limits

This is a portfolio simulation, not a production help desk. For a production system, add authentication, real CRM/order APIs, durable tickets and conversations, rate limiting, monitoring, privacy controls, and an evaluation suite. The optional endpoint sends conversation content to the configured AI provider; only synthetic data should be used in this demo.
