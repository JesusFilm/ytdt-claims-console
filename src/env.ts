import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_DATADOG_APPLICATION_ID: z.string().optional(),
    NEXT_PUBLIC_DATADOG_CLIENT_TOKEN: z.string().optional(),
    NEXT_PUBLIC_DATADOG_SITE: z.string().optional(),
    NEXT_PUBLIC_DATADOG_SERVICE: z.string().optional(),
    NEXT_PUBLIC_DATADOG_ENV: z.string().optional(),
    NEXT_PUBLIC_DATADOG_VERSION: z.string().optional(),
    NEXT_PUBLIC_DATADOG_SESSION_SAMPLE_RATE: z.coerce
      .number()
      .min(0)
      .max(100)
      .default(20)
      .optional(),
    NEXT_PUBLIC_DATADOG_REPLAY_SAMPLE_RATE: z.coerce
      .number()
      .min(0)
      .max(100)
      .default(10)
      .optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_DATADOG_APPLICATION_ID:
      process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID,
    NEXT_PUBLIC_DATADOG_CLIENT_TOKEN:
      process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
    NEXT_PUBLIC_DATADOG_SITE: process.env.NEXT_PUBLIC_DATADOG_SITE,
    NEXT_PUBLIC_DATADOG_SERVICE: process.env.NEXT_PUBLIC_DATADOG_SERVICE,
    NEXT_PUBLIC_DATADOG_ENV: process.env.NEXT_PUBLIC_DATADOG_ENV,
    NEXT_PUBLIC_DATADOG_VERSION: process.env.NEXT_PUBLIC_DATADOG_VERSION,
    NEXT_PUBLIC_DATADOG_SESSION_SAMPLE_RATE:
      process.env.NEXT_PUBLIC_DATADOG_SESSION_SAMPLE_RATE,
    NEXT_PUBLIC_DATADOG_REPLAY_SAMPLE_RATE:
      process.env.NEXT_PUBLIC_DATADOG_REPLAY_SAMPLE_RATE,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})
