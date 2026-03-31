const track = document.getElementById('game-track');
const globalScore = document.getElementById('global-score');
const home = document.getElementById('home-screen');
const game = document.getElementById('game-screen');
const end = document.getElementById('end-screen');

let questions = [];
let facts = [];
let currentIdx = 0;
let currentFactIdx = 0;
let score = 0;
let isAccepting = false;
let questionStartTime = 0;

// Three Dots logic
document.getElementById('dots-icon').onclick = () => {
    const t = document.getElementById("toast");
    t.className = "show";
    setTimeout(() => { t.className = ""; }, 2500);
};

document.getElementById('exit-btn').onclick = () => showView(home);


// Current Affairs Logic
document.getElementById('fact-fab').onclick = async () => {
    const modal = document.getElementById('facts-modal');
    const qBox = document.getElementById('fact-question-box');
    const aBox = document.getElementById('fact-answer-box');
    
    modal.style.display = 'block';
    qBox.innerHTML = 'Scanning global news...';
    aBox.style.display = 'none';
    
    try {
        // Pulling live news via an RSS-to-JSON bridge (Google News feed)
        const newsUrl = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%3Fhl%3Den-US%26gl%3DUS%26ceid%3DUS%3Aen';
        const res = await fetch(newsUrl);
        const data = await res.json();
        
        if (data.status === 'ok') {
            // Map the first 10 news items
            facts = data.items.slice(0, 10).map(item => ({
                q: item.title, // The Headline
                a: "Source: " + item.source // The News Source
            }));
            currentFactIdx = 0;
            updateFactUI();
        } else {
            throw new Error("News feed unavailable");
        }
    } catch(e) { 
        qBox.innerHTML = "News feed is updating. Please check back in a moment."; 
        console.error(e);
    }
};

function updateFactUI() {
    const qBox = document.getElementById('fact-question-box');
    const aBox = document.getElementById('fact-answer-box');
    const count = document.getElementById('fact-count');
    
    if (facts && facts.length > 0) {
        // Headlines are often long, so we adjust font size slightly for readability
        qBox.style.fontSize = "1.4rem"; 
        qBox.innerHTML = facts[currentFactIdx].q;
        aBox.innerHTML = facts[currentFactIdx].a;
        aBox.style.display = 'block';
        if(count) count.innerText = `Update ${currentFactIdx + 1}/10`;
    }
}

// Invisible Side Navigation
document.getElementById('fact-nav-right').onclick = () => { 
    if(currentFactIdx < 9) { currentFactIdx++; updateFactUI(); } 
};
document.getElementById('fact-nav-left').onclick = () => { 
    if(currentFactIdx > 0) { currentFactIdx--; updateFactUI(); } 
};

document.querySelector('.close-modal').onclick = () => document.getElementById('facts-modal').style.display = 'none';

// Game Start Logic
document.getElementById('start-btn').onclick = startGame;
document.getElementById('start-over').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

async function startGame() {
    score = 0; currentIdx = 0;
    globalScore.innerText = "0";
    track.style.transform = `translateX(0)`;
    track.innerHTML = '';
    showView(game);
    const res = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
    const data = await res.json();
    questions = data.results.map(q => ({
        text: decode(q.question),
        choices: shuffle([...q.incorrect_answers, q.correct_answer]),
        correct: decode(q.correct_answer)
    }));
    renderQuestion(0);
}

function renderQuestion(idx) {
    const q = questions[idx];
    const slide = document.createElement('div');
    slide.className = 'question-slide';
    slide.innerHTML = `
        <div class="brain-img"></div>
        <div class="question-banner"><h2>${q.text}</h2></div>
        <div class="choice-list">
            ${q.choices.map(c => `<button class="choice-btn">${decode(c)}</button>`).join('')}
        </div>
    `;
    track.appendChild(slide);
    isAccepting = true;
    questionStartTime = Date.now();
    document.getElementById('current-idx').innerText = idx + 1;

    slide.querySelectorAll('.choice-btn').forEach(btn => {
        btn.onclick = () => {
            if(!isAccepting) return;
            isAccepting = false;
            const timeTaken = (Date.now() - questionStartTime) / 1000;

            if(btn.innerText === q.correct) {
                btn.classList.add('correct');
                let points = 0;
                if (timeTaken <= 3) points = 100;
                else if (timeTaken <= 5) points = 85;
                else if (timeTaken <= 8) points = 70;
                else points = 50;
                score += points;
                globalScore.innerText = score;
            } else {
                btn.classList.add('wrong');
                Array.from(btn.parentElement.children).forEach(b => {
                    if(b.innerText === q.correct) b.classList.add('correct');
                });
            }
            setTimeout(() => {
                if(currentIdx < 9) {
                    currentIdx++;
                    renderQuestion(currentIdx);
                    track.style.transform = `translateX(-${currentIdx * 100}%)`;
                } else {
                    showView(end);
                    document.getElementById('final-score').innerText = score;
                    if(score > (localStorage.getItem('qrHS')||0)) localStorage.setItem('qrHS', score);
                }
            }, 1200);
        };
    });
}

function showView(v) {
    [home, game, end].forEach(view => view.classList.remove('active'));
    v.classList.add('active');
    if(v === home) document.getElementById('high-score-val').innerText = localStorage.getItem('qrHS') || 0;
}
function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }
function decode(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}