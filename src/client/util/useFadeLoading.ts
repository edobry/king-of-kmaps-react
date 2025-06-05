import React from 'react';

/**
 * Custom hook that provides fade in/out loading states for smooth UX.
 * Fast fade in (50ms) for immediate feedback, slower fade out (200ms) for polish.
 */
export const useFadeLoading = (isPending: boolean) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [fadeState, setFadeState] = React.useState<'hidden' | 'fade-in' | 'fade-out'>('hidden');

    React.useEffect(() => {
        if (isPending) {
            // Show immediately and start fast fade in
            setIsVisible(true);
            setFadeState('fade-in');
        } else {
            // Start slower fade out
            setFadeState('fade-out');
            // Hide element after fade completes
            setTimeout(() => {
                setIsVisible(false);
                setFadeState('hidden');
            }, 200);
        }
    }, [isPending]);

    return { isVisible, fadeState };
}; 
