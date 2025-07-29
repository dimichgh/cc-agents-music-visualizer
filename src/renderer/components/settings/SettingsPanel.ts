// Music Visualizer - Settings Panel Component

import { BaseComponent } from '../base/BaseComponent';
import { CosmicButton } from '../ui/Button';
import { CosmicInput } from '../ui/Input';
import { SettingsPanelOptions, SettingsGroup, SettingSetting } from '../../types/ui-types';

export class SettingsPanel extends BaseComponent {
  private _options: SettingsPanelOptions;
  private _header: HTMLElement;
  private _searchContainer: HTMLElement;
  private _groupsContainer: HTMLElement;
  private _footer: HTMLElement;
  private _searchInput: CosmicInput;
  private _settingsMap: Map<string, SettingSetting> = new Map();
  private _groupElements: Map<string, HTMLElement> = new Map();
  private _expandedGroups: Set<string> = new Set();

  constructor(options: SettingsPanelOptions) {
    super('div');
    this._options = {
      collapsible: true,
      searchable: true,
      ...options
    };
    
    this.buildSettingsMap();
    this.render();
  }

  private buildSettingsMap(): void {
    this._options.groups.forEach(group => {
      group.settings.forEach(setting => {
        this._settingsMap.set(setting.id, setting);
      });
      
      // Expand first group by default
      if (this._expandedGroups.size === 0) {
        this._expandedGroups.add(group.id);
      }
    });
  }

  render(): HTMLElement {
    const container = this._element;
    container.className = 'cosmic-settings-panel cosmic-container';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-labelledby', 'settings-title');

    this.createHeader();
    if (this._options.searchable) {
      this.createSearchContainer();
    }
    this.createGroupsContainer();
    this.createFooter();

    return container;
  }

  private createHeader(): void {
    this._header = document.createElement('div');
    this._header.className = 'settings-header';
    this._header.innerHTML = `
      <h2 id="settings-title" class="cosmic-heading-medium">
        <span class="cosmic-icon icon-settings"></span>
        COSMIC VISUALIZATION SETTINGS
      </h2>
      <button class="cosmic-button ghost small close-button" aria-label="Close settings">
        <span class="cosmic-icon icon-close"></span>
      </button>
    `;

    const closeButton = this._header.querySelector('.close-button') as HTMLElement;
    closeButton.addEventListener('click', () => this.close());

    this._element.appendChild(this._header);
  }

  private createSearchContainer(): void {
    this._searchContainer = document.createElement('div');
    this._searchContainer.className = 'settings-search';

    this._searchInput = CosmicInput.search('Search settings...', {
      onChange: (value) => this.filterSettings(value)
    });
    this._searchInput.addClass('settings-search-input');

    this._searchContainer.appendChild(this._searchInput.element);
    this._element.appendChild(this._searchContainer);
  }

  private createGroupsContainer(): void {
    this._groupsContainer = document.createElement('div');
    this._groupsContainer.className = 'settings-groups';
    this._groupsContainer.setAttribute('role', 'tablist');

    this._options.groups.forEach(group => {
      const groupElement = this.createSettingsGroup(group);
      this._groupElements.set(group.id, groupElement);
      this._groupsContainer.appendChild(groupElement);
    });

    this._element.appendChild(this._groupsContainer);
  }

  private createSettingsGroup(group: SettingsGroup): HTMLElement {
    const groupElement = document.createElement('div');
    groupElement.className = 'settings-group cosmic-surface';
    groupElement.setAttribute('data-group-id', group.id);

    // Group header
    const header = document.createElement('div');
    header.className = 'group-header';
    header.setAttribute('role', 'tab');
    header.setAttribute('aria-expanded', String(this._expandedGroups.has(group.id)));
    header.setAttribute('aria-controls', `group-content-${group.id}`);
    header.tabIndex = 0;

    if (this._options.collapsible) {
      header.addEventListener('click', () => this.toggleGroup(group.id));
      header.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.toggleGroup(group.id);
        }
      });
    }

    header.innerHTML = `
      <div class="group-title">
        ${group.icon ? `<span class="cosmic-icon ${group.icon}"></span>` : ''}
        <span class="group-label">${group.label}</span>
      </div>
      ${this._options.collapsible ? '<span class="cosmic-icon icon-chevron-down expand-icon"></span>' : ''}
    `;

    // Group content
    const content = document.createElement('div');
    content.className = 'group-content';
    content.id = `group-content-${group.id}`;
    content.setAttribute('role', 'tabpanel');
    content.style.display = this._expandedGroups.has(group.id) ? 'block' : 'none';

    group.settings.forEach(setting => {
      const settingElement = this.createSettingElement(setting, group.id);
      content.appendChild(settingElement);
    });

    groupElement.appendChild(header);
    groupElement.appendChild(content);

    return groupElement;
  }

  private createSettingElement(setting: SettingSetting, groupId: string): HTMLElement {
    const settingElement = document.createElement('div');
    settingElement.className = 'setting-item';
    settingElement.setAttribute('data-setting-id', setting.id);
    settingElement.setAttribute('data-group-id', groupId);

    // Setting info
    const infoContainer = document.createElement('div');
    infoContainer.className = 'setting-info';
    infoContainer.innerHTML = `
      <div class="setting-label">${setting.label}</div>
      ${setting.description ? `<div class="setting-description">${setting.description}</div>` : ''}
    `;

    // Setting control
    const controlContainer = document.createElement('div');
    controlContainer.className = 'setting-control';

    const control = this.createSettingControl(setting, groupId);
    controlContainer.appendChild(control);

    settingElement.appendChild(infoContainer);
    settingElement.appendChild(controlContainer);

    return settingElement;
  }

  private createSettingControl(setting: SettingSetting, groupId: string): HTMLElement {
    switch (setting.type) {
      case 'boolean':
        return this.createBooleanControl(setting, groupId);
      case 'number':
      case 'range':
        return this.createNumberControl(setting, groupId);
      case 'string':
        return this.createStringControl(setting, groupId);
      case 'select':
        return this.createSelectControl(setting, groupId);
      case 'color':
        return this.createColorControl(setting, groupId);
      default:
        return document.createElement('div');
    }
  }

  private createBooleanControl(setting: SettingSetting, groupId: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'cosmic-toggle-container';

    const toggle = document.createElement('div');
    toggle.className = `cosmic-toggle ${setting.value ? 'active' : ''}`;
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-checked', String(setting.value));
    toggle.setAttribute('aria-labelledby', `setting-${setting.id}-label`);
    toggle.tabIndex = 0;

    toggle.innerHTML = `
      <div class="toggle-handle"></div>
    `;

    const handleToggle = () => {
      const newValue = !setting.value;
      this.updateSettingValue(setting.id, newValue, groupId);
      
      toggle.classList.toggle('active', newValue);
      toggle.setAttribute('aria-checked', String(newValue));
    };

    toggle.addEventListener('click', handleToggle);
    toggle.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      }
    });

    container.appendChild(toggle);
    return container;
  }

  private createNumberControl(setting: SettingSetting, groupId: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'number-control-container';

    if (setting.type === 'range') {
      // Range slider
      const slider = document.createElement('div');
      slider.className = 'cosmic-range';
      slider.setAttribute('role', 'slider');
      slider.setAttribute('aria-valuemin', String(setting.min || 0));
      slider.setAttribute('aria-valuemax', String(setting.max || 100));
      slider.setAttribute('aria-valuenow', String(setting.value));
      slider.tabIndex = 0;

      const percentage = ((setting.value - (setting.min || 0)) / ((setting.max || 100) - (setting.min || 0))) * 100;

      slider.innerHTML = `
        <div class="range-track" style="width: ${percentage}%"></div>
        <div class="range-handle" style="left: ${percentage}%"></div>
        <div class="range-value">${setting.value}</div>
      `;

      this.setupRangeInteraction(slider, setting, groupId);
      container.appendChild(slider);
    } else {
      // Number input
      const input = new CosmicInput({
        type: 'number',
        value: String(setting.value),
        onChange: (value) => {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            this.updateSettingValue(setting.id, numValue, groupId);
          }
        }
      });

      if (setting.min !== undefined) input.setMinMax(setting.min);
      if (setting.max !== undefined) input.setMinMax(undefined, setting.max);
      if (setting.step !== undefined) input.setStep(setting.step);

      container.appendChild(input.element);
    }

    return container;
  }

  private createStringControl(setting: SettingSetting, groupId: string): HTMLElement {
    const input = new CosmicInput({
      type: 'text',
      value: setting.value,
      onChange: (value) => this.updateSettingValue(setting.id, value, groupId)
    });

    return input.element;
  }

  private createSelectControl(setting: SettingSetting, groupId: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'cosmic-dropdown';

    const trigger = document.createElement('button');
    trigger.className = 'dropdown-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const currentOption = setting.options?.find(opt => opt.value === setting.value);
    trigger.innerHTML = `
      <span class="selected-value">${currentOption?.label || 'Select...'}</span>
      <span class="dropdown-arrow cosmic-icon icon-chevron-down"></span>
    `;

    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.setAttribute('role', 'listbox');
    menu.style.display = 'none';

    setting.options?.forEach(option => {
      const item = document.createElement('div');
      item.className = `dropdown-item ${option.value === setting.value ? 'selected' : ''}`;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(option.value === setting.value));
      item.textContent = option.label;

      item.addEventListener('click', () => {
        this.updateSettingValue(setting.id, option.value, groupId);
        this.updateSelectDisplay(trigger, menu, option);
        this.closeDropdown(trigger, menu);
      });

      menu.appendChild(item);
    });

    trigger.addEventListener('click', () => {
      const isOpen = menu.style.display === 'block';
      if (isOpen) {
        this.closeDropdown(trigger, menu);
      } else {
        this.openDropdown(trigger, menu);
      }
    });

    container.appendChild(trigger);
    container.appendChild(menu);

    return container;
  }

  private createColorControl(setting: SettingSetting, groupId: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'color-control-container';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'cosmic-color-input';
    colorInput.value = setting.value;

    const colorDisplay = document.createElement('div');
    colorDisplay.className = 'color-display cosmic-surface';
    colorDisplay.style.backgroundColor = setting.value;

    const colorValue = document.createElement('span');
    colorValue.className = 'color-value';
    colorValue.textContent = setting.value;

    colorInput.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      const newColor = target.value;
      
      this.updateSettingValue(setting.id, newColor, groupId);
      colorDisplay.style.backgroundColor = newColor;
      colorValue.textContent = newColor;
    });

    colorDisplay.addEventListener('click', () => colorInput.click());

    container.appendChild(colorDisplay);
    container.appendChild(colorValue);
    container.appendChild(colorInput);

    return container;
  }

  private setupRangeInteraction(slider: HTMLElement, setting: SettingSetting, groupId: string): void {
    const track = slider.querySelector('.range-track') as HTMLElement;
    const handle = slider.querySelector('.range-handle') as HTMLElement;
    const valueDisplay = slider.querySelector('.range-value') as HTMLElement;

    let isDragging = false;
    const min = setting.min || 0;
    const max = setting.max || 100;
    const step = setting.step || 1;

    const updateValue = (clientX: number) => {
      const rect = slider.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      let newValue = min + percentage * (max - min);
      
      // Apply step
      newValue = Math.round(newValue / step) * step;
      newValue = Math.max(min, Math.min(max, newValue));

      this.updateSettingValue(setting.id, newValue, groupId);
      this.updateRangeDisplay(slider, newValue, min, max);
    };

    // Mouse events
    slider.addEventListener('mousedown', (event: MouseEvent) => {
      isDragging = true;
      updateValue(event.clientX);
      event.preventDefault();
    });

    document.addEventListener('mousemove', (event: MouseEvent) => {
      if (isDragging) {
        updateValue(event.clientX);
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Keyboard events
    slider.addEventListener('keydown', (event: KeyboardEvent) => {
      let delta = 0;
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          delta = -step;
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          delta = step;
          break;
        case 'Home':
          this.updateSettingValue(setting.id, min, groupId);
          this.updateRangeDisplay(slider, min, min, max);
          return;
        case 'End':
          this.updateSettingValue(setting.id, max, groupId);
          this.updateRangeDisplay(slider, max, min, max);
          return;
      }
      
      if (delta !== 0) {
        event.preventDefault();
        const newValue = Math.max(min, Math.min(max, setting.value + delta));
        this.updateSettingValue(setting.id, newValue, groupId);
        this.updateRangeDisplay(slider, newValue, min, max);
      }
    });
  }

  private updateRangeDisplay(slider: HTMLElement, value: number, min: number, max: number): void {
    const percentage = ((value - min) / (max - min)) * 100;
    const track = slider.querySelector('.range-track') as HTMLElement;
    const handle = slider.querySelector('.range-handle') as HTMLElement;
    const valueDisplay = slider.querySelector('.range-value') as HTMLElement;

    track.style.width = `${percentage}%`;
    handle.style.left = `${percentage}%`;
    valueDisplay.textContent = String(value);
    slider.setAttribute('aria-valuenow', String(value));
  }

  private updateSelectDisplay(trigger: HTMLElement, menu: HTMLElement, selectedOption: any): void {
    const selectedValue = trigger.querySelector('.selected-value') as HTMLElement;
    selectedValue.textContent = selectedOption.label;

    // Update menu items
    menu.querySelectorAll('.dropdown-item').forEach(item => {
      const isSelected = item.textContent === selectedOption.label;
      item.classList.toggle('selected', isSelected);
      item.setAttribute('aria-selected', String(isSelected));
    });
  }

  private openDropdown(trigger: HTMLElement, menu: HTMLElement): void {
    menu.style.display = 'block';
    trigger.setAttribute('aria-expanded', 'true');
    trigger.classList.add('open');
    menu.classList.add('open');
  }

  private closeDropdown(trigger: HTMLElement, menu: HTMLElement): void {
    menu.style.display = 'none';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.classList.remove('open');
    menu.classList.remove('open');
  }

  private createFooter(): void {
    this._footer = document.createElement('div');
    this._footer.className = 'settings-footer';

    const resetButton = CosmicButton.secondary('Reset to Defaults', {
      onClick: () => this.resetToDefaults()
    });

    const applyButton = CosmicButton.primary('Apply Changes', {
      onClick: () => this.applyChanges()
    });

    this._footer.appendChild(resetButton.element);
    this._footer.appendChild(applyButton.element);
    this._element.appendChild(this._footer);
  }

  // Event handlers and methods
  private toggleGroup(groupId: string): void {
    const groupElement = this._groupElements.get(groupId);
    if (!groupElement) return;

    const header = groupElement.querySelector('.group-header') as HTMLElement;
    const content = groupElement.querySelector('.group-content') as HTMLElement;
    const expandIcon = groupElement.querySelector('.expand-icon') as HTMLElement;

    const isExpanded = this._expandedGroups.has(groupId);

    if (isExpanded) {
      this._expandedGroups.delete(groupId);
      content.style.display = 'none';
      header.setAttribute('aria-expanded', 'false');
      expandIcon.style.transform = 'rotate(0deg)';
    } else {
      this._expandedGroups.add(groupId);
      content.style.display = 'block';
      header.setAttribute('aria-expanded', 'true');
      expandIcon.style.transform = 'rotate(180deg)';
    }
  }

  private filterSettings(query: string): void {
    const lowerQuery = query.toLowerCase();

    this._options.groups.forEach(group => {
      const groupElement = this._groupElements.get(group.id);
      if (!groupElement) return;

      let hasVisibleSettings = false;

      group.settings.forEach(setting => {
        const settingElement = groupElement.querySelector(`[data-setting-id="${setting.id}"]`) as HTMLElement;
        if (!settingElement) return;

        const matches = setting.label.toLowerCase().includes(lowerQuery) ||
                       (setting.description && setting.description.toLowerCase().includes(lowerQuery));

        settingElement.style.display = matches ? '' : 'none';
        if (matches) hasVisibleSettings = true;
      });

      groupElement.style.display = hasVisibleSettings ? '' : 'none';

      // Expand groups with matches
      if (hasVisibleSettings && query.length > 0) {
        this._expandedGroups.add(group.id);
        const content = groupElement.querySelector('.group-content') as HTMLElement;
        const header = groupElement.querySelector('.group-header') as HTMLElement;
        content.style.display = 'block';
        header.setAttribute('aria-expanded', 'true');
      }
    });
  }

  private updateSettingValue(settingId: string, value: any, groupId: string): void {
    const setting = this._settingsMap.get(settingId);
    if (!setting) return;

    const oldValue = setting.value;
    setting.value = value;

    // Call setting-specific onChange handler
    if (setting.onChange) {
      setting.onChange(value);
    }

    // Call global onChange handler
    if (this._options.onSettingChange) {
      this._options.onSettingChange(settingId, value, groupId);
    }

    this.emit('settingChange', { settingId, value, oldValue, groupId });
  }

  private resetToDefaults(): void {
    // This would reset all settings to their default values
    this.emit('resetDefaults');
  }

  private applyChanges(): void {
    this.emit('applyChanges');
    this.close();
  }

  // Public API
  show(): void {
    super.show();
    this._element.classList.add('visible');
    
    // Focus the first focusable element
    const firstFocusable = this._element.querySelector('button, input, [tabindex="0"]') as HTMLElement;
    if (firstFocusable) {
      firstFocusable.focus();
    }

    this.emit('show');
  }

  hide(): void {
    this._element.classList.remove('visible');
    setTimeout(() => super.hide(), 300); // Wait for animation
    this.emit('hide');
  }

  close(): void {
    this.hide();
    this.emit('close');
  }

  getSetting(settingId: string): SettingSetting | undefined {
    return this._settingsMap.get(settingId);
  }

  updateSetting(settingId: string, value: any): void {
    const setting = this._settingsMap.get(settingId);
    if (!setting) return;

    setting.value = value;

    // Update the UI control
    const settingElement = this._element.querySelector(`[data-setting-id="${settingId}"]`) as HTMLElement;
    if (settingElement) {
      this.updateSettingDisplay(settingElement, setting);
    }
  }

  private updateSettingDisplay(settingElement: HTMLElement, setting: SettingSetting): void {
    const control = settingElement.querySelector('.setting-control') as HTMLElement;
    
    switch (setting.type) {
      case 'boolean':
        const toggle = control.querySelector('.cosmic-toggle') as HTMLElement;
        toggle.classList.toggle('active', setting.value);
        toggle.setAttribute('aria-checked', String(setting.value));
        break;
        
      case 'number':
      case 'string':
        const input = control.querySelector('input') as HTMLInputElement;
        if (input) input.value = String(setting.value);
        break;
        
      case 'range':
        const slider = control.querySelector('.cosmic-range') as HTMLElement;
        if (slider) {
          this.updateRangeDisplay(slider, setting.value, setting.min || 0, setting.max || 100);
        }
        break;
        
      case 'color':
        const colorInput = control.querySelector('.cosmic-color-input') as HTMLInputElement;
        const colorDisplay = control.querySelector('.color-display') as HTMLElement;
        const colorValue = control.querySelector('.color-value') as HTMLElement;
        
        if (colorInput) colorInput.value = setting.value;
        if (colorDisplay) colorDisplay.style.backgroundColor = setting.value;
        if (colorValue) colorValue.textContent = setting.value;
        break;
    }
  }

  getAllSettings(): Record<string, any> {
    const settings: Record<string, any> = {};
    this._settingsMap.forEach((setting, id) => {
      settings[id] = setting.value;
    });
    return settings;
  }

  expandAllGroups(): void {
    this._options.groups.forEach(group => {
      this._expandedGroups.add(group.id);
      const groupElement = this._groupElements.get(group.id);
      if (groupElement) {
        const content = groupElement.querySelector('.group-content') as HTMLElement;
        const header = groupElement.querySelector('.group-header') as HTMLElement;
        content.style.display = 'block';
        header.setAttribute('aria-expanded', 'true');
      }
    });
  }

  collapseAllGroups(): void {
    this._expandedGroups.clear();
    this._options.groups.forEach(group => {
      const groupElement = this._groupElements.get(group.id);
      if (groupElement) {
        const content = groupElement.querySelector('.group-content') as HTMLElement;
        const header = groupElement.querySelector('.group-header') as HTMLElement;
        content.style.display = 'none';
        header.setAttribute('aria-expanded', 'false');
      }
    });
  }
}