export interface ColorTheme {
  isDark: boolean;
  maroon: {
    primary: string;
    deep: string;
  };
  gold: {
    accent: string;
  };
  surface: {
    base: string;
    card: string;
    cardSubtle: string;
    border: string;
    inputBg: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  semantic: {
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    error: string;
    errorBg: string;
    info: string;
  };
}

export const lightTheme: ColorTheme = {
  isDark: false,
  maroon: {
    primary: '#7A1F3D',
    deep: '#4E1327',
  },
  gold: {
    accent: '#C9A227',
  },
  surface: {
    base: '#FFFDF9',
    card: '#FBF3E7',
    cardSubtle: '#F5EBDD',
    border: '#E8DCCE',
    inputBg: '#FFFFFF',
  },
  text: {
    primary: '#241016',
    secondary: '#6B5A60',
    muted: '#9C888F',
    inverse: '#FFFFFF',
  },
  semantic: {
    success: '#2E7D4F',
    successBg: '#E9F5EE',
    warning: '#B8860B',
    warningBg: '#FAF3DC',
    error: '#B3261E',
    errorBg: '#FCECEB',
    info: '#1A649B',
  },
};

export const darkTheme: ColorTheme = {
  isDark: true,
  maroon: {
    primary: '#B8446B',
    deep: '#7A1F3D',
  },
  gold: {
    accent: '#E3C567',
  },
  surface: {
    base: '#160C10',
    card: '#241620',
    cardSubtle: '#2E1D2A',
    border: '#3D2837',
    inputBg: '#1D1117',
  },
  text: {
    primary: '#F5EDE7',
    secondary: '#C9B8BE',
    muted: '#8A777E',
    inverse: '#160C10',
  },
  semantic: {
    success: '#3AA76D',
    successBg: '#14291D',
    warning: '#D6A429',
    warningBg: '#2E2611',
    error: '#D94D45',
    errorBg: '#331616',
    info: '#4FA1DF',
  },
};
