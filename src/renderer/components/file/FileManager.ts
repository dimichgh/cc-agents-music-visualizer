// Music Visualizer - File Management Component

import { BaseComponent } from '../base/BaseComponent';
import { CosmicButton } from '../ui/Button';
import { FileItem, FileBrowserOptions } from '../../types/ui-types';

export class FileManager extends BaseComponent {
  private _options: FileBrowserOptions;
  private _dropZone!: HTMLElement;
  private _fileList!: HTMLElement;
  private _toolbar!: HTMLElement;
  private _searchInput!: HTMLElement;
  private _currentPath: string;
  private _files: FileItem[] = [];
  private _selectedFiles: Set<string> = new Set();
  private _dragCounter: number = 0;

  constructor(options: FileBrowserOptions = {}) {
    super('div');
    this._options = {
      currentPath: '',
      supportedExtensions: ['.wav', '.mp3', '.flac', '.m4a', '.ogg', '.aac'],
      allowMultiple: false,
      showHidden: false,
      ...options
    };
    
    this._currentPath = this._options.currentPath || '';
    this.render();
  }

  protected override init(): void {
    super.init();
    this.setupKeyboardNavigation();
  }

  private setupDragDropListeners(): void {
    // Prevent default drag behaviors on the document
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.addEventListener(eventName, (e) => e.preventDefault());
    });

    // Drop zone events - only if dropZone exists
    if (this._dropZone) {
      this._dropZone.addEventListener('dragenter', this.handleDragEnter.bind(this));
      this._dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
      this._dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
      this._dropZone.addEventListener('drop', this.handleDrop.bind(this));
    }
  }

  private setupKeyboardNavigation(): void {
    this._element.addEventListener('keydown', (event: KeyboardEvent) => {
      const selectedFile = this.getFirstSelectedFile();
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.selectNextFile();
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.selectPreviousFile();
          break;
        case 'Enter':
          if (selectedFile) {
            this.openFile(selectedFile);
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (event.ctrlKey || event.metaKey) {
            this.deleteSelectedFiles();
          }
          break;
        case 'a':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.selectAllFiles();
          }
          break;
        case 'Escape':
          this.clearSelection();
          break;
      }
    });
  }

  private handleDragEnter(event: DragEvent): void {
    event.preventDefault();
    this._dragCounter++;
    this._dropZone.classList.add('drag-over');
  }

  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  private handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    this._dragCounter--;
    
    if (this._dragCounter === 0) {
      this._dropZone.classList.remove('drag-over');
    }
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault();
    this._dragCounter = 0;
    this._dropZone.classList.remove('drag-over');

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFilesDrop(Array.from(files));
    }
  }

  private handleFilesDrop(files: File[]): void {
    const supportedFiles = files.filter(file => 
      this.isFileSupported(file.name)
    );

    if (supportedFiles.length === 0) {
      this.showError('No supported audio files found. Supported formats: ' + 
        this._options.supportedExtensions?.join(', '));
      return;
    }

    const fileItems: FileItem[] = supportedFiles.map(file => ({
      name: file.name,
      path: file.path || file.name,
      type: 'file',
      size: file.size,
      modified: new Date(file.lastModified)
    }));

    if (this._options.onFileSelect) {
      this._options.onFileSelect(fileItems);
    }

    this.emit('filesSelected', fileItems);
    this.showSuccess(`${fileItems.length} file(s) loaded successfully`);
  }

  render(): HTMLElement {
    const container = this._element;
    container.className = 'cosmic-file-manager';
    container.setAttribute('role', 'application');
    container.setAttribute('aria-label', 'Cosmic File Navigator');

    this.createHeader();
    this.createToolbar();
    this.createDropZone();
    this.createFileList();

    return container;
  }

  private createHeader(): void {
    const header = document.createElement('div');
    header.className = 'file-manager-header';
    header.innerHTML = `
      <h2 class="cosmic-heading-medium">
        <span class="cosmic-icon icon-file-browser"></span>
        COSMIC FILE NAVIGATOR
      </h2>
      <div class="current-path" aria-live="polite">
        <span class="path-label">CURRENT SECTOR:</span>
        <span class="path-value">${this._currentPath || 'Local Files'}</span>
      </div>
    `;
    this._element.appendChild(header);
  }

  private createToolbar(): void {
    this._toolbar = document.createElement('div');
    this._toolbar.className = 'file-manager-toolbar cosmic-surface';
    
    // Search input
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
      <input type="search" 
             class="cosmic-input compact search-input" 
             placeholder="Search cosmic frequencies..."
             aria-label="Search files">
      <span class="cosmic-icon icon-search search-icon"></span>
    `;
    
    this._searchInput = searchContainer.querySelector('.search-input') as HTMLElement;
    this._searchInput.addEventListener('input', this.handleSearch.bind(this));

    // Action buttons
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'toolbar-actions';

    const openButton = CosmicButton.secondary('Browse Files', {
      icon: 'folder-open',
      onClick: () => this.openFileDialog()
    });

    const refreshButton = CosmicButton.icon('refresh', {
      ariaLabel: 'Refresh file list',
      onClick: () => this.refreshFileList()
    });

    const viewToggle = CosmicButton.icon('grid', {
      ariaLabel: 'Toggle view mode',
      onClick: () => this.toggleViewMode()
    });

    actionsContainer.appendChild(openButton.element);
    actionsContainer.appendChild(refreshButton.element);
    actionsContainer.appendChild(viewToggle.element);

    this._toolbar.appendChild(searchContainer);
    this._toolbar.appendChild(actionsContainer);
    this._element.appendChild(this._toolbar);
  }

  private createDropZone(): void {
    this._dropZone = document.createElement('div');
    this._dropZone.className = 'cosmic-drop-zone cosmic-container';
    this._dropZone.innerHTML = `
      <div class="drop-zone-content">
        <div class="drop-icon">
          <span class="cosmic-icon icon-upload-cloud"></span>
        </div>
        <h3 class="drop-title">Drop Audio Files to Explore</h3>
        <p class="drop-description">
          Drag and drop your cosmic frequencies here<br>
          <small>Supported: ${this._options.supportedExtensions?.join(', ')}</small>
        </p>
        <div class="drop-actions">
          <button class="cosmic-button primary browse-button">
            <span class="cosmic-icon icon-folder"></span>
            Browse Files
          </button>
        </div>
      </div>
      <div class="drop-overlay">
        <div class="drop-overlay-content">
          <span class="cosmic-icon icon-download"></span>
          <span>Release to load cosmic frequencies</span>
        </div>
      </div>
    `;

    const browseButton = this._dropZone.querySelector('.browse-button') as HTMLElement;
    browseButton.addEventListener('click', () => this.openFileDialog());

    this._element.appendChild(this._dropZone);
    
    // Setup drag and drop after dropZone is created
    this.setupDragDropListeners();
  }

  private createFileList(): void {
    this._fileList = document.createElement('div');
    this._fileList.className = 'cosmic-file-list cosmic-container';
    this._fileList.setAttribute('role', 'listbox');
    this._fileList.setAttribute('aria-label', 'Audio files');
    this._fileList.setAttribute('aria-multiselectable', String(this._options.allowMultiple));

    this.updateFileList();
    this._element.appendChild(this._fileList);
  }

  private updateFileList(): void {
    this._fileList.innerHTML = '';

    if (this._files.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'file-list-empty';
      emptyState.innerHTML = `
        <div class="empty-icon">
          <span class="cosmic-icon icon-music-note"></span>
        </div>
        <h3>No Cosmic Frequencies Detected</h3>
        <p>Drop audio files or browse your collection to begin the journey</p>
      `;
      this._fileList.appendChild(emptyState);
      return;
    }

    this._files.forEach((file, index) => {
      const fileItem = this.createFileItem(file, index);
      this._fileList.appendChild(fileItem);
    });
  }

  private createFileItem(file: FileItem, index: number): HTMLElement {
    const item = document.createElement('div');
    item.className = 'file-item cosmic-surface interactive';
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    item.setAttribute('data-file-path', file.path);
    item.setAttribute('data-index', index.toString());
    item.tabIndex = 0;

    const isSelected = this._selectedFiles.has(file.path);
    if (isSelected) {
      item.classList.add('selected');
      item.setAttribute('aria-selected', 'true');
    }

    // File icon based on type
    const iconClass = this.getFileIcon(file);
    
    item.innerHTML = `
      <div class="file-icon">
        <span class="cosmic-icon ${iconClass}"></span>
      </div>
      <div class="file-info">
        <div class="file-name" title="${file.name}">${file.name}</div>
        <div class="file-details">
          ${this.formatFileSize(file.size)}
          ${file.audioInfo ? ` • ${this.formatDuration(file.audioInfo.duration)}` : ''}
          ${file.modified ? ` • ${this.formatDate(file.modified)}` : ''}
        </div>
        ${file.audioInfo ? this.createAudioInfo(file.audioInfo) : ''}
      </div>
      <div class="file-actions">
        <button class="cosmic-button ghost small play-button" aria-label="Preview ${file.name}">
          <span class="cosmic-icon icon-play"></span>
        </button>
        <button class="cosmic-button ghost small info-button" aria-label="File info for ${file.name}">
          <span class="cosmic-icon icon-info"></span>
        </button>
      </div>
    `;

    // Event listeners
    item.addEventListener('click', (event) => this.handleFileClick(event, file));
    item.addEventListener('dblclick', () => this.openFile(file));
    item.addEventListener('keydown', (event) => this.handleFileKeydown(event, file));

    const playButton = item.querySelector('.play-button') as HTMLElement;
    playButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.previewFile(file);
    });

    const infoButton = item.querySelector('.info-button') as HTMLElement;
    infoButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.showFileInfo(file);
    });

    return item;
  }

  private createAudioInfo(audioInfo: any): string {
    return `
      <div class="audio-info">
        ${audioInfo.bitrate ? `${Math.round(audioInfo.bitrate)} kbps` : ''}
        ${audioInfo.sampleRate ? ` • ${audioInfo.sampleRate} Hz` : ''}
        ${audioInfo.channels ? ` • ${audioInfo.channels === 1 ? 'Mono' : 'Stereo'}` : ''}
      </div>
    `;
  }

  private getFileIcon(file: FileItem): string {
    const ext = file.name.toLowerCase().split('.').pop();
    switch (ext) {
      case 'wav': return 'icon-wave-file';
      case 'mp3': return 'icon-mp3-file';
      case 'flac': return 'icon-flac-file';
      case 'm4a': case 'aac': return 'icon-aac-file';
      case 'ogg': return 'icon-ogg-file';
      default: return 'icon-audio-file';
    }
  }

  // Event handlers
  private handleFileClick(event: MouseEvent, file: FileItem): void {
    if (event.ctrlKey || event.metaKey) {
      this.toggleFileSelection(file);
    } else if (event.shiftKey && this._options.allowMultiple) {
      this.selectFileRange(file);
    } else {
      this.selectFile(file, !this._options.allowMultiple);
    }
  }

  private handleFileKeydown(event: KeyboardEvent, file: FileItem): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (event.ctrlKey) {
          this.toggleFileSelection(file);
        } else {
          this.openFile(file);
        }
        break;
    }
  }

  private handleSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterFiles(query);
  }

  // File selection methods
  private selectFile(file: FileItem, clearOthers: boolean = true): void {
    if (clearOthers) {
      this.clearSelection();
    }
    
    this._selectedFiles.add(file.path);
    this.updateFileItemSelection();
    this.emit('selectionChange', Array.from(this._selectedFiles));
  }

  private toggleFileSelection(file: FileItem): void {
    if (this._selectedFiles.has(file.path)) {
      this._selectedFiles.delete(file.path);
    } else {
      this._selectedFiles.add(file.path);
    }
    
    this.updateFileItemSelection();
    this.emit('selectionChange', Array.from(this._selectedFiles));
  }

  private selectFileRange(endFile: FileItem): void {
    // Find start of selection range
    const selectedPaths = Array.from(this._selectedFiles);
    if (selectedPaths.length === 0) {
      this.selectFile(endFile);
      return;
    }

    const startIndex = this._files.findIndex(f => f.path === selectedPaths[selectedPaths.length - 1]);
    const endIndex = this._files.findIndex(f => f.path === endFile.path);
    
    if (startIndex >= 0 && endIndex >= 0) {
      const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
      
      for (let i = min; i <= max; i++) {
        if (this._files[i]) {
          this._selectedFiles.add(this._files[i]!.path);
        }
      }
      
      this.updateFileItemSelection();
      this.emit('selectionChange', Array.from(this._selectedFiles));
    }
  }

  private clearSelection(): void {
    this._selectedFiles.clear();
    this.updateFileItemSelection();
    this.emit('selectionChange', []);
  }

  private selectAllFiles(): void {
    this._files.forEach(file => this._selectedFiles.add(file.path));
    this.updateFileItemSelection();
    this.emit('selectionChange', Array.from(this._selectedFiles));
  }

  private updateFileItemSelection(): void {
    const fileItems = this._fileList.querySelectorAll('.file-item');
    fileItems.forEach(item => {
      const filePath = item.getAttribute('data-file-path');
      const isSelected = Boolean(filePath && this._selectedFiles.has(filePath));
      
      item.classList.toggle('selected', isSelected);
      item.setAttribute('aria-selected', String(isSelected));
    });
  }

  // Navigation methods
  private selectNextFile(): void {
    const selected = this.getFirstSelectedFile();
    if (!selected) {
      if (this._files.length > 0 && this._files[0]) {
        this.selectFile(this._files[0]);
      }
      return;
    }

    const currentIndex = this._files.findIndex(f => f.path === selected.path);
    if (currentIndex < this._files.length - 1 && this._files[currentIndex + 1]) {
      this.selectFile(this._files[currentIndex + 1]!);
      this.scrollToSelectedFile();
    }
  }

  private selectPreviousFile(): void {
    const selected = this.getFirstSelectedFile();
    if (!selected) return;

    const currentIndex = this._files.findIndex(f => f.path === selected.path);
    if (currentIndex > 0 && this._files[currentIndex - 1]) {
      this.selectFile(this._files[currentIndex - 1]!);
      this.scrollToSelectedFile();
    }
  }

  private scrollToSelectedFile(): void {
    const selectedItem = this._fileList.querySelector('.file-item.selected');
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  // File operations
  private openFile(file: FileItem): void {
    const selectedFiles = this.getSelectedFiles();
    
    if (this._options.onFileSelect) {
      this._options.onFileSelect(selectedFiles.length > 0 ? selectedFiles : [file]);
    }
    
    this.emit('fileOpen', file);
  }

  private previewFile(file: FileItem): void {
    this.emit('filePreview', file);
  }

  private showFileInfo(file: FileItem): void {
    this.emit('fileInfo', file);
  }

  private deleteSelectedFiles(): void {
    const selectedFiles = this.getSelectedFiles();
    if (selectedFiles.length > 0) {
      this.emit('filesDelete', selectedFiles);
    }
  }

  // Utility methods
  private getSelectedFiles(): FileItem[] {
    return this._files.filter(file => this._selectedFiles.has(file.path));
  }

  private getFirstSelectedFile(): FileItem | null {
    const selectedPaths = Array.from(this._selectedFiles);
    if (selectedPaths.length === 0) return null;
    
    return this._files.find(file => file.path === selectedPaths[0]) || null;
  }

  private filterFiles(query: string): void {
    const fileItems = this._fileList.querySelectorAll('.file-item');
    
    fileItems.forEach(item => {
      const fileName = item.querySelector('.file-name')?.textContent?.toLowerCase() || '';
      const matches = fileName.includes(query);
      
      (item as HTMLElement).style.display = matches ? '' : 'none';
      item.setAttribute('aria-hidden', String(!matches));
    });
  }

  private isFileSupported(fileName: string): boolean {
    const ext = '.' + fileName.toLowerCase().split('.').pop();
    return this._options.supportedExtensions?.includes(ext) || false;
  }

  // Formatting helpers
  private formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private formatDuration(seconds?: number): string {
    if (!seconds) return '';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString();
  }

  // Public API
  setFiles(files: FileItem[]): void {
    this._files = [...files];
    this.clearSelection();
    this.updateFileList();
  }

  addFiles(files: FileItem[]): void {
    this._files.push(...files);
    this.updateFileList();
  }

  removeFiles(filePaths: string[]): void {
    this._files = this._files.filter(file => !filePaths.includes(file.path));
    filePaths.forEach(path => this._selectedFiles.delete(path));
    this.updateFileList();
  }

  refreshFileList(): void {
    this.emit('refresh');
  }

  openFileDialog(): void {
    this.emit('browse');
  }

  toggleViewMode(): void {
    this._fileList.classList.toggle('grid-view');
    this.emit('viewToggle');
  }

  setCurrentPath(path: string): void {
    this._currentPath = path;
    const pathElement = this._element.querySelector('.path-value');
    if (pathElement) {
      pathElement.textContent = path || 'Local Files';
    }
    
    if (this._options.onDirectoryChange) {
      this._options.onDirectoryChange(path);
    }
  }

  getSelectedFilePaths(): string[] {
    return Array.from(this._selectedFiles);
  }

  // Notifications
  private showSuccess(message: string): void {
    this.emit('notification', { type: 'success', message });
  }

  private showError(message: string): void {
    this.emit('notification', { type: 'error', message });
  }
}