import { createTheme } from "@material-ui/core/styles";

// Teal accents and a pitch-black dark background
const customTheme = (darkMode) =>
  createTheme({
    shape: {
      borderRadius: 16,
    },
    palette: {
      type: darkMode ? "dark" : "light",
      primary: {
        // accent color (user requested)
        main: "#ff4520ff",
      },
      secondary: {
        main: "#ff4520ff",
      },
      background: darkMode
        ? { default: "#1a1a1a", paper: "#1a1a1a" }
        : { default: "#fafafa", paper: "#ffffff" },
      text: {
        primary: darkMode ? "#ffffffff" : "#000000",
      },
    },
    overrides: {
      // Make boxes rounded across common components
      MuiPaper: {
        rounded: {
          borderRadius: 12,
        },
      },
      MuiCard: {
        root: {
          borderRadius: 12,
        },
      },
      MuiDialog: {
        paper: {
          borderRadius: 12,
        },
      },
      MuiOutlinedInput: {
        root: {
          borderRadius: 12,
        },
      },
      MuiButton: {
        root: {
          borderRadius: 12,
        },
      },
      MuiMenu: {
        paper: {
          borderRadius: 12,
        },
      },
      MuiTypography: {
        root: {
          wordBreak: "break-word",
        },
      },
      // Tab styling configuration
      MuiTab: {
        root: {
          // thinner tabs vertically and slightly narrower horizontally
          minWidth: 80,
          minHeight: 40,
          padding: '6px 12px',
          marginRight: 12,
          fontSize: '0.95rem',
          textTransform: 'none',
        },
        selected: {
          color: '#ff4520ff',
        },
        textColorPrimary: {
          '&$selected': {
            color: '#ff4520ff',
          },
        },
      },
      MuiTabs: {
        indicator: {
          backgroundColor: '#ff4520ff',
          height: 1,              // thickness of indicator underline
          borderRadius: 3,
        },
      },
    },
  });

export default customTheme;
