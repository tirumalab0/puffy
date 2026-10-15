"use client";
import { useId, useState } from "react";
import { GlassButton } from "./glass-button.jsx";
import { usePopover, moveIndex, listKey, GlassList, Chevron } from "./glass-menu.jsx";

/**
 * GlassDropdown: a button that opens a menu of actions.
 * label     text on the button
 * items     [{ value, label, icon?, hint?, danger?, disabled?, onSelect? } | { separator: true }]
 * onSelect(value)
 * effect    "flat" | "glass" | "bubble"
 * variant, size, iconLeft go to the button; align is "start" or "end"
 */
export function GlassDropdown({ label, items, onSelect, effect = "flat", variant = "secondary", size = "md", align = "start", iconLeft }) {
  const id = useId();
  const { open, setOpen, rootRef } = usePopover();
  const [active, setActive] = useState(-1);

  const openMenu = (index) => {
    setActive(index);
    setOpen(true);
  };
  const pick = (item) => {
    setOpen(false);
    if (item.onSelect) item.onSelect();
    if (onSelect) onSelect(item.value);
  };
  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        openMenu(e.key === "ArrowDown" ? moveIndex(items, -1, 1) : moveIndex(items, 0, -1));
      }
      return;
    }
    listKey(e, { items, active, setActive, pick, close: () => setOpen(false) });
  };

  return (
    <div className="gp-anchor" data-inline="" ref={rootRef}>
      <GlassButton
        variant={variant}
        effect={effect}
        size={size}
        iconLeft={iconLeft}
        iconRight={<Chevron />}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        aria-activedescendant={open && active >= 0 ? `${id}-menu-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu(-1))}
        onKeyDown={onKeyDown}
      >
        {label}
      </GlassButton>
      {open && (
        <GlassList
          id={`${id}-menu`}
          role="menu"
          effect={effect}
          align={align}
          items={items}
          activeIndex={active}
          onActiveChange={setActive}
          onPick={pick}
        />
      )}
    </div>
  );
}

export default GlassDropdown;
