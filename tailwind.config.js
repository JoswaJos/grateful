/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: "#FFF8F0",
        accent: "#F4845F",
        ink: "#2D2A26",
        muted: "#8A8580",
        surface: "#FFFFFF",
      },
    },
  },
  plugins: [],
};
