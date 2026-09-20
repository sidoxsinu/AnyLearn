import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mint: '#CFF7D3',
        lavender: '#F1D3FA',
        butter: '#FBE8B0',
        sky: '#D5F1F7',
        pink: '#FF8FC7',
        black: '#0A0A0A',
        'off-white': '#F7F7F7',
        grey: '#F0F0F0',
        shell: '#0A0A0A',
        content: '#F7F7F7',
        secondary: '#F0F0F0',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Outfit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        panel: '40px',
        'panel-sm': '20px',
        pill: '9999px',
      },
      boxShadow: {
        toolbar: '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
        'dei-card': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
