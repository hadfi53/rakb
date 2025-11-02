import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Composant qui fait défiler la page vers le haut lors des changements de route
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll vers le haut à chaque changement de route
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // 'smooth' pour une animation, 'instant' pour immédiat
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;

