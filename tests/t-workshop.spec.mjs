import { expect, test } from "@playwright/test";

const GOOD_AI = {
  diagnosis: "你已经完成一次有效开发验证，下一步要把用户卡点转成产品修改清单。",
  evidenceReading: "从你的描述看，用户已经接触到最小版本，并指出输入方式不够直接，这属于可以转化为产品决策的一手反馈，也说明当前验证已经从想法讨论进入真实使用场景。",
  improvements: [
    "把用户原话整理成问题清单，并标注每句话对应的具体产品页面",
    "区分用户不会用和用户不想用，避免把体验问题误判成需求不存在",
    "下一版只改一个关键入口，让第二位用户独立完成同样任务并记录用时",
  ],
  nextActions: [
    "今天把输入书名入口改成更明显的首屏动作并记录这次改动原因",
    "本周再约三位同学测试同一路径，观察他们是否仍卡在入口",
  ],
  reminder: "AI 只基于你输入的文字做一诊，不能替代老师对证据质量和课堂表现的判断。",
};

const SAMPLE_TEXT =
  "我做了一个校园二手书估价的小页面，给室友试了 5 分钟。他一开始不知道从哪里输入书名，后来问我能不能直接拍封面识别，我没有解释，只记录了他的原话。";

function glmPayload(ai) {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify(ai),
        },
      },
    ],
  };
}

async function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

async function fillSubmission(page) {
  await page.getByLabel("学生昵称（可选）").fill("小李");
  await page.getByLabel("你做了什么？给谁看了？").fill(SAMPLE_TEXT);
  await page.locator("#evidence-file").setInputFiles({
    name: "feedback.png",
    mimeType: "image/png",
    buffer: Buffer.from("fake-image"),
  });
}

test("正常流生成 AI 一诊并复制安全摘要", async ({ page }) => {
  const errors = await collectErrors(page);
  await page.addInitScript(() => {
    window.__copiedText = "";
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          window.__copiedText = text;
        },
      },
      configurable: true,
    });
  });
  await page.route("**/api/glm-proxy", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(glmPayload(GOOD_AI)),
    });
  });

  await page.goto("/t/demo");
  await fillSubmission(page);
  await page.getByRole("button", { name: "让 AI 看一下" }).click();
  await expect(page.locator(".result-list").getByText("你已经完成一次有效开发验证")).toBeVisible();
  await page.getByRole("button", { name: "复制摘要发给示例老师老师" }).click();
  const copied = await page.evaluate(() => window.__copiedText);
  expect(copied).toContain("【校园VC 数创助教 · 一诊摘要】");
  expect(copied).toContain("链接：https://xiaoyuanvc.com/t/demo");
  expect(copied).not.toMatch(/preview=1|blob:|localStorage|\?c=/);
  expect(errors).toEqual([]);
});

test("GLM 超时后使用演示一诊 fallback", async ({ page }) => {
  const errors = await collectErrors(page);
  await page.route("**/api/glm-proxy", async (route) => {
    await route.abort("timedout");
  });

  await page.goto("/t/demo");
  await fillSubmission(page);
  await page.getByRole("button", { name: "让 AI 看一下" }).click();
  await expect(page.getByText("本次使用演示一诊。AI 仅做参考，不替代老师判断。")).toBeVisible();
  await expect(page.locator(".result-list").getByText("你已经在动手做产品了，方向值得继续打磨。")).toBeVisible();
  expect(errors.filter((text) => !text.includes("net::ERR_TIMED_OUT"))).toEqual([]);
});

test("红线词输出被拦截并降级", async ({ page }) => {
  const errors = await collectErrors(page);
  await page.route("**/api/glm-proxy", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        glmPayload({
          ...GOOD_AI,
          diagnosis: "项目一定可行，你可以马上扩大推广规模并把这次作业作为通过依据。",
        }),
      ),
    });
  });

  await page.goto("/t/demo");
  await fillSubmission(page);
  await page.getByRole("button", { name: "让 AI 看一下" }).click();
  await expect(page.getByText("本次使用演示一诊。AI 仅做参考，不替代老师判断。")).toBeVisible();
  await expect(page.getByText("项目一定可行")).not.toBeVisible();
  expect(errors).toEqual([]);
});

for (const width of [375, 414, 768]) {
  test(`视口 ${width}px 无横向滚动`, async ({ page }) => {
    const errors = await collectErrors(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/t/demo");
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(fits).toBe(true);
    expect(errors).toEqual([]);
  });
}
