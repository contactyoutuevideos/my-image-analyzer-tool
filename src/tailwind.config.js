/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // এটি নিশ্চিত করে যে Tailwind আপনার React ফাইলগুলো স্ক্যান করবে
    "./public/index.html" // যদি আপনি public/index.html এ সরাসরি Tailwind ক্লাস ব্যবহার করেন
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}