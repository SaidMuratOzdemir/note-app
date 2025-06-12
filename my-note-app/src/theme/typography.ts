import { Colors } from './colors';

export const Typography = {
  // Headers
  h1: { 
    fontSize: 28, 
    fontWeight: 'bold' as const, 
    color: Colors.neutral.darkGray,
    lineHeight: 34 
  },
  h2: { 
    fontSize: 24, 
    fontWeight: '600' as const, 
    color: Colors.neutral.darkGray,
    lineHeight: 30 
  },
  h3: { 
    fontSize: 20, 
    fontWeight: '600' as const, 
    color: Colors.neutral.darkGray,
    lineHeight: 26 
  },
  h4: { 
    fontSize: 18, 
    fontWeight: '600' as const, 
    color: Colors.neutral.darkGray,
    lineHeight: 24 
  },
  
  // Body text
  body: { 
    fontSize: 14, 
    lineHeight: 20, 
    color: Colors.neutral.darkGray 
  },
  bodyLarge: { 
    fontSize: 16, 
    lineHeight: 24, 
    color: Colors.neutral.darkGray 
  },
  
  // Specialized text
  date: { 
    fontSize: 18, 
    fontWeight: '500' as const, 
    color: Colors.neutral.darkGray 
  },
  timestamp: { 
    fontSize: 12, 
    color: Colors.textGray 
  },
  tag: { 
    fontSize: 12, 
    fontWeight: '500' as const,
    color: Colors.neutral.darkGray 
  },
  
  // UI text
  button: { 
    fontSize: 16, 
    fontWeight: '600' as const
  },
  caption: { 
    fontSize: 12, 
    color: Colors.textGray 
  },
  
  // Legacy compatibility (will be removed in Phase 5)
  title: { fontSize: 24, fontWeight: 'bold' as const, color: Colors.neutral.darkGray },
  small: { fontSize: 12, color: Colors.textGray },
};
