module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#6B705C',
        secondary: '#A5A58D',
        'custom-green': '#7dad7d',
        'custom-brown': '#CB997E',
        'success': '#82d616',
        'info': '#17c1e8',
        'warning': '#fbcf33',
        'danger': '#ea0606',
        'light': '#e9ecef',
        'dark': '#344767',
      },
      fontFamily: {
        'dancing': ['Dancing Script', 'cursive'],
        'great-vibes': ['Great Vibes', 'cursive'],
        'sans': ['Roboto', 'Arial', 'sans-serif'],
      },
      margin: {
        '7.5': '1.875rem', // 30px
      },
      boxShadow: {
        'soft-xxs': '0 1px 5px 1px #ddd',
        'soft-xs': '0 3px 5px -1px rgba(0,0,0,.09),0 2px 3px -1px rgba(0,0,0,.07)',
        'soft-sm': '0 .25rem .375rem -.0625rem hsla(0,0%,8%,.12),0 .125rem .25rem -.0625rem hsla(0,0%,8%,.07)',
        'soft-md': '0 4px 7px -1px rgba(0,0,0,.11),0 2px 4px -1px rgba(0,0,0,.07)',
        'soft-lg': '0 12px 22px -5px rgba(0,0,0,.13),0 10px 10px -5px rgba(0,0,0,.04)',
      },
    },
  },
  plugins: [],
};