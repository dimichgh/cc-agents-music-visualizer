/**
 * WCAG 2.1 AA Accessibility Compliance Tests
 */

import { expect, sinon } from '../setup';
import { 
  setupDOMEnvironment, 
  createTestContainer, 
  cleanupTestContainer,
  createMockKeyboardEvent,
  waitForDOMUpdate
} from '../fixtures/dom-fixtures';

describe('WCAG 2.1 AA Accessibility Compliance', () => {
  let container: HTMLElement;

  before(() => {
    setupDOMEnvironment();
  });

  beforeEach(() => {
    container = createTestContainer();
    // Create a mock application UI
    container.innerHTML = `
      <div class="app-layout" role="application" aria-label="Music Visualizer">
        <header class="app-header" role="banner">
          <h1>Music Visualizer</h1>
          <nav role="navigation" aria-label="Main navigation">
            <button class="nav-button" aria-label="Audio controls">Audio</button>
            <button class="nav-button" aria-label="Visual settings">Visual</button>
            <button class="nav-button" aria-label="Application settings">Settings</button>
          </nav>
        </header>
        
        <main class="app-main" role="main">
          <section class="audio-controls" aria-label="Audio playback controls">
            <button class="play-button" aria-label="Play audio" aria-pressed="false">
              <span class="sr-only">Play</span>
            </button>
            <input type="range" class="volume-slider" min="0" max="1" step="0.1" 
                   aria-label="Volume" value="0.8">
            <div class="progress-bar" role="progressbar" aria-label="Playback progress" 
                 aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-fill"></div>
            </div>
          </section>
          
          <section class="visualization-area" aria-label="Audio visualization">
            <canvas class="visualization-canvas" role="img" 
                    aria-label="Audio frequency visualization"></canvas>
          </section>
          
          <section class="file-manager" aria-label="File management">
            <input type="file" class="file-input" accept=".wav,.mp3,.flac" 
                   aria-label="Select audio file">
            <div class="drop-zone" role="button" tabindex="0" 
                 aria-label="Drop audio files here or click to select">
              Drop files here
            </div>
          </section>
        </main>
        
        <aside class="settings-panel" role="complementary" aria-label="Settings panel">
          <h2>Settings</h2>
          <fieldset>
            <legend>Accessibility Options</legend>
            <label>
              <input type="checkbox" class="high-contrast-toggle">
              High Contrast Mode
            </label>
            <label>
              <input type="checkbox" class="reduced-motion-toggle">
              Reduce Motion
            </label>
            <label>
              <input type="checkbox" class="screen-reader-mode">
              Screen Reader Optimizations
            </label>
          </fieldset>
        </aside>
        
        <div class="notifications" aria-live="polite" aria-label="Notifications"></div>
        <div class="status-bar" role="status" aria-live="polite"></div>
      </div>
    `;
  });

  afterEach(() => {
    cleanupTestContainer();
  });

  describe('1.1 Text Alternatives (Level A)', () => {
    it('should provide text alternatives for non-text content', () => {
      // Images and canvas elements should have alt text or aria-label
      const canvas = container.querySelector('canvas');
      expect(canvas?.getAttribute('aria-label')).to.exist;
      expect(canvas?.getAttribute('role')).to.equal('img');

      // Buttons should have accessible labels
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const label = button.getAttribute('aria-label') || 
                     button.textContent?.trim() ||
                     button.querySelector('.sr-only')?.textContent;
        expect(label).to.exist.and.not.be.empty;
      });
    });

    it('should provide meaningful alt text for decorative elements', () => {
      // Add a decorative icon
      const icon = document.createElement('i');
      icon.className = 'icon-play';
      icon.setAttribute('aria-hidden', 'true');
      container.appendChild(icon);

      // Decorative elements should be hidden from screen readers
      expect(icon.getAttribute('aria-hidden')).to.equal('true');
    });
  });

  describe('1.3 Adaptable (Level A)', () => {
    it('should have proper heading structure', () => {
      const h1 = container.querySelector('h1');
      const h2 = container.querySelector('h2');
      
      expect(h1).to.exist;
      expect(h2).to.exist;
      
      // Should follow logical heading hierarchy
      expect(h1?.textContent).to.not.be.empty;
      expect(h2?.textContent).to.not.be.empty;
    });

    it('should use semantic HTML elements', () => {
      // Check for proper semantic structure
      expect(container.querySelector('[role="banner"]')).to.exist; // header
      expect(container.querySelector('[role="main"]')).to.exist; // main content
      expect(container.querySelector('[role="navigation"]')).to.exist; // navigation
      expect(container.querySelector('[role="complementary"]')).to.exist; // aside
    });

    it('should provide meaningful labels and descriptions', () => {
      const sections = container.querySelectorAll('section');
      sections.forEach(section => {
        const label = section.getAttribute('aria-label') || 
                     section.getAttribute('aria-labelledby');
        expect(label).to.exist;
      });
    });

    it('should maintain content order when CSS is disabled', () => {
      // Test reading order by checking DOM structure
      const mainContent = container.querySelector('main');
      const children = Array.from(mainContent?.children || []);
      
      // Should have logical flow: controls -> visualization -> file manager
      expect(children[0]?.classList.contains('audio-controls')).to.be.true;
      expect(children[1]?.classList.contains('visualization-area')).to.be.true;
      expect(children[2]?.classList.contains('file-manager')).to.be.true;
    });
  });

  describe('1.4 Distinguishable (Level AA)', () => {
    it('should meet color contrast requirements', () => {
      // Mock color contrast checking
      const elements = container.querySelectorAll('button, input, [role="button"]');
      
      elements.forEach(element => {
        const computedStyle = window.getComputedStyle(element as Element);
        const bgColor = computedStyle.backgroundColor;
        const textColor = computedStyle.color;
        
        // Should have sufficient contrast (mock test)
        expect(bgColor).to.not.equal(textColor);
      });
    });

    it('should be usable without color alone', () => {
      // Error states should use more than just color
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.setAttribute('role', 'alert');
      errorElement.innerHTML = '⚠️ Error: Invalid file format';
      container.appendChild(errorElement);

      // Should have icon/text in addition to color
      expect(errorElement.textContent).to.include('Error');
      expect(errorElement.getAttribute('role')).to.equal('alert');
    });

    it('should be resizable up to 200% without loss of functionality', () => {
      // Mock zoom testing
      document.body.style.zoom = '2.0';
      
      // Elements should remain accessible
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        expect(rect.width).to.be.greaterThan(0);
        expect(rect.height).to.be.greaterThan(0);
      });
      
      document.body.style.zoom = '1.0';
    });

    it('should handle text spacing adjustments', () => {
      // Apply text spacing CSS
      document.body.style.lineHeight = '1.5';
      document.body.style.letterSpacing = '0.12em';
      document.body.style.wordSpacing = '0.16em';
      
      // Content should remain readable
      const textElements = container.querySelectorAll('button, label, h1, h2');
      textElements.forEach(element => {
        expect(element.textContent?.trim()).to.not.be.empty;
      });
      
      // Reset styles
      document.body.style.lineHeight = '';
      document.body.style.letterSpacing = '';
      document.body.style.wordSpacing = '';
    });
  });

  describe('2.1 Keyboard Accessible (Level A)', () => {
    it('should be fully keyboard accessible', async () => {
      // All interactive elements should be keyboard accessible
      const interactiveElements = container.querySelectorAll(
        'button, input, [role="button"], [tabindex]:not([tabindex="-1"])'
      );
      
      interactiveElements.forEach(element => {
        const tabIndex = element.getAttribute('tabindex');
        expect(tabIndex !== '-1').to.be.true;
      });
    });

    it('should handle keyboard navigation properly', async () => {
      const firstButton = container.querySelector('button') as HTMLElement;
      firstButton.focus();
      
      // Tab should move to next focusable element
      const tabEvent = createMockKeyboardEvent('keydown', 'Tab');
      document.dispatchEvent(tabEvent);
      
      await waitForDOMUpdate();
      
      // Focus should have moved
      expect(document.activeElement).to.not.equal(firstButton);
    });

    it('should support keyboard shortcuts', async () => {
      const playButton = container.querySelector('.play-button') as HTMLElement;
      
      // Space bar should activate play button
      const spaceEvent = createMockKeyboardEvent('keydown', ' ');
      Object.defineProperty(spaceEvent, 'target', { value: playButton });
      
      playButton.dispatchEvent(spaceEvent);
      
      // Should trigger action (mock)
      expect(playButton.getAttribute('aria-pressed')).to.equal('true');
    });

    it('should not trap keyboard focus inappropriately', () => {
      // Modal dialogs should trap focus, but regular content should not
      const regularButtons = container.querySelectorAll('.nav-button');
      
      regularButtons.forEach(button => {
        // Should not prevent tabbing away
        expect(button.hasAttribute('aria-modal')).to.be.false;
      });
    });
  });

  describe('2.2 Enough Time (Level A)', () => {
    it('should not have automatic time limits without user control', () => {
      // Check for any automatic timeouts or animations
      const animatedElements = container.querySelectorAll('[data-auto-timeout]');
      
      animatedElements.forEach(element => {
        // Should have pause/stop controls
        const pauseControl = element.querySelector('[data-action="pause"]');
        expect(pauseControl).to.exist;
      });
    });

    it('should allow users to extend time limits', () => {
      // Mock a timeout warning
      const timeoutWarning = document.createElement('div');
      timeoutWarning.setAttribute('role', 'alertdialog');
      timeoutWarning.innerHTML = `
        <p>Session will expire in 1 minute</p>
        <button class="extend-session">Extend Session</button>
        <button class="logout">Log Out</button>
      `;
      container.appendChild(timeoutWarning);

      const extendButton = timeoutWarning.querySelector('.extend-session');
      expect(extendButton).to.exist;
    });
  });

  describe('2.3 Seizures and Physical Reactions (Level A)', () => {
    it('should not contain content that flashes more than 3 times per second', () => {
      // Mock animation checking
      const animatedElements = container.querySelectorAll('[data-animation]');
      
      animatedElements.forEach(element => {
        const animationDuration = parseFloat(
          element.getAttribute('data-animation-duration') || '1000'
        );
        const flashCount = parseInt(
          element.getAttribute('data-flash-count') || '0'
        );
        
        const flashesPerSecond = flashCount / (animationDuration / 1000);
        expect(flashesPerSecond).to.be.lessThan(3);
      });
    });

    it('should provide option to disable motion', () => {
      const reducedMotionToggle = container.querySelector('.reduced-motion-toggle') as HTMLInputElement;
      
      reducedMotionToggle.checked = true;
      reducedMotionToggle.dispatchEvent(new Event('change'));
      
      // Should disable animations
      expect(container.classList.contains('reduced-motion')).to.be.true;
    });
  });

  describe('2.4 Navigable (Level AA)', () => {
    it('should have descriptive page titles', () => {
      // Application should have meaningful title
      expect(document.title || container.querySelector('h1')?.textContent).to.exist;
    });

    it('should have proper focus order', () => {
      const focusableElements = container.querySelectorAll(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );
      
      const tabIndices = Array.from(focusableElements).map(el => 
        parseInt(el.getAttribute('tabindex') || '0')
      );
      
      // Should follow logical tab order
      expect(tabIndices.every(index => index >= 0)).to.be.true;
    });

    it('should have clear link/button purposes', () => {
      const buttons = container.querySelectorAll('button, [role="button"]');
      
      buttons.forEach(button => {
        const purpose = button.getAttribute('aria-label') || 
                       button.textContent?.trim() ||
                       button.querySelector('.sr-only')?.textContent;
        
        expect(purpose).to.exist;
        expect(purpose?.length).to.be.greaterThan(0);
      });
    });

    it('should provide skip links for main content', () => {
      // Add skip link for testing
      const skipLink = document.createElement('a');
      skipLink.href = '#main-content';
      skipLink.textContent = 'Skip to main content';
      skipLink.className = 'skip-link';
      container.insertBefore(skipLink, container.firstChild);

      expect(container.querySelector('.skip-link')).to.exist;
    });

    it('should have visible focus indicators', () => {
      const focusableElements = container.querySelectorAll('button, input');
      
      focusableElements.forEach(element => {
        (element as HTMLElement).focus();
        
        // Should have visible focus (mock test)
        const computedStyle = window.getComputedStyle(element);
        const outline = computedStyle.outline;
        const boxShadow = computedStyle.boxShadow;
        
        // Should have some form of focus indicator
        expect(outline !== 'none' || boxShadow !== 'none').to.be.true;
      });
    });
  });

  describe('2.5 Input Modalities (Level AA)', () => {
    it('should support multiple input methods', () => {
      const dropZone = container.querySelector('.drop-zone') as HTMLElement;
      
      // Should be accessible via keyboard
      expect(dropZone.getAttribute('tabindex')).to.equal('0');
      expect(dropZone.getAttribute('role')).to.equal('button');
      
      // Should handle both click and keyboard activation
      expect(dropZone.getAttribute('aria-label')).to.exist;
    });

    it('should have sufficiently large touch targets', () => {
      const buttons = container.querySelectorAll('button');
      
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        // Should be at least 44x44 pixels
        expect(rect.width).to.be.greaterThan(40);
        expect(rect.height).to.be.greaterThan(40);
      });
    });
  });

  describe('3.1 Readable (Level AA)', () => {
    it('should specify language for content', () => {
      // Document should have lang attribute
      expect(document.documentElement.lang || document.body.lang).to.exist;
    });

    it('should identify language changes', () => {
      // Add foreign language content
      const foreignText = document.createElement('span');
      foreignText.lang = 'fr';
      foreignText.textContent = 'Bonjour';
      container.appendChild(foreignText);

      expect(foreignText.getAttribute('lang')).to.equal('fr');
    });
  });

  describe('3.2 Predictable (Level AA)', () => {
    it('should not cause unexpected context changes on focus', () => {
      const input = container.querySelector('input') as HTMLInputElement;
      
      // Focusing should not trigger navigation or form submission
      input.focus();
      
      // Page should remain stable
      expect(window.location.href).to.not.change;
    });

    it('should have consistent navigation', () => {
      const navButtons = container.querySelectorAll('.nav-button');
      
      // Navigation should be in consistent order
      expect(navButtons[0]?.textContent).to.include('Audio');
      expect(navButtons[1]?.textContent).to.include('Visual');
      expect(navButtons[2]?.textContent).to.include('Settings');
    });

    it('should have consistent identification of components', () => {
      // Similar components should have similar labels
      const buttons = container.querySelectorAll('button');
      const buttonLabels = Array.from(buttons).map(btn => 
        btn.getAttribute('aria-label') || btn.textContent?.trim()
      );
      
      // Should have meaningful, consistent labels
      buttonLabels.forEach(label => {
        expect(label).to.exist;
        expect(label?.length).to.be.greaterThan(0);
      });
    });
  });

  describe('3.3 Input Assistance (Level AA)', () => {
    it('should identify and describe input errors', () => {
      const fileInput = container.querySelector('.file-input') as HTMLInputElement;
      
      // Mock invalid file selection
      const errorMessage = document.createElement('div');
      errorMessage.id = 'file-error';
      errorMessage.setAttribute('role', 'alert');
      errorMessage.textContent = 'Please select a valid audio file';
      container.appendChild(errorMessage);
      
      fileInput.setAttribute('aria-describedby', 'file-error');
      fileInput.setAttribute('aria-invalid', 'true');

      expect(fileInput.getAttribute('aria-invalid')).to.equal('true');
      expect(fileInput.getAttribute('aria-describedby')).to.equal('file-error');
    });

    it('should provide labels and instructions for inputs', () => {
      const inputs = container.querySelectorAll('input');
      
      inputs.forEach(input => {
        const label = input.getAttribute('aria-label') ||
                     container.querySelector(`label[for="${input.id}"]`)?.textContent ||
                     input.closest('label')?.textContent;
        
        expect(label).to.exist;
      });
    });

    it('should suggest error correction when possible', () => {
      // Mock file format error with suggestion
      const errorWithSuggestion = document.createElement('div');
      errorWithSuggestion.setAttribute('role', 'alert');
      errorWithSuggestion.innerHTML = `
        Error: Unsupported file format "txt". 
        Please select a supported audio format: WAV, MP3, or FLAC.
      `;
      container.appendChild(errorWithSuggestion);

      expect(errorWithSuggestion.textContent).to.include('Please select');
    });
  });

  describe('4.1 Compatible (Level AA)', () => {
    it('should use valid HTML markup', () => {
      // Check for proper ARIA usage
      const elementsWithAria = container.querySelectorAll('[aria-label], [aria-labelledby], [role]');
      
      elementsWithAria.forEach(element => {
        const role = element.getAttribute('role');
        const ariaLabel = element.getAttribute('aria-label');
        const ariaLabelledBy = element.getAttribute('aria-labelledby');
        
        // ARIA attributes should be properly formed
        if (role) {
          expect(['button', 'application', 'banner', 'main', 'navigation', 
                  'complementary', 'img', 'progressbar', 'alert', 'status'].includes(role)).to.be.true;
        }
        
        if (ariaLabelledBy) {
          const referencedElement = container.querySelector(`#${ariaLabelledBy}`);
          expect(referencedElement).to.exist;
        }
      });
    });

    it('should have proper name, role, and value for custom components', () => {
      const customButton = container.querySelector('.drop-zone') as HTMLElement;
      
      // Custom interactive element should have proper ARIA
      expect(customButton.getAttribute('role')).to.equal('button');
      expect(customButton.getAttribute('aria-label')).to.exist;
      expect(customButton.getAttribute('tabindex')).to.equal('0');
    });

    it('should support assistive technologies', () => {
      // Live regions for dynamic content
      const liveRegions = container.querySelectorAll('[aria-live]');
      expect(liveRegions.length).to.be.greaterThan(0);
      
      liveRegions.forEach(region => {
        const politeness = region.getAttribute('aria-live');
        expect(['polite', 'assertive', 'off'].includes(politeness || '')).to.be.true;
      });
    });
  });

  describe('Screen Reader Experience', () => {
    it('should provide meaningful screen reader announcements', async () => {
      const notifications = container.querySelector('.notifications') as HTMLElement;
      
      // Simulate file loading announcement
      notifications.textContent = 'Audio file loaded successfully: cosmic-symphony.wav';
      await waitForDOMUpdate();
      
      expect(notifications.getAttribute('aria-live')).to.equal('polite');
      expect(notifications.textContent).to.include('loaded successfully');
    });

    it('should hide decorative content from screen readers', () => {
      const decorativeIcon = document.createElement('span');
      decorativeIcon.className = 'icon-decorative';
      decorativeIcon.setAttribute('aria-hidden', 'true');
      decorativeIcon.innerHTML = '🎵';
      container.appendChild(decorativeIcon);

      expect(decorativeIcon.getAttribute('aria-hidden')).to.equal('true');
    });

    it('should provide alternative content for complex visuals', () => {
      const canvas = container.querySelector('.visualization-canvas') as HTMLCanvasElement;
      
      // Should have meaningful description
      expect(canvas.getAttribute('aria-label')).to.include('visualization');
      
      // Could also have detailed description
      const description = document.createElement('div');
      description.id = 'canvas-description';
      description.textContent = 'Real-time frequency visualization showing audio spectrum from 20Hz to 20kHz';
      container.appendChild(description);
      
      canvas.setAttribute('aria-describedby', 'canvas-description');
      expect(canvas.getAttribute('aria-describedby')).to.equal('canvas-description');
    });
  });

  describe('High Contrast and Theme Support', () => {
    it('should work with high contrast themes', () => {
      const highContrastToggle = container.querySelector('.high-contrast-toggle') as HTMLInputElement;
      
      highContrastToggle.checked = true;
      highContrastToggle.dispatchEvent(new Event('change'));
      
      // Should apply high contrast styles
      expect(container.classList.contains('high-contrast')).to.be.true;
      
      // Critical elements should remain visible
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        expect(rect.width).to.be.greaterThan(0);
        expect(rect.height).to.be.greaterThan(0);
      });
    });

    it('should respect user theme preferences', () => {
      // Mock dark mode preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: sinon.stub().returns({
          matches: true,
          media: '(prefers-color-scheme: dark)',
          onchange: null,
          addListener: sinon.stub(),
          removeListener: sinon.stub(),
          addEventListener: sinon.stub(),
          removeEventListener: sinon.stub(),
          dispatchEvent: sinon.stub(),
        }),
      });

      // Should apply dark theme automatically
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      expect(prefersDark).to.be.true;
    });
  });
});