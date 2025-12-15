module.exports = {
    content: [
        './index.html',
        './src/**/*.{js,jsx,ts,tsx}'
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Montserrat', 'sans-serif'],
            },
            colors: {
                'brand': '#16a34a',
                'brand-dark': '#15803d',
                'outfit': {
                    600: '#9333ea',
                }
            }
        },
    },
    plugins: [],
}
