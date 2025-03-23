/* Code from https://reynoldsnlp.com/hfst-wasm/ */
let hfst;
let transducer;

const langInfo = {
    "french": {
        "file" : "french.hfst.ol",
        "placeholder" : "Entrez un mot à analyser"
    },
    "english": {
        "file" : "english.hfstol",
        "placeholder" : "Enter a word to analyze"
    }
};

const langSelect = document.querySelector('.langSelect');
let lang = langSelect.value;
const textInput = document.querySelector('.textInput')
textInput.placeholder = langInfo[lang]['placeholder'];

const analyzeBtn = document.querySelector('.analyzeButton')
prepareResources();

async function prepareResources() {
    console.log('Loading HFST module...');
    await createHfstModule().then((hfstModule) => {
        hfst = hfstModule;
        console.log('    ...HFST module loaded as `hfst`');
    });
    console.log('Loading French analyzer...');
    let lf = langInfo[lang]["file"];
    await hfst.FS.createPreloadedFile('/', lf, './' + lf, true, false);
    // Wait until the file is loaded
    while (!hfst.FS.analyzePath('/' + lf).exists) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(`    ...${lf} file loaded in Emscripten filesystem...`);
    transducer = loadTransducer('/' + lf);
    console.log(`    ...${lang} analyzer loaded as \`transducer\``, transducer);
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
const resultsDiv = document.querySelector('.resultsDiv');

function analyzeWord() {
    const word = textInput.value.trim();

    if (!word) {
        resultsDiv.textContent = 'Please enter a word to analyze';
        return;
    }

    try {
        const results = transducer.lookup(word);
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

function capitalizeFirstChar(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const title = document.querySelector('.title')
langSelect.addEventListener('change', () => {
    lang = langSelect.value;
    textInput.placeholder = langInfo[lang]['placeholder'];
    resultsDiv.textContent = '';
    title.textContent = capitalizeFirstChar(lang) + 
                        ' Morphological Analysis'
    console.log('Language selected:', lang);
})

// Not being used for now
// textInput.addEventListener('input', function() {
//     tokens = tokenized(textInput.value);
//     // Get array of analyzed tokens (this currently
//     // does nothing)
//     analyzed = tokens
//     analysis.textContent = analyzed.join(' ')
// })