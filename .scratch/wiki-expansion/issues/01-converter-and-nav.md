# 01: 轉換器骨架、共用模型與分區導覽

**What to build:** tools/ 轉換腳本骨架(讀取暫存目錄的 wiki Markdown、輸出 JSON、記錄 commit 與原頁路徑、報告無法解析的頁面),loadGuide 擴充為多集合並驗證跨類型連結,頂部分區導覽、全站搜尋框、頁尾授權與出處。

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] 轉換函式有 fixture 測試
- [ ] loadGuide 驗證跨類型連結與唯一性並有測試
- [ ] 頂部導覽可切區,頁尾顯示授權與出處
- [ ] 全站搜尋涵蓋所有集合,簡繁寬容
- [ ] typecheck 與測試全綠
