// Minimal headless Chrome driver over the DevTools protocol (no extra dependencies).
import { spawn } from "node:child_process"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const CHROME_PATH = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function launchBrowser({ baseUrl, artifactsDir }) {
  const port = 9700 + Math.floor(Math.random() * 200)
  const chrome = spawn(
    CHROME_PATH,
    ["--headless=new", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "cijj-e2e-"))}`, "about:blank"],
    { stdio: "ignore" }
  )

  let target
  for (let i = 0; i < 100 && !target; i++) {
    try {
      target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((item) => item.type === "page")
    } catch {
      await wait(100)
    }
  }
  if (!target) throw new Error(`Could not start Chrome at ${CHROME_PATH} (set CHROME_PATH).`)

  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve) => socket.addEventListener("open", resolve))
  let nextId = 0
  const pending = new Map()
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data)
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message)
      pending.delete(message.id)
    }
  })

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId
      pending.set(id, (message) => (message.error ? reject(new Error(`${method}: ${message.error.message}`)) : resolve(message.result)))
      socket.send(JSON.stringify({ id, method, params }))
    })

  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })
    if (result.exceptionDetails) throw new Error(`JS: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`)
    return result.result.value
  }

  const waitForLoad = async () => {
    await wait(400)
    for (let i = 0; i < 40; i++) {
      if ((await evaluate("document.readyState")) === "complete") break
      await wait(100)
    }
    await wait(900)
  }

  // Resolves when the JS condition becomes truthy (false after the timeout).
  const waitFor = async (condition, timeoutMs = 8000) => {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      if (await evaluate(`(() => { try { return !!(${condition}) } catch { return false } })()`)) return true
      await wait(150)
    }
    return false
  }

  const clickExpression = async (expression, label = expression) => {
    const point = await evaluate(
      `(() => { const el = ${expression}; if (!el) return null; el.scrollIntoView({ block: "center", behavior: "instant" }); const box = el.getBoundingClientRect(); return [box.x + box.width / 2, box.y + box.height / 2] })()`
    )
    if (!point) throw new Error(`Element not found: ${label}`)
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point[0], y: point[1] })
    for (const type of ["mousePressed", "mouseReleased"]) {
      await send("Input.dispatchMouseEvent", { type, x: point[0], y: point[1], button: "left", clickCount: 1 })
    }
  }

  await send("Page.enable")
  await send("DOM.enable")
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })

  return {
    send,
    evaluate,
    waitFor,
    path: () => evaluate("location.pathname + location.search"),
    async goto(url) {
      await send("Page.navigate", { url: url.startsWith("http") ? url : baseUrl + url })
      await waitForLoad()
    },
    waitForLoad,
    // Sets an input's value the way React expects (native setter + input event).
    type: (selector, value) =>
      evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)})
        if (!el) throw new Error("Input not found: " + ${JSON.stringify(selector)})
        const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
        Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(value)})
        el.dispatchEvent(new Event("input", { bubbles: true }))
        el.dispatchEvent(new Event("change", { bubbles: true }))
      })()`),
    click: (selector) => clickExpression(`document.querySelector(${JSON.stringify(selector)})`, selector),
    clickExpression,
    // Clicks the visible button, link or menu item whose text contains `text`, optionally inside a container.
    clickText: (text, within = "document") =>
      clickExpression(
        `[...${within}.querySelectorAll("button, a, [role=menuitem]")].find((el) => el.textContent.trim().includes(${JSON.stringify(text)}) && el.getBoundingClientRect().width > 0)`,
        text
      ),
    textOf: (selector) => evaluate(`[...document.querySelectorAll(${JSON.stringify(selector)})].map((el) => el.textContent.trim()).join(" / ")`),
    async uploadFile(selector, filePath) {
      const { root } = await send("DOM.getDocument")
      const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector })
      await send("DOM.setFileInputFiles", { nodeId, files: [filePath] })
    },
    pressEscape: () => send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }),
    clearCookies: () => send("Network.clearBrowserCookies"),
    async screenshot(name) {
      mkdirSync(artifactsDir, { recursive: true })
      const { data } = await send("Page.captureScreenshot", { format: "png" })
      writeFileSync(join(artifactsDir, `${name}.png`), Buffer.from(data, "base64"))
    },
    close() {
      socket.close()
      chrome.kill()
    },
  }
}
