// JavaScript to generate random stars in the background
document.addEventListener('DOMContentLoaded', function () {
  const starContainer = document.querySelector('.background-container')
  const numStars = 100 // Adjust number of stars

  for (let i = 0; i < numStars; i++) {
    const star = document.createElement('div')
    star.classList.add('star')

    const size = Math.random() * 2 + 1 // Star size between 1px and 3px
    star.style.width = `${size}px`
    star.style.height = `${size}px`

    star.style.top = `${Math.random() * 100}%`
    star.style.left = `${Math.random() * 100}%`

    // Vary animation delay for a twinkling effect
    star.style.animationDelay = `${Math.random() * 5}s`

    starContainer.appendChild(star)
  }
})
