markdown
# MTG Game State Tracker - Project Rules

## 🎯 Project Overview
An AI-integrated web app for tracking Magic: The Gathering game states. 
- **Goal**: Maintain 100% accuracy of game objects (Hand, Battlefield, Library, Graveyard).
- **Core Loop**: User performs actions -> WebApp updates state -> User clicks "Send to Claude" -> Claude analyzes and suggests next moves.

## 🛠 Tech Stack
- Frontend: Single HTML/JS/CSS (Keep it modular if it grows!)
- APIs: Scryfall (for card data and high-res art)
- Storage: Browser LocalStorage (for session persistence)

## 🚨 VIBE-CODING CONSTRAINTS (IMPORTANT)
- **NO FULL REWRITES**: Never rewrite a file from scratch unless explicitly asked. Provide only the changed code blocks or "diffs."
- **PLAN FIRST**: Always explain the logic of a fix before writing any code.
- **SCRYFALL ART**: Access artwork via `image_uris.normal` or `image_uris.large`. Do not use generic `image_uri`.
- **GAME OBJECT INTEGRITY**: If a card moves (e.g., Hand -> Battlefield), you MUST explicitly remove it from the source array before adding to the destination array.

## 🃏 MTG Rules Logic
- **Rules Engine**: The Human (User) is the rules engine. Do not code complex triggers unless asked.
- **State Object**: Ensure the `gameState` JSON contains: `life`, `turn`, `activePlayer`, `zones` (hand, battlefield, library, graveyard, exile).

## 🚀 Common Commands
- To Refresh: Just reload `index.html` in the browser.
- To Debug: Check the browser console (F12) for Scryfall API 404s.

## 🖥️ Development Workflow
- Claude Code writes changes directly to files on disk (no copy/paste needed)
- File location: C:\[your path]\mtg-commander_web_app.html
- After changes: refresh browser to see updates
- Prefer targeted diffs over full rewrites (per NO FULL REWRITES rule above)