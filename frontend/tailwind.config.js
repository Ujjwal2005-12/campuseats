/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        smartly: {
          blue: '#2166F3',
          'blue-hover': '#1a54cc',
          'blue-light': '#EDF4FF',
          navy: '#102448',
          bg: '#F3F7FC',
          card: '#FFFFFF',
          border: '#E1E8F0',
          text: '#17243B',
          secondary: '#718096',
          success: '#20A875',
          'success-light': '#EAF7F0',
          warning: '#F4AD32',
          'warning-light': '#FEF7EC',
          danger: '#E65363',
          'danger-light': '#FDEEF0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(16, 36, 72, 0.06), 0 1px 2px rgba(16, 36, 72, 0.04)',
        'dropdown': '0 10px 25px -5px rgba(16, 36, 72, 0.1), 0 8px 10px -6px rgba(16, 36, 72, 0.06)',
      }
    },
  },
  plugins: [],
}
