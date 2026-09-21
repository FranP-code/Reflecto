# Custom AI-Powered Shapes Implementation Guide

Based on my research of tldraw's documentation and architecture, here's a comprehensive step-by-step guide for implementing your AI-powered shapes system:

## **Core Implementation Strategy**

The implementation leverages tldraw's three key extension points:[1][2]
1. **Custom Shape Utils** - Define AI-powered shape behaviors and rendering
2. **Event System** - Handle file uploads and processing triggers  
3. **Binding System** - Create automatic connections between related shapes

## **Step 1: AI Image Upload Shape**

### **Basic Structure**
Create a custom shape that handles image uploads and displays OCR processing status. The shape extends `ShapeUtil<AIImageShape>` and uses `HTMLContainer` for rich UI components.[1]

**Key Features:**
- Visual image preview with processing status indicators
- Real-time status updates (idle → processing → completed)
- Integration with Hugging Face TrOCR models for text extraction
- Automatic creation of connected text result shapes

### **Shape Properties**
The shape stores essential data like `imageUrl`, `extractedText`, `processingStatus`, and metadata using tldraw's type-safe prop system with validators (`T.string`, `T.literalEnum`).

## **Step 2: AI Voice Note Shape** 

### **Voice Recording Integration**
Similar to the image shape but designed for audio files with speech-to-text processing. Features include:
- Audio player controls within the shape
- Recording duration display
- Real-time transcription status
- Integration with Hugging Face Whisper models

The shape uses the same architectural pattern but with audio-specific properties and UI components.

## **Step 3: Automatic Text Result Shapes**

### **Connected Results**
When AI processing completes, the system automatically creates `AITextResultShape` instances positioned adjacent to source shapes. These shapes:
- Display extracted/transcribed text with confidence scores
- Support manual editing of AI results
- Maintain source relationship metadata
- Use visual styling to indicate content type (OCR vs transcription)

## **Step 4: Knowledge Graph Connections**

### **Binding-Based Relationships**
Leveraging tldraw's binding system, the implementation creates automatic arrow connections between related shapes:[2]

**Connection Logic:**
- **Content Analysis**: Compare text content using similarity algorithms
- **Arrow Creation**: Use tldraw's arrow shapes with custom binding metadata  
- **Visual Coding**: Color-code arrows based on confidence levels
- **Relationship Types**: Store semantic relationship information in arrow metadata

### **Smart Connection Detection**
The system analyzes text content across all shapes to suggest connections:
- Keyword overlap similarity for basic relationships
- Vector embedding similarity for advanced semantic connections
- Confidence scoring to filter meaningful relationships
- Support for manual relationship overrides

## **Step 5: File Upload Integration**

### **Drag-and-Drop Processing**
The implementation hooks into tldraw's event system to handle file drops:[3]

```typescript
// File drop triggers automatic shape creation and AI```ocessing
const handleFileDrop = async (event: DragEvent) => {
  // Create appropriate AI shape based on file type
  // Trigger processing pipeline
  // Generate connected result shapes
}
```

**Processing Pipeline:**
1. **File Detection** - Identify image vs audio files
2. **Shape Creation** - Instantiate appropriate AI shape type
3. **AI Processing** - Call Hugging Face APIs for content extraction
4. **Result Generation** - Create connected text result shapes  
5. **Connection Analysis** - Automatically suggest relationships with existing content

## **Step 6: Knowledge Graph Management**

### **Relationship Management System**
A dedicated `KnowledgeGraphManager` class handles:
- **Connection Creation**: Programmatically create arrow bindings between shapes
- **Similarity Analysis**: Calculate content relationships using text analysis
- **Intermediate Shapes**: Generate analysis shapes that summarize multiple related concepts
- **Visual Organization**: Position related content clusters for optimal layout

### **Advanced Features**
- **Batch Processing**: Analyze multiple shapes simultaneously for comprehensive relationship mapping
- **Confidence Scoring**: Weight connections based on content similarity strength
- **Relationship Types**: Support different connection semantics (extracts, analyzes, relates_to)
- **Interactive Editing**: Allow manual adjustment of AI-generated connections

## **Implementation Benefits**

This approach provides several advantages:

**Visual Processing**: All AI operations happen directly on the infinite canvas with real-time visual feedback[4][1]

**Extensible Architecture**: The shape-based system easily accommodates new AI processing types[1]

**Persistent Relationships**: Connections are stored as first-class tldraw objects with full undo/redo support[2]

**Integration Ready**: Direct compatibility with Appwrite for data persistence and Hugging Face for AI processing

The implementation creates a seamless knowledge capture and organization system where users can drop files onto the canvas and immediately see AI processing results with automatic relationship detection, perfectly aligning with your design document requirements.

[1](https://tldraw.dev/examples/custom-shape)
[2](https://tldraw.dev/examples/pin-bindings)
[3](https://tldraw.dev/examples/ui-events)
[4](https://tldraw.dev/reference/editor/HTMLContainer)
[5](https://tldraw.dev/examples/basic)
[6](https://github.com/tldraw/tldraw/issues/378)
[7](https://tldraw.dev/examples/custom-config)
[8](https://tldraw.dev/releases/v2.2.0)
[9](https://www.youtube.com/watch?v=gh6SSl1PJD4)
[10](https://javascript.plainenglish.io/integrating-tldraw-with-angular-0410d841dc51)
[11](https://www.yfiles.com/demos/tutorial-style-implementation-node/02-create-a-custom-shape/)
[12](https://www.dhiwise.com/post/Empowering%20Designers:%20The%20Impact%20of%20tldraw%20on%20Web%20Development)
[13](https://tldraw.substack.com/p/release-notes-february-10th-2023)
[14](https://www.youtube.com/watch?v=VB63abGBMPU)
[15](https://www.npmjs.com/package/@tldraw/core/v/0.1.19)
[16](https://stackoverflow.com/questions/17426613/kineticjs-draw-arrow-between-two-shapes)
[17](https://www.devtools.fm/episode/23)
[18](http://codesandbox.io/p/github/KooIaIa/tldraw-examples)
[19](https://github.com/tldraw/tldraw/issues/3838)
[20](https://examples.tldraw.com)
[21](https://examples.tldraw.com/custom-styles/full)

---

# Custom AI-Powered Shapes Implementation Guide

## Overview

This guide shows you how to implement three key AI-powered shapes in tldraw:
1. **AI Image Shape** - Upload images and get OCR text extraction
2. **AI Voice Shape** - Record voice notes and get speech-to-text transcription
3. **Knowledge Graph Connections** - Automatically connect related shapes

## Step 1: Basic AI Image Shape

### 1.1 Define the Shape Type

```typescript
import {
  TLBaseShape,
  ShapeUtil,
  HTMLContainer,
  Rectangle2d,
  RecordProps,
  T,
  createShapeId
} from 'tldraw'

// Define the AI Image shape type
type AIImageShape = TLBaseShape<'ai-image', {
  imageUrl: string
  extractedText: string
  processingStatus: 'idle' | 'processing' | 'completed' | 'error'
  filename: string
  uploadDate: number
}>
```

### 1.2 Create the Shape Util

```typescript
export class AIImageShapeUtil extends ShapeUtil<AIImageShape> {
  static override type = 'ai-image' as const
  
  static override props: RecordProps<AIImageShape> = {
    imageUrl: T.string,
    extractedText: T.string,
    processingStatus: T.literalEnum('idle', 'processing', 'completed', 'error'),
    filename: T.string,
    uploadDate: T.number
  }
  
  getDefaultProps(): AIImageShape['props'] {
    return {
      imageUrl: '',
      extractedText: '',
      processingStatus: 'idle',
      filename: '',
      uploadDate: Date.now()
    }
  }
  
  override canEdit() {
    return false
  }
  
  override canResize() {
    return true
  }
  
  getGeometry(shape: AIImageShape) {
    return new Rectangle2d({
      width: 300,
      height: 200,
      isFilled: true
    })
  }
  
  component(shape: AIImageShape) {
    return (
      <HTMLContainer>
        <div className="ai-image-container" style={{
          width: '100%',
          height: '100%',
          border: '2px solid #e1e5e9',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#f8f9fa'
        }}>
          {/* Image Display */}
          {shape.props.imageUrl && (
            <img 
              src={shape.props.imageUrl} 
              alt={shape.props.filename}
              style={{
                width: '100%',
                height: '60%',
                objectFit: 'cover'
              }}
            />
          )}
          
          {/* Processing Status */}
          <div className="status-bar" style={{
            padding: '8px',
            backgroundColor: shape.props.processingStatus === 'processing' ? '#fff3cd' : 
                           shape.props.processingStatus === 'completed' ? '#d1edff' : 
                           shape.props.processingStatus === 'error' ? '#f8d7da' : '#e9ecef',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {shape.props.processingStatus === 'processing' && '🔄 Processing with OCR...'}
            {shape.props.processingStatus === 'completed' && '✅ Text extracted'}
            {shape.props.processingStatus === 'error' && '❌ Processing failed'}
            {shape.props.processingStatus === 'idle' && '⏳ Ready for processing'}
          </div>
          
          {/* Extracted Text Preview */}
          {shape.props.extractedText && (
            <div style={{
              padding: '8px',
              fontSize: '11px',
              color: '#6c757d',
              height: '30%',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              <strong>Extracted:</strong> {shape.props.extractedText.substring(0, 100)}...
            </div>
          )}
        </div>
      </HTMLContainer>
    )
  }
  
  indicator(shape: AIImageShape) {
    return <rect width={300} height={200} />
  }
}
```

## Step 2: AI Voice Note Shape

### 2.1 Define Voice Shape Type

```typescript
type AIVoiceShape = TLBaseShape<'ai-voice', {
  audioUrl: string
  transcription: string
  duration: number
  processingStatus: 'idle' | 'recording' | 'processing' | 'completed' | 'error'
  recordedDate: number
}>
```

### 2.2 Create Voice Shape Util

```typescript
export class AIVoiceShapeUtil extends ShapeUtil<AIVoiceShape> {
  static override type = 'ai-voice' as const
  
  static override props: RecordProps<AIVoiceShape> = {
    audioUrl: T.string,
    transcription: T.string,
    duration: T.number,
    processingStatus: T.literalEnum('idle', 'recording', 'processing', 'completed', 'error'),
    recordedDate: T.number
  }
  
  getDefaultProps(): AIVoiceShape['props'] {
    return {
      audioUrl: '',
      transcription: '',
      duration: 0,
      processingStatus: 'idle',
      recordedDate: Date.now()
    }
  }
  
  getGeometry(shape: AIVoiceShape) {
    return new Rectangle2d({
      width: 250,
      height: 120,
      isFilled: true
    })
  }
  
  component(shape: AIVoiceShape) {
    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    
    return (
      <HTMLContainer>
        <div className="ai-voice-container" style={{
          width: '100%',
          height: '100%',
          border: '2px solid #e1e5e9',
          borderRadius: '8px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Voice Icon and Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ fontSize: '24px' }}>
              {shape.props.processingStatus === 'recording' ? '🔴' : 
               shape.props.processingStatus === 'processing' ? '🔄' : 
               shape.props.processingStatus === 'completed' ? '🎵' : '🎤'}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                Voice Note
              </div>
              <div style={{ fontSize: '10px', color: '#6c757d' }}>
                {shape.props.duration > 0 && formatDuration(shape.props.duration)}
              </div>
            </div>
          </div>
          
          {/* Audio Player */}
          {shape.props.audioUrl && (
            <audio 
              controls 
              style={{ width: '100%', height: '32px' }}
              src={shape.props.audioUrl}
            />
          )}
          
          {/* Transcription */}
          {shape.props.transcription && (
            <div style={{
              fontSize: '11px',
              color: '#495057',
              backgroundColor: '#ffffff',
              padding: '6px',
              borderRadius: '4px',
              flex: 1,
              overflow: 'auto'
            }}>
              <strong>Transcription:</strong><br />
              {shape.props.transcription}
            </div>
          )}
          
          {/* Status */}
          <div style={{
            fontSize: '10px',
            color: '#6c757d',
            textAlign: 'center'
          }}>
            {shape.props.processingStatus === 'recording' && 'Recording...'}
            {shape.props.processingStatus === 'processing' && 'Transcribing...'}
            {shape.props.processingStatus === 'completed' && 'Ready'}
            {shape.props.processingStatus === 'error' && 'Error occurred'}
          </div>
        </div>
      </HTMLContainer>
    )
  }
  
  indicator(shape: AIVoiceShape) {
    return <rect width={250} height={120} />
  }
}
```

## Step 3: Text Result Shape

### 3.1 Define Text Result Shape

```typescript
type AITextResultShape = TLBaseShape<'ai-text-result', {
  content: string
  sourceType: 'image' | 'voice' | 'analysis'
  sourceShapeId: string
  confidence: number
  createdDate: number
}>

export class AITextResultShapeUtil extends ShapeUtil<AITextResultShape> {
  static override type = 'ai-text-result' as const
  
  static override props: RecordProps<AITextResultShape> = {
    content: T.string,
    sourceType: T.literalEnum('image', 'voice', 'analysis'),
    sourceShapeId: T.string,
    confidence: T.number,
    createdDate: T.number
  }
  
  getDefaultProps(): AITextResultShape['props'] {
    return {
      content: '',
      sourceType: 'image',
      sourceShapeId: '',
      confidence: 0,
      createdDate: Date.now()
    }
  }
  
  override canEdit() {
    return true // Allow editing the extracted text
  }
  
  getGeometry(shape: AITextResultShape) {
    return new Rectangle2d({
      width: 280,
      height: 150,
      isFilled: true
    })
  }
  
  component(shape: AITextResultShape) {
    return (
      <HTMLContainer>
        <div style={{
          width: '100%',
          height: '100%',
          border: '2px solid #28a745',
          borderRadius: '8px',
          padding: '12px',
          backgroundColor: '#ffffff',
          fontSize: '12px'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            paddingBottom: '4px',
            borderBottom: '1px solid #e9ecef'
          }}>
            <span style={{ fontWeight: 'bold', color: '#28a745' }}>
              {shape.props.sourceType === 'image' ? '📄 OCR Result' : 
               shape.props.sourceType === 'voice' ? '🎤 Transcription' : 
               '🧠 AI Analysis'}
            </span>
            <span style={{ fontSize: '10px', color: '#6c757d' }}>
              {Math.round(shape.props.confidence * 100)}%
            </span>
          </div>
          
          {/* Content */}
          <div style={{
            height: 'calc(100% - 40px)',
            overflow: 'auto',
            lineHeight: '1.4',
            color: '#495057'
          }}>
            {shape.props.content || 'No content extracted'}
          </div>
        </div>
      </HTMLContainer>
    )
  }
  
  indicator(shape: AITextResultShape) {
    return <rect width={280} height={150} />
  }
}
```

## Step 4: Knowledge Graph Connection System

### 4.1 Create Connection Manager

```typescript
export class KnowledgeGraphManager {
  constructor(private editor: any) {}
  
  // Create a connection arrow between two shapes
  createConnection(
    fromShapeId: string, 
    toShapeId: string, 
    relationshipType: string,
    confidence: number = 0.8
  ) {
    const arrowId = createShapeId()
    
    this.editor.createShape({
      id: arrowId,
      type: 'arrow',
      props: {
        start: { type: 'binding', boundShapeId: fromShapeId },
        end: { type: 'binding', boundShapeId: toShapeId },
        text: relationshipType,
        color: confidence > 0.8 ? 'blue' : confidence > 0.6 ? 'orange' : 'gray'
      },
      meta: {
        relationshipType,
        confidence,
        aiGenerated: true,
        createdAt: Date.now()
      }
    })
    
    return arrowId
  }
  
  // Analyze content similarity and suggest connections
  async analyzeConnections(shapeId: string) {
    const shape = this.editor.getShape(shapeId)
    if (!shape) return
    
    // Get all text-based shapes on the canvas
    const allShapes = this.editor.getCurrentPageShapes()
    const textShapes = allShapes.filter(s => 
      (s.type === 'ai-text-result' || s.type === 'text') && 
      s.id !== shapeId
    )
    
    // Simple keyword-based similarity (you can replace with vector similarity)
    const currentContent = this.extractTextContent(shape)
    if (!currentContent) return
    
    for (const otherShape of textShapes) {
      const otherContent = this.extractTextContent(otherShape)
      if (!otherContent) continue
      
      const similarity = this.calculateTextSimilarity(currentContent, otherContent)
      
      if (similarity > 0.3) {
        this.createConnection(
          shapeId, 
          otherShape.id, 
          'related_content',
          similarity
        )
      }
    }
  }
  
  private extractTextContent(shape: any): string {
    if (shape.type === 'ai-text-result') {
      return shape.props.content
    } else if (shape.type === 'ai-image') {
      return shape.props.extractedText
    } else if (shape.type === 'ai-voice') {
      return shape.props.transcription
    } else if (shape.type === 'text') {
      return shape.props.text
    }
    return ''
  }
  
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple keyword overlap similarity
    const words1 = text1.toLowerCase().split(/\s+/)
    const words2 = text2.toLowerCase().split(/\s+/)
    
    const intersection = words1.filter(word => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]
    
    return intersection.length / union.length
  }
  
  // Create intermediate analysis shapes
  createAnalysisShape(
    relatedShapeIds: string[],
    analysisContent: string,
    position: { x: number, y: number }
  ) {
    const analysisId = createShapeId()
    
    this.editor.createShape({
      id: analysisId,
      type: 'ai-text-result',
      x: position.x,
      y: position.y,
      props: {
        content: analysisContent,
        sourceType: 'analysis',
        sourceShapeId: relatedShapeIds.join(','),
        confidence: 0.9,
        createdDate: Date.now()
      }
    })
    
    // Connect the analysis shape to all related shapes
    relatedShapeIds.forEach(shapeId => {
      this.createConnection(shapeId, analysisId, 'analyzes', 0.9)
    })
    
    return analysisId
  }
}
```

## Step 5: AI Processing Functions

### 5.1 OCR Processing

```typescript
export async function processImageWithOCR(
  editor: any,  
  shapeId: string, 
  imageFile: File
): Promise<void> {
  // Update status to processing
  editor.updateShape({
    id: shapeId,
    type: 'ai-image',
    props: { processingStatus: 'processing' }
  })
  
  try {
    // Use Hugging Face TrOCR
    const response = await fetch(
      'https://api-inference.huggingface.co/models/microsoft/trocr-base-handwritten',
      {
        headers: { 
          'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}` 
        },
        method: 'POST',
        body: imageFile
      }
    )
    
    const result = await response.json()
    const extractedText = result[0]?.generated_text || ''
    
    // Update the image shape
    editor.updateShape({
      id: shapeId,
      type: 'ai-image',
      props: {
        extractedText,
        processingStatus: 'completed'
      }
    })
    
    // Create a text result shape
    const textShapeId = createShapeId()
    const imageShape = editor.getShape(shapeId)
    
    editor.createShape({
      id: textShapeId,
      type: 'ai-text-result',
      x: imageShape.x + 320, // Position to the right
      y: imageShape.y,
      props: {
        content: extractedText,
        sourceType: 'image',
        sourceShapeId: shapeId,
        confidence: 0.85,
        createdDate: Date.now()
      }
    })
    
    // Create connection arrow
    const kgManager = new KnowledgeGraphManager(editor)
    kgManager.createConnection(shapeId, textShapeId, 'extracts_text', 0.95)
    
    // Analyze for other connections
    await kgManager.analyzeConnections(textShapeId)
    
  } catch (error) {
    editor.updateShape({
      id: shapeId,
      type: 'ai-image',
      props: { processingStatus: 'error' }
    })
  }
}
```

### 5.2 Speech-to-Text Processing

```typescript
export async function processVoiceWithSTT(
  editor: any,
  shapeId: string,
  audioFile: File
): Promise<void> {
  editor.updateShape({
    id: shapeId,
    type: 'ai-voice',
    props: { processingStatus: 'processing' }
  })
  
  try {
    // Use Hugging Face Whisper model
    const response = await fetch(
      'https://api-inference.huggingface.co/models/openai/whisper-base',
      {
        headers: { 
          'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}` 
        },
        method: 'POST',
        body: audioFile
      }
    )
    
    const result = await response.json()
    const transcription = result.text || ''
    
    // Update voice shape
    editor.updateShape({
      id: shapeId,
      type: 'ai-voice',
      props: {
        transcription,
        processingStatus: 'completed'
      }
    })
    
    // Create text result shape
    const textShapeId = createShapeId()
    const voiceShape = editor.getShape(shapeId)
    
    editor.createShape({
      id: textShapeId,
      type: 'ai-text-result',
      x: voiceShape.x + 270,
      y: voiceShape.y,
      props: {
        content: transcription,
        sourceType: 'voice',
        sourceShapeId: shapeId,
        confidence: 0.9,
        createdDate: Date.now()
      }
    })
    
    // Create connection
    const kgManager = new KnowledgeGraphManager(editor)
    kgManager.createConnection(shapeId, textShapeId, 'transcribes_to', 0.95)
    
    // Analyze connections
    await kgManager.analyzeConnections(textShapeId)
    
  } catch (error) {
    editor.updateShape({
      id: shapeId,
      type: 'ai-voice',
      props: { processingStatus: 'error' }
    })
  }
}
```

## Step 6: File Upload Integration

### 6.1 Setup File Drop Handler

```typescript
export function setupFileDropHandler(editor: any) {
  const container = editor.getContainer()
  
  const handleDrop = async (event: DragEvent) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer?.files || [])
    const dropPoint = editor.screenToPage({ 
      x: event.clientX, 
      y: event.clientY 
    })
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await handleImageDrop(editor, file, dropPoint)
      } else if (file.type.startsWith('audio/')) {
        await handleAudioDrop(editor, file, dropPoint)
      }
    }
  }
  
  container.addEventListener('dragover', (e: DragEvent) => e.preventDefault())
  container.addEventListener('drop', handleDrop)
}

async function handleImageDrop(editor: any, file: File, position: any) {
  const shapeId = createShapeId()
  const imageUrl = URL.createObjectURL(file)
  
  // Create image shape
  editor.createShape({
    id: shapeId,
    type: 'ai-image',
    x: position.x,
    y: position.y,
    props: {
      imageUrl,
      filename: file.name,
      uploadDate: Date.now(),
      processingStatus: 'idle'
    }
  })
  
  // Start OCR processing
  await processImageWithOCR(editor, shapeId, file)
}

async function handleAudioDrop(editor: any, file: File, position: any) {
  const shapeId = createShapeId()
  const audioUrl = URL.createObjectURL(file)
  
  // Create voice shape
  editor.createShape({
    id: shapeId,
    type: 'ai-voice',
    x: position.x,
    y: position.y,
    props: {
      audioUrl,
      duration: 0, // Will be set after loading
      recordedDate: Date.now(),
      processingStatus: 'idle'
    }
  })
  
  // Start transcription
  await processVoiceWithSTT(editor, shapeId, file)
}
```

## Step 7: Main Application Setup

### 7.1 Complete Tldraw Setup

```typescript
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

const customShapeUtils = [
  AIImageShapeUtil,
  AIVoiceShapeUtil,
  AITextResultShapeUtil
]

export default function AIKnowledgeCanvas() {
  return (
    <div className="tldraw__editor" style={{ height: '100vh' }}>
      <Tldraw
        shapeUtils={customShapeUtils}
        onMount={(editor) => {
          // Setup file drop handling
          setupFileDropHandler(editor)
          
          // Initialize knowledge graph manager
          const kgManager = new KnowledgeGraphManager(editor)
          
          // Store reference for global access
          ;(window as any).editor = editor
          ;(window as any).kgManager = kgManager
        }}
      />
    </div>
  )
}
```

## Usage Instructions

1. **Image Upload**: Drag and drop images onto the canvas - they'll automatically create AI Image shapes and process with OCR
2. **Voice Notes**: Drop audio files to create Voice Note shapes with speech-to-text processing  
3. **Text Results**: Both processing types create connected Text Result shapes showing extracted content
4. **Knowledge Connections**: The system automatically analyzes content similarity and creates connecting arrows between related shapes
5. **Manual Connections**: You can manually create arrows between shapes to establish custom relationships

This implementation provides a complete foundation for AI-powered knowledge capture and organization on an infinite canvas, with automatic processing and intelligent connection suggestions.