"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { AlertTriangle, CheckCircle, Upload } from "lucide-react"

interface SRTSegment {
  index: number
  startTime: number
  endTime: number
  text: string
  startTimeString: string
  endTimeString: string
}

interface Overlap {
  segmentIndex: number
  nextSegmentIndex: number
  overlapDuration: number
}

export default function SRTOverlapChecker() {
  const [srtContent, setSrtContent] = useState(`1
00:00:02,480 --> 00:00:02,980
Okay.

2
00:00:03,120 --> 00:00:09,519
So we're going to navigate this, to sort of show where where we go with this.

3
00:00:09,519 --> 00:00:09,839
Okay.

4
00:00:09,839 --> 00:00:11,759
So here's a domain that I've got.

5
00:00:11,759 --> 00:00:14,255
It's called Casa de SaaS.

6
00:00:14,255 --> 00:00:14,574
Right?

7
00:00:14,574 --> 00:00:15,554
The house of SaaS.`)
  const [segments, setSegments] = useState<SRTSegment[]>([])
  const [overlaps, setOverlaps] = useState<Overlap[]>([])
  const [isAnalyzed, setIsAnalyzed] = useState(false)

  // Convert SRT timestamp to milliseconds
  const parseTimestamp = (timestamp: string): number => {
    const [time, ms] = timestamp.split(",")
    const [hours, minutes, seconds] = time.split(":").map(Number)
    return (hours * 3600 + minutes * 60 + seconds) * 1000 + Number(ms)
  }

  // Parse SRT content
  const parseSRT = (content: string): SRTSegment[] => {
    const blocks = content.trim().split(/\n\s*\n/)
    const segments: SRTSegment[] = []

    blocks.forEach((block) => {
      const lines = block.trim().split("\n")
      if (lines.length >= 3) {
        const index = Number.parseInt(lines[0])
        const timeRange = lines[1]
        const text = lines.slice(2).join("\n")

        const [startTimeString, endTimeString] = timeRange.split(" --> ")
        const startTime = parseTimestamp(startTimeString.trim())
        const endTime = parseTimestamp(endTimeString.trim())

        segments.push({
          index,
          startTime,
          endTime,
          text,
          startTimeString: startTimeString.trim(),
          endTimeString: endTimeString.trim(),
        })
      }
    })

    return segments.sort((a, b) => a.startTime - b.startTime)
  }

  // Check for overlaps
  const checkOverlaps = (segments: SRTSegment[]): Overlap[] => {
    const overlaps: Overlap[] = []

    for (let i = 0; i < segments.length - 1; i++) {
      const current = segments[i]
      const next = segments[i + 1]

      if (current.endTime > next.startTime) {
        overlaps.push({
          segmentIndex: current.index,
          nextSegmentIndex: next.index,
          overlapDuration: current.endTime - next.startTime,
        })
      }
    }

    return overlaps
  }

  const analyzeSRT = () => {
    if (!srtContent.trim()) return

    const parsedSegments = parseSRT(srtContent)
    const foundOverlaps = checkOverlaps(parsedSegments)

    setSegments(parsedSegments)
    setOverlaps(foundOverlaps)
    setIsAnalyzed(true)
  }

  const formatDuration = (ms: number): string => {
    return `${ms}ms`
  }

  const isOverlapping = (segmentIndex: number): boolean => {
    return overlaps.some(
      (overlap) => overlap.segmentIndex === segmentIndex || overlap.nextSegmentIndex === segmentIndex,
    )
  }

  return (
    <div className="h-screen w-full bg-gray-50">
      <div className="h-full p-4">
        <div className="text-center mb-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">SRT Overlap Checker</h1>
          <p className="text-sm text-gray-600">Paste your SRT content to check for timing overlaps</p>
        </div>

        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-120px)] rounded-lg border">
          {/* Left Panel - SRT Input */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col bg-white">
              <div className="p-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    SRT Content
                  </h2>
                  <Button onClick={analyzeSRT} disabled={!srtContent.trim()} size="sm">
                    Analyze SRT
                  </Button>
                </div>
                <p className="text-sm text-gray-600">Paste your SRT subtitle file content below</p>
              </div>
              <div className="flex-1 p-4 overflow-hidden">
                <Textarea
                  placeholder="Paste your SRT content here..."
                  value={srtContent}
                  onChange={(e) => setSrtContent(e.target.value)}
                  className="h-full font-mono text-sm resize-none"
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Results */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col bg-white">
              <div className="p-4 border-b flex-shrink-0">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {overlaps.length > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  Analysis Results
                </h2>
                {isAnalyzed && (
                  <div className="flex items-center gap-4 mt-2">
                    <div className="text-sm text-gray-600">
                      Total Segments: <span className="font-semibold">{segments.length}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Collision Count:
                      <Badge variant={overlaps.length > 0 ? "destructive" : "secondary"} className="ml-2">
                        {overlaps.length}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto p-4">
                  {!isAnalyzed ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Click "Analyze SRT" to check for overlaps
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {overlaps.length > 0 && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <AlertDescription className="text-red-700">
                            Found {overlaps.length} timing overlap{overlaps.length !== 1 ? "s" : ""}. Check the
                            highlighted segments below.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        {segments.map((segment) => (
                          <div
                            key={segment.index}
                            className={`p-3 rounded-lg border ${
                              isOverlapping(segment.index) ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-sm">#{segment.index}</span>
                              <span className="text-xs font-mono text-gray-600">
                                {segment.startTimeString} → {segment.endTimeString}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800">{segment.text}</p>
                            {isOverlapping(segment.index) && (
                              <div className="mt-2">
                                {overlaps
                                  .filter(
                                    (overlap) =>
                                      overlap.segmentIndex === segment.index ||
                                      overlap.nextSegmentIndex === segment.index,
                                  )
                                  .map((overlap, idx) => (
                                    <Badge key={idx} variant="destructive" className="text-xs">
                                      Overlap: {formatDuration(overlap.overlapDuration)}
                                      with #
                                      {overlap.segmentIndex === segment.index
                                        ? overlap.nextSegmentIndex
                                        : overlap.segmentIndex}
                                    </Badge>
                                  ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
