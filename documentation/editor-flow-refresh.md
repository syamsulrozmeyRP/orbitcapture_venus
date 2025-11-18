<!-- Editor Flow Refresh Spec -->

# Editor Flow Refresh

## 1. Current Experience Audit

### 1.1 Entry (EditorHomeClient)
- `editor-home-client.tsx` renders the hero (`EditorChatHero`) plus either `EditorChatThread` or `EditorPlanTable`.
- The hero presents persona/voice pickers, a textarea, and suggestions. The CTA is “Start writing content”.
- If no chat interaction exists, the plan table is shown (content backlog view). Once users send a prompt, `EditorChatThread` renders inside the same page, still under the hero card.

### 1.2 Chat Layer (`EditorChatThread`)
- Chat bubbles are constrained to a card below the hero; the layout keeps other dashboard UI visible, so the experience feels secondary.
- “Convert this to blog” appears inside the card when `latestCompletion` exists.
- Conversion calls `convertChatToContentAction`, then immediately pushes to `/app/editor/[contentId]`.

### 1.3 Editor Detail (`EditorClient`)
- `/app/editor/[contentId]` renders `EditorClient`, comments, AI sidebar, version history, templates.
- No explicit confirmation step between clicking convert and landing in the editor; navigation feels abrupt.

**Pain points:** chat lacks immersion (card layout, mixed with plan table) and there is no transitional state before entering the editor. Users lose context when conversion happens.

---

## 2. Target UX States

1. **Splash Prompt (Hero State)**
   - Remains the first surface: empty page with greeting, prompt box, persona/voice selectors, suggestions.
   - Mimics Claude’s landing (see provided reference): large centered input, minimal chrome.

2. **Full-Page Chat Overlay**
   - Triggered when the first prompt is submitted (and persona resolved).
   - Expands to a full-viewport overlay (covering plan table/other UI). The hero contracts into a top bar showing the current conversation title (auto-generated from prompt).
   - Chat history occupies the main canvas; composer docks at the bottom (sticky). “Orbi thinking” animation plays inline after each user bubble.
   - A conversation list/history toggle can slide in from the left later, but for v1 we focus on a single session.

3. **Conversion Handoff**
   - After the user clicks “Convert this to blog”, instead of instant redirect:
     1. Display an overlay (modal layer on top of chat) summarizing the draft (title, outline preview, word count estimate).
     2. CTA “Send to editor” triggers the action; show progress indicator (“Preparing draft…”). Once server confirms success, fade out chat overlay and navigate to `/app/editor/[contentId]`.
     3. Provide a secondary button “Keep refining” to dismiss overlay and remain in chat.

---

## 3. State Management

### 3.1 State machine
```
Splash
  └─ on SUBMIT_PROMPT -> Chat(activeConversation)

Chat(activeConversation)
  ├─ internal transitions: append messages, show Orbi thinking, update completion
  ├─ on CONVERT_CLICK -> ConvertReview(latestCompletion)
  └─ on EXIT_CHAT -> Splash (if user clears history)

ConvertReview(latestCompletion)
  ├─ on CONFIRM -> NavigatingToEditor (disabled buttons, spinner)
  │     └─ on SUCCESS(contentId) -> redirect /app/editor/[contentId]
  └─ on CANCEL -> Chat(activeConversation)
```

### 3.2 Implementation notes
- Introduce a `view` state in `EditorHomeClient`: `"splash" | "chat"`.
- Store `conversationId` / `title` derived from first prompt to render in chat header.
- Conversion overlay can live inside `EditorChatThread` or a parent to share `latestCompletion`.
- Preserve persona and voice selections in chat overlay header for quick edits.

---

## 4. UI Structure

| State | Components | Layout Highlights |
|-------|------------|-------------------|
| Splash | `EditorHeroLanding` (renamed `EditorChatHero`), persona/voice selectors | Centered content, full-height gradient background, CTA anchored to hero |
| Chat Overlay | New `EditorChatExperience` | Full viewport, top bar (title + persona chips), scrollable chat body, sticky composer, floating suggestions. Use `motion.div` or CSS transitions for overlay entry |
| Convert Review | `ConvertDraftOverlay` | Semi-transparent backdrop over chat, card with draft summary, CTA buttons, progress feedback |

Additional notes:
- The overlay should be accessible (trap focus) and close via ESC/backdrop when not in progress.
- “Orbi thinking” animation: use a small orbital spinner near message placeholder (similar to Claude sample).
- When overlay closes (after conversion), restore hero state if there are no chat messages; otherwise keep chat accessible via an icon/button.

---

## 5. Conversion Overlay Details

- **Trigger:** `latestCompletion` exists and user clicks “Convert this to blog”.
- **Content:**
  - Title + persona summary
  - Outline preview (first 3 bullet points) with “View full outline” accordion
  - Stats row (estimated word count, channel, voice)
- **Actions:**
  - Primary: `Send to editor` (calls `convertChatToContentAction`)
  - Secondary: `Keep refining` (close overlay)
  - Tertiary: `Copy to clipboard`
- **States:**
  1. `review`: default state
  2. `submitting`: disabled buttons + inline spinner with “Preparing draft…”
  3. `error`: show error text, re-enable buttons; keep overlay open
- On success, call `router.push` only after overlay fades out (200–300 ms) to avoid abrupt swap.

---

## 6. Documented Flow Summary

1. **Landing:** Users see splash (hero) with prompt input.
2. **Submit Prompt:** Validate persona/voice, set `view = "chat"`, open overlay, show first user message + spinner.
3. **Chat Session:** Continue conversation in full-page mode. Auto-scroll, quick suggestions, Orbi animation per response.
4. **Conversion:** CTA opens `ConvertDraftOverlay`. User confirms; we show progress and redirect on success.
5. **Editor:** `EditorClient` opens with the generated document. Browser back returns to `/app/editor` splash (chat state not persisted for v1; optional future enhancement).

This spec should guide the engineering effort to refactor the editor experience into the desired three-phase journey without editing the plan file.

