export interface Annotation {
  id: string
  imageId: string
  shape: 'circle' | 'rect' | 'polygon'
  coords: CircleCoords | RectCoords
  answer: string
  category: string
  severity: 'minor' | 'major' | 'critical'
  explanation: string
}

export interface CircleCoords {
  x: number
  y: number
  radius: number
}

export interface RectCoords {
  x: number
  y: number
  width: number
  height: number
}

export interface UserAnnotation {
  id: string
  shape: 'circle' | 'rect'
  coords: CircleCoords | RectCoords
  timestamp: number
}

export interface PracticeResult {
  imageId: string
  userAnnotations: UserAnnotation[]
  correctHits: number
  missedAnnotations: Annotation[]
  falsePositives: UserAnnotation[]
  score: number
  timeSpent: number
}
