# Puffy

Soft, tactile React components with three looks — **Quiet**, **Mist** and **Puffy** — Copy the files into your project or install them with one command. No dependencies beyond React.

**[See every component live →](https://puffyui.com)**

## Install

### One command (shadcn CLI)

If your project already uses shadcn/ui (it has a `components.json`), add any part by name:

```bash
npx shadcn@latest add https://raw.githubusercontent.com/tirumalab0/puffy/main/r/button.json
```

Everything at once:

```bash
npx shadcn@latest add https://raw.githubusercontent.com/tirumalab0/puffy/main/r/all.json
```

Files land in `components/puffy/`, and anything a part needs (like the shared surface styles) comes with it. New to shadcn? Run `npx shadcn@latest init` first.

### Or copy and paste

Copy the files you need from [`components/puffy`](components/puffy) into one folder in your project. The table below says which file holds which part; each `.jsx` file loads its own CSS.

## Use

```jsx
import { GlassButton } from "@/components/puffy/glass-button";
import { GlassInput } from "@/components/puffy/glass-input";
import { GlassIcon } from "@/components/puffy/glass-icon";

export function InviteForm() {
  return (
    <form>
      <GlassInput label="Work email" type="email" iconLeft={<GlassIcon name="mail" />} />
      <GlassButton iconLeft={<GlassIcon name="plus" />}>Add team member</GlassButton>
    </form>
  );
}
```

## Themes

| Theme | What it feels like | How to turn it on |
| --- | --- | --- |
| Mist | Soft frosted glass with a bright edge | The default. Comes with `glass-surface.css`, nothing else to load. |
| Quiet | Calm and exact: flat white, hairline edges | Load `glass-theme-quiet.css` last, then add `data-glass-theme="quiet"` to `<html>` |
| Puffy | Round, squishy and colourful | Load `glass-theme-puffy.css` last, then add `data-glass-theme="puffy"` to `<html>` |

The attribute can go on any wrapper instead of `<html>`, so one page can mix looks.

```css
/* Your brand colour and corner shape */
:root {
  --glass-tint: #6d5dfc;
  --glass-on-tint: #fff;   /* text on top of the colour */
  --glass-radius: 999px;   /* or 12px for rounded corners */
}
```

**Which parts the themes restyle:** buttons, fields (input, text area, select, combobox, checkbox, radio, switch, slider, calendar, keypad, counter), menus (dropdown, command menu, context menu, bloom menu, overflow actions), cards, tabs, accordion, dialogs, drawers, popovers, bottom sheet, sidebar, stepper, stat card, date range, banner, progress, empty states. Charts, glance cards, pictures and the rest keep their own look in every theme; all of them take your colour and dark mode.

**Dark mode:** load `glass-dark.css` after the theme. It turns on when `<html>` has `class="dark"` (the class next-themes and shadcn/ui already set) or `data-glass-mode="dark"`, so it follows your app's dark mode with no extra setup.

**Sound (optional):** add `glass-sound.jsx` and put `<GlassSounds />` once near the root. Every part plays soft sounds made on the fly; there are no audio files, and nothing plays until the person's first tap.

## Parts

| Install name | What's inside |
| --- | --- |
| `app` | Sidebar, Breadcrumbs, Avatar, Stat card, Charts, Data table |
| `basics` | Button group, Toggle, Toggle group, Navigation menu, Video player, Carousel, Spinner, Keyboard keys |
| `button` | Button with solid, glass and bubble finishes |
| `card` | Card, Progress |
| `charts` | Block bars, Radial rings, Radar, Flow, Brush |
| `combobox` | Combobox |
| `controls` | Checkbox, Radio, Switch, Slider |
| `dark` | Dark mode, load after the theme |
| `data` | Stat strip, Meter, Square grid, Forecast bar, Timeline, Tag list |
| `delight` | Confirm, Calendar, Popover, Hover card, Hold to confirm, Swipe to delete, Password strength, Star rating, Undo pill, Toast stack, Notification bell, Number ticker, Floating label, Range slider, Animated form, Edge-lit style |
| `display` | Tabs, Accordion, Table, Dialog, Badge, Banner, Tooltip, Carousel dots, Thinking |
| `dropdown` | Dropdown |
| `extras` | Wheel picker, Sortable list, Multi select, Context menu, Morphing modal, Expandable tabs, Bloom menu, File diff, Tool approval, Thinking phrases |
| `extras2` | Colour picker, Image viewer, File tree, Marquee, Tilt card, Pull to refresh, Cylinder carousel, Theme toggle, Hover highlight, Morphing search, Overflow actions, Card folder, Availability, Masonry, Wallet card, Not found |
| `fur` | Fluffy Puffy |
| `glance` | Glance card, Weather, Temperature, Flight, Sleep, Checklist, Movers, Paycheck, Range today |
| `grain` | Grain backgrounds |
| `icon` | Icons |
| `input` | Input, Text area, Input copy |
| `keypad` | Keypad |
| `menu` | The menu used by Select, Combobox and Dropdown |
| `motion` | Rolling number, Word reveal, Art |
| `overlay` | Command menu, Drawer, Toast, Empty, Skeleton, Date range, Stepper |
| `scene` | Picture backdrop for glass finishes |
| `select` | Select |
| `sound` | Optional sounds for every part |
| `surface` | Shared surface styles used by most parts |
| `tactile` | Knob, Arc dial, Ruler picker, Code input, Counter, Drop zone, Reactions, Card deck, Morphing tray |
| `theme-puffy` | Puffy theme |
| `theme-quiet` | Quiet theme |
| `widget` | Widget card, Line chart, Breakdown, Heatmap |

## Works with

React 18 or newer, and any setup that can import CSS from a component: Vite, Next.js (the files start with `"use client"`), Remix, Parcel.

## Licence

MIT — free for personal and commercial work. See [LICENSE](LICENSE).

## Puffy Pro

The AI parts (chat, composer, agents, voice, images and meetings) are in **Puffy Pro**: one payment, free updates, delivered as a private GitHub repo. See them live and get Pro at **[puffyui.com](https://puffyui.com/#pro)**.

## Contact

Questions, bugs or Pro support: [puffyuipro@gmail.com](mailto:puffyuipro@gmail.com)
