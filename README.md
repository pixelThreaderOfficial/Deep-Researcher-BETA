### Deep Researcher (Desktop)

Modern AI assistant chat UI built with React, Tailwind CSS (v4), and Shadcn UI, running as a Tauri desktop app. Includes a ChatGPT-like layout with a left sidebar, top header, scrollable chat area, and an animated composer. Uses Lucide icons and framer-motion for micro-interactions.

### Tech stack

- React 18 + Vite 6
- Tailwind CSS 4 + tw-animate-css
- Shadcn UI primitives (Radix UI)
- Framer Motion
- Lucide React icons
- Tauri 2 (Rust backend wrapper)

### Getting started

Prerequisites

- Node.js 18+
- Rust toolchain (for Tauri)

Install dependencies

```bash
npm install
```

Run in web (Vite dev server)

```bash
npm run dev
```

Build web bundle

```bash
npm run build
```

Run Tauri (desktop)

```bash
npm run tauri
```

### Project structure

```text
src/
  components/
    bits/
      Aurora/              # OGL animated background (unused in current chat view)
      GradientText/
      SplitText/
    ui/                    # Shadcn UI primitives (button, input, avatar, dropdown, etc.)
    widgets/
      AIInput.jsx          # Landing input (route "/")
      AIInputSettingModal.jsx
      ChatSidebar.jsx      # Sidebar: logo, actions, recent chats, profile
      ChatHeader.jsx       # Top bar: assistant title + settings trigger
      ChatArea.jsx         # Chat: greeting, messages, composer
  pages/
    Chat.jsx               # Chat page; composes Sidebar + Header + ChatArea
  lib/
    utils.js               # cn() utility (clsx + tailwind-merge)
  index.css                # Tailwind config, fonts, theme tokens, custom scrollbar
  main.jsx                 # App bootstrap with React Router
  App.jsx                  # Routes: "/" -> AIInput, "/chat" -> Chat

src-tauri/                 # Tauri project configuration and Rust entrypoints
```

### Key UI behavior

- Sidebar: scrollable recent chats with `.custom-scrollbar`, “New chat”, “Search chats”, “Library”, “Files”, “Models”, and a profile block.
- Chat header: assistant label + settings button.
- Chat greeting: centered, large; fades away after the first user message.
- Messages:
  - User messages: right-aligned bubble (dark card style), attachments and an inline timestamp underneath.
  - Assistant messages: plain text, no bubble.
- Composer:
  - Pill shape when empty; reduces to 20px radius if multiline.
  - Vertical text centering when single line; expands on newline (Shift+Enter).
  - Attachments menu, mic toggle, and send action.
  - Stays at the bottom; chat scrolls independently.

### Commands

- Lint (not configured): use your editor’s ESLint/TSLint if needed.
- Tests: none provided.

### Routing

- `/` renders `AIInput` landing.
- `/chat` renders the chat experience.

### Theming & fonts

- Dark mode theme tokens defined in `src/index.css` (oklch color tokens; shadcn-compatible CSS vars).
- Custom fonts: `poppins`, `merienda`, `parkinsans`, `mooli`.

### Notes

- If scroll feels off, ensure the parent containers use `h-screen`/`min-h-0` as set in `src/pages/Chat.jsx`.
- Icons provided via `lucide-react` and used throughout the sidebar, header, and composer.

### License

Private project. All rights reserved.
