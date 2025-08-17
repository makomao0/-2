let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDate = null;


/* --- ファイル管理用 --- */
let bookmarkFiles = [];

/* ファイル一覧をローカルストレージから読み込む */
function loadFiles() {
    try {
        bookmarkFiles = JSON.parse(localStorage.getItem('bookmarkFiles') || '[]');
        if (!Array.isArray(bookmarkFiles)) bookmarkFiles = [];
    } catch (e) {
        bookmarkFiles = [];
    }
}

/* ファイル一覧をローカルストレージに保存する */
function saveFiles() {
    localStorage.setItem('bookmarkFiles', JSON.stringify(bookmarkFiles));
}

/* ファイル一覧を描画する */
function renderFileList() {
    const listContainer = document.getElementById('file-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    bookmarkFiles.forEach(fileName => {
        const btn = document.createElement('button');
        btn.textContent = fileName;
        btn.dataset.file = fileName;
        btn.onclick = () => {
            renderBookmarks('file:' + fileName);
        };
        listContainer.appendChild(btn);
    });
}

/* モーダル内のファイル選択セレクトを更新する */
function updateFileSelect() {
    const select = document.getElementById('entry-file-select');
    if (!select) return;
    select.innerHTML = '';
    const noneOption = document.createElement('option');
    noneOption.value = '';
    noneOption.textContent = 'なし';
    select.appendChild(noneOption);
    bookmarkFiles.forEach(fileName => {
        const opt = document.createElement('option');
        opt.value = fileName;
        opt.textContent = fileName;
        select.appendChild(opt);
    });
}


function getStampImgTag(stamp) {
    const map = {
        '💘': '猫.PNG',
        '😭': '感動.png',
        '💧': '泣く.png',
        '😲': '驚く.png',
        '😴': '寝る.png'
    };
    if (!stamp || !map[stamp]) return '';
    return `<img src="${map[stamp]}" alt="${stamp}" style="width:32px; height:auto;">`;
}

/* カレンダー描画 */
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    const entries = JSON.parse(localStorage.getItem('entries') || '{}');
    const keyPrefix = `${currentYear}-${currentMonth + 1}`;

    for (let i = 1; i <= new Date(currentYear, currentMonth + 1, 0).getDate(); i++) {
        const dateKey = `${keyPrefix}-${i}`;
        const entry = entries[dateKey];
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        // データがある場合はタイトルやスタンプを表示
        if (entry) {
            cell.innerHTML = `
                <div class="day-number">${i}</div>
                ${entry.stamp ? `<div>${getStampImgTag(entry.stamp)}</div>` : ''}
                ${entry.title ? `<div style="font-size:0.8em; margin-top:4px; color:var(--gold);">${entry.title}</div>` : ''}
            `;
        } else {
            cell.innerHTML = `<div class="day-number">${i}</div>`;
        }
        // クリックでモーダルを開く（新規 or 編集）
        cell.onclick = () => {
            selectedDate = dateKey;
            loadForm(dateKey); // entryがあれば内容をセット、なければ空欄
            openModal(dateKey);
        };
        calendar.appendChild(cell);
    }
    document.getElementById('monthLabel').textContent = `${currentYear}年 ${currentMonth + 1}月`;
    setCalendarBackgroundByMonth();
}

/* カレンダーの背景画像設定（固定） */
function setCalendarBackgroundByMonth() {
    const calendarPage = document.querySelector('.calendar-page');
    calendarPage.style.backgroundImage = "url('img/背景.jpg')";
    calendarPage.style.backgroundSize = "cover";
    calendarPage.style.backgroundPosition = "center";
    calendarPage.style.backgroundRepeat = "no-repeat";
}

/* しおり一覧を描画 */
function renderBookmarks(filter = 'all') {
    const list = document.getElementById('bookmark-list');
    if (!list) return;
    list.innerHTML = '';
    const entries = JSON.parse(localStorage.getItem('entries') || '{}');
    // スタンプごとにグループ化
    const groups = { '💘': [], '😭': [], '💧': [], '😲': [], '😴': [] };
    Object.entries(entries).forEach(([dateKey, entry]) => {
        // ファイルフィルタ処理
        if (filter && String(filter).startsWith('file:')) {
            const targetFile = String(filter).slice(5);
            if (!entry.file || entry.file !== targetFile) return;
        } else {
            // 他のフィルタ条件
            if (filter === '読了' && entry.status !== '読了') return;
            if (filter === '未読' && entry.status !== '未読') return;
            if (filter === 'favorite' && !entry.favorite) return;
            if (['💘', '😭', '💧', '😲', '😴'].includes(filter) && entry.stamp !== filter) return;
        }
        const stamp = entry.stamp || '💘';
        if (groups[stamp]) groups[stamp].push({ dateKey, entry });
    });
    Object.entries(groups).forEach(([stamp, cards]) => {
        if (cards.length > 0) {
            cards.forEach(({ dateKey, entry }) => {
                const card = document.createElement('div');
                card.className = 'bookmark-card';
                // スタンプごとの色付け
                if (entry.stamp === '💘') card.classList.add('heart');
                if (entry.stamp === '😭') card.classList.add('cry');
                if (entry.stamp === '💧') card.classList.add('tears');
                if (entry.stamp === '😲') card.classList.add('surprise');
                if (entry.stamp === '😴') card.classList.add('sleepy');
                // 保存日時
                if (!entry.savedAt) entry.savedAt = new Date().toISOString();
                let savedAt = new Date(entry.savedAt);
                if (isNaN(savedAt.getTime())) savedAt = new Date();
                const savedStr = `${savedAt.getFullYear()}年${savedAt.getMonth() + 1}月${savedAt.getDate()}日 ${savedAt.getHours().toString().padStart(2, '0')}:${savedAt.getMinutes().toString().padStart(2, '0')}`;
                // カレンダー日付
                const [y, m, d] = dateKey.split('-').map(Number);
                const calendarStr = `${y}年${m}月${d}日`;
                // カード内容
                card.innerHTML = `
                    <h4>${entry.title || '(未記入)'} ${entry.favorite ? '⭐' : ''}</h4>
                    <p><strong>著者:</strong> ${entry.author || '-'}</p>
                    <p><strong>感想:</strong> ${entry.impression || '-'}</p>
                    <p><strong>お気に入りの一文:</strong> ${entry.quote || '-'}</p>
                    <p><strong>ステータス:</strong> ${entry.status || '未読'}</p>
                    <p style="font-size:0.9em;color:#888;">カレンダー日: ${calendarStr}</p>
                    <p style="font-size:0.9em;color:#888;">保存日時: ${savedStr}</p>
                    ${entry.file ? `<p style="font-size:0.9em;color:#888;">ファイル: ${entry.file}</p>` : ''}
                `;
                // カードクリック時、該当日付のカレンダーへジャンプ
                card.onclick = () => {
                    document.querySelectorAll('main > section').forEach(section => {
                        if (section.classList.contains('calendar-page')) {
                            section.style.display = 'block';
                            requestAnimationFrame(() => { section.classList.add('active'); });
                        } else {
                            section.style.display = 'none';
                            section.classList.remove('active');
                        }
                    });
                    currentYear = y;
                    currentMonth = m - 1;
                    renderCalendar();
                    setTimeout(() => {
                        const calendar = document.getElementById('calendar');
                        const cells = calendar.querySelectorAll('.calendar-cell');
                        if (cells[d - 1]) {
                            cells[d - 1].classList.add('highlight');
                            setTimeout(() => { cells[d - 1].classList.remove('highlight'); }, 1200);
                        }
                    }, 100);
                };
                list.appendChild(card);
            });
        }
    });
}


document.querySelectorAll('.filter-buttons button').forEach(button => {
    button.onclick = () => { renderBookmarks(button.getAttribute('data-filter')); };
});

/* ファイル作成ボタンイベント */
const fileCreateBtn = document.getElementById('file-create-button');
if (fileCreateBtn) {
    fileCreateBtn.onclick = () => {
        const input = document.getElementById('file-name-input');
        if (!input) return;
        const name = input.value.trim();
        if (!name) {
            alert('ファイル名を入力してください');
            return;
        }
        if (bookmarkFiles.includes(name)) {
            alert('同じ名前のファイルが既に存在します');
            return;
        }
        bookmarkFiles.push(name);
        saveFiles();
        renderFileList();
        updateFileSelect();
        input.value = '';
    };
}

function loadForm(dateKey) {
    const entries = JSON.parse(localStorage.getItem('entries') || '{}');
    const entry = entries[dateKey] || {};
    document.getElementById('calendar-edit-title').value = entry.title || '';
    document.getElementById('calendar-edit-author').value = entry.author || '';
    document.getElementById('calendar-edit-impression').value = entry.impression || '';
    document.getElementById('calendar-edit-quote').value = entry.quote || '';
    document.getElementById('favorite-check').checked = !!entry.favorite;
    // スタンプ選択
    document.querySelectorAll('#calendar-edit-stamps .stamp').forEach(stamp => {
        const img = stamp.querySelector('img');
        stamp.classList.toggle('selected', img && img.alt === entry.stamp);
    });
    // ステータス
    if (entry.status) {
        document.querySelectorAll('input[name="status"]').forEach(r => { r.checked = (r.value === entry.status); });
    } else {
        document.querySelectorAll('input[name="status"]').forEach(r => { r.checked = false; });
    }
    // ファイル
    const fileSelect = document.getElementById('entry-file-select');
    if (fileSelect) {
        updateFileSelect();
        fileSelect.value = entry.file || '';
    }
}

/* モーダル制御 */
function openModal() {
    const modal = document.getElementById('edit-modal');
    modal.style.display = 'flex';
    const content = modal.querySelector('.modal-content');
    content.style.animation = 'modalFadeIn 0.3s forwards';
}
function closeModal() {
    const modal = document.getElementById('edit-modal');
    const content = modal.querySelector('.modal-content');
    content.style.animation = 'modalFadeOut 0.3s forwards';
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

/* 保存ボタン */

document.getElementById('calendar-edit-save').onclick = () => {
    if (!selectedDate) return;
    const entries = JSON.parse(localStorage.getItem('entries') || '{}');
    const selectedStampImg = document.querySelector('#calendar-edit-stamps .stamp.selected img');
    entries[selectedDate] = {
        title: document.getElementById('calendar-edit-title').value,
        author: document.getElementById('calendar-edit-author').value,
        impression: document.getElementById('calendar-edit-impression').value,
        quote: document.getElementById('calendar-edit-quote').value,
        stamp: selectedStampImg ? selectedStampImg.alt : '',
        status: document.querySelector('input[name="status"]:checked')?.value || '未読',
        favorite: document.getElementById('favorite-check').checked,
        savedAt: new Date().toISOString() // 保存日時を追加
    };
    localStorage.setItem('entries', JSON.stringify(entries));
    alert('保存しました！');
    closeModal();
    renderCalendar();
    renderBookmarks();
};

/* 削除ボタン */
document.getElementById('calendar-edit-delete').onclick = () => {
    if (!selectedDate) return;
    const entries = JSON.parse(localStorage.getItem('entries') || '{}');
    delete entries[selectedDate];
    localStorage.setItem('entries', JSON.stringify(entries));
    alert('削除しました');
    closeModal();
    renderCalendar();
    renderBookmarks();
};

document.getElementById('calendar-edit-close').onclick = closeModal;
document.getElementById('edit-modal').addEventListener('click', e => { if (e.target.id === 'edit-modal') closeModal(); });
document.querySelectorAll('#calendar-edit-stamps .stamp').forEach(stamp => {
    stamp.onclick = () => {
        document.querySelectorAll('#calendar-edit-stamps .stamp').forEach(s => s.classList.remove('selected'));
        stamp.classList.add('selected');
    };
});
document.getElementById('prevMonth').onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
};
document.getElementById('nextMonth').onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
};
let stampChartInstance = null;  // グラフインスタンス保持用

function renderChart() {
    const canvas = document.getElementById('stampChart');
    if (!canvas) return;
    const entries = JSON.parse(localStorage.getItem('entries') || '{}');
    const counts = { '💘': 0, '😭': 0, '💧': 0, '😲': 0, '😴': 0 };
    Object.values(entries).forEach(e => {
        if (e.stamp && counts[e.stamp] !== undefined) counts[e.stamp]++;
    });

    // 既に描画済みのチャートがあれば破棄
    if (stampChartInstance) {
        stampChartInstance.destroy();
        stampChartInstance = null;
    }

    const ctx = canvas.getContext('2d');
    stampChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(counts),
            datasets: [{
                label: 'スタンプ使用数',
                data: Object.values(counts),
                backgroundColor: ['#e76f51', '#f4a261', '#2a9d8f', '#457b9d', '#b5838d']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}


// ナビゲーションリンクのフェード切り替え処理
document.querySelectorAll('.nav a').forEach(link => {
    link.onclick = (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target');
        document.querySelectorAll('main > section').forEach(section => {
            if (section.classList.contains(target)) {
                section.style.display = 'block';
                requestAnimationFrame(() => {
                    section.classList.add('active');
                });
            } else {
                section.classList.remove('active');
                setTimeout(() => {
                    section.style.display = 'none';
                }, 400);
            }
        });
        if (target === 'bookmark-page') renderBookmarks();
        if (target === 'mypage-page') renderChart();
    };
});

/* 初期処理 */
document.addEventListener('DOMContentLoaded', () => {
    loadFiles();
    renderCalendar();
    renderBookmarks();
    renderFileList();
    updateFileSelect();
    document.querySelectorAll('main > section').forEach(section => {
        if (section.classList.contains('calendar-page')) {
            section.style.display = 'block';
            requestAnimationFrame(() => { section.classList.add('active'); });
        } else {
            section.style.display = 'none';
            section.classList.remove('active');
        }
    });
});

/* 重複する旧ナビゲーションイベントとDOMContentLoadedイベントを無効化
document.querySelectorAll('.nav a').forEach(link => {
    link.onclick = (e) => { e.preventDefault(); const target = link.getAttribute('data-target'); document.querySelectorAll('main > section').forEach(s => s.style.display = 'none'); document.querySelector('.' + target).style.display = 'block'; if (target === 'bookmark-page') renderBookmarks(); if (target === 'mypage-page') renderChart(); };
});

document.addEventListener('DOMContentLoaded', () => { renderCalendar(); renderBookmarks(); });
*/
// SNS共有ボタンイベント
document.getElementById('share-x').addEventListener('click', () => {
    const text = document.querySelector('#daily-book-card').innerText;
    const tweet = encodeURIComponent(`📖 今日のおすすめ本\n\n${text}\n\n#読書記録`);
    const url = `https://twitter.com/intent/tweet?text=${tweet}`;
    window.open(url, '_blank');
});



document.getElementById('share-line').addEventListener('click', () => {
    const text = document.querySelector('#daily-book-card').innerText;
    const message = encodeURIComponent(`📖 今日のおすすめ本\n${text}`);
    const url = `https://line.me/R/msg/text/?${message}`;
    window.open(url, '_blank');
});

document.getElementById('copy-caption').addEventListener('click', () => {
    const text = document.querySelector('#daily-book-card').innerText;
    navigator.clipboard.writeText(`📖 今日のおすすめ本\n\n${text}`).then(() => {
        alert('キャプションをコピーしました！');
    });
});


// --- Book recommendation based on impression text ---
async function fetchBookByKeyword(keyword) {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(keyword)}&maxResults=10`);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
        const chosen = data.items[Math.floor(Math.random() * data.items.length)].volumeInfo;
        return {
            title: chosen.title,
            authors: chosen.authors?.join(', ') || '不明',
            description: chosen.description || '説明なし',
            thumbnail: chosen.imageLinks?.thumbnail || '',
            infoLink: chosen.infoLink
        };
    } else {
        throw new Error("候補が見つかりませんでした");
    }
}

function displayBookCard(book) {
    const html = `
        <div class="recommend-card">
          ${book.thumbnail ? `<img src="${book.thumbnail}" alt="表紙">` : ''}
          <h3>${book.title}</h3>
          <p><strong>著者:</strong> ${book.authors}</p>
          <p><strong>あらすじ:</strong> ${book.description}</p>
          <a href="${book.infoLink}" target="_blank">\u{1F4D6} 詳しく読む</a>
        </div>
      `;
    const card = document.getElementById('book-card');
    card.innerHTML = html;

    // アニメ再発火（任意）
    const el = card.querySelector('.recommend-card');
    el.classList.remove('recommend-card');
    void el.offsetWidth;
    el.classList.add('recommend-card');


}

// デモ用に仮データを表示




document.querySelectorAll('#mood-buttons button').forEach(btn => {
    btn.onclick = async () => {
        const mood = btn.dataset.mood;
        const status = document.getElementById('roulette-status');
        const card = document.getElementById('book-card');
        card.innerHTML = '';
        status.textContent = "📚 選書中…";

        // 簡易ルーレット風エフェクト
        let dots = 0;
        const interval = setInterval(() => {
            dots = (dots + 1) % 4;
            status.textContent = "📚 選書中" + ".".repeat(dots);
        }, 300);

        try {
            const book = await fetchBookByKeyword(mood + " 小説");
            clearInterval(interval);
            status.textContent = "🎉 今日のおすすめはこちら！";
            displayBookCard(book);
        } catch (err) {
            clearInterval(interval);
            status.textContent = "⚠️ 本が見つかりませんでした";
        }
    };
});

// 日付と時刻を表示・更新
function updateDateTime() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const h = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    document.getElementById('datetime').textContent = `${y}年${m}月${d}日 ${h}:${min}:${s}`;
}
setInterval(updateDateTime, 1000);
updateDateTime();

// カレンダー日付強調用CSS
// .calendar-cell.highlight { outline: 3px solid #e76f51; z-index: 2; }

/*
 * 読書記録カレンダー × 感情スタンプ アプリ
 * Kindle連携機能：読書履歴の取得と感情スタンプへの反映
 * 
 * 本アプリは、ユーザーの読書体験を可視化・記録・共有することを目的とした
 * 「読書記録カレンダー×感情スタンプ」サービスです。
 * 
 * Kindle連携機能により、ユーザーがKindleで読書した履歴（読了日、ハイライト、メモ等）を
 * Amazon API経由で自動取得し、以下の処理を実行します：
 * 
 * 1. 読了日をカレンダーに反映し、スタンプ表示を自動生成
 * 2. ハイライトから感情・ジャンルを推定し、AIによる感想支援やおすすめ本提案を行う
 * 3. 読書傾向を可視化し、ユーザーの読書活動の継続を支援
 * 
 * ※Amazon APIとの連携にはOAuth認証を利用し、ユーザーの明示的な同意を得てアクセスします。
 * ※取得したデータはローカルまたはユーザーアカウントに限定して使用し,
 *   第三者に共有・外部送信しません。
 */

// --- Kindle連携デモ用スクリプト ---
async function authenticateWithAmazon() {
    // OAuth認証処理（※実際はAmazonのSDKを使用）
    console.log("AmazonにOAuth認証をリクエスト中...");
    // ダミー
    return { accessToken: "mock_access_token" };
}

async function fetchKindleReadingData(accessToken) {
    // 本来はAmazon APIを叩いて読書履歴、ハイライトを取得
    console.log("Kindle読書データを取得中...");

    // モックデータ
    return [
        {
            title: "吾輩は猫である",
            author: "夏目漱石",
            readDate: "2025-07-08",
            highlights: [
                "吾輩は猫である。名前はまだない。",
                "人間というものは、元来気ままなものである。"
            ]
        },
        {
            title: "星の王子さま",
            author: "サン＝テグジュペリ",
            readDate: "2025-07-05",
            highlights: [
                "本当に大切なものは、目には見えない。"
            ]
        }
    ];
}

function analyzeEmotionsFromHighlights(highlights) {
    // AIによる感情分析（ここでは簡易版）
    const joined = highlights.join(" ");
    if (joined.includes("大切") || joined.includes("気まま")) {
        return "😊"; // 喜
    } else if (joined.includes("見えない")) {
        return "💧"; // 哀
    }
    return "😲"; // その他
}

function updateCalendar(readingData) {
    readingData.forEach(entry => {
        const emotionStamp = analyzeEmotionsFromHighlights(entry.highlights);
        console.log(`📚 ${entry.readDate}：『${entry.title}』 → スタンプ ${emotionStamp} を表示`);
        // 実際にはDOM更新やlocalStorageへの保存処理
    });
}

// 実行フロー（例）
async function runKindleIntegration() {
    const { accessToken } = await authenticateWithAmazon();
    const readingData = await fetchKindleReadingData(accessToken);
    updateCalendar(readingData);
}

// アプリ起動時などに呼び出す
runKindleIntegration();

/**
 * 読書記録カレンダー × 感情スタンプ アプリ
 * Kindle Clippings.txt連携機能（安全・無料）
 * 
 * ユーザーがKindle端末からエクスポートした「My Clippings.txt」ファイルを読み取り、
 * 読書履歴（読了日、ハイライト、タイトル）をカレンダーと連携させてスタンプ表示します。
 * 
 * Amazon APIやOAuth認証を使わず、ローカル処理で完結する安全・確実な連携方法です。
 */

// --- Kindle Clippings.txt連携機能（安全・無料）---
// ファイルアップロードと読書データ処理
function setupClippingUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.style.display = 'none';
    input.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            const content = e.target.result;
            const entries = content.split("==========");
            const parsed = [];
            entries.forEach(entry => {
                const lines = entry.trim().split("\n");
                if (lines.length >= 3 && lines[1].includes("ハイライト")) {
                    const title = lines[0].trim();
                    const quote = lines[2].trim();
                    const dateMatch = lines[1].match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
                    const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : null;
                    if (date) {
                        parsed.push({ title, quote, date });
                    }
                }
            });
            updateCalendarFromClippings(parsed);
        };
        reader.readAsText(file);
    });
    document.body.appendChild(input);
    input.click();
    // 使い終わったら削除
    setTimeout(() => document.body.removeChild(input), 1000);
}

function analyzeEmotion(text) {
    if (text.includes("大切") || text.includes("愛")) return "💘";
    if (text.includes("涙") || text.includes("悲しい")) return "💧";
    if (text.includes("びっくり") || text.includes("驚き")) return "😲";
    if (text.includes("最高") || text.includes("楽しい")) return "😊";
    if (text.includes("怒り") || text.includes("許せない")) return "😠";
    if (text.includes("眠い") || text.includes("退屈")) return "😴";
    return "📖";
}

function updateCalendarFromClippings(readingData) {
    const entries = JSON.parse(localStorage.getItem('entries') || '{}');
    readingData.forEach(entry => {
        const dateKey = entry.date;
        const emotionStamp = analyzeEmotion(entry.quote);
        entries[dateKey] = {
            title: entry.title,
            author: '',
            impression: '',
            quote: entry.quote,
            stamp: emotionStamp,
            status: '読了',
            favorite: false,
            savedAt: new Date().toISOString()
        };
    });
    localStorage.setItem('entries', JSON.stringify(entries));
    renderCalendar();
    renderBookmarks();
    alert('Clippings.txtから読書記録をインポートしました！');
}

// --- UIから呼び出す例 ---
// 例: ボタンにonclick="setupClippingUpload()"を追加してください
// <button onclick="setupClippingUpload()">Clippings.txtをインポート</button>



function createShootingStar() {
    const star = document.createElement('div');
    star.className = 'shooting-star';

    // ランダム位置に設定
    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight * 0.6; // 上半分
    star.style.left = `${startX}px`;
    star.style.top = `${startY}px`;

    document.body.appendChild(star);

    setTimeout(() => {
        star.remove();
    }, 1500);
}

// 星を定期的に降らせる（全ページ）
setInterval(() => {
    createShootingStar();
}, 50); // 2.5秒ごとに1つ出現
