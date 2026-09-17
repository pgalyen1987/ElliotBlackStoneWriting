/**
 * Exhaustive check of an interactive story's graph.
 *
 * The engine gates choices on flags, so "is this ending reachable" is not a question you can answer
 * by reading the JSON — it depends on what the reader is carrying when they arrive. This walks
 * every (node, flag-set) state the reader can actually reach and proves the story holds up:
 * every ending reachable, no dead ends, no unreachable prose, no choice pointing at nothing.
 *
 * Usage: node tests/story-graph.mjs interactive/tidewater.json
 */
import { readFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) { console.error('usage: story-graph.mjs <story.json>'); process.exit(2); }
const story = JSON.parse(readFileSync(path, 'utf8'));
const { nodes, endings, start } = story;

const fail = [];
const key = (node, flags) => node + '|' + [...flags].sort().join(',');
const available = (choices, flags) => (choices || []).filter(c =>
    (c.requires || []).every(f => flags.has(f)) && (c.forbids || []).every(f => !flags.has(f)));

// Walk every reachable (node, flags) state.
const seen = new Set();
const reachedNodes = new Set();
const reachedEndings = new Map();   // ending id -> a path that gets there
const queue = [{ node: start, flags: new Set(), path: [] }];

while (queue.length) {
    const { node, flags: arrived, path: trail } = queue.shift();

    const def = nodes[node];
    if (!def) { fail.push(`choice points at missing node "${node}" (via ${trail.join(' -> ') || 'start'})`); continue; }

    // Entering a node applies its own `sets` before its choices are offered — same rule the
    // engine uses, so a passage can gate its exits on what it just told the reader.
    const flags = new Set(arrived);
    (def.sets || []).forEach(f => flags.add(f));

    const k = key(node, flags);
    if (seen.has(k)) continue;
    seen.add(k);
    reachedNodes.add(node);

    if (def.ending) {
        if (!reachedEndings.has(def.ending.id)) reachedEndings.set(def.ending.id, trail);
        continue;
    }

    const open = available(def.choices, flags);
    if (!open.length) fail.push(`dead end at "${node}" with flags {${[...flags].join(',')}}`);

    for (const choice of open) {
        const next = new Set(flags);
        (choice.sets || []).forEach(f => next.add(f));
        queue.push({ node: choice.to, flags: next, path: [...trail, node] });
    }
}

// Every declared ending must be reachable, and every ending node declared.
const declared = new Set(endings.map(e => e.id));
for (const e of endings) {
    if (!reachedEndings.has(e.id)) fail.push(`ending "${e.id}" (${e.title}) is UNREACHABLE`);
}
for (const [name, def] of Object.entries(nodes)) {
    if (def.ending && !declared.has(def.ending.id)) fail.push(`node "${name}" has undeclared ending "${def.ending.id}"`);
    if (!reachedNodes.has(name)) fail.push(`node "${name}" is unreachable`);
    for (const c of def.choices || []) {
        if (!c.label) fail.push(`node "${name}" has a choice with no label`);
        if (!nodes[c.to]) fail.push(`node "${name}" -> "${c.to}" does not exist`);
    }
    // every flag a choice gates on must be settable somewhere, or the branch is dead scenery
    for (const c of def.choices || []) {
        for (const f of c.requires || []) {
            const settable = Object.values(nodes).some(n =>
                (n.sets || []).includes(f) || (n.choices || []).some(cc => (cc.sets || []).includes(f)));
            if (!settable) fail.push(`node "${name}" requires flag "${f}" that nothing ever sets`);
        }
    }
    if (def.image && !/^[\w.-]+\.(jpg|png|webp)$/.test(def.image)) fail.push(`node "${name}" has an odd image "${def.image}"`);
    if (def.mood && !['gold', 'dusk', 'dark', 'fire'].includes(def.mood)) fail.push(`node "${name}" has unknown mood "${def.mood}"`);
}

const words = Object.values(nodes).reduce((n, d) => n + (d.text || []).join(' ').split(/\s+/).length, 0);

console.log(`story        ${story.title} (${path})`);
console.log(`nodes        ${Object.keys(nodes).length}, all reachable`);
console.log(`states       ${seen.size} reachable (node + flags) combinations`);
console.log(`words        ${words}`);
console.log(`endings      ${reachedEndings.size}/${endings.length} reachable`);
for (const e of endings) {
    const trail = reachedEndings.get(e.id);
    console.log(`  ${reachedEndings.has(e.id) ? '✓' : '✗'} ${e.title.padEnd(22)} ${trail ? trail.length + ' choices' : '—'}`);
}

if (fail.length) {
    console.error('\nFAILURES:');
    fail.forEach(f => console.error('  ✗ ' + f));
    process.exit(1);
}
console.log('\nPASS — every ending reachable, no dead ends, no broken links.');
