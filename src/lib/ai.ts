/**
 * AI 服务统一封装
 * 支持 OpenAI 兼容接口 + 阿里云 / 腾讯云 / 百度云
 */

const AI_BASE_URL = process.env.AI_BASE_URL || "https://api.openai.com/v1"
const AI_API_KEY = process.env.AI_API_KEY || ""
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini"

/** AI 提供商类型 */
export type AIProvider = "openai" | "aliyun" | "tencent" | "baidu"

/** 根据 BASE_URL 自动检测提供商 */
function detectProvider(): AIProvider {
  const url = AI_BASE_URL.toLowerCase()
  if (url.includes("dashscope") || url.includes("aliyuncs")) return "aliyun"
  if (url.includes("hunyuan") || url.includes("tencent")) return "tencent"
  if (url.includes("baidubce") || url.includes("baidu")) return "baidu"
  return "openai"
}

// ==================== 图像识别 ====================

/** OpenAI 兼容接口图像识别 */
async function recognizeWithOpenAI(
  imageBase64: string,
  prompt: string
): Promise<string> {
  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`AI 识别失败: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

/** 阿里云通义千问 VL 图像识别 */
async function recognizeWithAliyun(
  imageBase64: string,
  prompt: string
): Promise<string> {
  const response = await fetch(
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL || "qwen-vl-plus",
        input: {
          messages: [
            {
              role: "user",
              content: [
                { text: prompt },
                { image: `data:image/jpeg;base64,${imageBase64}` },
              ],
            },
          ],
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`阿里云识别失败: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.output.choices[0].message.content[0].text
}

/** 腾讯云混元图像识别 */
async function recognizeWithTencent(
  imageBase64: string,
  prompt: string
): Promise<string> {
  const response = await fetch(
    `${AI_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL || "hunyuan-vision",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ],
          },
        ],
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`腾讯云识别失败: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

/** 百度云 ERNIE 图像识别 */
async function recognizeWithBaidu(
  imageBase64: string,
  prompt: string
): Promise<string> {
  // 百度云需要先获取 access_token
  const tokenRes = await fetch(
    `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${AI_API_KEY}&client_secret=${process.env.AI_API_SECRET || ""}`
  )
  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token

  const response = await fetch(
    `${AI_BASE_URL}/wenxinworkshop/chat/${AI_MODEL || "ernie-4.0"}?access_token=${accessToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ],
          },
        ],
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`百度云识别失败: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.result
}

/** 图像识别：自动选择提供商 */
export async function recognizeImage(
  imageBase64: string,
  prompt: string
): Promise<string> {
  const provider = detectProvider()
  switch (provider) {
    case "aliyun":
      return recognizeWithAliyun(imageBase64, prompt)
    case "tencent":
      return recognizeWithTencent(imageBase64, prompt)
    case "baidu":
      return recognizeWithBaidu(imageBase64, prompt)
    default:
      return recognizeWithOpenAI(imageBase64, prompt)
  }
}

// ==================== 语音转文字 ====================

/** OpenAI 兼容接口语音转文字 */
async function transcribeWithOpenAI(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  const formData = new FormData()
  formData.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: "audio/webm" }),
    filename
  )
  formData.append("model", "whisper-1")
  formData.append("language", "zh")

  const response = await fetch(`${AI_BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`语音转写失败: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.text
}

/** 阿里云 Paraformer 语音转文字 */
async function transcribeWithAliyun(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  // 阿里云 DashScope 语音识别（文件上传方式）
  const formData = new FormData()
  formData.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: "audio/webm" }),
    filename
  )
  formData.append("model", "paraformer-v2")
  formData.append("language_hints", '["zh"]')

  const response = await fetch(
    "https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: formData,
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`阿里云语音转写失败: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.output.transcription
}

/** 腾讯云语音转文字 */
async function transcribeWithTencent(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  const formData = new FormData()
  formData.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: "audio/webm" }),
    filename
  )
  formData.append("model", "whisper-large-v3")
  formData.append("language", "zh")

  const response = await fetch(
    `${AI_BASE_URL}/audio/transcriptions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: formData,
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`腾讯云语音转写失败: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.text
}

/** 百度云语音转文字 */
async function transcribeWithBaidu(
  audioBuffer: Buffer,
  _filename: string
): Promise<string> {
  const tokenRes = await fetch(
    `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${AI_API_KEY}&client_secret=${process.env.AI_API_SECRET || ""}`
  )
  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token

  const response = await fetch(
    `https://vop.baidu.com/server_api?access_token=${accessToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        format: "webm",
        rate: 16000,
        channel: 1,
        cuid: "kidstep",
        token: accessToken,
        speech: audioBuffer.toString("base64"),
        len: audioBuffer.length,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`百度云语音转写失败: ${response.status} ${error}`)
  }

  const data = await response.json()
  if (data.err_no !== 0) {
    throw new Error(`百度云语音转写错误: ${data.err_msg}`)
  }
  return data.result[0]
}

/** 语音转文字：自动选择提供商 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  const provider = detectProvider()
  switch (provider) {
    case "aliyun":
      return transcribeWithAliyun(audioBuffer, filename)
    case "tencent":
      return transcribeWithTencent(audioBuffer, filename)
    case "baidu":
      return transcribeWithBaidu(audioBuffer, filename)
    default:
      return transcribeWithOpenAI(audioBuffer, filename)
  }
}
