"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, GripHorizontal } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SignatureFieldProps {
  id: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  scale: number
  onUpdate: (position: { x: number; y: number }, size: { width: number; height: number }) => void
  onDelete: () => void
}

export function SignatureField({ id, position, size, scale, onUpdate, onDelete }: SignatureFieldProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const fieldRef = useRef<HTMLDivElement>(null)

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  // Handle resizing
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = (e.clientX - dragStart.x) / scale
        const dy = (e.clientY - dragStart.y) / scale

        const newPosition = {
          x: position.x + dx,
          y: position.y + dy,
        }

        onUpdate(newPosition, size)
        setDragStart({ x: e.clientX, y: e.clientY })
      } else if (isResizing) {
        const dx = (e.clientX - resizeStart.x) / scale
        const dy = (e.clientY - resizeStart.y) / scale

        const newSize = {
          width: Math.max(100, resizeStart.width + dx),
          height: Math.max(40, resizeStart.height + dy),
        }

        onUpdate(position, newSize)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isResizing, dragStart, resizeStart, position, size, onUpdate, scale])

  return (
    <div
      ref={fieldRef}
      className="absolute border-2 border-dashed border-primary bg-primary/10 rounded-md flex flex-col justify-center items-center cursor-move"
      style={{
        left: position.x * scale,
        top: position.y * scale,
        width: size.width * scale,
        height: size.height * scale,
        transform: "translate(0, 0)",
      }}
      onMouseDown={handleMouseDown}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-1 transform translate-x-1/2 -translate-y-1/2 hover:bg-destructive/90 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Remove signature field</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="text-center pointer-events-none">
        <p className="font-medium text-primary">Signature Required</p>
        <p className="text-xs text-primary/70">Drag to move</p>
      </div>

      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-primary cursor-se-resize transform translate-x-1/2 translate-y-1/2 rounded-sm"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  )
}

