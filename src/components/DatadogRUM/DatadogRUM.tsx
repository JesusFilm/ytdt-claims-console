"use client"

import { useEffect } from "react"

import { datadogRum } from "@datadog/browser-rum"

import { env } from "@/env"

let isInitialized = false

export function DatadogRUM() {
  useEffect(() => {
    if (isInitialized) {
      return
    }

    const applicationId = env.NEXT_PUBLIC_DATADOG_APPLICATION_ID
    const clientToken = env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN

    if (!applicationId || !clientToken) {
      return
    }

    datadogRum.init({
      applicationId,
      clientToken,
      site: env.NEXT_PUBLIC_DATADOG_SITE || "datadoghq.com",
      service: env.NEXT_PUBLIC_DATADOG_SERVICE || "ytdt-claims-console",
      env: env.NEXT_PUBLIC_DATADOG_ENV || "production",
      version: env.NEXT_PUBLIC_DATADOG_VERSION,
      sessionSampleRate: env.NEXT_PUBLIC_DATADOG_SESSION_SAMPLE_RATE ?? 20,
      sessionReplaySampleRate: env.NEXT_PUBLIC_DATADOG_REPLAY_SAMPLE_RATE ?? 10,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: "mask-user-input",
    })

    datadogRum.startSessionReplayRecording()
    isInitialized = true
  }, [])

  return null
}
