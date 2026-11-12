# 幸福階梯｜資料來源

## 隨網站附上的資料

- `WHR26_Data_Figure_2.1.xlsx` 是 [World Happiness Report 2026 官方原始工作簿](https://files.worldhappiness.report/WHR26_Data_Figure_2.1.xlsx)。它涵蓋 2011–2025 年的生活評價、置信區間、六項因素的模型貢獻值和殘差。
- `whr-2011-2025.csv` 是原表的 2,116 筆觀測值轉成的 CSV。最後一欄按 Assignment 2 網頁內嵌的 2025 年國家分類補上地區，空白表示該年度名單無法匹配。
- `assignment2-chart-data.json` 取自 [已發布的 Assignment 2 網頁](https://ray24200867.github.io/whr-assignment2/) 的內嵌資料。包括地區序列、2025 年散點資料、回歸係數、最大跌幅和作者歸類。Claude 對話提到原本的 `whr_long_with_region.csv`，這次取得的是網頁已發布的資料和重新整理的 CSV。
- `ranking.js` 由官方原表的 147 筆 2025 年排名生成。階梯點選後會讀取這份資料並更新排行榜。
- `chart-data.js` 是頁面「查看數據」所用的資料副本。圖 A、圖 1、圖 2、圖 3 可展開查看對應資料。各圖的原始視覺仍以 Figma 匯出的圖層呈現。

## Assignment 3 圖表對照

| 圖表 | 設計中所用資料或來源 |
| --- | --- |
| 排行榜、圖 A | WHR 2026 Figure 2.1，2025 年生活評價與排名 |
| 六項因素圖解 | WHR 2026 Chapter 2，六個解釋變數與其定義 |
| 圖 1 | WHR 2026 歷年生活評價、Assignment 2 地區歸類和平均值 |
| 圖 1b | [WHR 2024 Chapter 2](https://files.worldhappiness.report/WHR24_Ch02.pdf) 年齡分組排名。香港未滿 30 歲的第 97 名也見官方報告 Figure 2.2。 |
| 圖 1c | WHR 2026 歷年社會支援、人生選擇自由的模型貢獻值。旁邊的青年圖另引 [WHR 2026 Chapter 2](https://files.worldhappiness.report/WHR26_Ch02.pdf)。 |
| 圖 2 | WHR 2026 生活評價、GDP 和社會支援的模型貢獻值，以及 Assignment 2 的作者回歸及分組 |
| 圖 2b、2c、2d | WHR 2026 香港歷年評分、排名、六項模型貢獻值和殘差。人均居住面積小圖另外引用 [香港立法會 FS06/2022](https://www.legco.gov.hk/research-publications/english/2022fs06-housing-situation-and-housing-supply-in-hong-kong-20221011-e.pdf) 和 The Standard（Demographia）。 |
| 圖 3 | WHR 歷年生活評價、Assignment 2 作者計算的最大跌幅和反彈值，以及作者的事件分類。設計註釋引用 [UCDP 定義](https://www.uu.se/en/department/peace-and-conflict-research/research/ucdp/ucdp-definitions)。 |
| 圖 3b | 黎巴嫩的 WHR 生活評價，加上設計註明的 World Bank／StatisticsTimes 和 L’Orient Today 實質 GDP 增長率。 |
| 圖 3c | WHR 2026 歷年社會支援的模型貢獻值。 |
| 圖 3d | [Gallup 2024 年烏克蘭調查](https://news.gallup.com/poll/653684/ukrainians-less-hopeful-future.aspx) 的單年生活評分和憂慮比例。 |

補充圖目前使用設計中的圖層和數字。來源列表供追查和核對，部分來源是報告或文章，Assignment 2 分享對話沒有附上 Assignment 3 的全部原始作圖表。

`figure-1b-age-rankings.csv`、`figure-3d-ukraine-gallup.csv` 和 `housing-space.csv` 是按設計上標出的數字整理的 CSV，適合核對或改圖。空白表示設計未提供數字。
