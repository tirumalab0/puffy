"use client";
import { useId, useState } from "react";
import { usePopover, moveIndex, listKey, GlassList, Chevron } from "./glass-menu.jsx";

/**
 * GlassSelect: pick one from a short list.
 * options   [{ value, label, icon?, disabled? }]
 * value, onChange(value)
 * effect    "flat" | "glass" | "bubble"
 */
export function GlassSelect({ label, options, value, onChange, placeholder = "Select", effect = "flat", disabled = false, hint }) {
  const id = useId();
  const { open, setOpen, rootRef } = usePopover();
  const [active, setActive] = useState(-1);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];

  const openList = () => {
    setActive(selectedIndex >= 0 ? selectedIndex : moveIndex(options, -1, 1));
    setOpen(true);
  };
  const pick = (option) => {
    if (onChange) onChange(option.value);
    setOpen(false);
  };
  const onKeyDown = (e) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === " ") {
      e.preventDefault();
      if (options[active]) pick(options[active]);
      return;
    }
    if (listKey(e, { items: options, active, setActive, pick, close: () => setOpen(false) })) return;
    // Type a letter to jump to the next option that starts with it
    if (e.key.length === 1) {
      const key = e.key.toLowerCase();
      for (let k = 1; k <= options.length; k++) {
        const i = (active + k) % options.length;
        if (!options[i].disabled && options[i].label.toLowerCase().startsWith(key)) {
          setActive(i);
          break;
        }
      }
    }
  };

  return (
    <div className="gfield" ref={rootRef}>
      {label && <span className="gfield-label" id={`${id}-label`}>{label}</span>}
      <div className="gp-anchor">
        <button
          type="button"
          className="gf"
          data-effect={effect}
          data-open={open ? "" : undefined}
          disabled={disabled}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? `${id}-list` : undefined}
          aria-labelledby={label ? `${id}-label ${id}-value` : `${id}-value`}
          aria-activedescendant={open && active >= 0 ? `${id}-list-${active}` : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
          onKeyUp={(e) => e.key === " " && e.preventDefault()}
        >
          {selected && selected.icon && <span className="gf-icon" aria-hidden="true">{selected.icon}</span>}
          <span id={`${id}-value`} className={selected ? "gf-value" : "gf-value gf-placeholder"}>
            {selected ? selected.label : placeholder}
          </span>
          <span className="gf-chevron" aria-hidden="true"><Chevron /></span>
        </button>
        {open && (
          <GlassList
            id={`${id}-list`}
            effect={effect}
            items={options}
            activeIndex={active}
            onActiveChange={setActive}
            onPick={pick}
            selectedValue={value}
            labelledBy={`${id}-label`}
          />
        )}
      </div>
      {hint && <div className="gfield-foot"><span className="gfield-hint">{hint}</span></div>}
    </div>
  );
}

export default GlassSelect;
