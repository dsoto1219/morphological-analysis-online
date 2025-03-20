function tokenized(str) {
    return str.split(' ');
}

const input = document.querySelector('.text-input');
const analysis = document.querySelector('.analysis');
input.addEventListener('input', function() {
    tokens = tokenized(input.value);
    // Get array of analyzed tokens (this currently
    // does nothing)
    analyzed = tokens
    analysis.textContent = analyzed.join(' ')
})