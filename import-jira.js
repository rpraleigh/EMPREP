#!/usr/bin/env node
/**
 * Jira Import Script – Emergency Preparedness App
 * Project: RPRAL @ rpraleigh.atlassian.net
 * Auth:    rraleigh@gmail.com + JIRA_API_TOKEN env var
 *
 * Usage:
 *   JIRA_API_TOKEN=<token> node import-jira.js
 *
 * Dry-run (no API calls):
 *   DRY_RUN=1 JIRA_API_TOKEN=dummy node import-jira.js
 */

const BASE_URL = "https://rpraleigh.atlassian.net";
const PROJECT_KEY = "SCRUM";
const PROJECT_ID = "10000";
const EMAIL = "rraleigh@gmail.com";
const API_TOKEN = process.env.JIRA_API_TOKEN;
const DRY_RUN = process.env.DRY_RUN === "1";

if (!API_TOKEN) {
  console.error("Error: JIRA_API_TOKEN environment variable is not set.");
  process.exit(1);
}

const AUTH = Buffer.from(`${EMAIL}:${API_TOKEN}`).toString("base64");

const HEADERS = {
  Authorization: `Basic ${AUTH}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

// ─────────────────────────────────────────────
// DATA: 8 Epics + 44 Stories
// ─────────────────────────────────────────────

const EPICS = [
  {
    key: "EPIC_ALERT",
    summary: "Alert & Notification System",
    description:
      "Multi-channel alerting for emergencies including push notifications, SMS, and sirens.",
  },
  {
    key: "EPIC_RESOURCE",
    summary: "Resource & Supply Management",
    description:
      "Track inventory of food, water, medical supplies, and equipment.",
  },
  {
    key: "EPIC_COMM",
    summary: "Communication & Coordination Hub",
    description:
      "Enable real-time communication between responders, volunteers, and citizens.",
  },
  {
    key: "EPIC_MAP",
    summary: "Mapping & Situational Awareness",
    description:
      "Interactive maps showing hazard zones, shelters, and resource distribution.",
  },
  {
    key: "EPIC_EVAC",
    summary: "Evacuation Planning & Routing",
    description:
      "Dynamic evacuation route planning accounting for road closures and population density.",
  },
  {
    key: "EPIC_SHELTER",
    summary: "Shelter & Capacity Management",
    description:
      "Track shelter locations, available capacity, and special needs accommodations.",
  },
  {
    key: "EPIC_REPORT",
    summary: "Incident Reporting & Documentation",
    description:
      "Standardized incident logging, photo upload, and after-action reporting.",
  },
  {
    key: "EPIC_TRAIN",
    summary: "Training & Drill Management",
    description:
      "Schedule, execute, and evaluate emergency preparedness drills and exercises.",
  },
];

// Stories keyed by epic key
const STORIES = {
  EPIC_ALERT: [
    {
      summary: "Configure push notification provider",
      description:
        "Integrate with FCM/APNs to deliver push alerts to mobile devices.",
    },
    {
      summary: "Build SMS alert dispatch service",
      description:
        "Send automated SMS messages via Twilio when an emergency is declared.",
    },
    {
      summary: "Design alert severity levels",
      description:
        "Define and implement severity tiers (Info, Warning, Critical) with corresponding UI treatments.",
    },
    {
      summary: "Create alert subscription management UI",
      description:
        "Allow users to opt in/out of alert categories and set geographic preferences.",
    },
    {
      summary: "Implement alert delivery confirmation tracking",
      description:
        "Log and display delivery receipts so dispatchers know which alerts were received.",
    },
    {
      summary: "Add multi-language alert templates",
      description:
        "Support English and Spanish alert messages, with extensible i18n framework.",
    },
  ],

  EPIC_RESOURCE: [
    {
      summary: "Build resource inventory data model",
      description:
        "Define schema for supply items including category, unit, quantity, and expiry.",
    },
    {
      summary: "Create inventory entry and update UI",
      description: "Form-based interface for adding and editing supply records.",
    },
    {
      summary: "Implement low-stock threshold alerts",
      description:
        "Notify managers when any supply falls below a configurable minimum.",
    },
    {
      summary: "Build resource request workflow",
      description:
        "Allow field teams to request supplies and track fulfillment status.",
    },
    {
      summary: "Generate supply consumption reports",
      description:
        "Dashboard showing resource usage over time with CSV export.",
    },
    {
      summary: "Integrate barcode scanning for inventory",
      description:
        "Use device camera to scan barcodes for fast inventory check-in/check-out.",
    },
  ],

  EPIC_COMM: [
    {
      summary: "Set up real-time messaging infrastructure",
      description:
        "Deploy WebSocket-based chat using Socket.IO or similar for low-latency messaging.",
    },
    {
      summary: "Create incident-specific chat channels",
      description:
        "Automatically provision a dedicated channel for each declared incident.",
    },
    {
      summary: "Implement role-based channel access",
      description:
        "Restrict channel visibility to relevant responders, commanders, and volunteers.",
    },
    {
      summary: "Build broadcast announcement feature",
      description:
        "Allow commanders to send one-way announcements to all channel members.",
    },
    {
      summary: "Add message read receipts",
      description:
        "Display per-message delivery and read status for accountability.",
    },
    {
      summary: "Enable file and photo sharing in channels",
      description:
        "Support image and document attachments up to 25 MB in messaging channels.",
    },
  ],

  EPIC_MAP: [
    {
      summary: "Integrate base map provider",
      description:
        "Embed Mapbox or Google Maps SDK with offline tile caching support.",
    },
    {
      summary: "Display real-time hazard zones",
      description:
        "Render GeoJSON polygon overlays for flood, fire, and chemical hazard areas.",
    },
    {
      summary: "Show shelter and resource point markers",
      description:
        "Plot shelter and supply depot locations with drill-down info cards.",
    },
    {
      summary: "Implement user location tracking",
      description:
        "Display responder and volunteer positions on the live map with consent controls.",
    },
    {
      summary: "Add search and address lookup",
      description:
        "Geocoding search bar to find addresses and jump to map locations.",
    },
    {
      summary: "Build layer toggle controls",
      description:
        "UI panel to show/hide individual map layers (hazards, shelters, routes, etc.).",
    },
  ],

  EPIC_EVAC: [
    {
      summary: "Define evacuation zone data model",
      description:
        "Store zone boundaries, priority order, and associated population estimates.",
    },
    {
      summary: "Calculate primary and alternate routes",
      description:
        "Use routing API to generate primary and two alternate evacuation paths per zone.",
    },
    {
      summary: "Handle road closure overlays",
      description:
        "Allow dispatchers to mark roads as closed and auto-recalculate affected routes.",
    },
    {
      summary: "Send zone-specific evacuation alerts",
      description:
        "Trigger targeted alerts to residents in an activated evacuation zone.",
    },
    {
      summary: "Display route capacity indicators",
      description:
        "Estimate route congestion and surface warnings when a route is near capacity.",
    },
    {
      summary: "Track evacuation compliance rates",
      description:
        "Aggregate check-in data from shelters to estimate zone evacuation progress.",
    },
  ],

  EPIC_SHELTER: [
    {
      summary: "Create shelter registration and profile pages",
      description:
        "CRUD interface for shelter details: name, address, capacity, and amenities.",
    },
    {
      summary: "Implement real-time occupancy tracking",
      description:
        "Allow shelter staff to log arrivals and departures to maintain live headcounts.",
    },
    {
      summary: "Add special needs accommodation flags",
      description:
        "Tag shelters with ADA accessibility, pet-friendly, medical, and language support flags.",
    },
    {
      summary: "Build shelter availability dashboard",
      description:
        "Command center view showing all shelters, occupancy %, and status at a glance.",
    },
    {
      summary: "Send capacity threshold notifications",
      description:
        "Alert coordinators when a shelter reaches 80% and 100% capacity.",
    },
    {
      summary: "Enable inter-shelter transfer requests",
      description:
        "Workflow for moving evacuees between shelters when one reaches capacity.",
    },
  ],

  EPIC_REPORT: [
    {
      summary: "Design standardized incident report form",
      description:
        "Structured form capturing type, location, severity, resources deployed, and timeline.",
    },
    {
      summary: "Implement photo and document attachment upload",
      description:
        "Allow responders to attach photos and PDFs to incident reports from mobile devices.",
    },
    {
      summary: "Build after-action report (AAR) template",
      description:
        "Post-incident AAR with lessons-learned, timeline reconstruction, and recommendations.",
    },
    {
      summary: "Generate PDF report exports",
      description:
        "Produce a formatted, printable PDF from any incident or AAR record.",
    },
    {
      summary: "Create incident analytics dashboard",
      description:
        "Aggregate incident data into charts showing frequency, type, and response times.",
    },
    {
      summary: "Implement report approval workflow",
      description:
        "Multi-step review and sign-off process before reports are finalized.",
    },
  ],

  EPIC_TRAIN: [
    {
      summary: "Build drill scheduling calendar",
      description:
        "Calendar interface for creating, editing, and viewing upcoming drill events.",
    },
    {
      summary: "Create exercise scenario library",
      description:
        "Reusable scenario templates (wildfire, flood, mass casualty) with objectives and injects.",
    },
    {
      summary: "Track participant attendance and roles",
      description:
        "Register attendees for each drill and assign ICS roles for the exercise.",
    },
    {
      summary: "Implement real-time inject delivery",
      description:
        "Push timed scenario injects to participants during live exercises.",
    },
    {
      summary: "Collect post-drill evaluation surveys",
      description:
        "Structured survey for capturing participant feedback and controller observations.",
    },
    {
      summary: "Generate training completion reports",
      description:
        "Certifiable training records showing each participant's drill history and scores.",
    },
  ],
};

// ─────────────────────────────────────────────
// JIRA API HELPERS
// ─────────────────────────────────────────────

async function jiraRequest(method, path, body) {
  const url = `${BASE_URL}/rest/api/3${path}`;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] ${method} ${url}`);
    if (body) console.log(`           ${JSON.stringify(body).slice(0, 120)}…`);
    return { id: `DRY_ID_${Math.random().toString(36).slice(2)}`, key: "RPRAL-0" };
  }

  const res = await fetch(url, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira API ${method} ${url} → ${res.status}: ${text}`);
  }

  return res.json();
}

/** Fetch the Jira issue type ID for "Epic" and "Story" in the project. */
async function getIssueTypeIds() {
  if (DRY_RUN) return { epicTypeId: "10010", storyTypeId: "10009" };

  const types = await jiraRequest("GET", `/issuetype/project?projectId=${PROJECT_ID}`);

  const epic = types.find((t) => t.name === "Epic");
  const story = types.find((t) => t.name === "Story");

  if (!epic) throw new Error("Issue type 'Epic' not found.");
  if (!story) throw new Error("Issue type 'Story' not found.");

  return { epicTypeId: epic.id, storyTypeId: story.id };
}

/** Create a Jira Epic and return its issue key (e.g. "RPRAL-1"). */
async function createEpic(epicData, epicTypeId) {
  const body = {
    fields: {
      project: { key: PROJECT_KEY },
      summary: epicData.summary,
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: epicData.description }],
          },
        ],
      },
      issuetype: { id: epicTypeId },
    },
  };

  const result = await jiraRequest("POST", "/issue", body);
  return result.key;
}

/** Create a Jira Story linked to a parent epic by issue key. */
async function createStory(storyData, epicKey, storyTypeId) {
  const body = {
    fields: {
      project: { key: PROJECT_KEY },
      summary: storyData.summary,
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: storyData.description }],
          },
        ],
      },
      issuetype: { id: storyTypeId },
      // Link story to parent epic. Jira Cloud uses "parent" field.
      parent: { key: epicKey },
    },
  };

  const result = await jiraRequest("POST", "/issue", body);
  return result.key;
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Jira Import – Project: ${PROJECT_KEY}${DRY_RUN ? "  [DRY RUN]" : ""}\n`);

  // 1. Resolve issue type IDs
  console.log("Fetching issue type IDs…");
  const { epicTypeId, storyTypeId } = await getIssueTypeIds();
  console.log(`  Epic type ID:  ${epicTypeId}`);
  console.log(`  Story type ID: ${storyTypeId}\n`);

  const epicKeyMap = {}; // EPIC_ALERT → RPRAL-n

  // 2. Create epics
  console.log(`Creating ${EPICS.length} epics…`);
  for (const epic of EPICS) {
    process.stdout.write(`  [Epic] ${epic.summary} … `);
    const issueKey = await createEpic(epic, epicTypeId);
    epicKeyMap[epic.key] = issueKey;
    console.log(issueKey);
  }
  console.log();

  // 3. Create stories
  let totalStories = 0;
  for (const epic of EPICS) {
    const stories = STORIES[epic.key] ?? [];
    const epicIssueKey = epicKeyMap[epic.key];
    console.log(`Creating ${stories.length} stories under ${epicIssueKey} – "${epic.summary}"`);
    for (const story of stories) {
      process.stdout.write(`  [Story] ${story.summary} … `);
      const storyKey = await createStory(story, epicIssueKey, storyTypeId);
      console.log(storyKey);
      totalStories++;
    }
    console.log();
  }

  console.log(`✅ Done! Created ${EPICS.length} epics and ${totalStories} stories.`);
}

main().catch((err) => {
  console.error("\n❌ Import failed:", err.message);
  process.exit(1);
});
