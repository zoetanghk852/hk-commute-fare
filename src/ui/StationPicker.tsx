import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { searchStations, type Station } from "../domain/searchStations";

import { stationPrimaryName, stationSecondaryName, t, type Locale } from "../i18n/messages";

import { lineLabel } from "./lineLabels";

type StationPickerProps = {
  legend: string;

  stations: Station[];

  selectedId: string | null;

  onSelect: (stationId: string | null) => void;

  locale: Locale;

  /** When false, station appears disabled and cannot be committed. Default: all selectable. */

  isSelectable?: (stationId: string) => boolean;
};

function joinLabel(legend: string, part: string, locale: Locale): string {
  return locale === "en" ? `${legend} ${part}` : `${legend}${part}`;
}

export function StationPicker({
  legend,

  stations,

  selectedId,

  onSelect,

  locale,

  isSelectable = () => true,
}: StationPickerProps) {
  const [query, setQuery] = useState("");

  const [lineId, setLineId] = useState("");

  const [listOpen, setListOpen] = useState(false);

  const [highlightIndex, setHighlightIndex] = useState(-1);

  const listboxId = useId();

  const baseId = useId();

  const selected = stations.find((s) => s.id === selectedId) ?? null;

  /** Skip wiping query when we cleared selection from local typing. */

  const keepQueryOnClearRef = useRef(false);

  /** Skip wiping line when clearing selection because the user just chose a line. */

  const keepLineOnClearRef = useRef(false);

  const lineIds = [...new Set(stations.flatMap((station) => station.lineIds))].sort();

  const searchHits = searchStations(query, stations, locale);

  const lineStations = lineId ? stations.filter((s) => s.lineIds.includes(lineId)) : [];

  const lineStationValue =
    selectedId && lineStations.some((s) => s.id === selectedId) ? selectedId : "";

  const searchInputId = `${baseId}-search`;

  const lineSelectId = `${baseId}-line`;

  const stationSelectId = `${baseId}-station`;

  const showSearchList = listOpen && query.trim() !== "";

  const canReset = query !== "" || lineId !== "" || selectedId !== null;

  // Sync search/line UI when selectedId changes (swap, commit, clear).

  useEffect(() => {
    if (!selectedId) {
      if (keepQueryOnClearRef.current) {
        keepQueryOnClearRef.current = false;

        return;
      }

      if (keepLineOnClearRef.current) {
        keepLineOnClearRef.current = false;

        setQuery("");

        setListOpen(false);

        setHighlightIndex(-1);

        return;
      }

      setQuery("");

      setLineId("");

      setListOpen(false);

      setHighlightIndex(-1);

      return;
    }

    const station = stations.find((s) => s.id === selectedId);

    if (!station) return;

    setQuery(stationPrimaryName(station, locale));

    setLineId((current) =>
      current && station.lineIds.includes(current) ? current : (station.lineIds[0] ?? ""),
    );

    setListOpen(false);

    setHighlightIndex(-1);
  }, [selectedId, stations, locale]);

  function resetToInit() {
    setQuery("");

    setLineId("");

    setListOpen(false);

    setHighlightIndex(-1);

    onSelect(null);
  }

  function commitStation(station: Station) {
    if (!isSelectable(station.id)) return;

    onSelect(station.id);

    setQuery(stationPrimaryName(station, locale));

    setListOpen(false);

    setHighlightIndex(-1);

    const nextLine =
      lineId && station.lineIds.includes(lineId) ? lineId : (station.lineIds[0] ?? "");

    setLineId(nextLine);
  }

  function onSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showSearchList || searchHits.length === 0) {
      if (e.key === "Escape") {
        setListOpen(false);

        setHighlightIndex(-1);
      }

      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();

      setHighlightIndex((i) => (i + 1) % searchHits.length);

      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();

      setHighlightIndex((i) => (i <= 0 ? searchHits.length - 1 : i - 1));

      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();

      const index = highlightIndex >= 0 ? highlightIndex : 0;

      const station = searchHits[index];

      if (station) commitStation(station);

      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();

      setListOpen(false);

      setHighlightIndex(-1);
    }
  }

  const activeOptionId =
    showSearchList && highlightIndex >= 0 && searchHits[highlightIndex]
      ? `${listboxId}-opt-${searchHits[highlightIndex].id}`
      : undefined;

  const searchLabel = joinLabel(legend, t(locale, "search"), locale);

  const byLineLabel = joinLabel(legend, t(locale, "byLine"), locale);

  const stationAria = joinLabel(legend, t(locale, "pickStation"), locale);

  const clearAria = joinLabel(t(locale, "clear"), legend, locale);

  return (
    <fieldset className="station-picker">
      <legend className="slot-label">{legend}</legend>

      {selected ? (
        <p className="selected-station">
          {t(locale, "selectedPrefix")}

          {stationPrimaryName(selected, locale)}

          <span className="selected-en"> {stationSecondaryName(selected, locale)}</span>
        </p>
      ) : (
        <p className="selected-station muted">{t(locale, "noneSelected")}</p>
      )}

      <div className="search-row">
        <label className="field-label" htmlFor={searchInputId}>
          {searchLabel}
        </label>

        {canReset && (
          <button type="button" className="reset-pick" aria-label={clearAria} onClick={resetToInit}>
            {t(locale, "clear")}
          </button>
        )}
      </div>

      <input
        id={searchInputId}
        type="search"
        className="field-input"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showSearchList}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        value={query}
        placeholder={t(locale, "searchPlaceholder")}
        autoComplete="off"
        onChange={(e) => {
          const next = e.target.value;

          if (next === "") {
            resetToInit();

            return;
          }

          setQuery(next);

          setListOpen(true);

          setLineId("");

          setHighlightIndex(-1);

          if (selectedId) {
            keepQueryOnClearRef.current = true;

            onSelect(null);
          }
        }}
        onFocus={() => {
          if (query.trim() !== "") setListOpen(true);
        }}
        onKeyDown={onSearchKeyDown}
      />

      {showSearchList && (
        <ul
          id={listboxId}
          className="station-list"
          role="listbox"
          aria-label={joinLabel(legend, t(locale, "searchResults"), locale)}
        >
          {searchHits.length === 0 ? (
            <li className="station-list-empty" role="presentation">
              <p className="station-empty-message">{t(locale, "noMatch")}</p>
            </li>
          ) : (
            searchHits.map((station, index) => {
              const isActive = index === highlightIndex;

              const isPicked = station.id === selectedId;

              const selectable = isSelectable(station.id);

              return (
                <li key={station.id} role="presentation">
                  <button
                    type="button"
                    id={`${listboxId}-opt-${station.id}`}
                    role="option"
                    aria-selected={isPicked}
                    aria-disabled={selectable ? undefined : true}
                    disabled={!selectable}
                    className={[
                      "station-option",

                      isPicked ? "is-selected" : "",

                      isActive ? "is-active" : "",

                      selectable ? "" : "is-unavailable",
                    ]

                      .filter(Boolean)

                      .join(" ")}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => commitStation(station)}
                  >
                    {stationPrimaryName(station, locale)}

                    <span className="selected-en"> {stationSecondaryName(station, locale)}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}

      <label className="field-label" htmlFor={lineSelectId}>
        {byLineLabel}
      </label>

      <div className="line-station-row">
        <select
          id={lineSelectId}
          className="field-input"
          value={lineId}
          onChange={(e) => {
            const nextLine = e.target.value;

            setLineId(nextLine);

            setQuery("");

            setListOpen(false);

            setHighlightIndex(-1);

            if (
              selectedId &&
              nextLine !== "" &&
              !stations.some((s) => s.id === selectedId && s.lineIds.includes(nextLine))
            ) {
              keepLineOnClearRef.current = true;
              onSelect(null);
            }

            if (nextLine === "") {
              onSelect(null);
            }
          }}
        >
          <option value="">{t(locale, "selectLine")}</option>

          {lineIds.map((id) => (
            <option key={id} value={id}>
              {lineLabel(id, locale)}
            </option>
          ))}
        </select>

        {lineId !== "" && (
          <select
            id={stationSelectId}
            className="field-input"
            value={lineStationValue}
            aria-label={stationAria}
            onChange={(e) => {
              const stationId = e.target.value;

              if (stationId === "") {
                keepLineOnClearRef.current = true;
                onSelect(null);

                setQuery("");

                return;
              }

              const station = lineStations.find((s) => s.id === stationId);

              if (!station) return;

              commitStation(station);
            }}
          >
            <option value="">{t(locale, "selectStation")}</option>

            {lineStations.map((station) => (
              <option key={station.id} value={station.id} disabled={!isSelectable(station.id)}>
                {stationPrimaryName(station, locale)}
              </option>
            ))}
          </select>
        )}
      </div>
    </fieldset>
  );
}
