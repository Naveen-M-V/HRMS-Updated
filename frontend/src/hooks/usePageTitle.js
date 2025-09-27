import { useEffect } from 'react';

const usePageTitle = (title) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} - Talent Shield` : 'Talent Shield';
    
    // Cleanup function to restore previous title
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};

export default usePageTitle;
