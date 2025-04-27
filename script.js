/* Code from https://reynoldsnlp.com/hfst-wasm/ */
let hfst;
let lang;
let transducer;

const langSelect = document.querySelector('.langSelect');
const analyzeBtn = document.querySelector('.analyzeButton')
const textInput = document.querySelector('.textInput')
const resultsDiv = document.querySelector('.resultsDiv');

const credits = document.querySelector('.credits');
const [analyzerName, author] = credits.children
const citation = document.querySelector('.citation');
update();

function update() {
    analyzeBtn.disabled = true;
    lang = langSelect.value;
    textInput.value = ''
    textInput.placeholder = langInfo[lang]['placeholder'];
    resultsDiv.textContent = '';
    prepareResources();

    // Update Credits
    analyzerName.textContent = '';
    analyzerName.replaceChildren();
    if (analyzerNameStr = langInfo[lang]['analyzer-name']) {
        analyzerName.textContent = 'Analyzer Name: ';
        let a = document.createElement('a');
        a.textContent = analyzerNameStr;
        if (link = langInfo[lang]['link']) {
            a.href = link;
        } else if (analyzerName.href) {
            a.removeAttribute('href');
        }
        analyzerName.appendChild(a);
    }
    author.textContent = `By ${langInfo[lang]['authors'] || 'Unknown'}\
                          ${langInfo[lang]['year'] ? ` (${langInfo[lang]['year']})` : ''}`;
    citation.textContent = langInfo[lang]['citation'] ? `Citation: ${langInfo[lang]['citation']}` : '';
}

async function prepareResources() {
    console.log('Loading HFST module...');
    await createHfstModule().then((hfstModule) => {
        hfst = hfstModule;
        console.log('    ...HFST module loaded as `hfst`');
    });
    console.log(`Loading ${capitalizeFirstChar(lang)} analyzer...`);
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
                      more than one transducer. Only the first one 
                      is loaded.`);
    }
    instream.close();
    return transducer;
}

analyzeBtn.addEventListener('click', () => {
    resultsDiv.textContent = '';

    tokens = tokenized(textInput.value.trim());
    for (let token of tokens) {
        resultsDiv.appendChild(analyzeWord(token));
    }
});
// Pressing enter triggers button click
textInput.addEventListener('keypress', (event) => {
    if (event.key == "Enter") {
        /*
          We trigger a click instead of a function call
          so that pressing enter doesn't trigger the action
          while the button is disabled
        */
       analyzeBtn.click();
    }
});

const selectedClass = ['bg-dark', 'bg-opacity-25'];
const unselectedClass = ['bg-light', 'text-muted'];

// Returns card with analyses
function analyzeWord(word) {
    if (!word) {
        resultsDiv.textContent = 'Please enter a word to analyze';
        return;
    }

    try {
        const results = transducer.lookup(word);
        console.log(`Results (${word}):`, results);

        let resultsList = document.createElement('ul');
        resultsList.classList.add('list-group');
        let resultElem = document.createElement('li');
        resultElem.classList.add(
            'list-group-item', 
            'd-flex', 
            'flex-wrap', 
            'gap-1', 
            'justify-content-between'
        );
        resultsList.appendChild(resultElem);
        if (results.length === 0) {
            resultElem.textContent = 'No analysis found for: ' + word;
            resultElem.classList.add('bg-warning', 'bg-opacity-50');
        } else {
            let result = results[0];

            let analysis = document.createElement('span');
            analysis.textContent = result[0].join('');
            resultElem.appendChild(analysis);
            let weight;
            if (result[1] !== 0) {
                weight = document.createElement('span');
                weight.textContent = `(weight: ${result[1]})`;
                resultElem.appendChild(weight);
            }

            let resultElemClone;
            results.slice(1).forEach(result => {
                resultElemClone = resultElem.cloneNode(true);
                analysis = resultElemClone.children[0];
                analysis.textContent = result[0].join('');
                if (result[1] !== 0) {
                    weight = resultElemClone.children[1];
                    weight.textContent = `(weight: ${result[1]})`;
                }
                resultElemClone.classList.add('text-muted');
                resultsList.appendChild(resultElemClone);
            });
            resultElem.classList.add(...selectedClass);
        }
        return resultsList;
    } catch (error) {
        console.error('Error in lookup:', error);
        resultsDiv.textContent = 'Error analyzing word: ' + error.message;
    }
}
/* End of code from https://reynoldsnlp.com/hfst-wasm/ */

resultsDiv.addEventListener('click', (event) => {
    if (event.target.tagName === 'LI') {
        let selected = event.target;
        // Make clicked element appear selected
        selected.classList.remove(...unselectedClass);
        selected.classList.add(...selectedClass);
        // Make all other elements unselected
        let ul = selected.parentNode;
        for (let li of ul.children) {
            if (li !== selected) {
                li.classList.remove(...selectedClass);
                li.classList.add(...unselectedClass);
            }
        }
    }
})

function tokenized(str) {
    return str.split(' ');
}

function capitalizeFirstChar(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

langSelect.addEventListener('change', update);