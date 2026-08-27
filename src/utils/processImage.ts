export function applyCardEffect(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const pad = 28
      const radius = 12
      const shadowBlur = 16

      const canvas = document.createElement('canvas')
      canvas.width = img.width + pad * 2 + shadowBlur
      canvas.height = img.height + pad * 2 + shadowBlur
      const ctx = canvas.getContext('2d')!

      // Gölge
      ctx.shadowColor = 'rgba(0,0,0,0.18)'
      ctx.shadowBlur = shadowBlur
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 4

      // Beyaz kart
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      const x = shadowBlur / 2
      const y = shadowBlur / 2
      const w = img.width + pad * 2
      const h = img.height + pad * 2
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + w - radius, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
      ctx.lineTo(x + w, y + h - radius)
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
      ctx.lineTo(x + radius, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()

      // Görseli kartın içine çiz
      ctx.shadowColor = 'transparent'
      ctx.drawImage(img, x + pad, y + pad, img.width, img.height)

      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = imageUrl
  })
}
