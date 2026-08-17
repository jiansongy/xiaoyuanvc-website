---
title: "第四章：稳定币、DeFi、RWA 与 NFT"
description: "完整理解稳定币、DeFi、DEX、AMM、Uniswap、RWA、bStocks、NFT 与 OpenSea。"
dateModified: "2026-08-13"
tags: ["稳定币","DeFi","AMM","RWA","NFT"]
---

# 第四章：稳定币、DeFi、RWA 与 NFT

::: warning 公开阅读说明
本章涉及的规模、收益率、费用和产品规则均为阶段性资料，不是实时数据或投资建议；请到协议官网与权威数据源复核。
:::

## 创投营大纲

| 路线 | 定位 | 主要内容 |
| --- | --- | --- |
| 公链 | 地基 | 公链定义、比特币、区块链技术、加密工具 |
| 实务 | 大门 | 实务的重要性、交易所、加密钱包、安全常识 |
| 以太坊 | 发动机 | 与比特币的区别、交易过程、DApp 生态、一层与二层网络 |
| 金融 | 商业街 | 稳定币、DeFi、RWA、NFT |
| 创新 | 未来式 | Perp DEX、预测市场、Crypto AI |

## 币圈技术图

![Web3学习路线图，整体以流程图形式呈现，清晰梳理了Web3领域的学习路径](/images/crypto-vc/chapter-4/01.webp)

## 前言

前面我们学习了三节课。公链（比特币）是行业地基，即“去中心化的共享账本”（区块链）技术。交易所和钱包安全是进入加密行业的大门。而以太坊（智能合约平台）是加密行业的发动机。

本课和下一课将介绍在区块链上的应用（APP），可能比之前三课的基础设施（Infra），离普通人的生活更近一些。

本课的主题是金融，有两个主角是稳定币和DeFi（去中心化金融）。下一课的主题是创新，主角就比较多了。因为加密行业（也称为币圈）的创新，无时无刻在发生和演变，所以我只能从众多主角中精选了三个。

## Stablecoin（稳定币）

稳定币（Stablecoin）是一种锚定真实资产（如法定货币或主流加密货币）的加密货币， 旨在通过特定机制，维持其代币**价格的相对稳定**。有人把稳定币当作RWA（真实资产代币化）的一种，但因为稳定币目前是加密行业的Top应用，所以我选择单独讲解它。

它就是“数字化的美元（US Dollar，简称U）或者其他法币”，解决了传统加密货币（如比特币和以太币等）价格波动大的问题，可以充当加密经济中的“避风港”和高效支付工具。

![2025全球稳定币产业发展报告中“链上稳定币交易与传统银行电汇对比”图表](/images/crypto-vc/chapter-4/02.webp)

**稳定币对加密货币行业，类似集装箱对物流行业的重要性，即用“标准化”来改变世界。**以前，站在互联网的视角，我们认为区块链又慢、又贵、效率又低。现在，站在全球金融资产代币化和跨境支付的角度，我们却又会发现区块链又快、又便宜、效率奇高。

加密货币行业，借助稳定币，跨越了“创新扩散”中的鸿沟。截至2026年8月1日，稳定币总市值达\$3076亿。美国通过了天才（GENIUS）法案，首次将稳定币纳入立法监管，允许银行和科技公司发行稳定币。

#### 稳定币特征

稳定币的特征就是，价格相对稳定，可以用来做交易、支付、储值。而不像比特币经常价格波动。

主要类型有：

- **中心化稳定币**：USDT（市场领导者、不够透明，发行方Tether估值达\$5000亿）、USDC（由公司发行，美元储备支持）。传统金融业者比如JPMorgan等巨头也在进入稳定币的市场竞争中。
- **去中心化稳定币**：没有中心化机构，而是在链上去中心化方式形成，比如 DAI（由智能合约抵押加密资产而生成）

#### 为什么重要？

- 是去中心化金融（DeFi）和加密市场的**“血液”（现金）**
- 在交易所中作为交易对（比如 ETH/USDT）
- 用于跨境支付和清算（24小时且无国界）

#### 稳定币市场数据

https://defillama.com/stablecoins

![DeFiLlama平台的稳定币市场数据页面，核心板块围绕稳定币市场整体情况呈现](/images/crypto-vc/chapter-4/03.webp)

## DeFi（去中心化金融）

去中心化金融（Decentralized Finance）是最能体现**智能合约**特性的服务，它本质上就是**货币的“计算”与应用**。它解决了传统金融（TradFi）的痛点：7x24小时不间断、无门槛、代码即法律；但同时也有跨链桥风险、预言机攻击、合约漏洞等风险**。**

### DeFi 行业地图

DeFi 是用一系列的金融服务，替代传统的金融行业，包括银行、证券、保险等。用户不但能使用这些金融服务，而且由于其可组合性（即叠加不同功能），还可以无缝使用不同的 DeFi 协议叠加，就像拼乐高积木。

DeFi 的主要类别分别是跨链桥、借贷、质押、交易等。其特点是：无需登录到各种服务中，只要你用自己的加密钱包（比如 MetaMask）登录后，就可以进行操作，而且各种操作可以任意组合，这就是DeFi乐高积木化的含义。

[DeFiLlama 分类数据](https://defillama.com/categories)：

![DeFi各类别的TVL（总锁定价值）数据](/images/crypto-vc/chapter-4/04.webp)

#### DeFi各类别的规模

1. 跨链桥Bridge ≈ \$44–45B （这个领域也是安全事件最高发的）
2. 借贷Lending ≈ \$38–40B （借贷是一个刚需）
3. 流动性质押Liquid Staking ≈ \$34–35B （质押类似定期存款）
4. 真实资产代币化RWA ≈ \$25–27B （下一节详细说）
5. 去中心化交易所Dexs ≈ \$11B （这是最有代表性的DeFi应用）
6. 之后是 Staking Pool、Risk Curators、CDP、Canonical Bridge、Restaking、Onchain Capital Allocator、Basis Trading、Liquid Restaking、Yield 等。

### DeFi的定位

DeFi的定位是无需许可、可任意组合（乐高积木式）的金融市场。

最典型的两个应用例子（DEX和Lending）：

1. **AMM 自动做市商（以 Uniswap 为例）**：

   - 摒弃传统的“订单簿”，采用数学公式 **x × y = k**（常数乘积公式）。
   - 其中有“无常损失（Impermanent Loss）”的概念与流动性池（Liquidity Pool）机制。
2. **去中心化借贷（以 Aave 为例）**：

   - **资金池模式**：摒弃点对点借贷，采用点对池（Peer-to-Pool），利率由算法供求曲线动态决定。
   - **闪电贷（Flash Loans）**：智能合约特有的“原子性（Atomicity）”体现——在同一个区块内完成借款、套利、还款，无须抵押物。

### 去中心化换币协议 DEX

交易所的功能：把某种货币兑换成另一种货币。传统的交易所采用的是订单簿方式，这就需要做市商（Market Maker）来撮合买卖双方。但是在区块链上产生了一种新的方式，称为 AMM（自动做市商）。AMM在底层跑的，就是DEX协议（Decentralized EXchange，去中心化换币）。

它本质是一个部署在区块链上的智能合约，提供货币兑换服务。我们可以把AMM设想成一个机器人做市商，根据某种定价模型，在两种资产之间，随时提供报价，以供用户进行交易。

恒定函数做市商（CFMM）是当前最流行的AMM。比如，要求两种资产储备量的乘积始终保持不变，即：

**x \* y = k**

推荐这个解释 AMM 机制的视频：https://www.youtube.com/watch?v=1PbZMudPP5E

![用于解释AMM（自动化做市商）机制的教学视频截图，核心围绕流动性池的相关内容展开](/images/crypto-vc/chapter-4/05.webp)

下面是一个**简化版 AMM 合约**示意代码，帮助学生理解 AMM 的核心逻辑：**「我存入两种币，别人可以换币」的自动兑换机制**。

#### 简化版 AMM 智能合约

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleAMM {
    uint public reserveTokenA;
    uint public reserveTokenB;

    // 用户存入 TokenA 和 TokenB，按照 1:1 比例添加流动性
    function addLiquidity(uint amountA, uint amountB) public {
        // 实际项目中会用 IERC20 的 transferFrom，但我们简化
        reserveTokenA += amountA;
        reserveTokenB += amountB;
    }

    // 用户用 TokenA 换 TokenB（不考虑手续费）
    function swapAForB(uint amountAIn) public returns (uint amountBOut) {
        // 使用恒定乘积做市公式： x * y = k
        // 假设：amountBOut = reserveTokenB - (k / (reserveTokenA + amountAIn))

        uint k = reserveTokenA * reserveTokenB;
        reserveTokenA += amountAIn;
        amountBOut = reserveTokenB - (k / reserveTokenA);
        reserveTokenB -= amountBOut;
        return amountBOut;
    }

    // 用户用 TokenB 换 TokenA（同理）
    function swapBForA(uint amountBIn) public returns (uint amountAOut) {
        uint k = reserveTokenA * reserveTokenB;
        reserveTokenB += amountBIn;
        amountAOut = reserveTokenA - (k / reserveTokenB);
        reserveTokenA -= amountAOut;
        return amountAOut;
    }
}
```

📚 函数说明：

- `addLiquidity()`：就像往池子里倒入糖和水一样，必须同时倒入 TokenA 和 TokenB，才能保持兑换比例。
- `swapAForB()`：自动计算出你能换多少 B，按 `x*y=k` 保证池子状态恒定。反之 swapBForA() 同理。
- 此代码中没有考虑手续费、没有 ERC20 接口调用、没有滑点保护——因为这是为了**教学用的简化模型**。

下面介绍 AMM 中的代表产品。

#### 案例：Uniswap

2017年，机械工程师哈登·亚当斯（Hayden Adams）刚刚被西门子裁员，一边自学 Solidity，一边在社区摸索机会。偶然间，他在 Reddit 上看到 Vitalik Buterin（以太坊创始人）提到一个叫「恒定乘积做市公式」的点子。

Hayden 灵光一现，用这个想法造出了一个完全自动的去中心化交易所原型。他没有团队、没有资金、没有商业计划，只有代码和信念。

几个月后，Vitalik 亲自资助了他一笔 ETH，之后这项目也拿到了以太坊基金会的资助。2018 年 UniSwap v1 问世，用 300 行代码，颠覆了传统交易所逻辑。

这个“一个人+一个想法”的项目，最终成长为管理上百亿美元流动性的 DeFi 基础设施。

UniSwap 证明了：**极简的数学 + 极致的执行，也能改变世界。**

进一步细节请看 **Uniswap Docs:** https://docs.uniswap.org/

#### 动手实验：在 Uniswap 上把 ETH 换成为 USDC

1. 访问网页：https://app.uniswap.org/
2. 点击右上角的“连接”，按指示连接上 MetaMask 钱包，并且要切换到“Sepolia”测试网
3. 进入 Uniswap 页面上钱包的设置页，选择打开“测试网模式”（如果你已经有了 U 就可以用真实网进行）
4. 把你在第一节课，通过水龙头拿到的 ETH 测试币，换成 USDC（或者反向操作）
5. 之后你就可以把这个 USDC 拿去做借贷，或者其他 DeFi 操作

![Uniswap平台的界面及设置](/images/crypto-vc/chapter-4/06.webp)

## RWA（真实世界资产代币化）

**RWA (Real World Assets)** 指的是将传统现实世界中的有形或无形资产（如政府债券、房地产、私人信贷、大宗商品、股票等），通过智能合约在区块链上进行**数字化表达（Tokenization）与分发**。

其**核心目的**：利用区块链技术降低传统金融资产的发行、交易和结算成本，实现 **24/7 全天候流动性**、**碎片化投资（Fractional Ownership）** 以及 **DeFi 组合可编程性**。

| 赛道类型 | 代表标的或协议 | 核心特点与业务逻辑 |
| --- | --- | --- |
| 美债与货币基金 | BlackRock BUIDL、Ondo Finance OUSG/USDY、Franklin Templeton BENJI | 将底层国债收益代币化，为 DeFi 市场提供链上生息资产；底稿记录的阶段性收益率约为 4%–5% |
| 私人信贷 | Centrifuge、Maple Finance、Goldfinch | 帮助实体企业或信贷基金将应收账款、贷款抵押至链上融资，收益较高但需要承担信用风险 |
| 大宗商品与股权 | Tether Gold XAUT、PAX Gold PAXG、通证化美股 | 锚定金库黄金或股票凭证，为合规地区的用户提供对应资产价格敞口 |

### 币安bStocks的案例

bStocks 就像是把美股（比如特斯拉、英伟达等大公司的股票）装进了区块链的“数字口袋”里

它不是股票本身，而是一张**数字凭证（代币）**。持有 1 个某公司的 bStocks 代币，就相当于拥有该公司 1 股股票的“收益权”。从法律上讲，这不是“股票”，而是“衍生证券凭证”。

用户购买 bStock **不拥有底层公司的直接股权**，也不享有股东投票权（Voting Rights）。用户拥有的是“追踪该股票价格涨跌以及享受分红”的合同债权（Economic Rights）。

| 功能特点 | 传统美股 | bStocks 数字股票代币 |
| --- | --- | --- |
| 交易时间 | 主要在工作日交易时段开放 | 课程底稿记录为 24/7 交易，具体以平台最新规则为准 |
| 存放地点 | 传统证券经纪商账户 | 可提到支持该资产的加密钱包 |
| 分红方式 | 现金进入账户，由用户决定是否再投资 | 底稿记录为分红自动再投资，需核对具体产品条款 |
| 购买门槛 | 受经纪商的整股、碎股和地区规则约束 | 底稿记录最低约 5 美元，需核对最新门槛 |

1. 这个业务是2026年6月11日左右上线，也就不到2个月的时间。
2. AUM（资产规模）：从首日约560万美元快速增长，两周内破1亿美元，约7周后达到约5-6亿美元级别。
3. 发展速度：极快启动，借助币安用户基础，和“真实背书+可转换”叙事，以及BNB Chain生态（DeFi集成）快速吸量。同时平台还有7000+真实美股交易（日均交易量曾达数亿美元级），形成互补。

## NFT（非同质化代币）

NFT 来自英文 Non-Fungible Token，直译是“非同质化代币”。也有人把“非同质化”译为“不可替换”或者“不可替代”。意思是，每个 NFT 都是独一无二的，相互之间不可替换/替代。

比特币等代币（Coin）都是同质化的。只要是1个比特币，那它和另外1个比特币，是同等价值。就像你收到100元人民币现钞，你只关心它的购买力，而不在乎这个现钞上的编号。

但是 Labubu 就不可替代，是非同质化的。你喜欢的 Labubu 不是我喜欢的 Labubu，每人都有自己喜欢的独特 Labubu。

NFT 的本质是：可以被彻底拥有的数字化收藏品，体现了“**数字所有权**”。形象的说，NFT 是**链上 Labubu。**

也有人把它戏称为“小图片”。怎么去评估一张小图片的价值？这就像梵高一幅画一样，不带来现金流，只能由供求关系来决定。

在以太坊上，发行一个代币（Coin）使用的是ERC20协议；而发行一个NFT使用的是ERC721协议。

![一个比特币图案，背景为电路板图案](/images/crypto-vc/chapter-4/07.webp)

![一群卡通兔子形象，它们身着不同颜色的服装，有的弹吉他，有的在播放收音机，还有的在品尝蛋糕](/images/crypto-vc/chapter-4/08.webp)

NFT 的开山鼻祖、代表加密朋克精神的 CryptoPunks，是一万个像素风的头像图片，每一个头像都是不同的。如果你收藏其中的某些稀有品种，长期看可能很有价值。文艺复兴时期，人们在教堂的天花板上绘画，而 AI+Crypto 时代，人们在区块链上用代码绘画。

![CryptoPunks的头像，是NFT的开山鼻祖，代表加密朋克精神](/images/crypto-vc/chapter-4/09.webp)

NFT 在技术上，仅仅是一种文件格式，就像 PDF。你很难说一个 PDF 值多少钱。如果它只是你随便手写的一张请假条，可能不值钱；但如果它是国防机密档案，那它就值很多钱。

所以 PDF 的价值，是由其包含的内容决定的。NFT 的价值，也是由其包含的内容决定的。

NFT 独特的“数字所有权”，PDF 却不具有。因为 PDF 可以随意复制，而 NFT 不能随意复制。根本原因是 NFT 记录在一个**去中心化账本**（比如以太坊、索拉拉等公链）上。因为有该账本在背后的支持，才让 NFT 有稀缺性、有商品交换的价值。

你可以把任何一个 NFT 的图片，复制到自己的电脑或者手机里随意使用，但这只是美女的一张照片而已，你并没有得到美女的心（数字所有权）。**数字所有权，代表着：信念、稀缺性、社交货币**。

### NFT 交易市场 [OpenSea](https://opensea.io/)

![OpenSea平台界面](/images/crypto-vc/chapter-4/10.webp)

每个人都可以用 MetaMask 登录自己的 OpenSea 页面，查看NFT或者交易NFT。
