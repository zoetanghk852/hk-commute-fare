# HK通勤車費查詢

手機優先的港鐵市區綫**成人八達通**單程車費查詢（靜態資料、無後端）。

## 指令（pnpm）

```bash
pnpm install
pnpm dev          # 本機預覽
pnpm test         # 單元測試（Vitest）
pnpm test:watch   # 監看模式（TDD 建議開著）
pnpm typecheck    # TypeScript 檢查
```

## 目前進度

- Day1：`formatFare` + 錯誤型別（見 [docs/DAY1-TASKS.md](docs/DAY1-TASKS.md)）
- Day2：車站／票價 JSON、`lookupFare`、`searchStations`（見 [docs/DAY2-TASKS.md](docs/DAY2-TASKS.md)）
