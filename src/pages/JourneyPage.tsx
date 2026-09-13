import { useState, type DragEvent } from "react";
import faresJson from "../data/fares.json" with { type: "json" };
import faresMetaJson from "../data/fares.meta.json" with { type: "json" };
import lrFaresJson from "../data/light-rail-fares.json" with { type: "json" };
import lrRoutesJson from "../data/light-rail-routes.json" with { type: "json" };
import stationsJson from "../data/stations.json" with { type: "json" };
import lrStationsJson from "../data/light-rail-stations.json" with { type: "json" };
import { hasFare } from "../domain/hasFare";
import type { FareMatrix } from "../domain/lookupFare";
import type { TransportMode } from "../domain/journeyTypes";
import type { Station } from "../domain/searchStations";
import { quoteJourneyFromLegs } from "../domain/quoteJourneyFromLegs";
import { reverseJourneyLegs } from "../domain/reverseJourneyLegs";
import { formatFare } from "../domain/formatFare";
import { stationPrimaryName, stationSecondaryName, t, type Locale } from "../i18n/messages";
import { StationPicker } from "../ui/StationPicker";
import { JourneyMap } from "../ui/JourneyMap";

const mtrStations = stationsJson as Station[];
const lrStations = lrStationsJson as Station[];
const lrRouteStopOrders = lrRoutesJson as Record<string, string[]>;
const fareMatrix = faresJson as FareMatrix;
const lrFareMatrix = lrFaresJson as FareMatrix;
const faresAsOf = (faresMetaJson as { asOf?: string }).asOf ?? "—";

const EARLY_BIRD_URL = {
  zh: "https://www.mtr.com.hk/ch/customer/main/early_bird.html",
  en: "https://www.mtr.com.hk/en/customer/main/early_bird.html",
} as const;

const MTR_LR_FREE_URL = {
  zh: "https://www.mtr.com.hk/ch/customer/services/lt_bus_index.html",
  en: "https://www.mtr.com.hk/en/customer/services/lt_bus_index.html",
} as const;

/** Find the LR interchange station for a given MTR station ID */
function findLrInterchange(mtrId: string): Station | undefined {
  return lrStations.find((s) => s.mtrInterchangeId === mtrId);
}

/** Find the MTR interchange station for a given LR station ID */
function findMtrInterchange(lrId: string): Station | undefined {
  const lrStation = lrStations.find((s) => s.id === lrId);
  if (!lrStation?.mtrInterchangeId) return undefined;
  return mtrStations.find((s) => s.id === lrStation.mtrInterchangeId);
}

interface JourneyPageProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export function JourneyPage({ locale, onLocaleChange }: JourneyPageProps) {
  // ── Leg 1 ──
  const [leg1Mode, setLeg1Mode] = useState<TransportMode>("mtr");
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);

  // ── Leg 2 ──
  const [hasSecondLeg, setHasSecondLeg] = useState(false);
  const [leg2Mode, setLeg2Mode] = useState<TransportMode>("light_rail");
  const [leg2ToId, setLeg2ToId] = useState<string | null>(null);

  // ── Modifiers ──
  const [earlyBirdApplied, setEarlyBirdApplied] = useState(false);
  const [personalPercent, setPersonalPercent] = useState(0);

  // ── Leg reorder (drag) ──
  const [draggingLeg, setDraggingLeg] = useState<1 | 2 | null>(null);
  const [dropTargetLeg, setDropTargetLeg] = useState<1 | 2 | null>(null);

  const leg1Stations = leg1Mode === "light_rail" ? lrStations : mtrStations;
  const leg2Stations = leg2Mode === "light_rail" ? lrStations : mtrStations;
  const leg1Matrix = leg1Mode === "light_rail" ? lrFareMatrix : fareMatrix;
  const leg2Matrix = leg2Mode === "light_rail" ? lrFareMatrix : fareMatrix;

  // Derive leg2 "from" from leg 1's "to" via interchange logic
  const leg2FromId: string | null = (() => {
    if (!toId) return null;
    if (leg1Mode === leg2Mode) return toId;
    if (leg1Mode === "mtr" && leg2Mode === "light_rail") {
      return findLrInterchange(toId)?.id ?? null;
    }
    if (leg1Mode === "light_rail" && leg2Mode === "mtr") {
      return findMtrInterchange(toId)?.id ?? null;
    }
    return null;
  })();

  const leg2FromStation = leg2FromId
    ? (leg2Mode === "light_rail" ? lrStations : mtrStations).find((s) => s.id === leg2FromId)
    : undefined;

  const fromStation = leg1Stations.find((s) => s.id === fromId);
  const toStation = leg1Stations.find((s) => s.id === toId);

  // ── Build legs for quoteJourneyFromLegs ──
  const legs =
    hasSecondLeg && leg2FromId && leg2ToId && fromId && toId
      ? [
          { mode: leg1Mode, fromId, toId },
          { mode: leg2Mode, fromId: leg2FromId, toId: leg2ToId },
        ]
      : fromId && toId
        ? [{ mode: leg1Mode, fromId, toId }]
        : [];

  const quoteResult =
    legs.length > 0
      ? quoteJourneyFromLegs({
          legs,
          mtrMatrix: fareMatrix,
          lightRailMatrix: lrFareMatrix,
          earlyBirdApplied,
          personalPercent,
        })
      : null;

  // ── Derive the primary status text (backward-compat: same-station, incomplete, HK$XX) ──
  const statusText = ((): string => {
    if (!fromId || !toId) return t(locale, "incomplete");
    if (fromId === toId) return t(locale, "sameStation");
    if (!quoteResult) return t(locale, "incomplete");
    if (!quoteResult.ok) {
      const code = quoteResult.error.code;
      if (code === "same_station") return t(locale, "sameStation");
      if (code === "missing_fare") return t(locale, "missingFare");
      return t(locale, "missingFare");
    }
    return formatFare(quoteResult.quote.estimatedPayable);
  })();

  const statusKind =
    !fromId || !toId
      ? "incomplete"
      : fromId === toId
        ? "sameStation"
        : quoteResult?.ok
          ? "fare"
          : "missingFare";

  function swapStations() {
    setFromId(toId);
    setToId(fromId);
  }

  function formatJourneyEnd(station: Station | undefined): string {
    if (!station) return t(locale, "journeyUnknown");
    return `${stationPrimaryName(station, locale)} ${stationSecondaryName(station, locale)}`;
  }

  function isSelectableAgainst(
    otherId: string | null,
    matrix: FareMatrix,
  ): (stationId: string) => boolean {
    return (stationId) => {
      if (!otherId) return true;
      if (stationId === otherId) return true;
      return hasFare(stationId, otherId, matrix);
    };
  }

  function handleLeg1ModeChange(mode: TransportMode) {
    setLeg1Mode(mode);
    setFromId(null);
    setToId(null);
    setLeg2ToId(null);
  }

  function handleLeg2ModeChange(mode: TransportMode) {
    setLeg2Mode(mode);
    setLeg2ToId(null);
  }

  function handleAddSecondLeg() {
    setHasSecondLeg(true);
    if (leg1Mode === "mtr") setLeg2Mode("light_rail");
    else setLeg2Mode("mtr");
  }

  function handleRemoveSecondLeg() {
    setHasSecondLeg(false);
    setLeg2ToId(null);
    setDraggingLeg(null);
    setDropTargetLeg(null);
  }

  const canReverseLegs =
    hasSecondLeg && fromId !== null && toId !== null && leg2ToId !== null && leg2FromId !== null;

  function handleReverseLegs() {
    if (!fromId || !toId || !leg2ToId || !leg2FromId) return;
    const next = reverseJourneyLegs({
      leg1Mode,
      fromId,
      toId,
      leg2Mode,
      leg2FromId,
      leg2ToId,
    });
    setLeg1Mode(next.leg1Mode);
    setFromId(next.fromId);
    setToId(next.toId);
    setLeg2Mode(next.leg2Mode);
    setLeg2ToId(next.leg2ToId);
  }

  function onLegDragStart(leg: 1 | 2) {
    return (e: DragEvent) => {
      if (!canReverseLegs) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData("text/plain", String(leg));
      e.dataTransfer.effectAllowed = "move";
      setDraggingLeg(leg);
    };
  }

  function onLegDragOver(leg: 1 | 2) {
    return (e: DragEvent) => {
      if (!canReverseLegs || draggingLeg === null || draggingLeg === leg) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dropTargetLeg !== leg) setDropTargetLeg(leg);
    };
  }

  function onLegDragLeave(leg: 1 | 2) {
    return () => {
      if (dropTargetLeg === leg) setDropTargetLeg(null);
    };
  }

  function onLegDrop(leg: 1 | 2) {
    return (e: DragEvent) => {
      e.preventDefault();
      if (canReverseLegs && draggingLeg !== null && draggingLeg !== leg) {
        handleReverseLegs();
      }
      setDraggingLeg(null);
      setDropTargetLeg(null);
    };
  }

  function onLegDragEnd() {
    setDraggingLeg(null);
    setDropTargetLeg(null);
  }

  function legPanelClass(leg: 1 | 2): string {
    const classes = ["panel"];
    if (draggingLeg === leg) classes.push("is-dragging");
    if (dropTargetLeg === leg && draggingLeg !== null && draggingLeg !== leg) {
      classes.push("is-drop-target");
    }
    return classes.join(" ");
  }

  const leg2DestLegend = locale === "en" ? "Leg 2 destination" : "第二程終點";

  // For map display
  const mapLegs = legs.map((leg) => ({
    mode: leg.mode,
    fromId: leg.fromId,
    toId: leg.toId,
  }));

  const hasMapCoords =
    mapLegs.length > 0 &&
    mapLegs.some((leg) => {
      const allSt = [...mtrStations, ...lrStations];
      const from = allSt.find((s) => s.id === leg.fromId);
      const to = allSt.find((s) => s.id === leg.toId);
      return from?.lat !== undefined || to?.lat !== undefined;
    });

  // Show modifiers when at least one leg is complete
  const showModifiers = (fromId !== null && toId !== null) || (hasSecondLeg && leg2ToId !== null);

  // Show breakdown when quoteResult is non-null
  const showBreakdown = quoteResult !== null;
  // Avoid duplicating estimated payable: total lives in breakdown when quote succeeds
  const showPrimaryStatus = quoteResult?.ok !== true;

  return (
    <main className="app">
      <header className="brand">
        <div className="brand-top">
          <p className="brand-eyebrow">{t(locale, "brandEyebrow")}</p>
          <div className="lang-switch" role="group" aria-label={t(locale, "language")}>
            <button
              type="button"
              className={locale === "zh" ? "lang-btn is-active" : "lang-btn"}
              aria-pressed={locale === "zh"}
              onClick={() => onLocaleChange("zh")}
            >
              {t(locale, "langZh")}
            </button>
            <button
              type="button"
              className={locale === "en" ? "lang-btn is-active" : "lang-btn"}
              aria-pressed={locale === "en"}
              onClick={() => onLocaleChange("en")}
            >
              {t(locale, "langEn")}
            </button>
          </div>
        </div>
        <h1>{t(locale, "brandTitle")}</h1>
        <p className="tagline">{t(locale, "tagline")}</p>
      </header>

      {/* ── Leg 1 ── */}
      <section
        className={hasSecondLeg ? legPanelClass(1) : "panel"}
        aria-label={t(locale, "fareQuery")}
        onDragOver={hasSecondLeg ? onLegDragOver(1) : undefined}
        onDragLeave={hasSecondLeg ? onLegDragLeave(1) : undefined}
        onDrop={hasSecondLeg ? onLegDrop(1) : undefined}
      >
        {hasSecondLeg && (
          <div className="leg-panel-header">
            <span
              className={canReverseLegs ? "leg-drag-handle" : "leg-drag-handle is-disabled"}
              draggable={canReverseLegs}
              onDragStart={onLegDragStart(1)}
              onDragEnd={onLegDragEnd}
              aria-label={t(locale, "dragLegHandle")}
              role="button"
              tabIndex={canReverseLegs ? 0 : -1}
              aria-disabled={!canReverseLegs}
            >
              ⋮⋮
            </span>
            <h2 className="section-title">{t(locale, "fareQuery")}</h2>
          </div>
        )}

        {/* Mode selector for leg 1 */}
        <fieldset className="mode-selector">
          <legend className="slot-label">{t(locale, "legMode")}</legend>
          <div className="mode-btn-group" role="group">
            <button
              type="button"
              className={leg1Mode === "mtr" ? "mode-btn is-active" : "mode-btn"}
              aria-pressed={leg1Mode === "mtr"}
              onClick={() => handleLeg1ModeChange("mtr")}
            >
              {t(locale, "modeMtr")}
            </button>
            <button
              type="button"
              className={leg1Mode === "light_rail" ? "mode-btn is-active" : "mode-btn"}
              aria-pressed={leg1Mode === "light_rail"}
              onClick={() => handleLeg1ModeChange("light_rail")}
            >
              {t(locale, "modeLightRail")}
            </button>
            <button type="button" className="mode-btn" disabled aria-disabled="true">
              {t(locale, "modeBusDisabled")}
            </button>
          </div>
        </fieldset>

        <StationPicker
          legend={t(locale, "origin")}
          stations={leg1Stations}
          selectedId={fromId}
          onSelect={setFromId}
          locale={locale}
          isSelectable={isSelectableAgainst(toId, leg1Matrix)}
          lineStopOrders={leg1Mode === "light_rail" ? lrRouteStopOrders : undefined}
          searchPlaceholder={
            leg1Mode === "light_rail" ? t(locale, "searchPlaceholderRoute") : undefined
          }
        />

        <div className="swap-row">
          <button
            type="button"
            className="swap-btn"
            onClick={swapStations}
            aria-label={t(locale, "swap")}
          >
            <svg
              className="swap-icon"
              viewBox="0 0 24 24"
              width="22"
              height="22"
              aria-hidden="true"
              focusable="false"
            >
              <path
                fill="currentColor"
                d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
              />
            </svg>
          </button>
        </div>

        <StationPicker
          legend={t(locale, "destination")}
          stations={leg1Stations}
          selectedId={toId}
          onSelect={setToId}
          locale={locale}
          isSelectable={isSelectableAgainst(fromId, leg1Matrix)}
          lineStopOrders={leg1Mode === "light_rail" ? lrRouteStopOrders : undefined}
          searchPlaceholder={
            leg1Mode === "light_rail" ? t(locale, "searchPlaceholderRoute") : undefined
          }
        />

        {(fromStation || toStation) && (
          <p className="journey-summary" aria-live="polite">
            {formatJourneyEnd(fromStation)}
            <span className="journey-arrow"> → </span>
            {formatJourneyEnd(toStation)}
          </p>
        )}

        {/* Primary status: incomplete / errors only — successful fare is in breakdown */}
        {showPrimaryStatus && (
          <div className="result" role="status" aria-live="polite">
            <p className={statusKind === "fare" ? "result-message result-fare" : "result-message"}>
              {statusText}
            </p>
          </div>
        )}

        {/* Add second leg button */}
        {!hasSecondLeg && (
          <button type="button" className="add-leg-btn" onClick={handleAddSecondLeg}>
            {t(locale, "addSecondLeg")}
          </button>
        )}
      </section>

      {/* ── Leg 2 ── */}
      {hasSecondLeg && (
        <section
          className={legPanelClass(2)}
          aria-label={t(locale, "secondLegTitle")}
          onDragOver={onLegDragOver(2)}
          onDragLeave={onLegDragLeave(2)}
          onDrop={onLegDrop(2)}
        >
          <div className="second-leg-header">
            <div className="leg-panel-header">
              <span
                className={canReverseLegs ? "leg-drag-handle" : "leg-drag-handle is-disabled"}
                draggable={canReverseLegs}
                onDragStart={onLegDragStart(2)}
                onDragEnd={onLegDragEnd}
                aria-label={t(locale, "dragLegHandle")}
                role="button"
                tabIndex={canReverseLegs ? 0 : -1}
                aria-disabled={!canReverseLegs}
              >
                ⋮⋮
              </span>
              <h2 className="section-title">{t(locale, "secondLegTitle")}</h2>
            </div>
            <div className="second-leg-actions">
              <button
                type="button"
                className="swap-legs-btn"
                onClick={handleReverseLegs}
                disabled={!canReverseLegs}
              >
                {t(locale, "swapLegs")}
              </button>
              <button type="button" className="remove-leg-btn" onClick={handleRemoveSecondLeg}>
                {t(locale, "removeSecondLeg")}
              </button>
            </div>
          </div>

          {/* Mode selector for leg 2 */}
          <fieldset className="mode-selector">
            <legend className="slot-label">{t(locale, "legMode")}</legend>
            <div className="mode-btn-group" role="group">
              <button
                type="button"
                className={leg2Mode === "mtr" ? "mode-btn is-active" : "mode-btn"}
                aria-pressed={leg2Mode === "mtr"}
                onClick={() => handleLeg2ModeChange("mtr")}
              >
                {t(locale, "modeMtr")}
              </button>
              <button
                type="button"
                className={leg2Mode === "light_rail" ? "mode-btn is-active" : "mode-btn"}
                aria-pressed={leg2Mode === "light_rail"}
                onClick={() => handleLeg2ModeChange("light_rail")}
              >
                {t(locale, "modeLightRail")}
              </button>
              <button type="button" className="mode-btn" disabled aria-disabled="true">
                {t(locale, "modeBusDisabled")}
              </button>
            </div>
          </fieldset>

          {/* Interchange station (auto-derived from leg 1 destination) */}
          {leg2FromStation ? (
            <p className="interchange-note">
              <span className="interchange-label">{t(locale, "interchangeAuto")}</span>
              <strong>
                {stationPrimaryName(leg2FromStation, locale)}{" "}
                <span className="selected-en">{stationSecondaryName(leg2FromStation, locale)}</span>
              </strong>
            </p>
          ) : toId ? (
            <p className="interchange-note interchange-warning">
              {locale === "zh"
                ? "找不到自動換乘站，請手動確認第二程起點"
                : "No auto interchange found; verify leg 2 origin manually"}
            </p>
          ) : null}

          <StationPicker
            legend={leg2DestLegend}
            stations={leg2Stations}
            selectedId={leg2ToId}
            onSelect={setLeg2ToId}
            locale={locale}
            isSelectable={isSelectableAgainst(leg2FromId, leg2Matrix)}
            lineStopOrders={leg2Mode === "light_rail" ? lrRouteStopOrders : undefined}
            searchPlaceholder={
              leg2Mode === "light_rail" ? t(locale, "searchPlaceholderRoute") : undefined
            }
          />
        </section>
      )}

      {/* ── Modifiers: early bird + personal % ── */}
      {showModifiers && (
        <section
          className="panel modifiers-panel"
          aria-label={locale === "zh" ? "優惠選項" : "Discount options"}
        >
          <label className="early-bird-label">
            <input
              type="checkbox"
              checked={earlyBirdApplied}
              onChange={(e) => setEarlyBirdApplied(e.target.checked)}
              aria-describedby="early-bird-note"
            />
            {t(locale, "earlyBird")}
          </label>
          <p id="early-bird-note" className="modifier-note">
            {t(locale, "earlyBirdNote")}{" "}
            <a href={EARLY_BIRD_URL[locale]} target="_blank" rel="noopener noreferrer">
              {t(locale, "earlyBirdRef")}
            </a>
          </p>

          <label className="personal-pct-label" htmlFor="personal-pct">
            {t(locale, "personalPercent")}
          </label>
          <input
            id="personal-pct"
            type="number"
            min={0}
            max={100}
            step={1}
            value={personalPercent}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v) && v >= 0 && v <= 100) setPersonalPercent(v);
            }}
            className="field-input personal-pct-input"
            aria-describedby="personal-pct-note"
          />
          <p id="personal-pct-note" className="modifier-note">
            {t(locale, "personalPercentNote")}
          </p>
        </section>
      )}

      {/* ── Quote breakdown (role="region" — NOT role="status" to avoid conflicting with primary status) ── */}
      {showBreakdown && (
        <section className="panel breakdown-panel" aria-label={t(locale, "fareBreakdown")}>
          <h2 className="section-title">{t(locale, "fareBreakdown")}</h2>

          {quoteResult!.ok ? (
            <>
              {/* MTR↔LR free interchange badge (only for multi-leg) */}
              {hasSecondLeg && (
                <div className="interchange-explain">
                  <div
                    className={`interchange-badge ${quoteResult!.mtrLrFree.applicable ? "is-applicable" : "is-not-applicable"}`}
                    aria-label={t(locale, "mtrLrFreeLabel")}
                  >
                    <span>{t(locale, "mtrLrFreeLabel")}：</span>
                    <strong>
                      {quoteResult!.mtrLrFree.applicable
                        ? t(locale, "mtrLrFreeApplicable")
                        : t(locale, "mtrLrFreeNotApplicable")}
                    </strong>
                  </div>
                  <p className="modifier-note">
                    {t(locale, "mtrLrFreeNote")}{" "}
                    <a href={MTR_LR_FREE_URL[locale]} target="_blank" rel="noopener noreferrer">
                      {t(locale, "mtrLrFreeRef")}
                    </a>
                  </p>
                </div>
              )}

              <dl className="fare-breakdown">
                <div className="breakdown-row">
                  <dt>
                    {t(locale, "officialSubtotal")}
                    <span className="badge-official">{t(locale, "officialLabel")}</span>
                  </dt>
                  <dd>{formatFare(quoteResult!.quote.officialSubtotal)}</dd>
                </div>

                {quoteResult!.quote.officialInterchangeDiscount > 0 && (
                  <>
                    <div className="breakdown-row discount">
                      <dt>
                        {t(locale, "interchangeDiscount")}
                        <span className="badge-official">{t(locale, "officialLabel")}</span>
                      </dt>
                      <dd>−{formatFare(quoteResult!.quote.officialInterchangeDiscount)}</dd>
                    </div>
                    <div className="breakdown-row subtotal">
                      <dt>{t(locale, "afterInterchange")}</dt>
                      <dd>{formatFare(quoteResult!.quote.afterInterchange)}</dd>
                    </div>
                  </>
                )}

                {quoteResult!.quote.earlyBirdDiscount > 0 && (
                  <>
                    <div className="breakdown-row discount">
                      <dt>{t(locale, "earlyBirdDiscount")}</dt>
                      <dd>−{formatFare(quoteResult!.quote.earlyBirdDiscount)}</dd>
                    </div>
                    <div className="breakdown-row subtotal">
                      <dt>{t(locale, "afterEarlyBird")}</dt>
                      <dd>{formatFare(quoteResult!.quote.afterEarlyBird)}</dd>
                    </div>
                  </>
                )}

                {quoteResult!.quote.personalDiscount > 0 && (
                  <div className="breakdown-row discount">
                    <dt>
                      {t(locale, "personalDiscount")}
                      <span className="badge-personal">{t(locale, "personalLabel")}</span>
                    </dt>
                    <dd>−{formatFare(quoteResult!.quote.personalDiscount)}</dd>
                  </div>
                )}

                <div className="breakdown-row total">
                  <dt>
                    <strong>{t(locale, "estimatedPayable")}</strong>
                  </dt>
                  <dd>
                    <strong>{formatFare(quoteResult!.quote.estimatedPayable)}</strong>
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="result-message">{quoteResult!.error.message}</p>
          )}
        </section>
      )}

      {/* ── Map (Day4) ── */}
      {hasMapCoords && mapLegs.length > 0 && (
        <section className="panel map-panel" aria-label={t(locale, "mapTitle")}>
          <h2 className="section-title">{t(locale, "mapTitle")}</h2>
          <JourneyMap legs={mapLegs} mtrStations={mtrStations} lrStations={lrStations} />
        </section>
      )}

      <p className="data-asof">{t(locale, "dataAsOf").replace("{date}", faresAsOf)}</p>
    </main>
  );
}
