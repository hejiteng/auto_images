export const circleIoU = (
  a: { x: number; y: number; r: number },
  b: { x: number; y: number; r: number }
): number => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance >= a.r + b.r) return 0

  const minR = Math.min(a.r, b.r)
  const maxR = Math.max(a.r, b.r)

  if (distance <= Math.abs(a.r - b.r)) {
    return (minR * minR) / (maxR * maxR)
  }

  return 1 - (distance / (a.r + b.r))
}

export const rectIoU = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): number => {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.w, b.x + b.w)
  const y2 = Math.min(a.y + a.h, b.y + b.h)

  const interArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  if (interArea === 0) return 0

  const aArea = a.w * a.h
  const bArea = b.w * b.h
  const unionArea = aArea + bArea - interArea

  return interArea / unionArea
}

export const MATCH_THRESHOLD = 0.5
