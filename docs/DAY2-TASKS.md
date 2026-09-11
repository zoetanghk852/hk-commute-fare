# Day2 任務（你來做）

產品：**HK通勤車費查詢**  
目標：靜態資料 + `lookupFare`／`searchStations` 純函式 TDD（表格驅動）  
套件管理：**pnpm**

Agent 已幫你：Day1 的 `formatFare`、`FareResult` 型別。今日**不要做 UI／Playwright／CI**。

### 名詞：OD

**OD**＝**Origin–Destination**（起點–終點），交通／票價常用語。

| 縮寫 | 英文 | 本專案 |
|------|------|--------|
| O | Origin | 起站 `fromId` |
| D | Destination | 訖站 `toId` |

一組 OD＝一對「從哪裡 → 到哪裡」（例：金鐘 → 旺角 → 矩陣鍵 `admiralty:mong-kok`）。

測試標題如 *returns amount when OD exists* 意思是：**這組起訖站在票價矩陣裡有資料時，應回傳金額**（不是 `missing_fare`）。

---

## 環境確認

```bash
pnpm test
pnpm typecheck
```

預期：Day1 測試仍全綠。

---

## 任務 A — 靜態 JSON（必做）

目錄建議：`src/data/`

| 檔案 | 內容 |
|------|------|
| `stations.json` | 8–15 站即可（之後可擴） |
| `fares.json` | 票價矩陣：鍵 `` `${fromId}:${toId}` ``，值為港元數字 |
| `fares.meta.json` | 來源說明、`asOf`、適用「成人八達通／市區綫」 |

車站物件欄位：

- `id`：kebab-case 英文 slug（例 `mong-kok`、`admiralty`）
- `nameZh`、`nameEn`
- `lineIds`：字串陣列（轉車站多條綫；**青衣掛東涌綫**）

規則：

- 多綫轉車站只列**一筆**，`lineIds` 含所有所屬市區綫
- 矩陣缺某 OD → 之後 `lookupFare` 必須回錯誤，**禁止猜金額**
- 雙向：若只有 `a:b` 或只有 `b:a`，查價邏輯要能處理「對調仍可顯示」（見任務 B）

完成定義：JSON 可被 TypeScript import；結構自洽（票價鍵用的 id 都存在於 stations）。

---

## 任務 B — TDD：`lookupFare`（必做）

檔案建議：

- `src/domain/lookupFare.ts`
- `src/domain/lookupFare.test.ts`

簽名方向（可微調，但契約要測得出來）：

```ts
lookupFare(fromId: string, toId: string, matrix: FareMatrix): FareResult
```

行為（對齊 Day1 的 `FareErrorCode`）：

| 情況 | 結果 |
|------|------|
| 兩站不同且矩陣有值 | `{ ok: true, amount }` |
| 同站 | `{ ok: false, error.code: 'same_station' }` — **不回金額 0** |
| 站 id 不在資料／未知 | `unknown_station` |
| 站存在但 OD 無票價 | `missing_fare` |
| 對調：`from:to` 沒有、但 `to:from` 有 | 仍可成功（用反向鍵） |

流程：先寫失敗測試 → 看紅 → 最少實作變綠 → 再補案例。

完成定義：`pnpm test` 涵蓋上表；能口述為何同站不是 `HK$0`。

---

## 任務 C — TDD：`searchStations`（必做）

檔案建議：

- `src/domain/searchStations.ts`
- `src/domain/searchStations.test.ts`

行為方向：

- `searchStations(query, stations, locale?)`
- 中文：「旺」→ 含旺角
- 英文：「adm」→ 含 Admiralty／金鐘（依你的站名資料）
- 空白／無匹配 → 空陣列（或你定的明確行為，寫進測試）

完成定義：至少 3–4 個搜尋案例綠燈。

---

## 任務 D — 表格驅動測試 ≥10 案（必做）

在 `lookupFare`（必要時加上 search）用 **table-driven**（Vitest 的 `it.each` 或自訂案例陣列）寫：

- 正向：至少 2–3 組真實 OD
- 負向：同站、未知站、缺票價、對調有資料／無資料
- 合計 **≥ 10** 列

完成定義：一張表就能看出測了哪些契約；面試講得出「負向案例」。

---

## 任務 E — 學習筆記（必做）

新建 `docs/notes-day2.md`：

1. 今天測了哪些邊界／負向？
2. 矩陣鍵為什麼用 `` `${fromId}:${toId}` ``？
3. 缺票價為什麼不能猜一個「差不多」的金額？（QA 語言）

---

## 今日不要做

- 選站 UI、Testing Library、Playwright、CI、Deploy（Day3 起）
- **即時抓取／爬蟲／線上 API 查價**（out of scope）：今日只用合法公開來源，離線整理成靜態 JSON，並在 `fares.meta.json` 註明來源與 `asOf`

## 之後再說（備忘）

- 資料更新流程：靜態檔定期更新 vs 授權 API（若有）vs 即時抓取——優先評估條款與可維護性，**不要先做爬蟲**

## 卡住時怎麼問 Agent

- 「這個案例該回 `missing_fare` 還是 `unknown_station`？」
- 「`it.each` 這樣寫為什麼紅？」（貼測試，不要貼請代寫整檔）
- 「對調邏輯我測到紅了，方向對嗎？」

## 做完回報

說「Day2 做完」，並附上：

1. `pnpm test` 與 `pnpm typecheck` 結果  
2. 站數／票價對數（大概）  
3. `docs/notes-day2.md` 已寫  
4.（若尚未補）Day1 的 `docs/notes-day1.md`  
