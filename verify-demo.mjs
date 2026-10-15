import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../public/raspadita-demo.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'No se encontró el JavaScript de la raspadita');
const temp = '/tmp/timapuro-demo-check.js';
writeFileSync(temp, script);
try { execFileSync(process.execPath, ['--check', temp], { stdio: 'pipe' }); }
finally { unlinkSync(temp); }

const outcomesBlock = script.match(/const OUTCOMES=\[([\s\S]*?)\n \];/)?.[1];
assert.ok(outcomesBlock, 'No se encontró la lista de resultados ponderados');
const outcomes = [...outcomesBlock.matchAll(/\{id:'([^']+)',p:([0-9.]+)\}/g)].map(m => ({ id:m[1], p:Number(m[2]) }));
assert.equal(outcomes.length, 13, 'Deben existir exactamente 13 resultados');
assert.ok(Math.abs(outcomes.reduce((sum, o) => sum + o.p, 0) - 100) < 1e-9, 'Las probabilidades deben sumar 100%');
assert.equal(outcomes.find(o => o.id === 'gold')?.p, 0.00020, 'Gold debe tener 0.00020%');
assert.equal(outcomes.find(o => o.id === 'blue')?.p, 0.00008, 'Blue debe tener 0.00008%');
assert.equal(outcomes.find(o => o.id === 'no-prize')?.p, 93.02632, 'Sin premio debe tener 93.02632%');

const fillers = script.match(/const fillerIds=\[([^\]]+)\]/)?.[1] ?? '';
assert.match(fillers, /'polar'/, 'Polar debe ser símbolo frecuente sin premio');
assert.doesNotMatch(fillers, /'gold'|'blue'|'surpriseGold'|'surpriseSilver'/, 'Los premios altos y sorpresas no pueden ser relleno');
const polarSvg64 = html.match(/id:'polar',[\s\S]*?img:'data:image\/svg\+xml;base64,([^']+)'/)?.[1];
assert.ok(polarSvg64, 'Debe existir el símbolo SVG de Polar');
const polarSvg = Buffer.from(polarSvg64, 'base64').toString('utf8');
assert.match(polarSvg, /POLAR/);
assert.match(polarSvg, /SIN PREMIO/, 'El símbolo Polar debe indicar SIN PREMIO');
assert.match(html, /Botellita Budweiser — G\. 100\.000/, 'El premio de G. 100.000 debe mostrar Budweiser');
assert.doesNotMatch(html.match(/const PRIZES=\[([\s\S]*?)\];/)?.[1] ?? '', /\}\s*,\s*,\s*\{/ , 'La lista de símbolos no debe tener un hueco accidental');
console.log('OK: JavaScript válido; 13 resultados; probabilidades suman 100%; Gold/Blue/sorpresas no se usan como relleno; Polar está marcado SIN PREMIO.');
