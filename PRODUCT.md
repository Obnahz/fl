# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Players who want a low-friction cultivation-themed idle game: they set up a character, check their current progression, then return periodically to advance cultivation, equipment, exploration, alchemy, and related systems.

## Product Purpose

“挂机也成仙” turns cultivation progression into a persistent browser game. It gives players an always-available character sheet and several connected activities, with time-based cultivation continuing between interactions.

## Positioning

The product combines a restrained idle-game loop with a multi-system cultivation world: real-time spiritual gain is the backbone, while techniques, equipment, exploration, alchemy, dungeon content, rewards, and achievements give that progress meaningful choices.

## Operating Context

- The game is played in a browser and persists player state locally.
- A first-time player begins on the onboarding route; returning players open directly into cultivation.
- The shell exposes cultivation, techniques, inventory, exploration, settings, and GM debugging when enabled; additional routes include alchemy, dungeon, gacha, and achievements.
- A worker updates passive spirit gain while the player is active.

## Capabilities and Constraints

- Existing Vue 3, Pinia, Vue Router, Naive UI, workers, route structure, controls, and Chinese game copy must remain functional and unchanged by this visual redesign.
- The UI supports light and dark themes; both must remain legible and coherent.
- The application is responsive down to a 320px viewport.
- No external brand assets, testimonials, performance claims, or product facts may be invented.

## Brand Commitments

- Product name: “挂机也成仙”.
- The user has explicitly requested a visual language that fits the cultivation/xianxia theme while retaining existing functionality and copy.

## Evidence on Hand

- Runtime source lives under `src/`, with the shell in `src/App.vue` and route views in `src/views/`.
- Existing icon libraries include Ant Design Icons and Ionicons.
- Current running preview: `http://localhost:2025/#/`.

## Product Principles

1. Progress must remain immediately readable at a glance.
2. Navigation should make the game’s systems feel connected, not buried.
3. A strong xianxia atmosphere must never obscure controls, numbers, or state.
4. Repeated check-ins should be fast, calm, and rewarding.

## Accessibility & Inclusion

- Preserve keyboard focus visibility, semantic controls supplied by Naive UI, and readable contrast in both themes.
- Keep touch targets and text legible on compact screens.

## Inference Note

This record is inferred from the user’s explicit redesign request and the project source because no structured question input is available in this session.
