---
title: "建立我的第一個 Next.js 現代化網站"
date: "2026-03-13"
excerpt: "分享我如何使用 Next.js App Router 與 MDX，零資料庫打造極速個人的部落格。"
tags: ["Next.js", "MDX", "部落格"]
---

# 歡迎來到我的新部落格！

這是我使用 **Next.js** 建立的全新個人空間，主要紀錄我學習技術的過程以及分享軟體開發上的心得。

## 為什麼選擇 Next.js？

傳統的網站常常需要依賴後端與資料庫，但我希望有一個**維護成本極低、載入速度極快**的解決方案。
透過 Next.js 的 SSG (靜態網站生成)，我可以直接用 Markdown 來撰寫文章，寫完只要 `git push` 到 Cloudflare Pages 就能完成更新！

幾個優點包含：
1. **SEO 極佳**
2. **不用租用資料庫**
3. **支援 React 元件互動 (MDX)**

```javascript
// 範例程式碼：讀取 MDX 檔案
const post = getPostBySlug(slug);
console.log("文章標題：", post.meta.title);
```

感謝你的短暫停留，未來我會持續在這裡發佈更多有趣的技術筆記！
