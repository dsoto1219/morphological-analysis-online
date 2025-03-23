/* Code from https://reynoldsnlp.com/hfst-wasm/ */
let hfst;
let french_transducer;
const analyzeBtn = document.querySelector('.analyzeButton')
prepareResources();

async function prepareResources() {
    console.log('Loading HFST module...');
    await createHfstModule().then((hfstModule) => {
        hfst = hfstModule;
        console.log('    ...HFST module loaded as `hfst`');
    });
    console.log('Loading French analyzer...');
    await hfst.FS.createPreloadedFile('/', 'french.hfst.ol', './french.hfst.ol', true, false);
    // Wait until the file is loaded
    while (!hfst.FS.analyzePath('/french.hfst.ol').exists) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('    ...french.hfst.ol file loaded in Emscripten filesystem...');
    french_transducer = loadTransducer("/french.hfst.ol");
    console.log('    ...French analyzer loaded as `french_transducer`', french_transducer);
    analyzeBtn.disabled = false;
}

function loadTransducer(path) {
    let instream = new hfst.HfstInputStream(path);
    transducer = instream.read();
    if (!instream.is_eof()) {  // If stream has not reached end-of-file
    console.warn(`The given transducer file (${path}) contains
        more than one transducer. Only the first one is loaded.`);
    }
    instream.close();
    return transducer;
}

analyzeBtn.addEventListener('click', analyzeWord);
const textInput = document.querySelector('.textInput')
const resultsDiv = document.querySelector('.results');

function analyzeWord() {
    const word = textInput.value.trim();

    if (!word) {
        resultsDiv.textContent = 'Please enter a word to analyze';
        return;
    }

    try {
        const results = french_transducer.lookup(word);
        console.log(`Results (${word}):`, results);

        if (results.length === 0) {
            resultsDiv.textContent = 'No analysis found for: ' + word;
        } else {
            let resultHtml = '<p>Analysis results:</p><ul>';

            for (let result of results) {
            resultHtml += '<li>' + result[0].join('') + ' (weight: ' + result[1] + ')</li>';
            }

            resultHtml += '</ul>';
            resultsDiv.innerHTML = resultHtml;
        }
    } catch (error) {
        console.error('Error in lookup:', error);
        resultsDiv.textContent = 'Error analyzing word: ' + error.message;
    }
}
/* End of code from https://reynoldsnlp.com/hfst-wasm/ */

function tokenized(str) {
    return str.split(' ');
}

// Not being used for now
// const analysis = document.querySelector('.results');
// textInput.addEventListener('input', function() {
//     tokens = tokenized(textInput.value);
//     // Get array of analyzed tokens (this currently
//     // does nothing)
//     analyzed = tokens
//     analysis.textContent = analyzed.join(' ')
// })