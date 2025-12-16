const wrappers = Array.from(document.querySelectorAll('.disorder-wrapper'));
const dots = Array.from(document.querySelectorAll('.dot'));
const upArrow = document.getElementById('up-arrow');
const downArrow = document.getElementById('down-arrow');

let currentIndex = wrappers.findIndex(wrapper => wrapper.classList.contains('active'));

// Helper function to show a box with smooth animation
function showBox(index) {
    if (index < 0 || index >= wrappers.length || index === currentIndex) return;

    const currentBox = wrappers[currentIndex];
    const nextBox = wrappers[index];

    // Animate current box out
    currentBox.style.opacity = 0;
    currentBox.style.transform = 'translateY(20px)';
    setTimeout(() => {
        currentBox.style.display = 'none';
        currentBox.classList.remove('active');
    }, 600); // match your CSS transition duration

    // Animate next box in
    nextBox.style.display = 'block';
    setTimeout(() => {
        nextBox.style.opacity = 1;
        nextBox.style.transform = 'translateY(0)';
        nextBox.classList.add('active');
    }, 600); // slight delay to trigger transition

    // Update dots
    dots[currentIndex].classList.remove('active');
    dots[index].classList.add('active');

    currentIndex = index;
}

// Arrow clicks
upArrow.addEventListener('click', () => {
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = wrappers.length - 1;
    showBox(prevIndex);
});

downArrow.addEventListener('click', () => {
    let nextIndex = currentIndex + 1;
    if (nextIndex >= wrappers.length) nextIndex = 0;
    showBox(nextIndex);
});

// Dot clicks
dots.forEach((dot, i) => {
    dot.addEventListener('click', () => showBox(i));
});
