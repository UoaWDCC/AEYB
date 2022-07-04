module.exports = {
  mode : "jit",
  content: ['./src/**/*.{js,jsx,ts,tsx,vue}'],
  theme: {
    screens: {
      'sm': '480px',
      // => @media (min-width: 640px) { ... }

      'md': '547px',
      // => @media (min-width: 768px) { ... }

      'lg': '768px',
      // => @media (min-width: 1024px) { ... }

      'xl': '1024px',
      // => @media (min-width: 1280px) { ... }

      '2xl': '1680px',
      // => @media (min-width: 1536px) { ... }
    },

    extend: {
      colors: {
        primary: "#5a6275",
      }
    },
  },
  plugins: [],
}
