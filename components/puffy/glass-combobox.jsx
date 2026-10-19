"use client";
import { useEffect, useId, useState } from "react";
import { usePopover, listKey, GlassList, Chevron } from "./glass-menu.jsx";

/**
 * GlassCombobox: type to filter a longer list, then pick one.
 * options   [{ value, label, icon?, hint? }]
 * value, onChange(value)
 * effect    "flat" | "glass" | "bubble"
 */
export function GlassCombobox({ label, options, value, onChange, placeholder = "Search", effect = "flat", emptyText = "No matches", hint }) {
  const id = useId();
  const { open, setOpen, rootRef } = usePopover();
  const selected = options.find((o) => o.value === value);
  const selectedLabel = selected ? selected.label : "";
  const [query, setQuery] = useState(selectedLabel);
  const [active, setActive] = useState(0);

  // Closing without a pick puts the chosen label back
  useEffect(() => {
    if (!open) setQuery(selectedLabel);
  }, [open, selectedLabel]);

  const filtering = open && query !== selectedLabel;
  const needle = query.trim().toLowerCase();
  const shown = filtering ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options;

  const pick = (option) => {
    if (onChange) onChange(option.value);
    setQuery(option.label);
    setOpen(false);
  };
  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setActive(0);
        setOpen(true);
      }
      return;
    }
    listKey(e, { items: shown, active, setActive, pick, close: () => setOpen(false) });
  };

  return (
    <div className="gfield" ref={rootRef}>
      {label && <label className="gfield-label" htmlFor={`${id}-input`}>{label}</label>}
      <div className="gp-anchor">
        <div className="gf" data-effect={effect} data-open={open ? "" : undefined}>
          <input
            id={`${id}-input`}
            className="gf-input"
            role="combobox"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={open ? `${id}-list` : undefined}
            aria-activedescendant={open && shown[active] ? `${id}-list-${active}` : undefined}
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onClick={() => {
              setActive(Math.max(0, shown.indexOf(selected)));
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
          />
          <span className="gf-chevron" aria-hidden="true"><Chevron /></span>
        </div>
        {open && (
          <GlassList
            id={`${id}-list`}
            effect={effect}
            items={shown}
            activeIndex={shown.length ? active : -1}
            onActiveChange={setActive}
            onPick={pick}
            selectedValue={value}
            empty={emptyText}
          />
        )}
      </div>
      {hint && <div className="gfield-foot"><span className="gfield-hint">{hint}</span></div>}
    </div>
  );
}

export default GlassCombobox;
