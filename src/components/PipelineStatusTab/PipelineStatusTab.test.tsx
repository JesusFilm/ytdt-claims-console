import { render, screen, fireEvent } from "@testing-library/react"

import PipelineStatusTab from "."

import type { PipelineStatusProps } from "./PipelineStatusTab"

describe("PipelineStatusTab", () => {
  const mockOnRefresh = vi.fn()
  const mockOnStop = vi.fn()

  const defaultStatus: PipelineStatusProps["status"] = {
    running: false,
    status: "idle",
    error: null,
    steps: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render header", () => {
    render(
      <PipelineStatusTab
        status={defaultStatus}
        onRefresh={mockOnRefresh}
        onStop={mockOnStop}
      />
    )
    expect(screen.getByText("Pipeline Status")).toBeInTheDocument()
  })

  it("should show idle badge when not running", () => {
    render(
      <PipelineStatusTab
        status={defaultStatus}
        onRefresh={mockOnRefresh}
        onStop={mockOnStop}
      />
    )
    expect(screen.getByText("Idle")).toBeInTheDocument()
  })

  it("should show processing badge when running", () => {
    render(
      <PipelineStatusTab
        status={{ ...defaultStatus, running: true, status: "running" }}
        onRefresh={mockOnRefresh}
        onStop={mockOnStop}
      />
    )
    expect(screen.getByText("Processing")).toBeInTheDocument()
  })

  it("should show completed badge", () => {
    render(
      <PipelineStatusTab
        status={{ ...defaultStatus, status: "completed" }}
        onRefresh={mockOnRefresh}
        onStop={mockOnStop}
      />
    )
    expect(screen.getByText("Completed")).toBeInTheDocument()
  })

  it("should show failed badge", () => {
    render(
      <PipelineStatusTab
        status={{ ...defaultStatus, status: "failed" }}
        onRefresh={mockOnRefresh}
        onStop={mockOnStop}
      />
    )
    expect(screen.getByText("Failed")).toBeInTheDocument()
  })

  it("should display error when present", () => {
    render(
      <PipelineStatusTab
        status={{ ...defaultStatus, error: "Test error" }}
        onRefresh={mockOnRefresh}
        onStop={mockOnStop}
      />
    )
    expect(screen.getByText("Pipeline Failed")).toBeInTheDocument()
    expect(screen.getByText("Test error")).toBeInTheDocument()
  })

  it("should show progress when running", () => {
    render(
      <PipelineStatusTab
        status={{
          ...defaultStatus,
          running: true,
          progress: 50,
          runId: "test-run",
        }}
        onRefresh={mockOnRefresh}
        onStop={mockOnStop}
      />
    )
    expect(screen.getByText("50%")).toBeInTheDocument()
  })

  it("should show stop button when running", () => {
    render(
      <PipelineStatusTab
        status={{
          ...defaultStatus,
          running: true,
          runId: "test-run",
        }}
        onRefresh={mockOnRefresh}
        onStop={mockOnStop}
      />
    )
    expect(screen.getByText("Stop Pipeline")).toBeInTheDocument()
  })

  it("should call onStop when stop button is clicked", () => {
    render(
      <PipelineStatusTab
        status={{
          ...defaultStatus,
          running: true,
          runId: "test-run",
        }}
        onRefresh={mockOnRefresh}
        onStop={mockOnStop}
      />
    )
    const stopButton = screen.getByText("Stop Pipeline")
    fireEvent.click(stopButton)
    expect(mockOnStop).toHaveBeenCalledWith("test-run")
  })

  it("should show system ready when idle and no last run", () => {
    render(
      <PipelineStatusTab
        status={defaultStatus}
        onRefresh={mockOnRefresh}
        onStop={mockOnStop}
      />
    )
    expect(screen.getByText("System Ready")).toBeInTheDocument()
  })
})
