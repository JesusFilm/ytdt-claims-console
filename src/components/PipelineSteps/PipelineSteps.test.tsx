import { render, screen } from "@testing-library/react"

import PipelineSteps, { PipelineStep } from "."

describe("PipelineSteps", () => {
  const mockSteps: PipelineStep[] = [
    {
      id: "step_1",
      name: "Step 1",
      description: "First step",
      status: "completed",
      duration: 1000,
    },
    {
      id: "step_2",
      name: "Step 2",
      description: "Second step",
      status: "running",
    },
    {
      id: "step_3",
      name: "Step 3",
      description: "Third step",
      status: "pending",
    },
  ]

  it("should render empty state when no steps", () => {
    render(<PipelineSteps steps={[]} />)
    expect(screen.getByText("Pipeline Steps")).toBeInTheDocument()
    expect(screen.getByText("No steps available")).toBeInTheDocument()
  })

  it("should render all steps", () => {
    render(<PipelineSteps steps={mockSteps} />)
    expect(screen.getByText("Pipeline Steps")).toBeInTheDocument()
    const step1Elements = screen.getAllByText("Step 1")
    expect(step1Elements.length).toBeGreaterThan(0)
    const step2Elements = screen.getAllByText("Step 2")
    expect(step2Elements.length).toBeGreaterThan(0)
    const step3Elements = screen.getAllByText("Step 3")
    expect(step3Elements.length).toBeGreaterThan(0)
  })

  it("should show descriptions when showDescriptions is true", () => {
    render(<PipelineSteps steps={mockSteps} showDescriptions={true} />)
    expect(screen.getByText("First step")).toBeInTheDocument()
    expect(screen.getByText("Second step")).toBeInTheDocument()
  })

  it("should not show descriptions when showDescriptions is false", () => {
    render(<PipelineSteps steps={mockSteps} showDescriptions={false} />)
    expect(screen.queryByText("First step")).not.toBeInTheDocument()
  })

  it("should display step numbers", () => {
    render(<PipelineSteps steps={mockSteps} />)
    const step1Elements = screen.getAllByText(/Step 1/)
    expect(step1Elements.length).toBeGreaterThan(0)
    const step2Elements = screen.getAllByText(/Step 2/)
    expect(step2Elements.length).toBeGreaterThan(0)
    const step3Elements = screen.getAllByText(/Step 3/)
    expect(step3Elements.length).toBeGreaterThan(0)
  })

  it("should display duration when available", () => {
    render(<PipelineSteps steps={mockSteps} />)
    expect(screen.getByText(/Duration:/)).toBeInTheDocument()
  })

  it("should handle error status", () => {
    const errorStep: PipelineStep[] = [
      {
        id: "step_error",
        name: "Error Step",
        status: "error",
        error: "Test error",
      },
    ]
    render(<PipelineSteps steps={errorStep} />)
    expect(screen.getByText("Test error")).toBeInTheDocument()
  })

  it("should handle undefined steps gracefully", () => {
    render(<PipelineSteps steps={undefined as unknown as PipelineStep[]} />)
    expect(screen.getByText("No steps available")).toBeInTheDocument()
  })
})
