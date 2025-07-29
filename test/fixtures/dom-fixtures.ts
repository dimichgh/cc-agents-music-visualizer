/**
 * DOM testing utilities and fixtures
 */

/**
 * Setup DOM environment for testing
 */
export function setupDOMEnvironment(): void {
  // Create document mock if not available
  if (typeof document === 'undefined') {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable',
    });
    
    global.document = dom.window.document;
    global.window = dom.window as any;
    global.HTMLElement = dom.window.HTMLElement;
    global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
    global.CanvasRenderingContext2D = dom.window.CanvasRenderingContext2D;
  }
}

/**
 * Create a mock canvas element
 */
export function createMockCanvas(width: number = 800, height: number = 600): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Mock getContext method with proper typing
  const originalGetContext = canvas.getContext.bind(canvas);
  (canvas.getContext as any) = (contextType: string, options?: any) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return createMockWebGLContext();
    }
    if (contextType === '2d') {
      return createMockCanvasContext2D();
    }
    return originalGetContext(contextType, options);
  };
  
  return canvas;
}

/**
 * Create a mock WebGL context
 */
export function createMockWebGLContext(): WebGLRenderingContext {
  return new (global as any).WebGLRenderingContext();
}

/**
 * Create a mock 2D canvas context
 */
export function createMockCanvasContext2D(): CanvasRenderingContext2D {
  return {
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    setTransform: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    putImageData: () => {},
    createImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    measureText: () => ({ width: 100, height: 12 }),
    fillText: () => {},
    strokeText: () => {},
    canvas: {} as HTMLCanvasElement,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
  } as any;
}

/**
 * Create a mock file input element
 */
export function createMockFileInput(): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.wav,.mp3,.flac';
  
  // Mock file selection
  Object.defineProperty(input, 'files', {
    get: () => new FileList(),
    set: (files: FileList) => {
      Object.defineProperty(input, 'files', { value: files });
    },
  });
  
  return input;
}

/**
 * Create mock file objects
 */
export function createMockFile(
  name: string = 'test.wav',
  size: number = 1024000,
  type: string = 'audio/wav'
): File {
  const file = new (global as any).File([new ArrayBuffer(size)], name, { type });
  return file;
}

/**
 * Create a mock FileList
 */
export function createMockFileList(files: File[]): FileList {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
  };
  
  // Add file indices without spreading to avoid length conflict
  files.forEach((file, index) => {
    (fileList as any)[index] = file;
  });
  
  return fileList as FileList;
}

/**
 * Setup event mocking utilities
 */
export function createMockEvent(type: string, options: any = {}): Event {
  const event = new Event(type, { bubbles: true, cancelable: true, ...options });
  
  // Add common properties that might be missing
  Object.defineProperty(event, 'target', {
    value: options.target || null,
    writable: false,
  });
  
  Object.defineProperty(event, 'currentTarget', {
    value: options.currentTarget || options.target || null,
    writable: false,
  });
  
  return event;
}

/**
 * Create a mock keyboard event
 */
export function createMockKeyboardEvent(
  type: string,
  key: string,
  options: any = {}
): KeyboardEvent {
  const event = new KeyboardEvent(type, {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  
  return event;
}

/**
 * Create a mock mouse event
 */
export function createMockMouseEvent(
  type: string,
  x: number = 0,
  y: number = 0,
  options: any = {}
): MouseEvent {
  const event = new MouseEvent(type, {
    clientX: x,
    clientY: y,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  
  return event;
}

/**
 * Mock drag and drop events
 */
export function createMockDragEvent(
  type: string,
  files: File[] = [],
  options: any = {}
): DragEvent {
  const event = new DragEvent(type, {
    bubbles: true,
    cancelable: true,
    ...options,
  });
  
  // Mock dataTransfer
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files: createMockFileList(files),
      items: files.map(file => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file,
      })),
      types: ['Files'],
      effectAllowed: 'all',
      dropEffect: 'copy',
      getData: () => '',
      setData: () => {},
      clearData: () => {},
    },
    writable: false,
  });
  
  return event;
}

/**
 * Create container element for component testing
 */
export function createTestContainer(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'test-container';
  document.body.appendChild(container);
  return container;
}

/**
 * Clean up test container
 */
export function cleanupTestContainer(): void {
  const container = document.getElementById('test-container');
  if (container) {
    container.remove();
  }
}

/**
 * Wait for next animation frame (mocked)
 */
export function waitForAnimationFrame(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => resolve());
  });
}

/**
 * Wait for DOM mutations
 */
export function waitForDOMUpdate(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}