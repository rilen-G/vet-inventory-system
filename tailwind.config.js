export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 18px 45px rgba(15, 23, 42, 0.08)",
      },
      colors: {
        brand: {
          50: "#eef7f2",
          100: "#d7ebdf",
          200: "#b2d7c2",
          300: "#86bd9f",
          400: "#5ea17f",
          500: "#3e7f62",
          600: "#31664f",
          700: "#285141",
          800: "#223f35",
          900: "#1d342d",
        },
        sand: "#f6f1e7",
        ink: "#16202a",
      },
    },
  },
  plugins: [],
};
