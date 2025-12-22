/**
 * Scroll Navigation for CSS Scroll-Snap Containers
 * Adds arrow navigation to horizontally scrolling sections
 */

document.addEventListener('DOMContentLoaded', function() {
  const scrollNavContainers = document.querySelectorAll('[data-scroll-nav]');
  
  scrollNavContainers.forEach(wrapper => {
    const container = wrapper.querySelector('[data-scroll-container]');
    const prevBtn = wrapper.querySelector('[data-scroll-prev]');
    const nextBtn = wrapper.querySelector('[data-scroll-next]');
    
    if (!container || !prevBtn || !nextBtn) return;
    
    // Get scroll amount (one visible width)
    function getScrollAmount() {
      return container.offsetWidth;
    }
    
    // Update button states
    function updateButtons() {
      const isAtStart = container.scrollLeft <= 0;
      const isAtEnd = container.scrollLeft >= container.scrollWidth - container.offsetWidth - 10;
      
      prevBtn.disabled = isAtStart;
      nextBtn.disabled = isAtEnd;
      
      prevBtn.classList.toggle('disabled', isAtStart);
      nextBtn.classList.toggle('disabled', isAtEnd);
    }
    
    // Scroll to previous items
    function scrollPrev() {
      const scrollAmount = getScrollAmount();
      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
    
    // Scroll to next items
    function scrollNext() {
      const scrollAmount = getScrollAmount();
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
    
    // Event listeners
    prevBtn.addEventListener('click', scrollPrev);
    nextBtn.addEventListener('click', scrollNext);
    container.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);
    
    // Initial state
    updateButtons();
  });
});
