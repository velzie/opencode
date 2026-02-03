import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import http from "node:http"

const PUTER_WEB_ORIGIN = "https://puter.com"
const PUTER_AUTH_TIMEOUT_MS = 120_000

async function openUrl(url: string): Promise<boolean> {
  try {
    const proc = Bun.spawn({
      cmd:
        process.platform === "darwin"
          ? ["open", url]
          : process.platform === "win32"
            ? ["cmd", "/c", "start", "", url]
            : ["xdg-open", url],
      stdout: "ignore",
      stderr: "ignore",
    })
    await proc.exited
    return proc.exitCode === 0
  } catch {
    return false
  }
}

async function getPuterAuthToken(): Promise<string | undefined> {
  return new Promise((resolve) => {
    let finished = false
    let timeout: NodeJS.Timeout | undefined
    const finish = (token?: string) => {
      if (finished) return
      finished = true
      if (timeout) clearTimeout(timeout)
      if (server.listening) {
        server.close(() => resolve(token))
      } else {
        resolve(token)
      }
    }

    const server = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" })
      res.end(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Successful - Puter</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #404C71;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 16px;
            padding: 48px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            max-width: 420px;
            margin: 20px;
        }
        .checkmark {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #00c853 0%, #00e676 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            animation: scaleIn 0.5s ease-out;
        }
        .checkmark svg {
            width: 40px;
            height: 40px;
            stroke: white;
            stroke-width: 3;
            fill: none;
            animation: drawCheck 0.6s ease-out 0.3s forwards;
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
        }
        @keyframes scaleIn {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        @keyframes drawCheck {
            to { stroke-dashoffset: 0; }
        }
        h1 { color: #1a1a2e; font-size: 24px; font-weight: 600; margin-bottom: 12px; }
        p { color: #64748b; font-size: 16px; line-height: 1.6; }
        .puter-logo { margin-top: 32px; opacity: 0.6; font-size: 14px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="checkmark">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h1>Authentication Successful</h1>
        <p>You're all set! You may now close this window and return to your terminal.</p>
        <div class="puter-logo">Powered by Puter</div>
    </div>
</body>
</html>`)

      const url = new URL(req.url ?? "/", "http://localhost/")
      const token = url.searchParams.get("token")?.trim() || undefined
      finish(token)
    })

    server.listen(0, "127.0.0.1", async () => {
      const address = server.address()
      if (!address || typeof address === "string") {
        server.close(() => finish(undefined))
        return
      }

      timeout = setTimeout(() => {
        server.close(() => finish(undefined))
      }, PUTER_AUTH_TIMEOUT_MS)

      const redirectUrl = `http://localhost:${address.port}`
      const authUrl = `${PUTER_WEB_ORIGIN}/?action=authme&redirectURL=${encodeURIComponent(redirectUrl)}`
      await openUrl(authUrl)
    })
  })
}

export async function PuterAuthPlugin(_input: PluginInput): Promise<Hooks> {
  return {
    auth: {
      provider: "puter",
      methods: [
        {
          type: "oauth",
          label: "Web login (recommended)",
          async authorize() {
            return {
              url: undefined,
              instructions: "Opening browser for Puter authentication...",
              method: "auto" as const,
              async callback() {
                const token = await getPuterAuthToken()
                if (token) {
                  return {
                    type: "success" as const,
                    key: token,
                  }
                }
                return { type: "failed" as const }
              },
            }
          },
        },
        {
          type: "api",
          label: "API key (manual)",
          prompts: [
            {
              type: "text",
              key: "apiKey",
              message: "Enter your API key from https://puter.com/?action=copyauth",
              validate: (value) => {
                if (!value || !value.trim()) return "API key is required"
                return undefined
              },
            },
          ],
          async authorize(inputs) {
            const key = inputs.apiKey?.trim()
            if (!key) {
              return { type: "failed" as const }
            }
            return {
              type: "success" as const,
              key,
            }
          },
        },
      ],
    },
  }
}
