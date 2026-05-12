---
title: "第三章：数字产品开发"
description: "PMF、妈妈测试、产品思维、Y 模型与 Claude Code 接入实战"
order: 3
---

# 第三章：数字产品开发

创业是和喜欢的人在一起做有价值的事，本质是创造价值的行动和互动。

创业机会有寻找到的，也有创造出来的，平时就要做有心人。

“**内外碰撞法**”（可用于选创业方向或者论文课题）：“**财=贝+才**”

1）贝：用户真有需求吗？愿意花钱买吗？

2）才：为什么是你？你有独特优势吗？

<whiteboard token="KfRVwzdpUhYy2fbnmEkcvQRenGU" width="705" height="482"/>

## 创业是空白考卷

创业没有标准答案，甚至连考卷都是空白的，需靠不断试错迭代找到路径。

![](/images/digital-startup/chapter-3/1.png)

## 创业早期目标是 PMF

PMF 是 <text underline="true">**Product Market Fit**</text>（产品市场契合），即产品真正满足市场强需求的临界点，是创业者的命门，就像是下面漫画中的电灯开关。

如果你是创业高手，你可能需要3-6个月找到；如果你是创业新手，可能需要10-18个月，甚至创业失败而永远找不到。

![](/images/digital-startup/chapter-3/2.png)

<grid cols="2">

  <column width="48">
    
![](/images/digital-startup/chapter-3/3.png)

  </column>
  <column width="51">
    
![](/images/digital-startup/chapter-3/4.png)

  </column>

</grid>

当你的**创业假设**（客户、痛点、方式、竞争对手和差异化）都得到验证了，你的产品才和市场相契合（Product Market Fit，简称「PMF」），也有人把它比喻成为“Click”，就像你把两块乐高积木，咔嗒一声按在一起。

增长黑客 [Sean Ellis](https%3A%2F%2Fwww.seanellis.me%2F) 发现了，衡量产品/市场契合度（PMF）的一个领先指标：只需问用户“**如果你不能再使用该产品，你会有什么感受**”，并衡量回答“<text color="red" bgcolor="light-yellow">**非常失望**</text>”的百分比。

在对近 100 家初创公司进行基准测试后，Sean Ellis 发现产品/市场契合度的神奇数字是 **40%**。也就是说，如果你倒闭了，有超过40%用户感到非常失望的话，你就找到了电灯开关。（详见 <https://pmfsurvey.com/>）。

## 妈妈测试 The Mom Test

大学生最容易被"客气话"误导，所以这是需求验证的第一道防线。

<grid cols="2">

  <column width="50">
    
![](/images/digital-startup/chapter-3/5.png)

  </column>
  <column width="50">
    如何问那些连你妈妈都无法欺骗你的问题？当你跟用户聊天，得有一些技巧以及对自己的约束，不然你很可能就会「被哄骗」。因为你常常会收到三种噪音：赞美的客气话、没用的烟雾弹、主观化的设想。因此你需要有提问的技巧。
    故事A，是儿子告诉自己的妈妈，他想做一个菜谱App，想问妈妈几个问题。妈妈为了不伤害自己的孩子，告诉他这个想法太棒了，还帮他做了一堆证明。
    故事B，是儿子通过专注在母亲烹调中遇到的问题，而不是自己的解决方案上，取得了一些实质性的进展。
    因此和用户进行有价值对话要注意三点：
    1. 聊用户的生活，而不是自己的产品
		1. 聊用户生活中已经发生的，跟产品解决的问题相关的具体细节，不泛泛而谈，更不展望未来
		1. 多听，少说，成为一个优秀的倾听者
		- ❌ 错误问法："同学你觉得我这个 APP 好用吗？"
		- ✅ 正确问法："同学你上次点外卖遇到麻烦是怎么解决的？"
  </column>

</grid>

# 产品经理入门

## 梁宁的产品思维

https://www.dedao.cn/course/detail?id=wpAkQqxR0EoV7OQsMbVgnMzdLBlmar

几乎所有互联网大佬、新消费品牌的创业者，都自称产品经理。

产品能力是人生的底层能力。如果你拥有了产品能力，会让你有一种脚踩在地上一样的自信和踏实感，会给你生存的底气。产品能力，就是训练一个人：<text color="red" bgcolor="light-yellow">**判断信息，抓住要点**</text>，整合有限的资源，把自己的价值，打包成一个产品向世界交付，并且获得回报。

做产品经理，是科学又是艺术，处于技术、设计（UX，研究用户心理学）、商务的三者交集，本质是“**想清楚”**。产品经理得把产品当成自己家孩子，吃饭睡觉做梦都为它操心。产品经理相当于创业CEO的幼儿园阶段。

![](/images/digital-startup/chapter-3/6.png)

## 产品经理面试题

[知群](https://izhiqun.com)的马力说：通过考察你的思维方式的面试来筛选应聘者，比如

1. <text underline="true">3.05米高的卡车，如何过3米高的山洞？</text>
1. 一根针掉在大海里，怎么捞起来？
1. 下水道井盖，为什么是圆的？

做产品经理借助思维模型，来做类似的深度思考，推荐[100个产品设计框架](https%3A%2F%2Fpmframe.works%2F)。

## 需求分析的Y模型

如果福特问用户需要什么，用户会说，我要一匹更快的马，据说这是苹果的乔布斯讲的段子。

需求分析需要，<text color="red" bgcolor="light-yellow">**用心听，但不要照着做**</text>。这是产品经理的思维方式和做事方法里最核心的一点。对此最好的解释，来自乔布斯，他说：产品经理要把用户当做婴儿，婴儿只知道哭、说不出来要什么；这时候产品经理要去用各种方式尝试，了解真需求。

Y模型就是这句话的具体操作方法。Y模型概念中：“1”是用户需求场景，表现为需求的观点和行为，是表象。“2”是用户需求背后的目标和动机。PM在考虑用户目标同时，也要思考产品目标。“3”是产品功能，是解决方案，是实施人员能看懂的描述。“4”是人性/价值观，是需求的本质。Y模型形象地说明了：**往下深挖需求**的必要性。

<grid cols="2">

  <column width="59">
    
![](/images/digital-startup/chapter-3/7.png)

  </column>
  <column width="40">
    
![](/images/digital-startup/chapter-3/8.png)

  </column>

</grid>

## RICE 决策模型

![](/images/digital-startup/chapter-3/9.png)

RICE 是一套由 [Intercom](https%3A%2F%2Fwww.intercom.com%2F) 公司的量化决策工具，旨在通过四个指标，对不同的创业想法、产品功能或市场策略进行客观排序。它通过科学计算，帮助创业者将有限的资源，投入到价值最高的项目中，减少“拍脑袋”决策。

### 四大维度解析

1. **Reach（触达率）**：在特定时间段内（如每季度），该项目能影响多少用户？
1. **Impact（影响力）**：该项目对核心目标（如转化率、用户留存）的贡献有多大？
1. **Confidence（信心分）**：你对上述预测数据的把握程度是多少？
1. **Effort（执行成本）**：完成该项目需要投入的总人力成本（通常以“人/月”为单位）。注意：这是分母。成本越高，RICE 得分越低。

优秀的创业者不只是做正确的事，而是按**正确的顺序**做最有效率的事。RICE 模型不仅是一个计算公式，更是一种资源配置观。它强制我们思考：在追求“影响力”的同时，是否忽视了“触达规模”和“执行代价”？

# 头脑风暴工具

推荐经常使用[ Brainstorming 技能](https%3A%2F%2Fgithub.com%2Fobra%2Fsuperpowers%2Fblob%2Fmain%2Fskills%2Fbrainstorming%2FSKILL.md)，**让 AI 采访自己**，把模糊想法给清晰化。该技能来自开源库 <https://github.com/obra/superpowers>。

因为 AI 编程智能体的执行力实在是太强了，我们往往还没想好，它就已经不管三七二十一做出来了。所以在编程之前先把想做什么梳理清楚，比任何时候都重要！

![](/images/digital-startup/chapter-3/10.jpg)

## 脑暴相当于“别冲动装修”

为啥需要充分头脑风暴之后，再去进行编程，因为：

很多同学做编程，像一上来就抡锤子砸墙、买家具、刷油漆，结果做到一半才发现：

1. 房间尺寸量错了
1. 插座位置不对
1. 预算不够
1. 室友根本不想这么装

**Brainstorming 六步法，就是在装修时：先看清房子，再问需求，再出方案，确认后再施工。**

| **步骤** | **装修类比** | **你在做什么** |
| --- | --- | --- |
| **1. 探索现状** | 量尺寸、看户型、看水电 | 看项目文件、文档、历史记录 |
| **2. 逐个提问** | 设计师问你：想省钱、好看，还是收纳强？ | 一次只问一个问题，优先给选择题 |
| **3. 提出方案** | 给你看三种装修风格：极简 / 省钱 / 实用 | 提出 2-3 个方案，讲清优缺点，给推荐 |
| **4. 分段确认** | 先敲定客厅，再看卧室 | 每段设计确认后，再继续下一段 |
| **5. 写设计文档** | 把方案变成正式施工图 | 存档为设计文档，团队对齐 |
| **6. 过渡实施** | 图纸定了，施工队进场 | 转入详细实施计划 |

**铁律：图纸没批准，谁都不能开工。**

脑暴的产物是"实施计划"，不是"代码"。在计划里要拆清楚：先做什么、后做什么、每一步怎么验证。

# Claude Code 入门

![](/images/digital-startup/chapter-3/11.png)

上面介绍的脑暴技能，通过 Markdown 文件，提供了头脑风暴的最佳实践做法，需要通过 AI 编程智能体消耗 Token（中文称为词元，是解析内容的最小单位）跑起来。因此我们初步入门 [Claude code](https%3A%2F%2Fclaude.com%2Fproduct%2Fclaude-code) 这一类的编程智能体。

大模型相当于发动机，编程智能体相当于汽车（是由发动机驱动的系统），而技能是这辆车所运载的东西。

![](/images/digital-startup/chapter-3/12.png)

它的工作原理如下图：你输入提示词之后，它去搜集上下文、采取行动、确认结果，然后给你一个回复。

![](/images/digital-startup/chapter-3/13.png)

Claude Code 表现惊艳，是因为它把大模型的推理能力，封装成了一个拥**有读写权限、会使用工具、能自我纠错**的“<text color="red">数字员工</text>”。这对于想要快速迭代项目、打造数字创新产品的敏捷团队来说，几乎是降维打击。

推荐用 Claude code 内置命令 `**powerup**` 自学，启动快速互动课程，通过动画演示 Claude Code 的功能。

![](/images/digital-startup/chapter-3/14.png)

体验 Claude code 的第一步，是用它来帮你整理电脑桌面上，那些乱七八糟的各种文件，见识下它的威力。

小龙虾 OpenClaw（开放爪子）鼎鼎有名，但它的高度智能性，来自其大脑中配置的 Claude Code。

本课我们先掌握了 Claude code，下节课我们再学习小龙虾，两者在本质上有很多相似之处。

## 终端软件（俗称“黑窗”）入门

终端软件，就是我们在电影中常看见的，极客在用的花花绿绿的黑色窗口型（黑窗）操作界面。在终端中你需要输入命令（字符）来跟电脑互动，所以终端也称为“命令行界面”。

虽然 Claude 也有原生 App，但因为两个原因：1）官方对中国禁运；2）通过界面实现的功能不如终端命令行工具强大，所以我们还得学习终端软件用法。在终端软件中 Claude code 能力强大且更新最快。

我和大家一样多年在使用图形界面，后来才顿悟了：**字符型终端（命令行界面）才是图形界面的底层**。只有掌握了字符型终端，才掌握了计算机的第一性原理。借助它，你可以把计算机用出花来，让观众叹为观止。

![](/images/digital-startup/chapter-3/15.png)

如上图所示，常人接触到的计算机都是图形界面，比如微信的聊天界面。但是一旦编程，你就要去接触字符终端。**图形界面，只是漂浮在字符终端（命令行界面）汪洋大海之上的，一艘艘小船**。你需要用编程语言（现在可以是自然语言了），在字符终端中，去指挥计算机干活。

这是一个头脑上的**范式转变**。当你学习写 Python 语言，打开和关闭一个文件后，你就能体会到字符终端的强大。因为只有在字符终端中，你才能发出细致而深入的命令，用安排好的程序，去指挥计算机自动化工作，充分发挥其潜能，而做图形界面自动化是相对困难的。

在 Windows 上，可以点击“开始”菜单中黑色的“**CMD**”图标，去打开终端；在 Mac 上，可以搜索“**终端**”来打开它。你需要学习的最小操作是：**cd 命令**，因为这是切换工作空间（Workspace）的常用命令。本质上 Claude 是在你给定的某个文件夹（工作空间），智能处理所有该文件夹中的文件，从而实现“超能力”。

Claude code 等编程智能体，能成为**通用**智能体的原因：代码是通用求解语言。能写代码能执行，由此能做电脑上的几乎任何事，比如爬数据、处理文档、调接口、搞自动化、从零造工具等等。它就像3D 打印，目前还不能完全取代规模制造业（软件行业中的 SaaS 软件服务），但是灵活、定制、小批量的胶水层，满足个性化需求。

AI 工具整体上降低了数字创业门槛，使得超级个体（OPC）等创业新兴形态出现，但是这类工具本身不构成竞争的护城河 （就像艺术家的画笔），还是需要**有经验和品味的人**（就像艺术家梵高），驾驭工具创造价值。

## Claude Code 接入智谱大脑

Claude 对国内禁运了，但我们还是可以使用其软件。这个软件的**工程化**做得好，对普通用户来说很智能和友好。只不过在中国使用，最好换成中国大脑，既便宜又便捷。大脑就是智能体所依托的大模型（下面以智谱为例）。整个过程的核心就两步：

1. 安装 Claude Code
2. 配置智谱 GLM 的 API 接口

### 一、安装 Claude Code

安装 Claude code 是**本课程动手实践的关键环节**，请带自己电脑，去找最懂电脑的同学求助！

Node.js + 阿里镜像 + 智谱 API 是目前国内环境下成功率高且对学生友好的路径。

更多安装方式，请推荐参考花叔写的免费橙皮书：<mention-doc token="JK1WwrRgJiYfRok7YxxceS5qn1J" type="wiki">📙Claude Code从入门到精通橙皮书</mention-doc>

#### 第一步：安装 Node.js (推荐 LTS 即长期支持版本)

1. Windows: 从 [Node.js 官网](https%3A%2F%2Fnodejs.org%2Fzh-cn) 下载 .msi 安装包。Windows 的安装，多一个前置步骤：你需要先装Git for Windows，可以从[这个网站](https%3A%2F%2Fgit-scm.com%2Finstall%2Fwindows)下载和安装。
1. macOS: 如果有 Homebrew，执行 brew install node；如果没有，同样使用 Node 官网 .pkg 安装包。
1. 运行 Node 安装包，按缺省选项安装好即可。

#### 第二步：安装 Claude code

先打开终端控制台，执行下面这条命令：（国内的网络环境也可以跑）
```bash
npm install -g @anthropic-ai/claude-code --registry=https://registry.npmmirror.com
```

这条命令的作用，就是全局安装 Claude Code。

后面加上“npmmirror”的域名，就是阿里云的镜像库的地址，比你从国外 npm 库去下载要快很多。

如果你的网络环境正常、Node.js 已经安装好，这一步一般就能直接完成。

验证安装：**输入 claude --version 查看是否有回复，有回复代表你成功了**。

### 二、准备智谱 GLM 的 API Key

因为 Claude code 的大模型对国内不可访问，因此需要换成中国大模型（比如智谱）。

接下来，你需要去智谱开放平台获取自己的 API Key。

地址在这里：https://www.bigmodel.cn/usercenter/proj-mgmt/apikeys

进去之后，创建或者复制一个 API Key，后面配置时会用到。

详情可以参考 OpenCode 的[相关文档](https%3A%2F%2Flearnopencode.com%2F1-start%2F04c-zhipu.html)。

### 三、把 Claude Code 接到智谱 GLM

这里有两种配置方式。你任选一种就行。

#### 方法一：直接修改配置文件

这是更推荐新手使用的方式，因为配置一次之后，后面更省事。

第一步：找到你的用户目录

- Windows 用户：`C:\Users\你的用户名`
- Mac 用户：`~` 目录

第二步：找到或新建 `settings.json`

如果已经有这个文件，就直接改。如果没有，就新建一个。

注意几点：

- 文件名一定是 `settings.json`
- 后缀一定要是 `.json`
- 不要写成 txt 或其他格式

第三步：把下面内容写进去
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/anthropic",
    "ANTHROPIC_API_KEY": "用你在智谱那获取的API-key替换"
  }
}
```

你只需要把这里的“用你在智谱那获取的 API-key 替换”，真正替换成你自己的 API Key 就可以了。

#### 方法二：直接命令行配置

如果你不想改文件，也可以直接在命令行里配置环境变量。

这种方式比较适合：

- 先测试一下能不能用
- 临时跑一下
- 不想手动改配置文件

Mac 电脑执行：
```bash
export ANTHROPIC_AUTH_TOKEN=用你在智谱那获取的API-key替换
export ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic
```

Windows CMD 执行：
```plaintext
set ANTHROPIC_AUTH_TOKEN=用你在智谱那获取的API-key替换
set ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic
```

把其中的 API Key 换成你自己的即可。

### 四、启动 Claude Code

上面配置完成之后，就可以启动 Claude Code 了。

如果配置没问题，你会发现它已经不是走默认接口，而是接入了：
```bash
https://open.bigmodel.cn/api/anthropic
```

也就是说，这时候 Claude Code 已经可以通过智谱 API 兼容接口，调用 GLM 系列模型能力了。

## 备用方案之一：OpenCode

请自学这个网站：<https://learnopencode.com/>，尤其是安装的环节，与 Claude code 很相似。

![](/images/digital-startup/chapter-3/16.png)

## 备用方案之二：CodeBuddy 的 CLI

另外，使用腾讯 CodeBuddy 命令行工具（CLI：Command Line Interface）也能初步体验下编程智能体。

[CodeBuddy Code](https%3A%2F%2Fwww.codebuddy.cn%2Fcli%2F) 可通过 npm 一键安装，但需先确保本机已安装 Node 和 Git 等基础环境。本质上它和 Claude code 是一回事，而且已内置了智谱的大脑，能让你感受到在终端中超能力的乐趣。

![](/images/digital-startup/chapter-3/17.png)

# 趣味小调查

假设你在创业公司实习，可以选择乔布斯和中本聪，由两个完全不同的师傅来带你。这两个师傅是完全不同的产品经理，都很优秀但非常不同。至少他们选择了完全不同的道路。乔布斯的文化遗产：少即是多、连点成线、think different、follow your heart。但乔布斯的另一面，是独裁、封闭和垄断，详见《乔布斯传》。乔布斯想要的是一个效率优先和工具理性的世界，做绝对主宰的“中心化”。而中本聪是“去中心化”的思想化身，详见《比特币白皮书》。

你选的师傅是：A 乔布斯、B 中本聪？为什么这么选？
