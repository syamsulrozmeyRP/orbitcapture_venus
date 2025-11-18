# App Flow Document for ContentOS

## Onboarding and Sign-In/Sign-Up

When a newcomer first arrives at ContentOS, they land on a clean landing page that highlights the platform’s benefits and invites them to sign up or log in. The sign-up screen offers two options: creating an account with email and password or using a single sign-on integration with Google. During the email sign-up, users enter their name, workspace name, and workspace domain if they choose the white-label option. They then set a password and accept the privacy policy and terms of service. After submitting, they receive a confirmation email with a link to verify their address. If they registered via Google, verification happens automatically and they proceed directly to the onboarding wizard.

If users forget their password, they can click a “Forgot Password” link on the sign-in page. They enter their email address and receive a reset link. Clicking that link takes them to a page where they choose a new password and confirm it. Once reset, they return to the sign-in screen to log in with their new credentials. Signing out is as simple as clicking the user avatar in the top right corner of any page and selecting “Sign Out” from the dropdown menu.

Upon successful sign-up or login, all users are greeted by an onboarding wizard. This wizard welcomes them to their newly created or selected workspace. It briefly explains the key modules—content planner, editor, distribution center, analytics, and settings. It then prompts them to set initial goals for AI-driven content generation and to invite their first team members by entering email addresses. Once complete, users are guided to their workspace selection screen.

## Main Dashboard or Home Page

After choosing a workspace or completing the onboarding wizard, users arrive at the main Dashboard. The screen is divided into a left sidebar, a top header bar, and a main content area. The sidebar lists the core modules: Dashboard, Content Planner, Content Editor, Distribution Center, Persona & ICP Manager, Competitor Manager, Analytics, and Settings & Integrations. The header bar displays the workspace name or custom domain for white-label clients, the current AI credit balance, and the user avatar with a dropdown menu for profile and sign-out. All shared UI elements reuse the shadcn UI component library so layouts, buttons, inputs, and dialogs behave consistently across the experience.

In the central area, a summary view shows the content pipeline stages, including ideas, drafts in review, scheduled posts, and recent publications. A small panel highlights upcoming approval tasks. Below that, interactive cards surface quick AI-generated content ideas, recent performance snapshots of click-through rates, time on page, and social engagement. Each card and metric links users to the relevant module for deeper inspection.

## Detailed Feature Flows and Page Transitions

### Workspace Selection and Role-Based Entry

If a user belongs to multiple workspaces, the workspace selection screen lists each workspace by name, branded domain, and user role. Admins see options to manage seats and integrations, while Editors and Writers see a button to enter the workspace directly. Choosing a workspace transitions the user to the Dashboard of that workspace.

### Content Planning and Scheduling

When a user clicks the Content Planner in the sidebar, the calendar interface opens in full view. They can switch between weekly and monthly views by toggling a button in the top corner. To schedule new content, they click on a date cell, which opens a modal form. The form asks for a title, target channel, and scheduled time. Users can then invoke the AI agent to suggest a headline or outline. Once they save, the event appears on the calendar, and the user can click it again to jump into editing mode.

### Content Creation and Optimization

Selecting an item from the calendar or clicking Content Editor in the sidebar brings the user to the drafting canvas. The canvas is split into sections for title, body, metadata, and AI suggestions. On the right, a side panel displays persona notes, ICP details, competitive keywords, and SEO recommendations driven by the AI. The editor itself is built on Editor.js, so authors add and rearrange modular content blocks that map cleanly to multi-channel outputs. Real-time collaboration is enabled through Liveblocks tied into our WebSocket-backed collaboration service, so multiple users can edit simultaneously. A version history button reveals a timeline of drafts, allowing rollback to any previous state.

### Approval Workflow

Once the draft is ready, the author clicks “Submit for Review.” This action opens a form to select a first reviewer from workspace members or to invite a guest approver via email. Upon submission, the system sends notifications through email and Slack with direct review links. The review page highlights suggested changes and comment threads. The editor can approve, request revisions, or reject. After the first approval, the content automatically moves to a second approver. The status of each step is tracked in an Approval Queue, accessible from both the sidebar and the Dashboard.

### Distribution Center

Approved content appears in the Distribution Center. Here, users select one or more channels such as WordPress, Webflow, LinkedIn, Facebook, Instagram, Reddit, Mailchimp, or Substack. For each channel, a dedicated section loads, showing channel-specific fields like image sizes, character limits, and metadata. Users can click “Adapt with AI” to automatically format and shorten or expand content based on channel needs. They then schedule or publish immediately. A feed at the bottom of the page shows distribution status and any errors encountered during publishing.

### Analytics and Insights

When users choose Analytics, they land on a dashboard of interactive charts. At the top, they can filter by date range, persona segment, content type, or channel. The charts display click-through rates, time on page, conversions, open rates, impressions, reach, and engagement metrics. Each chart has a “View Recommendations” link that opens AI-driven insights suggesting content improvements or new topic areas based on performance trends and competitor gap analysis.

### Persona and Competitor Management

Clicking Persona & ICP Manager brings up a list of defined personas. Users can create or edit personas by inputting demographic data, pain points, and buying triggers. The AI agent uses this information to refine future suggestions. In the Competitor Manager, users add competitor URLs and target keywords. The system runs periodic scans and flags new content gaps. Reports show keyword overlaps and missed opportunities, and users can click through to send those insights directly into the Content Planner.

## Settings and Account Management

The Settings & Integrations page offers Admins a central place to configure workspace preferences. They can manage user seats, adjust subscription tiers, and purchase additional AI credit packages. Under a Branding tab, Admins choose light or dark theme defaults and upload custom logos or domains for white-labeling. The Integrations tab lets them connect Google Search Console, GA4, Slack, Microsoft Webmaster, and CMS platforms. Each integration has a simple connect button followed by an OAuth flow or API key entry. A Security & Compliance section displays GDPR and CCPA settings, enabling data retention policies and user data export or deletion. All users can also update their profile information, change passwords, and toggle notification preferences for email or Slack within their personal profile page, accessible via the user avatar dropdown.

## Error States and Alternate Paths

If users enter incorrect credentials at sign-in, the page displays a clear error message indicating whether the email is unrecognized or the password is wrong. Password reset links expire after one hour, and expired links lead to an error page with an option to resend. During content editing, if network connectivity drops, the editor shows a warning banner and attempts to autosave local changes. Once connectivity restores, it syncs changes with the server automatically. Attempting to access a restricted page triggers a “Permission Denied” screen explaining the user’s role limitations and suggesting they contact their workspace Admin. Publishing failures in the Distribution Center show a detailed error log with retry options and links to documentation for troubleshooting common API errors.

## Conclusion and Overall App Journey

From the moment a user first visits ContentOS, they are guided through a smooth sign-up and onboarding wizard that sets up their workspace and introduces core features. They choose their workspace, then land on the Dashboard to see a bird’s-eye view of their content pipeline and AI credit usage. They plan content on an interactive calendar, create and optimize drafts with AI assistance, and collaborate in real time. The multi-step approval workflows ensure quality and accountability. Approved content flows seamlessly into a distribution module that adapts posts for each channel. Data-driven insights in the Analytics module help users learn and iterate, and a robust Persona & Competitor Manager keeps content aligned with audience and market trends. Finally, Admins maintain control through comprehensive settings for branding, integrations, and compliance. Throughout every step, clear error handling and fallback paths ensure that users stay on track, making ContentOS a unified, end-to-end platform for all content management needs.