const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const UA_POOL = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15'
];
const HOME = 'https://gemini.google.com/app';
const ENDPOINT = 'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate';
const SESSION_DIR = path.join(__dirname, 'sessions');

if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

const hex = n => crypto.randomBytes(n).toString('hex');
const uuid = () => crypto.randomUUID().toUpperCase();
const rUA = () => UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
const reqid = () => Math.floor(Math.random() * 900000) + 100000;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function cleanText(txt) {
    return txt.replace(/\*\*/g, '').replace(/\n/g, ' ').replace(/  +/g, ' ').trim();
}

async function bootstrap() {
    await sleep(1000 + Math.random() * 2000);
    const res = await fetch(HOME, { headers: { 'user-agent': rUA(), 'accept-language': 'en-US,en;q=0.9' } });
    const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    const cookie = setCookie.map(c => c.split(';')[0]).join('; ');
    const html = await res.text();
    const blMatch = html.match(/"cfb2h":"(.*?)"/);
    const fsidMatch = html.match(/"FdrFJe":"(.*?)"/);
    if (!blMatch || !fsidMatch) throw new Error('Token extraction failed');
    return { cookie, bl: blMatch[1], fsid: fsidMatch[1], uid: uuid() };
}

function buildPayload(message, resume, uid) {
    const inner = [
        [message, 0, null, null, null, null, 0],
        ['en-US'],
        resume,
        '',
        hex(16),
        null, [1], 1, null, null, 1, 0, null, null, null, null, null,
        [[0]], 0, null, null, null, null, null, null, null, null, 1, null, null, [4],
        null, null, null, null, null, null, null, null, null, null, [2],
        null, null, null, null, null, null, null, null, null, null, null, 0,
        null, null, null, null, null, uid, null, [], null, null, null, null, null, null, 2,
        null, null, null, null, null, null, null, null, null, null, 1
    ];
    return 'f.req=' + encodeURIComponent(JSON.stringify([null, JSON.stringify(inner)])) + '&';
}

function parseReply(raw) {
    const out = { text: '', conversationId: null, responseId: null, replyId: null };
    for (const line of raw.split('\n')) {
        const s = line.trim();
        if (!s.startsWith('[["wrb.fr"')) continue;
        let outer;
        try { outer = JSON.parse(s); } catch { continue; }
        for (const seg of outer) {
            if (!Array.isArray(seg) || seg[0] !== 'wrb.fr' || typeof seg[2] !== 'string') continue;
            let body;
            try { body = JSON.parse(seg[2]); } catch { continue; }
            const ids = body[1];
            if (Array.isArray(ids)) {
                if (ids[0]?.startsWith('c_')) out.conversationId = ids[0];
                if (ids[1]?.startsWith('r_')) out.responseId = ids[1];
            }
            const msgArr = body[4];
            if (Array.isArray(msgArr) && msgArr.length > 0 && Array.isArray(msgArr[0])) {
                const rId = msgArr[0][0];
                const parts = msgArr[0][1];
                if (Array.isArray(parts)) {
                    const txt = parts.join('');
                    if (txt.length > out.text.length) { out.text = txt; out.replyId = rId; }
                }
            }
        }
    }
    return out;
}

function saveSession(name, data) {
    fs.writeFileSync(path.join(SESSION_DIR, name + '.json'), JSON.stringify(data));
}

function loadSession(name) {
    const p = path.join(SESSION_DIR, name + '.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    return null;
}

async function chat(message, sessionName = null) {
    let session = sessionName ? loadSession(sessionName) : null;
    if (!session) {
        session = await bootstrap();
        if (sessionName) saveSession(sessionName, session);
    }
    const resume = session?.resume
        ? [session.resume[0] || '', session.resume[1] || '', session.resume[2] || '', null, null, null, null, null, null, '']
        : ['', '', '', null, null, null, null, null, null, ''];
    const url = `${ENDPOINT}?bl=${encodeURIComponent(session.bl)}&f.sid=${encodeURIComponent(session.fsid)}&hl=en-US&_reqid=${reqid()}&rt=c`;
    await sleep(800 + Math.random() * 1500);
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'user-agent': rUA(),
            'origin': 'https://gemini.google.com',
            'referer': 'https://gemini.google.com/',
            'x-same-domain': '1',
            'x-goog-ext-525001261-jspb': JSON.stringify([1, null, null, null, hex(4), null, null, 0, [4, 6], null, null, 1, null, null, 1, null, uuid()]),
            'x-goog-ext-525005358-jspb': JSON.stringify([session.uid, 1]),
            'x-goog-ext-73010990-jspb': '[0,0,0]',
            'x-goog-ext-73010989-jspb': '[0]',
            cookie: session.cookie
        },
        body: buildPayload(String(message), resume, session.uid)
    });
    const raw = await res.text();
    const reply = parseReply(raw);
    if (reply.conversationId && reply.responseId && reply.replyId && sessionName) {
        session.resume = [reply.conversationId, reply.responseId, reply.replyId];
        saveSession(sessionName, session);
    }
    return {
        creator: 'rynaqrtz',
        status: res.status,
        response: reply.text ? cleanText(reply.text) : null,
        session: sessionName || null
    };
}

module.exports = { chat };

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log(JSON.stringify({
            usage: {
                basic: 'node gemini.js "<prompt>"',
                with_memory: 'node gemini.js "<prompt>" <session_name>',
                example: 'node gemini.js "siapa itu ambatukam'
            },
            creator: 'rynaqrtz'
        }, null, 2));
        process.exit(0);
    }
    const prompt = args[0];
    const sessionName = args[1] || null;
    (async () => {
        const result = await chat(prompt, sessionName);
        console.log(JSON.stringify(result, null, 2));
    })();
}