// Original, language-neutral technical diagrams. Run with a sharp installation
// available through NODE_PATH to regenerate the PNG previews from the SVG masters.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {TOPICS} from './help.mjs';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharp = require('sharp');
const mint = '#8de1d2', amber = '#ffd58c', blue = '#8caeff';
const line = (x1,y1,x2,y2,color=mint,width=9) => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
const rect = (x,y,w,h,fill='#17283d',stroke='#405672',r=20) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="5"/>`;
const check = (x,y,scale=1) => `<g transform="translate(${x} ${y}) scale(${scale})"><circle r="35" fill="${mint}"/><path d="M-16 0l11 12 23-25" fill="none" stroke="#102635" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></g>`;
const camera = (x,y,scale=1) => `<g transform="translate(${x} ${y}) scale(${scale})">${rect(-105,-55,210,110,'#263b55',mint,30)}<circle r="37" fill="#101825" stroke="${mint}" stroke-width="8"/><circle r="16" fill="${blue}"/><circle cx="-70" cy="0" r="7" fill="${amber}"/>${line(0,60,0,85)}${line(-50,90,50,90)}</g>`;
const monitor = (x,y,w=400,h=250,fill='#101825') => `${rect(x,y,w,h,fill)}${line(x+w/2,y+h,x+w/2,y+h+50,'#405672',13)}${line(x+w/2-70,y+h+55,x+w/2+70,y+h+55,'#405672',13)}`;
const wifi = (x,y) => `<g transform="translate(${x} ${y})" fill="none" stroke="${mint}" stroke-width="12" stroke-linecap="round"><path d="M-75 0Q0-70 75 0M-48 28Q0-18 48 28M-20 53Q0 32 20 53"/><circle cx="0" cy="77" r="7" fill="${mint}" stroke="none"/></g>`;
const arrow = (x1,y1,x2,y2,color=amber) => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="8" stroke-dasharray="13 13" marker-end="url(#arrow)"/>`;
const scene = (x,y,color=blue) => `<g transform="translate(${x} ${y})"><circle cx="130" cy="25" r="27" fill="${amber}"/><path d="M0 150l80-100 55 65 40-40 65 75z" fill="${color}"/><path d="M20 177h220" stroke="${mint}" stroke-width="7"/></g>`;
const art = {
  'webcam-test': `${rect(165,105,720,410)}${rect(185,125,680,45,'#22344b','#22344b',8)}<circle cx="215" cy="147" r="8" fill="${amber}"/><circle cx="245" cy="147" r="8" fill="${blue}"/>${rect(200,195,490,280,'#0f1c2d','#405672',12)}${camera(445,325,1.15)}${check(775,250)}${check(775,345)}${check(775,440)}${line(950,230,1020,230,blue)}${line(950,315,1050,315,blue)}${line(950,400,1005,400,blue)}`,
  'webcam-for-pc': `${monitor(600,190,440,270)}${scene(690,240)}${camera(300,245,1.3)}<path d="M300 375v105q0 35 35 35h155q35 0 35-35V350h75" fill="none" stroke="${amber}" stroke-width="12"/>${rect(565,330,60,40,amber,amber,6)}${check(1025,160)}`,
  'iriun-webcam': `${rect(150,120,210,390,'#1d3149',blue,32)}${rect(170,175,170,265,'#0e1c2c','#405672',10)}<circle cx="255" cy="148" r="9" fill="${mint}"/>${camera(255,300,.65)}${monitor(680,190,385,250)}${scene(740,220)}${wifi(510,170)}${arrow(400,355,610,355)}${check(1055,160)}`,
  'logitech-webcam': `${monitor(200,260,480,235)}${camera(440,182,1.55)}<path d="M625 175h165q55 0 55 55v170q0 65 65 65h55" fill="none" stroke="${amber}" stroke-width="12"/>${rect(950,436,80,58,amber,amber,9)}${rect(1030,446,38,38,'#abc1d3','#abc1d3',3)}<circle cx="440" cy="370" r="50" fill="#243c56"/>${line(400,445,480,445,blue)}${check(755,480)}`,
  'camera-permissions': `${rect(155,125,530,370)}${line(190,185,640,185,'#405672',5)}${camera(295,310,.7)}${rect(425,270,180,85,'#2c766e',mint,42)}<circle cx="560" cy="312" r="31" fill="${mint}"/>${line(220,430,610,430,'#405672',8)}<path d="M875 130l140 55v130q0 125-140 195-140-70-140-195V185z" fill="#1b3c45" stroke="${mint}" stroke-width="8"/>${check(875,310,1.7)}`,
  'webcam-black-screen': `${monitor(145,160,530,320,'#050a11')}<path d="M410 245l75 130H335z" fill="${amber}"/><path d="M410 282v42" stroke="#172335" stroke-width="12" stroke-linecap="round"/><circle cx="410" cy="347" r="7" fill="#172335"/>${camera(900,210,1)}${rect(858,163,85,95,'#405672',blue,8)}<path d="M840 340v110h-70m130-110v110h70" fill="none" stroke="${amber}" stroke-width="12"/>${line(850,420,880,380,amber,5)}${line(870,470,900,430,amber,5)}`,
  'microphone-test': `${rect(210,135,120,235,'#29415d',mint,60)}<path d="M170 290v25q0 120 100 120t100-120v-25M270 435v75M205 515h130" fill="none" stroke="${mint}" stroke-width="12" stroke-linecap="round"/>${[36,80,130,200,260,170,110,55,90,150].map((h,i)=>rect(465+i*52,315-h/2,25,h,i>6?amber:mint,i>6?amber:mint,12)).join('')}${line(455,500,1000,500,'#405672',10)}`,
  'webcam-image-quality': `${rect(125,145,435,340)}${rect(640,145,435,340)}<g opacity=".4" filter="url(#blur)">${scene(215,205,'#637491')}</g>${scene(730,205)}<g stroke="${mint}" stroke-width="6" fill="none"><path d="M680 210v-30h35M1000 180h35v30M680 415v30h35M1000 445h35v-30"/></g>${check(1025,465,.8)}${line(240,530,445,530,'#405672',10)}${line(755,530,960,530,mint,10)}`,
};
Object.assign(art, {
  'webcam-in-use': `${camera(600,160,1)}${monitor(120,330,350,180)}${monitor(730,330,350,180)}${arrow(500,200,300,300)}${arrow(700,200,900,300)}${check(300,420)}<circle cx="900" cy="420" r="40" fill="${amber}"/>${line(875,395,925,445,'#101825',9)}${line(925,395,875,445,'#101825',9)}`,
  'webcam-background': `${rect(140,140,920,370)}${scene(700,220)}${rect(200,200,380,250,'#263b55',blue)}<circle cx="390" cy="290" r="42" fill="${mint}"/><path d="M310 420q0-90 80-90t80 90" fill="${mint}"/>${line(620,170,620,480,amber,5)}`,
  'webcam-resolution-fps': `${rect(130,130,390,270)}${rect(670,130,390,270)}${[1,2,3].map(i=>line(130+i*97,130,130+i*97,400,blue,3)).join('')}${[1,2,3,4,5,6,7].map(i=>line(670+i*48,130,670+i*48,400,mint,3)).join('')}${[1,2].map(i=>line(130,130+i*90,520,130+i*90,blue,3)).join('')}${[1,2,3,4,5].map(i=>line(670,130+i*45,1060,130+i*45,mint,3)).join('')}${arrow(130,510,1050,510)}${[220,400,580,760,940].map(x=>rect(x,470,60,80,'#263b55',amber,5)).join('')}`,
  'webcam-mirror': `${rect(130,160,400,310)}${rect(670,160,400,310)}${scene(200,210)}<g transform="translate(1140 0) scale(-1 1)">${scene(150,210)}</g>${line(600,110,600,520,amber,4)}${arrow(510,110,700,110)}${arrow(700,530,510,530)}`,
  'obs-webcam-setup': `${rect(150,100,900,440)}${rect(180,130,540,260)}${camera(450,250,1)}${rect(750,130,270,260)}${line(800,200,970,200,blue,12)}${line(800,250,930,250,blue,12)}${line(800,300,950,300,blue,12)}${rect(180,420,840,90)}${line(240,450,240,480)}${line(225,465,255,465)}${line(300,465,600,465,'#405672',12)}${check(965,465,.65)}`,
  'obs-webcam-frame': `${rect(170,160,560,330)}${scene(240,210)}<path d="M250 120h750v360H250z" fill="none" stroke="${mint}" stroke-width="20"/>${line(280,145,400,145,amber,10)}${line(850,450,970,450,amber,10)}${arrow(925,540,800,500)}`,
  'phone-as-webcam': `${rect(150,120,210,380,'#263b55',blue,30)}${camera(255,280,.6)}${monitor(690,180,380,270)}${camera(880,300,.8)}${arrow(410,240,630,240)}<path d="M290 510h240q40 0 40-40v-70h100" fill="none" stroke="${amber}" stroke-width="10"/>${wifi(520,320)}`,
  'webcam-setup': `${monitor(130,150,530,320)}${scene(240,200)}${[210,315,420].map((y,i)=>`${line(760,y,1060,y,'#405672',12)}<circle cx="${820+i*75}" cy="${y}" r="23" fill="${i===1?amber:mint}"/>`).join('')}${check(600,450,.7)}`,
  'webcam-on-off': `${camera(330,245,1.6)}${rect(720,200,300,130,'#2c766e',mint,65)}<circle cx="950" cy="265" r="50" fill="${mint}"/>${rect(720,390,300,80,'#263b55',blue,40)}<circle cx="765" cy="430" r="28" fill="${blue}"/>${line(190,440,470,440,amber,13)}`,
  'obs-webcam-black-screen': `${rect(125,120,600,400)}${rect(150,150,350,240,'#050a11')}${rect(525,150,175,240)}${line(550,220,670,220,amber,10)}${line(550,280,640,280,blue,10)}${camera(930,230,.9)}${arrow(870,380,620,440)}${rect(155,420,405,70)}${check(215,455,.5)}`,
  'webcam-crop': `${rect(170,130,850,390)}${scene(450,240)}<path d="M340 110v340h620M940 540V200H320" fill="none" stroke="${mint}" stroke-width="16"/>${line(170,325,320,325,amber,5)}${line(960,325,1080,325,amber,5)}<circle cx="640" cy="325" r="90" fill="none" stroke="${blue}" stroke-width="4" stroke-dasharray="9 9"/>`,
  'webcam-lighting': `<circle cx="600" cy="290" r="70" fill="${mint}"/><path d="M460 510q0-145 140-145t140 145" fill="${mint}"/>${rect(140,150,170,210,'#263b55',amber,20)}${rect(890,150,170,210,'#263b55',amber,20)}${line(225,360,225,510,'#405672',12)}${line(975,360,975,510,'#405672',12)}${[220,280,340].map(y=>`${line(340,y,470,290,amber,4)}${line(860,y,730,290,amber,4)}`).join('')}${camera(600,125,.55)}`,
});
const out = path.join(root,'img/help');
const masters = path.join(root,'_src/help/illustrations');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(masters,{recursive:true});
for (const id of TOPICS) {
  if (!art[id]) throw new Error(`Missing original diagram: ${id}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><radialGradient id="bg"><stop stop-color="#24364f"/><stop offset="1" stop-color="#101825"/></radialGradient><filter id="blur"><feGaussianBlur stdDeviation="6"/></filter><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5 0 10z" fill="${amber}"/></marker></defs><rect width="1200" height="630" fill="url(#bg)"/><circle cx="1090" cy="65" r="200" fill="#8de1d2" opacity=".025"/><circle cx="70" cy="600" r="220" fill="#8caeff" opacity=".035"/>${art[id]}</svg>`;
  fs.writeFileSync(path.join(masters,id+'.svg'),svg);
  fs.writeFileSync(path.join(out,id+'.svg'),svg);
  await sharp(Buffer.from(svg)).png({compressionLevel:9}).toFile(path.join(out,id+'.png'));
}
console.log(`Generated ${TOPICS.length} original diagrams (SVG masters + PNG previews).`);
