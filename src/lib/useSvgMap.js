import { useEffect, useState } from 'react';

/**
 * Hook to load and parse SVG map file
 * Returns viewBox and paths extracted from the SVG
 */
export function useSvgMap() {
  const [svgData, setSvgData] = useState({ viewBox: '0 0 1000 500', paths: {} });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSvg() {
      try {
        const response = await fetch('/map.svg');
        const svgText = await response.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        
        const svgElement = svgDoc.querySelector('svg');
        const viewBox = svgElement?.getAttribute('viewBox') || '0 0 1000 500';
        
        const paths = {};
        // Ищем по id для лучшей совместимости с редакторами
        const pathElements = svgDoc.querySelectorAll('path[id]');
        pathElements.forEach((path) => {
          const zoneId = path.getAttribute('id');
          const d = path.getAttribute('d');
          if (zoneId && d) {
            paths[zoneId] = d;
          }
        });
        
        setSvgData({ viewBox, paths });
      } catch (error) {
        console.error('Failed to load SVG map:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSvg();
  }, []);

  return { ...svgData, isLoading };
}

