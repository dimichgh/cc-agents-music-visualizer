// Music Visualizer - UI Component Types

export interface CosmicComponent {
  element: HTMLElement;
  isVisible: boolean;
  isEnabled: boolean;
  destroy(): void;
  render(): HTMLElement;
  show(): void;
  hide(): void;
  enable(): void;
  disable(): void;
}

export interface EventEmitter {
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
}

// Button Types
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon-only';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonOptions {
  text?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  disabled?: boolean;
  ariaLabel?: string;
  onClick?: (event: MouseEvent) => void;
}

// Input Types
export type InputType = 'text' | 'number' | 'email' | 'password' | 'search';
export type InputSize = 'compact' | 'medium' | 'large';

export interface InputOptions {
  type?: InputType;
  placeholder?: string;
  value?: string;
  size?: InputSize;
  disabled?: boolean;
  required?: boolean;
  ariaLabel?: string;
  onChange?: (value: string, event: Event) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
}

// Range Slider Types
export interface RangeOptions {
  min?: number;
  max?: number;
  value?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  ariaLabel?: string;
  onChange?: (value: number, event: Event) => void;
  onInput?: (value: number, event: Event) => void;
}

// Toggle Switch Types
export interface ToggleOptions {
  checked?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onChange?: (checked: boolean, event: Event) => void;
}

// Dropdown Types
export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownOptions {
  options: DropdownOption[];
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  onChange?: (value: string, option: DropdownOption, event: Event) => void;
}

// Progress Types
export interface ProgressOptions {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  ariaLabel?: string;
}

// Modal Types
export interface ModalOptions {
  title?: string;
  content?: string | HTMLElement;
  closable?: boolean;
  backdrop?: boolean;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  onClose?: () => void;
  onOpen?: () => void;
}

// Toast Notification Types
export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  closable?: boolean;
  action?: {
    text: string;
    handler: () => void;
  };
}

// Tab Types
export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  content?: HTMLElement;
  disabled?: boolean;
}

export interface TabsOptions {
  tabs: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string, tab: TabItem) => void;
}

// Container Types
export type ContainerVariant = 'default' | 'translucent' | 'solid' | 'glowing';

export interface ContainerOptions {
  variant?: ContainerVariant;
  padding?: string;
  interactive?: boolean;
  ariaLabel?: string;
}

// Audio Control Types
export interface AudioControlsOptions {
  duration?: number;
  currentTime?: number;
  volume?: number;
  muted?: boolean;
  playing?: boolean;
  loading?: boolean;
  fileName?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onSeek?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  onMute?: (muted: boolean) => void;
}

// Waveform Display Types
export interface WaveformData {
  peaks: number[];
  length: number;
  sampleRate: number;
}

export interface WaveformOptions {
  waveformData?: WaveformData;
  currentTime?: number;
  duration?: number;
  height?: number;
  interactive?: boolean;
  onSeek?: (time: number, percentage: number) => void;
}

// File Browser Types
export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  audioInfo?: {
    duration?: number;
    bitrate?: number;
    sampleRate?: number;
    channels?: number;
  };
}

export interface FileBrowserOptions {
  currentPath?: string;
  supportedExtensions?: string[];
  allowMultiple?: boolean;
  showHidden?: boolean;
  onFileSelect?: (files: FileItem[]) => void;
  onDirectoryChange?: (path: string) => void;
}

// Visualization Types
export interface VisualizationOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  responsive?: boolean;
  interactive?: boolean;
  onResize?: (width: number, height: number) => void;
}

// Settings Panel Types
export interface SettingsGroup {
  id: string;
  label: string;
  icon?: string;
  settings: SettingSetting[];
}

export interface SettingSetting {
  id: string;
  label: string;
  description?: string;
  type: 'boolean' | 'number' | 'string' | 'select' | 'color' | 'range';
  value: any;
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: any) => void;
}

export interface SettingsPanelOptions {
  groups: SettingsGroup[];
  collapsible?: boolean;
  searchable?: boolean;
  onSettingChange?: (settingId: string, value: any, groupId: string) => void;
}

// Loading State Types
export interface LoadingOptions {
  message?: string;
  progress?: number;
  cancelable?: boolean;
  onCancel?: () => void;
}

// Error State Types
export interface ErrorOptions {
  title?: string;
  message: string;
  details?: string;
  recoverable?: boolean;
  actions?: Array<{
    label: string;
    handler: () => void;
    variant?: ButtonVariant;
  }>;
}

// Accessibility Types
export interface AccessibilityOptions {
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaSelected?: boolean;
  ariaDisabled?: boolean;
  tabIndex?: number;
  focusable?: boolean;
}

// Keyboard Navigation
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
}

export interface KeyboardNavigationOptions {
  shortcuts?: KeyboardShortcut[];
  trapFocus?: boolean;
  autoFocus?: boolean;
  escapeHandler?: () => void;
}

// Theme Types
export type ThemeMode = 'cosmic' | 'cosmic-dark' | 'cosmic-high-contrast';

export interface ThemeOptions {
  mode: ThemeMode;
  customColors?: Record<string, string>;
  reducedMotion?: boolean;
  highContrast?: boolean;
}

// Animation Types
export type AnimationType = 'fade' | 'slide' | 'scale' | 'cosmic-warp' | 'energy-flow';

export interface AnimationOptions {
  type: AnimationType;
  duration?: number;
  easing?: string;
  delay?: number;
  onComplete?: () => void;
}

// Responsive Types
export interface BreakpointOptions {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

export interface ResponsiveOptions {
  breakpoints?: BreakpointOptions;
  mobileFirst?: boolean;
  onBreakpointChange?: (breakpoint: string, width: number) => void;
}

// Event Types
export interface ComponentEvent {
  type: string;
  target: CosmicComponent;
  data?: any;
  preventDefault?: () => void;
  stopPropagation?: () => void;
}

// Validation Types
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface ValidationOptions {
  rules: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showErrors?: boolean;
}

// Component State Types
export interface ComponentState {
  isVisible: boolean;
  isEnabled: boolean;
  isActive: boolean;
  isFocused: boolean;
  isHovered: boolean;
  hasError: boolean;
  isLoading: boolean;
  data?: any;
}

// Layout Types
export interface LayoutOptions {
  direction?: 'row' | 'column';
  wrap?: boolean;
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  gap?: string;
  padding?: string;
  margin?: string;
}

// Global App State Types
export interface AppState {
  theme: ThemeMode;
  audio: {
    playing: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    muted: boolean;
    currentFile?: FileItem;
  };
  visualization: {
    mode: string;
    effects: Record<string, any>;
  };
  ui: {
    sidebarOpen: boolean;
    settingsOpen: boolean;
    fullscreen: boolean;
  };
}