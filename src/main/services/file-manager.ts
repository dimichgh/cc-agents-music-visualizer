/**
 * File Manager Service - Handles file operations and dialog interactions
 */

import { dialog, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ServiceInterface, Logger, FileDialogOptions, ValidationResult, AudioFile } from '@/shared/types';

export class FileManager implements ServiceInterface {
  private logger: Logger;
  private isInitialized = false;
  private isDisposed = false;
  
  // Supported audio formats
  private readonly supportedFormats = [
    { name: 'WAV Audio Files', extensions: ['wav'] },
    { name: 'All Audio Files', extensions: ['wav', 'aiff', 'flac'] },
  ];

  // File size limits (in bytes)
  private readonly maxFileSize = 200 * 1024 * 1024; // 200MB

  constructor() {
    this.logger = new Logger('FileManager');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('FileManager already initialized');
      return;
    }

    this.logger.info('Initializing FileManager...');
    this.isInitialized = true;
    this.logger.info('FileManager initialized successfully');
  }

  /**
   * Show file open dialog and return selected file information
   */
  async showOpenDialog(parentWindow?: BrowserWindow): Promise<AudioFile | null> {
    try {
      const options: FileDialogOptions = {
        title: 'Select Audio File',
        buttonLabel: 'Open',
        filters: this.supportedFormats,
        properties: ['openFile'],
      };

      const result = await dialog.showOpenDialog(parentWindow || undefined, options);

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const filePath = result.filePaths[0];
      return await this.createAudioFileInfo(filePath);
    } catch (error) {
      this.logger.error('Failed to show open dialog', error as Error);
      throw error;
    }
  }

  /**
   * Validate audio file format and constraints
   */
  validateAudioFile(filePath: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Check file extension
      const ext = path.extname(filePath).toLowerCase().slice(1);
      const supportedExts = this.supportedFormats.flatMap(format => format.extensions);
      
      if (!supportedExts.includes(ext)) {
        result.isValid = false;
        result.errors.push(`Unsupported file format: .${ext}`);
      }

      // Check if file exists (will be checked during file reading)
      // Additional validations will be performed when actually reading the file

      return result;
    } catch (error) {
      result.isValid = false;
      result.errors.push(`File validation failed: ${(error as Error).message}`);
      return result;
    }
  }

  /**
   * Read audio file as ArrayBuffer for processing
   */
  async readAudioFile(filePath: string): Promise<ArrayBuffer> {
    try {
      // Validate file first
      const validation = this.validateAudioFile(filePath);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Check file size
      const stats = await fs.stat(filePath);
      if (stats.size > this.maxFileSize) {
        throw new Error(`File too large: ${this.formatFileSize(stats.size)} (max: ${this.formatFileSize(this.maxFileSize)})`);
      }

      // Read file as buffer
      const buffer = await fs.readFile(filePath);
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    } catch (error) {
      this.logger.error(`Failed to read audio file: ${filePath}`, error as Error);
      throw error;
    }
  }

  /**
   * Create audio file information object
   */
  private async createAudioFileInfo(filePath: string): Promise<AudioFile> {
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const ext = path.extname(filePath).toLowerCase();

      // Basic file info (detailed audio info will be extracted during decoding)
      const audioFile: AudioFile = {
        id: this.generateFileId(filePath),
        name: fileName,
        path: filePath,
        size: stats.size,
        duration: 0, // Will be set after decoding
        sampleRate: 0, // Will be set after decoding
        channels: 0, // Will be set after decoding
        bitDepth: 0, // Will be set after decoding
      };

      this.logger.info(`Created audio file info for: ${fileName}`);
      return audioFile;
    } catch (error) {
      this.logger.error(`Failed to create audio file info for: ${filePath}`, error as Error);
      throw error;
    }
  }

  /**
   * Generate unique file ID based on path and modification time
   */
  private generateFileId(filePath: string): string {
    const normalized = path.normalize(filePath);
    const hash = this.simpleHash(normalized);
    return `file_${hash}_${Date.now()}`;
  }

  /**
   * Simple hash function for generating file IDs
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(filePath: string): Promise<fs.Stats | null> {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      this.logger.error(`Failed to get file stats for: ${filePath}`, error as Error);
      return null;
    }
  }

  /**
   * Show save dialog for exporting settings or presets
   */
  async showSaveDialog(
    defaultName: string,
    filters: Array<{ name: string; extensions: string[] }>,
    parentWindow?: BrowserWindow
  ): Promise<string | null> {
    try {
      const result = await dialog.showSaveDialog(parentWindow || undefined, {
        title: 'Save File',
        defaultPath: defaultName,
        filters,
        properties: ['createDirectory'],
      });

      return result.canceled ? null : result.filePath || null;
    } catch (error) {
      this.logger.error('Failed to show save dialog', error as Error);
      throw error;
    }
  }

  public isInitialized(): boolean {
    return this.isInitialized;
  }

  public isDisposed(): boolean {
    return this.isDisposed;
  }

  public dispose(): void {
    if (this.isDisposed) return;

    this.logger.info('Disposing FileManager...');
    this.isDisposed = true;
    this.logger.info('FileManager disposed');
  }
}