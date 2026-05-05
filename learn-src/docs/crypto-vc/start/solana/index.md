---
title: "Solana：高性能公链"
subtitle: "Solana：速度与生态的高性能公链"
description: "了解Solana的核心技术：Proof of History共识、高TPS和低费用。本课涵盖Solana的技术特性、生态爆发式增长、SOL 2025年市场表现、SOL ETF获批，以及面临的去中心化挑战。"
tags:
  - "solana"
  - "proof-of-history"
  - "high-performance"
  - "sol"
  - "sol-etf"
prerequisite:
  - "start-ethereum"
order: 40
datePublished: "2026-01-15"
dateModified: "2026-03-04"
---

# Solana：速度与生态的高性能公链

## 📝 课程笔记

本课核心知识点整理：

<img src="/images/start/solana-notes.mini.jpeg"
     alt="Solana学霸笔记"
     data-zoom-src="/images/start/solana-notes.jpeg" />

---

## 学完你能做什么

::: info 本课收获
- 理解 Solana 的核心技术特性（PoH + PoS）
- 知道 Solana 为什么又快又便宜
- 了解 Solana 生态 2025 年的爆发式增长
- 认识 Solana 面临的去中心化和名誉挑战
- 能在 Solscan 上查看 Solana 链上活动
:::

## 核心思路

### Solana 是什么

::: info 一句话定义
**Solana** 是一条高性能区块链，以极快的速度和极低的费用著称。如果以太坊是"区块链界的 Windows"（功能全但有点慢），Solana 更像"区块链界的 macOS"（流畅快速，体验优先）。
:::

Solana 由前高通工程师 Anatoly Yakovenko 在 2020 年创建，目标是解决区块链"慢和贵"的问题。

### Solana 为什么这么快

Solana 的核心创新是 **Proof of History**（历史证明）。

::: info 什么是 Proof of History？
**PoH**（Proof of History）是 Solana 独创的时间戳机制。在传统区块链中，节点要花大量时间互相确认"这笔交易是什么时候发生的"。PoH 给每笔交易自动盖上时间戳，省去了大量沟通时间，交易速度因此大幅提升。
:::

打个比方：传统区块链处理交易像邮局寄信，每封信都要盖章、排队、核实。Solana 的 PoH 像给每封信自动打上精确的时间戳，邮局只需要按时间顺序处理就行，效率高得多。

Solana 还使用了**并行处理**技术：可以同时处理多笔不相关的交易，不用排队等。

### 三大公链对比

| 对比项 | 比特币 | 以太坊 | Solana |
|--------|--------|--------|--------|
| **定位** | 数字黄金 | 智能合约平台 | 高性能应用平台 |
| **共识机制** | PoW | PoS | PoH + PoS |
| **出块时间** | ~10 分钟 | ~12 秒 | ~0.4 秒 |
| **TPS** | ~7 | ~15-30 | ~4,000+ |
| **交易费用** | $1-10 | $0.5-100+ | $0.001 以下 |
| **能耗** | 极高 | 低 | 极低 |

::: tip TPS 是什么？
TPS = Transactions Per Second，每秒处理的交易数量。数字越大，网络越快。Solana 的理论 TPS 可达 65,000，实际日常运行约 4,000+。
:::

### Solana 生态的爆发

2025 年 Solana 生态经历了大规模增长：

- **DeFi TVL 增长约 30 倍**：从几亿美元级别飙升
- **DEX 交易量增长约 33 倍**：大量交易从以太坊转移到 Solana
- **Memecoin 热潮**：Pump.fun 等 Meme 代币发射平台主要运行在 Solana 上
- **SOL 现货 ETF**：2025 年获批，和 BTC、ETH 并列成为有 ETF 的三大代币

Solana 能承载 Memecoin 热潮的原因很简单：速度快、费用低。发一个代币只要几秒钟，交易手续费不到 1 分钱。在以太坊上同样的操作可能要花几十美元 Gas 费。

### 2025 年的 SOL

| 指标 | 数据 | 说明 |
|------|------|------|
| 年末价格 | $124.52 | 年跌幅 -34.3% |
| DeFi TVL 增长 | ~30 倍 | 生态规模暴增 |
| DEX 交易量增长 | ~33 倍 | 链上活跃度大增 |
| SOL ETF | 已获批 | 2025 年通过 |

::: warning SOL 跌了 34%，不是"崩了"吗？
要看背景。2025 年整个加密市场下行：BTC -6.4%、ETH -11.1%、SOL -34.3%。SOL 跌幅更大是因为它在 2024 年涨得更多。生态基本面（TVL、交易量）反而大幅增长。价格和生态发展不总是同步的。
:::

### Solana 的挑战

Solana 不是没有问题：

1. **网络稳定性**：历史上多次出现网络中断（宕机），虽然 2025 年有明显改善
2. **去中心化程度**：验证节点数量和分布程度不如以太坊
3. **名誉风险**：Memecoin 热潮带来了大量投机和诈骗项目，影响了 Solana 的声誉
4. **技术依赖**：高性能依赖硬件配置，验证节点的运营成本不低

## 跟我做：在 Solscan 上看 Solana

### 第 1 步：打开 Solscan

**为什么**
Solscan 是 Solana 的区块链浏览器，相当于以太坊的 Etherscan。

打开：[solscan.io](https://solscan.io)

**你应该看到**：首页显示 SOL 价格、最新交易、网络统计等

### 第 2 步：感受出块速度

**为什么**
亲眼看看"每 0.4 秒一个区块"是什么体验。

在首页观察最新区块列表的刷新速度。和比特币（10 分钟）、以太坊（12 秒）对比一下。

**你应该看到**：区块列表几乎在实时刷新，速度非常快

### 第 3 步：查看网络统计

**为什么**
了解 Solana 的真实网络活跃度。

在首页或 Analytics 页面查看：
- 当前 TPS
- 总交易量
- 活跃地址数
- 验证节点数

**你应该看到**：TPS 通常在几千的水平，远超比特币和以太坊

### 第 4 步：看一笔交易

**为什么**
体验 Solana 交易的快速确认和低费用。

点击任意一笔交易，观察：
- 确认时间（通常不到 1 秒）
- 交易费用（通常不到 $0.01）
- 交易状态

**你应该看到**：和以太坊几美元的 Gas 费相比，Solana 的费用几乎可以忽略

## 检查点 ✅

### 自测题

1. **Solana 的核心创新是什么？**
   - A. Proof of Work
   - B. Proof of History
   - C. Proof of Authority
   - D. Proof of Burn

2. **Solana 的出块时间大约是？**
   - A. 10 分钟
   - B. 12 秒
   - C. 0.4 秒
   - D. 1 分钟

3. **Solana 面临的主要挑战不包括？**
   - A. 网络稳定性
   - B. 去中心化程度
   - C. Gas 费太高
   - D. 名誉风险

<details>
<summary>点击查看答案</summary>

1. **B** — Proof of History 是 Solana 独创的时间戳机制
2. **C** — 约 0.4 秒一个区块
3. **C** — Solana 的 Gas 费极低，这恰恰是它的优势

</details>

### 实操检查

- [ ] 打开了 Solscan
- [ ] 感受了出块速度
- [ ] 查看了网络统计数据
- [ ] 看了一笔交易的费用和确认时间

## 踩坑提醒

::: warning 误区一："Solana 总宕机，不靠谱"
早期确实有多次网络中断，但 2025 年稳定性明显改善。技术在不断迭代。不过，如果你的资产需要极高可靠性，分散在多条链上是更好的选择。
:::

::: warning 误区二："Solana 上全是垃圾 Meme 币"
Meme 币确实是 Solana 上的热门品类，但 Solana 也有大量正经的 DeFi、NFT 和基础设施项目。不能以偏概全。
:::

::: warning 误区三："Solana 比以太坊好"
各有所长。Solana 快且便宜，以太坊生态更成熟、更去中心化。选哪个取决于你的需求。
:::

## 本课小结

Solana 是一条以速度和低费用著称的高性能公链，通过 PoH + PoS 共识实现了极快的出块速度。

几个核心要点：
- **Proof of History**：给交易自动打时间戳，大幅提升处理速度
- **高性能**：出块 ~0.4 秒，TPS 4000+，交易费 <$0.01
- **生态爆发**：2025 年 DeFi TVL 增长 30 倍，DEX 交易量增长 33 倍
- **SOL ETF**：2025 年获批，机构资金通道打开
- **挑战并存**：网络稳定性、去中心化程度、名誉风险

## 下一课预告

> 下一课我们学习 **[公链对比与不可能三角](../chain-comparison/)**。
>
> 你会学到：
> - 区块链"不可能三角"是什么
> - BTC、ETH、SOL 三大公链的技术取舍对比
> - 2025 年三大代币的市场表现对比
> - 如何理解加密市场的整体格局

---

## 附录：参考资料

<details>
<summary><strong>点击展开查看参考资料来源</strong></summary>

> 更新时间：2026-01-28

| 内容类型 | 来源资料 | 页码/章节 |
|----------|---------|----------|
| Solana 概述 | 第二期加密创投营课件 | P10（Solana 时间线） |
| SOL 价格数据 | CoinGecko 2025 年度报告 | 市场总览章节 |
| DeFi TVL 增长 | Messari Crypto Theses 2026 | Solana 章节 |
| DEX 交易量增长 | Messari Crypto Theses 2026 | Solana 章节 |
| SOL ETF | CoinGecko 2025 年度报告 | ETF 章节 |

**关键数据来源**：
- SOL 年末 $124.52（-34.3%）：CoinGecko 2025 Report
- DeFi TVL 增长 ~30 倍、DEX 交易量增长 ~33 倍：Messari
- SOL ETF 获批：CoinGecko 2025 Report

</details>

---

::: info 🎯 学完了？把知识变成实践！

**加入校园VC学习群**，每日领取数创 & 加密行业日报，第一时间掌握行业前沿动态。

[扫码加小助手 · 免费进群 →](https://xiaoyuanvc.com/#contact)
:::
