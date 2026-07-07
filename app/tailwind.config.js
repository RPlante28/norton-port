/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // ROHAN-DOS palette — one source of truth, shared with the CSS :root tokens.
      colors: {
        dos: {
          blue: '#0000a8',
          track: '#001b86',
          sel: '#0030c8',
          panel2: '#13357a',
        },
        cyan: {
          DEFAULT: '#54fcfc',
          bright: '#7afdfd',
        },
        yellow: { DEFAULT: '#fcfc54' },
        green: { DEFAULT: '#3cf06a' },
        ink: '#d4d8dc',
        muted: '#9fc0f0',
        dim: '#6f93d8',
        edge: '#2f6fd0',
        'edge-dim': '#2746b8',
      },
      fontFamily: {
        mono: ["'Space Mono'", 'monospace'],
      },
      boxShadow: {
        dos: '2px 2px 0 #000050',
      },
    },
  },
  plugins: [],
};
