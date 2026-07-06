// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0E4C7C',   // Azul Cartógrafo — primario
          dark: '#0A3A61',
          light: '#E8F1F8',
        },
        accent: {
          DEFAULT: '#C97A2B',   // Ocre Tierra — acciones cálidas (ej. "Ir con Maps")
          dark: '#A8611E',
          light: '#FBEEE0',
        },
        success: '#1B7A5C',     // Verde Matrícula — indicadores positivos
        mist: '#F4F6F9',        // fondo general
        ink: '#16232E',         // texto principal
        route: '#8A97A3',       // texto secundario / metadatos
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}