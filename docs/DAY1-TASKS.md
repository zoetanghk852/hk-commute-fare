# Day1 任務（你來做）

產品：**HK通勤車費查詢**  
目標：熟悉 TypeScript `strict` + Vitest TDD（紅 → 綠 → 重構）  
套件管理：**pnpm**

Agent 已幫你：Vite + React + TS、`strict`、Vitest、`pnpm test`、domain 空殼。

---

## 環境確認（5 分鐘）

在專案根目錄執行：

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm dev
```

預期：`formatFare` 測試目前是 `todo`（不算失敗）；瀏覽器可見標題「HK通勤車費查詢」。

---

## 任務 A — 用 TDD 實作 `formatFare`（必做，約 60–90 分）

檔案：

- 測試：[`src/domain/formatFare.test.ts`](../src/domain/formatFare.test.ts)
- 實作：[`src/domain/formatFare.ts`](../src/domain/formatFare.ts)

步驟：

1. 開兩個終端：一個 `pnpm test:watch`，一個編輯器。
2. 把 `it.todo(...)` 改成真正的 `it(...)`，斷言 `formatFare(12.5) === 'HK$12.5'`。
3. 跑測試 → **必須先紅**（`Not implemented`）。
4. 只改 `formatFare.ts`，用最少程式碼讓它變綠。
5. 再加至少 2 個案例（自己想）。例如：
   - `10` 要顯示成什麼？（`HK$10` 或 `HK$10.0` — **選一個規則寫進測試並遵守**）
   - `0.1`、`99.9`
6. 重構：實作變乾淨，測試仍全綠。

完成定義：`pnpm test` 全綠，且你能口述「紅→綠→重構」做了什麼。

---

## 任務 B — 定義錯誤型別（必做，約 30–45 分）

檔案：[`src/domain/types.ts`](../src/domain/types.ts)

1. 把 `FareErrorCode`、`FareError`、`FareResult` 補完整（拿掉 `never` / 空物件）。
2. 對齊產品錯誤（之後 UI／`lookupFare` 會用）：
   - 同站 → 不可當成功金額
   - 缺票價
   - 未知站
3. 跑 `pnpm typecheck` 必須通過。
4. （加分）新增 `src/domain/types.test.ts`，用一個小函式或型別守衛示範「失敗結果沒有 amount」。

提示：可用 discriminated union：`ok: true | false`。

---

## 任務 C — 學習筆記（必做，10 分鐘）

在 `docs/notes-day1.md` 寫：

1. 今天測了什麼？
2. 第一個紅燈錯誤訊息是什麼意思？
3. 同站為什麼不該回 `HK$0`？（用 QA 語言寫 2–3 句）

---

## 卡住時怎麼問 Agent（不要直接要完整答案）

- 「這個 Vitest 錯誤是什麼意思？」
- 「`FareResult` 這樣寫 typecheck 為什麼失敗？」
- 「我測到紅燈了，實作方向對嗎？（貼你的測試，不要貼請我代寫）」

---

## 今日不要做

- 選站 UI、票價 JSON、Playwright、CI（Day2 之後）

## 做完回報

跟 Agent 說「Day1 做完」，並附上：

1. `pnpm test` 與 `pnpm typecheck` 結果  
2. 你選的小數顯示規則（例如整數要不要 `.0`）  
3. `docs/notes-day1.md` 已寫  
