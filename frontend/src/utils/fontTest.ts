// Utility to test if SF Pro Display font is loaded
export const testFontLoading = () => {
  if (typeof window !== 'undefined') {
    // Check if SF Pro Display is available
    const testElement = document.createElement('div');
    testElement.style.fontFamily = 'SF Pro Display, sans-serif';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.style.fontSize = '72px';
    testElement.textContent = 'Test';
    
    document.body.appendChild(testElement);
    
    const computedStyle = window.getComputedStyle(testElement);
    const fontFamily = computedStyle.fontFamily;
    
    document.body.removeChild(testElement);
    
    console.log('Font family detected:', fontFamily);
    return fontFamily.includes('SF Pro Display');
  }
  return false;
};

// Auto-test on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const isLoaded = testFontLoading();
      console.log('SF Pro Display loaded:', isLoaded);
    }, 1000);
  });
}
