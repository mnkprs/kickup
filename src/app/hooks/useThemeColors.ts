import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export function useThemeColors() {
  const { isDark } = useTheme();
  return useMemo(() => ({
    isDark,
    bg: isDark ? '#1C1B1F' : '#FFFBFE',
    cardBg: isDark ? '#2D2C31' : 'white',
    textPrimary: isDark ? '#E6E1E5' : '#1C1B1F',
    textSecondary: isDark ? '#CAC4D0' : '#49454F',
    borderColor: isDark ? '#49454F' : '#E7E0EC',
  }), [isDark]);
}
