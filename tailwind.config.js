/**
 * Aura & Grid - Design System Configuration
 * Locks in a "zen minimalist" high-end editorial palette.
 * Palette:
 *  - Primary Background (warm off-whites): #faf9f6
 *  - Primary Text (rich dark charcoal): #11100f
 *  - Earthy Accents (muted stone/clay): #8c857b
 *  - Secondary accents: #cfcac4, #2c2825
 */

module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          cream: '#faf9f6',     // Warm Zen off-white
          charcoal: '#11100f',  // Rich elegant absolute dark
          earth: '#8c857b',     // Earthy clay sand
          stone: '#e6e4df',     // Light beige divider/border
          clay: '#3d3a37',      // Warm espresso/dark grey
        }
      },
      fontFamily: {
        // High-end luxury serif headlines
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        // High-legibility modern interface sans
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        // Technical numbers & precise financial tags
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      letterSpacing: {
        'super-wide': '0.15em',
        'editorial': '0.05em',
      },
    },
  },
  plugins: [],
}
