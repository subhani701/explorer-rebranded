// Voltuswave Customization Script
// Handles footer branding removal and navbar fixes
(function() {
  console.log('[Voltuswave] Customization script loaded');

  function applyCustomizations() {
    // ========== FOOTER CUSTOMIZATIONS ==========
    var footer = document.querySelector('footer');
    if (footer) {
      // Hide the first section (Add wallet button + blockscout description)
      var firstSection = footer.children[0];
      if (firstSection && firstSection.tagName === 'DIV') {
        // Check if it contains the wallet button or blockscout text
        if (firstSection.querySelector('button') ||
            (firstSection.textContent && firstSection.textContent.includes('Blockscout'))) {
          firstSection.style.cssText = 'display: none !important;';
        }
      }

      // In the links section, hide Blockscout column but keep Voltuswave
      var linksSection = footer.children[1];
      if (linksSection) {
        Array.from(linksSection.children).forEach(function(col) {
          var hasVoltuswave = col.textContent && col.textContent.includes('Voltuswave');
          if (!hasVoltuswave) {
            col.style.cssText = 'display: none !important;';
          }
        });
      }

      // Hide specific Blockscout links anywhere in footer
      footer.querySelectorAll('a').forEach(function(a) {
        if (a.href && (
          a.href.includes('blockscout.com') ||
          a.href.includes('discord.gg') ||
          a.href.includes('github.com/blockscout') ||
          a.href.includes('github.com/sponsors') ||
          a.href.includes('giveth.io') ||
          a.href.includes('canny.io')
        )) {
          var parent = a.closest('div');
          if (parent) parent.style.cssText = 'display: none !important;';
        }
      });

      // Hide buttons (Add to wallet)
      footer.querySelectorAll('button').forEach(function(btn) {
        btn.style.cssText = 'display: none !important;';
      });

      // Hide Blockscout description paragraphs
      footer.querySelectorAll('p').forEach(function(p) {
        if (p.textContent && p.textContent.includes('Blockscout')) {
          p.style.cssText = 'display: none !important;';
        }
      });

      // Hide version info
      footer.querySelectorAll('span, div').forEach(function(el) {
        if (el.textContent && (
          el.textContent.includes('Backend:') ||
          el.textContent.includes('Frontend:')
        )) {
          el.style.cssText = 'display: none !important;';
        }
      });
    }

    // ========== NAVBAR CUSTOMIZATIONS ==========
    // Find the navbar/header
    var header = document.querySelector('header');
    var nav = document.querySelector('nav');
    var topBar = header || nav;

    if (topBar) {
      // Make sure navbar items are visible
      topBar.querySelectorAll('a, button').forEach(function(item) {
        // Ensure visibility
        if (item.style.display === 'none' || item.style.visibility === 'hidden') {
          item.style.cssText = 'display: flex !important; visibility: visible !important;';
        }
      });

      // Remove empty space - if navbar has hidden children, reduce its height
      var visibleChildren = Array.from(topBar.querySelectorAll(':scope > *')).filter(function(child) {
        var style = window.getComputedStyle(child);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });

      if (visibleChildren.length === 0) {
        topBar.style.cssText = 'min-height: auto !important; padding: 8px !important;';
      }
    }

    // Fix sidebar navigation if buttons are hidden
    var sidebar = document.querySelector('[class*="sidebar"], [class*="Sidebar"], aside');
    if (sidebar) {
      sidebar.querySelectorAll('a, button').forEach(function(item) {
        var style = window.getComputedStyle(item);
        if (style.display === 'none') {
          item.style.cssText = 'display: flex !important;';
        }
      });
    }
  }

  // Run immediately
  applyCustomizations();

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCustomizations);
  }

  // Run multiple times for React hydration
  setTimeout(applyCustomizations, 300);
  setTimeout(applyCustomizations, 800);
  setTimeout(applyCustomizations, 1500);
  setTimeout(applyCustomizations, 3000);

  // Use MutationObserver for dynamic content
  var observer = new MutationObserver(function() {
    applyCustomizations();
  });

  function startObserver() {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      setTimeout(startObserver, 100);
    }
  }
  startObserver();
})();
