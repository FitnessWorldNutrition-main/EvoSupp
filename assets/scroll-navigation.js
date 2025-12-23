/**
 * Scroll Navigation for CSS Scroll-Snap Containers
 * Adds arrow navigation to horizontally scrolling sections
 * Safari/iOS compatible version
 */

document.addEventListener('DOMContentLoaded', function() {
  const scrollNavContainers = document.querySelectorAll('[data-scroll-nav]');
  
  scrollNavContainers.forEach(wrapper => {
    const container = wrapper.querySelector('[data-scroll-container]');
    const prevBtn = wrapper.querySelector('[data-scroll-prev]');
    const nextBtn = wrapper.querySelector('[data-scroll-next]');
    
    if (!container || !prevBtn || !nextBtn) {
      return;
    }
    
    let isScrolling = false;
    
    // Custom smooth scroll function for Safari/iOS compatibility
    function smoothScrollTo(element, targetPosition, duration) {
      if (isScrolling) return;
      isScrolling = true;
      
      const startPosition = element.scrollLeft;
      const distance = targetPosition - startPosition;
      const startTime = performance.now();
      
      // Temporarily disable scroll-snap for smooth animation
      const originalSnapType = element.style.scrollSnapType;
      element.style.scrollSnapType = 'none';
      
      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }
      
      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        
        element.scrollLeft = startPosition + (distance * easedProgress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Re-enable scroll-snap after animation
          element.style.scrollSnapType = originalSnapType;
          isScrolling = false;
          updateButtons();
        }
      }
      
      requestAnimationFrame(animate);
    }
    
    // Get scroll amount (one item width or container width)
    function getScrollAmount() {
      const firstItem = container.querySelector('.columns, .logo-list--logo, [class*="column"]');
      if (firstItem) {
        return firstItem.offsetWidth;
      }
      return container.offsetWidth * 0.8;
    }
    
    // Update button states
    function updateButtons() {
      const isAtStart = container.scrollLeft <= 1;
      const isAtEnd = container.scrollLeft >= container.scrollWidth - container.offsetWidth - 1;
      
      if (prevBtn.tagName === 'BUTTON') {
        prevBtn.disabled = isAtStart;
        nextBtn.disabled = isAtEnd;
      }
      
      prevBtn.classList.toggle('disabled', isAtStart);
      nextBtn.classList.toggle('disabled', isAtEnd);
    }
    
    // Scroll to previous items
    function scrollPrev(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (isScrolling) return;
      
      const scrollAmount = getScrollAmount();
      const targetPosition = Math.max(0, container.scrollLeft - scrollAmount);
      smoothScrollTo(container, targetPosition, 400);
    }
    
    // Scroll to next items
    function scrollNext(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (isScrolling) return;
      
      const scrollAmount = getScrollAmount();
      const maxScroll = container.scrollWidth - container.offsetWidth;
      const targetPosition = Math.min(maxScroll, container.scrollLeft + scrollAmount);
      smoothScrollTo(container, targetPosition, 400);
    }
    
    // Event listeners - use both click and touchend for better mobile support
    prevBtn.addEventListener('click', scrollPrev);
    nextBtn.addEventListener('click', scrollNext);
    
    // Touch events for mobile
    let touchHandled = false;
    prevBtn.addEventListener('touchend', function(e) {
      e.preventDefault();
      if (!touchHandled) {
        touchHandled = true;
        scrollPrev(e);
        setTimeout(function() { touchHandled = false; }, 100);
      }
    }, { passive: false });
    
    nextBtn.addEventListener('touchend', function(e) {
      e.preventDefault();
      if (!touchHandled) {
        touchHandled = true;
        scrollNext(e);
        setTimeout(function() { touchHandled = false; }, 100);
      }
    }, { passive: false });
    
    container.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);
    
    // Initial state
    updateButtons();
  });
});
