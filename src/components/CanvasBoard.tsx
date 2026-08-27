import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { fabric } from 'fabric'

function addDeleteControl() {
  fabric.Object.prototype.controls.deleteControl = new fabric.Control({
    x: 0.5,
    y: -0.5,
    offsetX: 12,
    offsetY: -12,
    cursorStyle: 'pointer',
    mouseUpHandler: (_e, transform) => {
      const target = transform.target
      target.canvas?.remove(target)
      target.canvas?.requestRenderAll()
      return true
    },
    render: (ctx, left, top) => {
      const size = 22
      ctx.save()
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(left, top, size / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('×', left, top)
      ctx.restore()
    },
  })
}

export interface CanvasBoardHandle {
  addImage: (url: string) => void
  getJSON: () => string
  loadJSON: (json: string) => void
}

interface CanvasBoardProps {
  scale: number
}

export const CanvasBoard = forwardRef<CanvasBoardHandle, CanvasBoardProps>(
  ({ scale }, ref) => {
    const canvasElRef = useRef<HTMLCanvasElement>(null)
    const fabricRef = useRef<fabric.Canvas | null>(null)

    useImperativeHandle(ref, () => ({
      getJSON: () => {
        const canvas = fabricRef.current
        if (!canvas) return ''
        return JSON.stringify(canvas.toJSON())
      },
      loadJSON: (json: string) => {
        const canvas = fabricRef.current
        if (!canvas) return
        if (!json) {
          canvas.clear()
          canvas.setBackgroundColor('#ffffff', () => canvas.renderAll())
          return
        }
        canvas.loadFromJSON(JSON.parse(json), () => canvas.renderAll())
      },
      addImage: (url: string) => {
        const canvas = fabricRef.current
        if (!canvas) return
        fabric.Image.fromURL(
          url,
          (img: fabric.Image) => {
            const maxSize = 200
            const s = Math.min(maxSize / (img.width ?? 1), maxSize / (img.height ?? 1))
            // Merkezine ekle
            img.set({
              left: 794 / 2 - (img.width! * s) / 2,
              top: 1123 / 2 - (img.height! * s) / 2,
              scaleX: s,
              scaleY: s,
              cornerSize: 10,
              cornerColor: '#6366f1',
              cornerStrokeColor: '#ffffff',
              transparentCorners: false,
              borderColor: '#6366f1',
              borderScaleFactor: 1.5,
            })
            canvas.add(img)
            canvas.setActiveObject(img)
            canvas.renderAll()
          },
          { crossOrigin: 'anonymous' }
        )
      },
    }))

    useEffect(() => {
      if (!canvasElRef.current || fabricRef.current) return
      addDeleteControl()
      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: 794,
        height: 1123,
        backgroundColor: '#ffffff',
        selection: true,
      })
      fabricRef.current = canvas
      return () => { canvas.dispose(); fabricRef.current = null }
    }, [])

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
      e.preventDefault()
      const imageUrl = e.dataTransfer.getData('imageUrl')
      if (!imageUrl || !fabricRef.current) return
      const canvas = fabricRef.current
      const rect = canvasElRef.current!.getBoundingClientRect()
      const dropX = (e.clientX - rect.left) / scale
      const dropY = (e.clientY - rect.top) / scale
      fabric.Image.fromURL(
        imageUrl,
        (img: fabric.Image) => {
          const maxSize = 200
          const s = Math.min(maxSize / (img.width ?? 1), maxSize / (img.height ?? 1))
          img.set({
            left: dropX - (img.width! * s) / 2,
            top: dropY - (img.height! * s) / 2,
            scaleX: s,
            scaleY: s,
            cornerSize: 10,
            cornerColor: '#6366f1',
            cornerStrokeColor: '#ffffff',
            transparentCorners: false,
            borderColor: '#6366f1',
            borderScaleFactor: 1.5,
          })
          canvas.add(img)
          canvas.setActiveObject(img)
          canvas.renderAll()
        },
        { crossOrigin: 'anonymous' }
      )
    }

    function handleKeyDown(e: React.KeyboardEvent) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && fabricRef.current) {
        const active = fabricRef.current.getActiveObject()
        if (active) {
          fabricRef.current.remove(active)
          fabricRef.current.renderAll()
        }
      }
    }

    const W = 794
    const H = 1123

    return (
      <div className="flex flex-col items-center gap-3">
        <div className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase select-none">
          A4 — 210 × 297 mm
        </div>
        {/* Outer div layout boyutunu alıyor — flex container bunu ortalar */}
        <div
          style={{ width: W * scale, height: H * scale, position: 'relative', flexShrink: 0 }}
        >
          {/* Inner div gerçek canvas — origin top-left ile scale uygulanıyor */}
          <div
            className="outline-none ring-1 ring-gray-300"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
              boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.12)',
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <canvas ref={canvasElRef} />
          </div>
        </div>
      </div>
    )
  }
)
