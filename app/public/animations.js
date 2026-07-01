// =====================================================================
//  animations.js  —  ALL ASCII ANIMATIONS live here.
//
//  Each animation is a function that takes a frame number `f` (it ticks up
//  ~8x/second) and returns a string of text to draw. They are collected in
//  the object returned below and referenced from content.js by name, e.g.
//  a project with  viz:'radar'  plays the `radar` animation.
//
//  THE ANIMATIONS (use these names as the `viz:` value in content.js):
//    radar  pipe  pantry  route  boot  web  dash  sheets  forge
//    court  mc    wave    hud    ascent ridge steam
//
//  TO TWEAK ONE: find it by name below and edit its drawing code.
//  TO ADD ONE:   add  myname:(f)=>{ ...return a string... },  then set
//                viz:'myname' on a project in content.js.
//
//  Tip: `\u2588` is a full block, `\u2591` a light block — handy for bars.
// =====================================================================
window.VIZ = (function () {
  let _songs;   // local cache for the music visualizer
      const hx=(n,w)=>(n>>>0).toString(16).toUpperCase().padStart(w,'0');
    return {
      // RAVEN-V - rotating LiDAR sweep with target blips
      radar:(f)=>{
        const W=27,H=13,cx=13,cy=6; const ang=(f*0.13)%(Math.PI*2);
        const blips=[[21,3],[6,9],[22,8],[5,4],[18,11]];
        const g=[];
        for(let y=0;y<H;y++){ let row='';
          for(let x=0;x<W;x++){
            const dx=(x-cx)/2.1, dy=(y-cy); const r=Math.hypot(dx,dy);
            let ch=' ';
            if(Math.abs(r-6)<0.45 || Math.abs(r-3.2)<0.4) ch='.';
            let a=Math.atan2(dy,dx); if(a<0)a+=Math.PI*2;
            let da=Math.abs(a-ang); if(da>Math.PI)da=Math.PI*2-da;
            if(r<6.1 && da<0.15) ch=':';
            if(x===cx && y===cy) ch='@';
            row+=ch;
          }
          g.push(row);
        }
        blips.forEach(([bx,by])=>{ if(by<0||by>=H||bx<0||bx>=W) return; const dx=(bx-cx)/2.1,dy=(by-cy); let a=Math.atan2(dy,dx); if(a<0)a+=Math.PI*2; let da=Math.abs(a-ang); if(da>Math.PI)da=Math.PI*2-da; const arr=g[by].split(''); arr[bx]= da<0.55?'O':'o'; g[by]=arr.join(''); });
        const deg=Math.round(ang*180/Math.PI).toString().padStart(3,' ');
        return g.join('\n')+'\nSWEEP '+deg+'\u00b0   targets '+blips.length+'   range 12.0m';
      },
      // 6502 - scalar pipeline with instructions flowing through
      pipe:(f)=>{
        const s=Math.floor(f/2);
        const ops=['LDA','TAX','INX','ADC','STA','CPX','BNE','JMP','NOP'];
        const st=['FETCH','DECOD','EXEC ','WRITE','INTRP'];
        const cur=st.map((x,i)=>{ const k=s-i; return k>=0?ops[k%ops.length]:'...'; });
        const L=[];
        L.push(' '+st.join('  '));
        L.push(' '+cur.map(o=>(o+'  ').slice(0,5)).join('  '));
        L.push(' '+'\u2500'.repeat(35));
        const A=(s*7)&0xff, X=(s*3)&0xff, Y=(s*5)&0xff, PC=0x8000+(s%64)*3;
        L.push(' A=$'+hx(A,2)+'  X=$'+hx(X,2)+'  Y=$'+hx(Y,2)+'  PC=$'+hx(PC,4));
        const ipc=(0.78+0.16*Math.sin(f/9)).toFixed(2);
        L.push(' clk '+(s%1000).toString().padStart(4,'0')+'   IPC '+ipc+'   '+((s%7===6)?'\u2691 branch flush':'pipeline full'));
        return L.join('\n');
      },
      // Kitchen Management Suite - recipe recommender matching against the pantry
      pantry:(f)=>{
        const recipes=[
          {n:'Pasta Primavera', it:[['pasta',1],['tomatoes',1],['basil',0],['garlic',1],['parmesan',1]]},
          {n:'Veggie Stir-Fry', it:[['rice',1],['peppers',1],['soy sauce',1],['ginger',0],['onion',1]]},
          {n:'Garden Omelette', it:[['eggs',1],['cheese',1],['onion',1],['spinach',1],['butter',1]]},
          {n:'Three-Bean Chili', it:[['beans',1],['tomatoes',1],['beef',0],['cumin',1],['onion',1]]},
        ];
        const PER=16, idx=Math.floor(f/PER)%recipes.length, k=f%PER;
        const r=recipes[idx], n=r.it.length;
        const shown=Math.min(n, k+1);
        const have=r.it.filter(x=>x[1]===1).length;
        const pct=Math.round(have/n*100);
        const L=[' KITCHEN SUITE \u00b7 RECIPE RECOMMENDER', ' '+'\u2500'.repeat(36)];
        L.push('  RECIPE   '+r.n);
        for(let i=0;i<5;i++){
          if(i<n && i<shown){ const it=r.it[i]; const box=it[1]?'[x]':'[ ]'; const tail=it[1]?'on hand':'need 1'; L.push('   '+box+' '+it[0].padEnd(14).slice(0,14)+' '+tail); }
          else L.push('');
        }
        L.push(' '+'\u2500'.repeat(36));
        const done=k>=n-1;
        L.push('  '+(done?('MATCH '+pct+'%  \u00b7  '+have+'/'+n+' on hand  '+(pct>=80?'\u2192 cook it!':'\u2192 add to list')):'scanning pantry...'));
        return L.join('\n');
      },
      // MaristMaps - indoor/outdoor route solver drawing a path
      route:(f)=>{
        const W=24,H=9;
        const buildings=[[1,0,4,2],[8,0,5,2],[16,0,5,2],[1,6,5,2],[15,6,6,2]];
        const path=[[6,3],[7,3],[8,3],[9,4],[10,5],[11,5],[12,5],[13,5],[14,4],[15,4],[16,4],[17,5],[18,5]];
        const grid=[]; for(let y=0;y<H;y++) grid.push(new Array(W).fill(' '));
        buildings.forEach(([bx,by,bw,bh])=>{ for(let y=by;y<by+bh;y++) for(let x=bx;x<bx+bw;x++){ if(y<H&&x<W) grid[y][x]='#'; } });
        const k=Math.floor(f/2)%(path.length+8);
        for(let i=0;i<Math.min(k,path.length);i++){ const p=path[i]; grid[p[1]][p[0]] = (i===k-1 && k<=path.length) ? '\u25b6' : '\u00b7'; }
        const s=path[0], e=path[path.length-1];
        grid[s[1]][s[0]]='A';
        grid[e[1]][e[0]] = (k>=path.length) ? '\u25c9' : '\u25ce';
        const lines=grid.map(r=>' '+r.join(''));
        const status = (k>=path.length) ? 'arrived - 320m \u00b7 2 floors' : 'routing\u2026 '+Math.round(Math.min(k,path.length)/path.length*100)+'%';
        return lines.join('\n')+'\n A=you  \u25ce=dest   '+status;
      },
      // This portfolio - Norton Commander panels booting / file tree building
      boot:(f)=>{
        const files=['PROJECTS','EXPERIENCE','EDUCATION','AWARDS','PROGRAMS','MY-FILES'];
        const IW=11, bar='\u2500'.repeat(IW), k=Math.floor(f/2)%(files.length+4);
        const L=[' \u250c'+bar+'\u2510 \u250c'+bar+'\u2510'];
        L.push(' \u2502'+'C:\\ROHAN'.padEnd(IW)+'\u2502 \u2502'+'INFO.TXT'.padEnd(IW)+'\u2502');
        L.push(' \u251c'+bar+'\u2524 \u251c'+bar+'\u2524');
        for(let i=0;i<6;i++){ const left=(i<k?files[i]:'').padEnd(IW).slice(0,IW); const right=(i<k?'\u2588'.repeat(Math.min(IW,i+2)):'').padEnd(IW).slice(0,IW); L.push(' \u2502'+left+'\u2502 \u2502'+right+'\u2502'); }
        L.push(' \u2514'+bar+'\u2518 \u2514'+bar+'\u2518');
        L.push(' C:\\ROHAN> NC.EXE /boot '+((Math.floor(f/3)%2)?'\u2588':' '));
        return L.join('\n');
      },
      // ISW Philosophy - browser rendering the rebuilt site, desktop/mobile
      web:(f)=>{
        const IW=30, bar='\u2500'.repeat(IW), k=Math.floor(f/2)%11;
        const rows=[
          '\u2588\u2588\u2588\u2588  ISW PHILOSOPHY   \u2588\u2588\u2588\u2588',
          'Home   About   Journal   Join',
          '\u2500'.repeat(IW),
          'World philosophy, reorganized',
          '',
          '\u2592\u2592\u2592\u2592\u2592    \u2592\u2592\u2592\u2592\u2592    \u2592\u2592\u2592\u2592\u2592',
          'essays    events    archive',
        ];
        const L=[' .\u2500[ iswphil.org ]'+'\u2500'.repeat(IW-13)+'.'];
        for(let i=0;i<rows.length;i++){ const c=i<k?rows[i]:''; L.push(' \u2502'+c.padEnd(IW).slice(0,IW)+'\u2502'); }
        L.push(" '"+bar+"'");
        const mode=(Math.floor(f/16)%2)?'[ MOBILE ]':'[ DESKTOP ]';
        L.push(' rebuild '+mode+'  WordPress \u2192 PHP theme');
        return L.join('\n');
      },
      // Data Analyst - campus dashboards drawing themselves
      dash:(f)=>{
        const labels=['ENROLL','RETAIN','EVENTS','SURVEY','ENGAGE','TRENDS'];
        const L=[' OFFICE OF COMMUNITY \u00b7 ANALYTICS', ' '+'\u2500'.repeat(34)];
        labels.forEach((lb,i)=>{ const v=Math.round((Math.sin(f/14+i*0.9)*0.5+0.5)*18); const bar='\u2588'.repeat(v)+'\u2591'.repeat(18-v); L.push(' '+lb+' '+bar+' '+(v*5+12).toString().padStart(3)); });
        L.push(' '+'\u2500'.repeat(34));
        L.push(' \u25b2 dashboards online   '+((Math.floor(f/3)%2)?'\u25cf':'\u25cb')+' sync   SQL \u00b7 Tableau');
        return L.join('\n');
      },
      // Web Developer - Sheets API populating a responsive curriculum map
      sheets:(f)=>{
        const cols=6, rows=4, k=Math.floor(f/2)%(cols*rows+8);
        const L=[' GOOGLE SHEETS API \u2192 CURRICULUM MAP', ' '+'\u2500'.repeat(34)];
        let n=0;
        for(let r=0;r<rows;r++){ let line=' '; for(let c=0;c<cols;c++){ line+=(n<k?'[\u2593\u2593\u2593]':'[   ]'); n++; } L.push(line); }
        L.push(' '+'\u2500'.repeat(34));
        L.push(' building map\u2026 '+Math.min(100,Math.round(k/(cols*rows)*100))+'%   Forms \u2192 Docs flow');
        return L.join('\n');
      },
      // Essex Heritage - Saugus Iron Works: waterwheel cranks a clear bellows -> reactive fire
      forge:(f)=>{
        const W=48, H=13;
        const g=[]; for(let r=0;r<H;r++) g.push(new Array(W).fill(' '));
        const put=(x,y,ch)=>{ if(y>=0&&y<H&&x>=0&&x<W) g[y][x]=ch; };
        const ln=(x0,y0,x1,y1,ch)=>{ let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx-dy,x=x0,y=y0; for(let i=0;i<60;i++){ put(x,y,ch); if(x===x1&&y===y1)break; const e2=2*err; if(e2>-dy){err-=dy;x+=sx;} if(e2<dx){err+=dx;y+=sy;} } };
        const ang=f*0.16;

        // ---- WATERWHEEL (overshot, left) ----
        const wcx=8, wcy=7, R=5;
        for(let y=0;y<H;y++) for(let x=0;x<W;x++){
          const mx=(x-wcx)*0.5, my=(y-wcy), d=Math.hypot(mx,my);
          if(Math.abs(d-R)<0.55){ let a=Math.atan2(my,mx)-ang; const seg=Math.floor((a/(Math.PI*2))*12); put(x,y, (((seg%2)+2)%2)?'o':'L'); }
        }
        for(let s=0;s<4;s++){ const a=ang+s*Math.PI/2; for(let rr=0.7; rr<R-0.4; rr+=0.45) put(Math.round(wcx+Math.cos(a)*rr*2), Math.round(wcy+Math.sin(a)*rr), '/'); }
        put(wcx,wcy,'@');

        // ---- WATER: flume + falling stream + tail race ----
        for(let x=0;x<=wcx-3;x++) put(x,2,'~'); put(wcx-2,2,'\\');
        for(let i=0;i<3;i++) put(wcx-2,(f+i)%4+2,'\u2502');
        const wt=(f%2)?'\u2248':'~'; for(let x=2;x<16;x++) put(x,H-1,wt);

        // ---- SHAFT across the top to the trip-hammer cam (far right) ----
        for(let x=wcx+1;x<=41;x++) put(x,2,'\u2500');
        const camUp=(Math.sin(ang*3)>0.3), hy=camUp?4:6, strike=!camUp&&(Math.floor(f)%2===0), hax=42;
        put(hax,hy-1,'\u2566'); put(hax,hy,'\u2551');
        put(hax-1,hy+1,'['); put(hax,hy+1,'\u2588'); put(hax+1,hy+1,']');
        put(hax-1,10,'/'); put(hax,10,'\u2588'); put(hax+1,10,'\u2588'); put(hax+2,10,'\\');
        put(hax,9, strike?'\u2593':'\u2588');
        if(strike){ put(hax-2,8,'\u2736'); put(hax+2,8,'\u2737'); }

        // ---- CRANK on the wheel -> BELLOWS (set apart, clearly accordion) ----
        const crankR=R-1;
        const pinx=Math.round(wcx+Math.cos(ang)*crankR*2), piny=Math.round(wcy+Math.sin(ang)*crankR);
        const blowing=(Math.sin(ang)>0);
        const backX=20, nozX=30, cy=7;
        const topY=blowing?6:4, botY=blowing?8:10, leverY=topY-2;
        // connecting rod from the wheel crank down to the bellows lever
        put(backX,leverY,'\u25e2');
        ln(pinx,piny,backX,leverY,'\u00b7');
        // rounded back cap
        for(let y=topY;y<=botY;y++) put(backX,y,'\u2502');
        put(backX,topY,'\u256d'); put(backX,botY,'\u2570');
        // top + bottom boards converging to the nozzle
        ln(backX+1,topY,nozX-1,cy,'_');
        ln(backX+1,botY,nozX-1,cy,'\u203e');
        // accordion pleats inside the chamber
        for(let px=backX+2; px<nozX-1; px+=2){ const tt=Math.round(topY+(px-backX)/(nozX-backX)*(cy-topY)); const bb=Math.round(botY+(px-backX)/(nozX-backX)*(cy-botY)); for(let y=tt+1;y<bb;y++) put(px,y, (y%2)?'\u2039':'\u203a'); }
        put(nozX,cy,'\u25b8');                                 // nozzle into the fire
        if(blowing){ const px=nozX+1+(f%3); put(px,cy,'\u00bb'); put(px+1,cy,'\u00b7'); }

        // ---- FORGE HEARTH to the right of the bellows, reacting to airflow ----
        const hx=34, fireH=blowing?4:2, flame=['\u2593','\u2592','\u2591'];
        for(let h=0;h<fireH;h++){ const y=cy+1-h, spread=Math.max(0,2-h); for(let x=hx-spread;x<=hx+spread;x++) put(x,y, flame[Math.min(2,h+((f+x)%2))]); }
        put(hx,cy+1-fireH, blowing?'\u2737':'\u00b7');
        for(let x=hx-3;x<=hx+3;x++){ put(x,cy+2,'\u2588'); put(x,cy+3,'\u2588'); }

        const heat = blowing ? '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591' : '\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591';
        const temp = 1300 + (blowing?260:120) + (Math.floor(f/2)%40);
        const L=[' SAUGUS IRON WORKS \u00b7 WATER-POWERED FORGE'];
        g.forEach(r=>L.push(' '+r.join('').replace(/\s+$/,'')));
        L.push(' WHEEL \u27f3 cranks BELLOWS '+(blowing?'\u25bc blow':'\u25b2 draw')+'   FORGE ['+heat+'] '+temp+'\u00b0F');
        return L.join('\n');
      },
      // MCW Starz - a little basketball game: shots arc in, make or miss, running score per game
      court:(f)=>{
        const W=30, H=8;
        const rimRow=3, cx=19, bbX=23;
        const ARC=12, RESULT=6, REST=4, T=ARC+RESULT+REST;
        const GP=11;                                  // possessions per game, then reset
        const k=f%T, poss=Math.floor(f/T);
        const game=Math.floor(poss/GP), base=game*GP, gp=poss%GP;
        const rnd=(n)=>{ const x=Math.sin(n*12.9898)*43758.5453; return x-Math.floor(x); };
        const isThree=(p)=>rnd(p*2.13+1.7)>0.62;       // ~38% threes
        const homeMade=(p)=>rnd(p*2.13+5.1)>0.46;      // ~54% make
        const awayScores=(p)=>rnd(p*3.7+2.2)>0.52;
        const awayThree=(p)=>rnd(p*3.7+8.8)>0.7;
        const three=isThree(base+gp), made=homeMade(base+gp), pts=three?3:2;
        // running score across THIS game's prior possessions
        let home=0, away=0;
        for(let i=0;i<gp;i++){ const p=base+i; if(homeMade(p)) home+=isThree(p)?3:2; if(awayScores(p)) away+=awayThree(p)?3:2; }
        const ballThrough = made && k>=ARC+3;
        if(ballThrough) home+=pts;
        const rows=[]; for(let r=0;r<H;r++) rows.push(new Array(W).fill(' '));
        // backboard + rim + net
        rows[0][bbX-1]='_'; rows[0][bbX]='_';
        rows[1][bbX]='|'; rows[2][bbX]='|'; rows[3][bbX]='|';
        rows[rimRow][cx-2]='('; rows[rimRow][cx-1]='='; rows[rimRow][cx]='='; rows[rimRow][cx+1]='='; rows[rimRow][cx+2]=')';
        rows[rimRow+1][cx-1]='\\'; rows[rimRow+1][cx+1]='/';
        rows[rimRow+2][cx]='V';
        for(let c=0;c<W;c++) rows[H-1][c]='_';
        // ball + outcome
        let bx, by, label;
        const startX = three?2:6;
        if(k<ARC){
          const t=k/(ARC-1);
          bx=Math.round(startX+t*(cx-startX));
          by=Math.round((rimRow-1)-Math.sin(t*Math.PI)*2);
          label=(three?'3PT':'2PT')+' attempt...';
        } else if(k<ARC+RESULT){
          const d=k-ARC;
          if(made){ bx=cx; by=(rimRow-1)+d; label='\u300a SWISH! +'+pts+' \u300b'; }
          else { const path=[[cx,rimRow-1],[cx+1,rimRow-1],[cx+2,rimRow],[cx+4,rimRow+1],[cx+5,rimRow+3],[cx+6,H-2]]; const p=path[Math.min(d,path.length-1)]; bx=p[0]; by=p[1]; label='clank! off the rim - no good'; }
        } else {
          label = made ? '\u300a bucket! +'+pts+' \u300b' : 'rebound, bring it back...';
          if(gp===GP-1) label='FINAL  '+home+'-'+away+'  '+(home>=away?'\u2605 STARZ WIN':'tough one');
        }
        if(by!==undefined && bx>=0 && bx<W && by>=0 && by<H) rows[by][bx]='o';
        const L=[' MCW STARZ   Q'+(((gp>>1)%4)+1)+'   HOME '+String(home).padStart(2,'0')+'   AWAY '+String(away).padStart(2,'0'), ''];
        rows.forEach(r=>L.push(' '+r.join('')));
        L.push(' '+label);
        return L.join('\n');
      },
      // Marist Minecraft Server - world builds up, players join, event goes live
      mc:(f)=>{
        const s=Math.floor(f/2);
        const cols=12, rowsH=6;
        const target=[2,3,3,4,5,5,4,3,4,5,4,3];
        const cycle=cols+7, k=s%cycle;
        const grid=[]; for(let y=0;y<rowsH;y++) grid.push(new Array(cols).fill(' '));
        for(let c=0;c<cols;c++){
          const h = c<k ? target[c] : 0;
          for(let y=0;y<h;y++){ const row=rowsH-1-y; if(row>=0) grid[row][c]=(y===h-1)?'\u2592':'\u2588'; }
        }
        const players=8+(s%15);
        const built=k>=cols;
        const L=[' MARIST MC SERVER     \u25c9 '+players+' online'];
        grid.forEach(r=>L.push('  '+r.map(ch=>ch+ch).join('')));
        L.push('  '+(built?'\u300a EVENT LIVE: Hunger Games \u300b':'generating world... '+Math.min(100,Math.round(k/cols*100))+'%'));
        return L.join('\n');
      },
      // MUSIC - a scrolling oscilloscope waveform that cycles through favorite tracks
      wave:(f)=>{
        const W=40, H=9, mid=(H-1)/2;
        const songs = _songs || (_songs=[
          { t:'Dogs', a:'Pink Floyd', beat:11, energy:0.80 },
          { t:'Pigs (Three Different Ones)', a:'Pink Floyd', beat:12, energy:0.78 },
          { t:'Sheep', a:'Pink Floyd', beat:9, energy:0.90 },
          { t:'Time', a:'Pink Floyd', beat:13, energy:0.70 },
          { t:'Money', a:'Pink Floyd', beat:10, energy:0.78 },
          { t:'Comfortably Numb', a:'Pink Floyd', beat:14, energy:0.72 },
          { t:'Schism', a:'Tool', beat:8, energy:0.86 },
          { t:'Lateralus', a:'Tool', beat:7, energy:0.92 },
          { t:'Forty Six & 2', a:'Tool', beat:9, energy:0.90 },
          { t:'Welcome to the Black Parade', a:'My Chemical Romance', beat:8, energy:0.95 },
          { t:'Famous Last Words', a:'My Chemical Romance', beat:7, energy:0.93 },
          { t:'My Heroine', a:'Silverstein', beat:6, energy:0.96 },
          { t:'Smile in Your Sleep', a:'Silverstein', beat:6, energy:0.97 },
        ]);
        const DUR=150;
        const song=songs[Math.floor(f/DUR)%songs.length];
        const prog=(f%DUR)/DUR;
        const g=[]; for(let r=0;r<H;r++) g.push(new Array(W).fill(' '));
        // beat envelope: the trace swells on each kick, then decays
        const bl=song.beat, bp=(f%bl)/bl;
        const punch=0.55+0.45*Math.max(0, 1-bp*2.2);
        for(let x=0;x<W;x++){
          const ph=x*0.45 - f*0.6;
          // layered partials make a richer, music-like waveform
          let s = Math.sin(ph)*0.6 + Math.sin(ph*2.1+1.0)*0.26 + Math.sin(ph*0.5)*0.34;
          s *= song.energy * punch;
          s += Math.sin(x*12.9+f*0.7)*0.10*punch;        // a little grit
          const yc=Math.max(0,Math.min(H-1,Math.round(mid - s*mid)));
          const a=Math.min(Math.round(mid),yc), b=Math.max(Math.round(mid),yc);
          for(let yy=a; yy<=b; yy++){ g[yy][x]= (yy===yc)?'\u2588':'\u2502'; }
          if(yc===Math.round(mid) && g[Math.round(mid)][x]===' ') g[Math.round(mid)][x]='\u2500';
        }
        const L=[' \u266a NOW PLAYING                  OSCILLOSCOPE'];
        g.forEach(r=>L.push(' '+r.join('')));
        const fillN=Math.round(prog*(W-2)); let bar=''; for(let i=0;i<W-2;i++) bar+= i<fillN?'\u2593':'\u2591';
        L.push(' '+bar);
        const full=song.t+'   \u00b7   '+song.a+'        ';
        let disp; if(full.length<=38){ disp=full+' '.repeat(38-full.length); } else { const off=Math.floor(f)%full.length; disp=(full+full).slice(off, off+38); }
        L.push(' '+disp);
        return L.join('\n');
      },
      // GAMING - calm, steady souls-like HUD (HP / FP / stamina + boss bar)
      hud:(f)=>{
        const W=40;
        const hp=Math.max(9, 20-(Math.floor(f/4)%12));
        const fp=15;
        const stam=Math.round(13+Math.sin(f*0.12)*2);
        const bossMax=30, boss=Math.max(0, bossMax-(Math.floor(f/3)%34));
        const bar=(v,max,n,ch)=>{ const k=Math.round(v/max*n); return ch.repeat(k)+'\u00b7'.repeat(Math.max(0,n-k)); };
        const L=[' '+'\u2500'.repeat(W)];
        L.push('  HP    ['+bar(hp,20,22,'\u2588')+']');
        L.push('  FP    ['+bar(fp,20,22,'\u2592')+']');
        L.push('  STAM  ['+bar(stam,20,22,'\u2591')+']');
        L.push('');
        L.push('  BOSS \u2620 ['+bar(boss,bossMax,24,'\u2588')+']');
        L.push('  souls-like \u00b7 metroidvania \u00b7 roguelike');
        L.push(' '+'\u2500'.repeat(W));
        return L.join('\n');
      },
      // CLIMBING - literally just a rock: a shaded boulder with light slowly raking across it
      ascent:(f)=>{
        const W=34, H=15;
        const g=[]; for(let r=0;r<H;r++) g.push(new Array(W).fill(' '));
        const cx=16.5, cy=7.4, rx=13, ry=6.2;
        const la=f*0.035, Lx=Math.cos(la), Ly=Math.sin(la)*0.6-0.55, Ll=Math.hypot(Lx,Ly)||1;
        const lx=Lx/Ll, ly=Ly/Ll;
        for(let y=0;y<H;y++) for(let x=0;x<W;x++){
          const nx=(x-cx)/rx, ny=(y-cy)/ry, ang=Math.atan2(ny,nx);
          const wob=0.12*Math.sin(ang*3+1.2)+0.06*Math.sin(ang*5-0.5);   // irregular boulder edge
          const r2=nx*nx+ny*ny;
          if(r2>1+wob) continue;
          let b=-(nx*lx+ny*ly);
          b=b*0.8+(1-r2)*0.3;
          let ch;
          if(r2>0.9+wob) ch='\u2593';
          else if(b<-0.12) ch='\u2591';
          else if(b<0.20) ch='\u2592';
          else if(b<0.52) ch='\u2593';
          else ch='\u2588';
          g[y][x]=ch;
        }
        // fault cracks raking down the face (part of the rock itself)
        const crack=(x0,y0,x1,y1)=>{ const n=24; for(let i=0;i<=n;i++){ const x=Math.round(x0+(x1-x0)*i/n), y=Math.round(y0+(y1-y0)*i/n); if(x>=0&&x<W&&y>=0&&y<H&&g[y][x]!==' ') g[y][x]='\u2591'; } };
        crack(12,2,15,12); crack(22,3,18,12);
        return g.map(r=>' '+r.join('')).join('\n');
      },
      // HIKING - a smoothly scrolling journey, climbing toward the snowcapped dome of Mt. Rainier
      ridge:(f)=>{
        const W=42, H=9;
        const g=[]; for(let r=0;r<H;r++) g.push(new Array(W).fill(' '));
        const scroll=f*0.4;                    // continuous pan = smooth glide
        const PERIOD=160;                      // distance between Rainier summits (loops seamlessly)
        const base=H-1;
        const elevAt=(wc)=>{
          let e = Math.sin(wc*0.11)*1.0 + Math.sin(wc*0.27+1.3)*0.5 + Math.sin(wc*0.045)*1.5; // rolling foothills
          const p=((wc%PERIOD)+PERIOD)%PERIOD, d=Math.min(p,PERIOD-p);
          e += Math.exp(-(d*d)/(2*8*8))*7.4;   // Rainier: a tall smooth gaussian dome
          return e;
        };
        const rows=[]; for(let x=0;x<W;x++){ rows[x]=Math.max(0,Math.min(H-1, Math.round(base-1-elevAt(x+scroll)))); }
        for(let x=0;x<W;x++){ const y=rows[x]; g[y][x]='^'; for(let yy=y+1;yy<H;yy++) g[yy][x]=(yy===y+1)?'\u2592':'\u2591'; }
        // snowcaps on the high ground
        for(let x=0;x<W;x++){ if(rows[x]<=2) g[rows[x]][x]='\u25b2'; }
        // plant a flag on each summit crest as it passes through
        for(let x=1;x<W-1;x++){ if(rows[x]<=1 && rows[x]<rows[x-1] && rows[x]<=rows[x+1] && rows[x]-1>=0) g[rows[x]-1][x]='\u2691'; }
        // hiker holds a fixed screen spot and rides the terrain up and down as it flows past
        const hxp=9; let hy=Math.max(0,rows[hxp]-1);
        g[hy][hxp]='R';
        const L=[' TRAIL \u00b7 the long climb to the summit'];
        g.forEach(r=>L.push(' '+r.join('')));
        L.push(' R Monadnock \u2192 Washington \u2192 Katahdin \u2192 \u25b2 RAINIER');
        return L.join('\n');
      },
      // COOKING - pot on a burner with rising steam + heat (heat/steam/organic)
      steam:(f)=>{
        const W=30, H=8;
        const g=[]; for(let r=0;r<H;r++) g.push(new Array(W).fill(' '));
        const cx=14;
        // steam wisps rising and curling
        for(let i=0;i<4;i++){ const phase=f*0.5+i*1.7; const y= (f+i*2)%5; const x=cx-3+i*2 + Math.round(Math.sin(phase)*1.5); if(y<4) g[y][x]= (y%2)?'\u0282':'\u0283'==='\u0283'?'~':'~'; }
        for(let i=0;i<4;i++){ const x=cx-3+i*2 + Math.round(Math.sin(f*0.5+i*1.7)*1.5); const y=(f+i*2)%5; if(y>=0&&y<4&&x>=0&&x<W) g[y][x]='\u0303'==='\u0303'?'\u2248':'\u2248'; }
        // pot
        const potY=5;
        g[potY][cx-4]='\u255a'; for(let x=cx-3;x<=cx+3;x++) g[potY][x]='\u2550'; g[potY][cx+4]='\u255d';
        for(let x=cx-4;x<=cx+4;x++){ g[potY-1][x]= (x===cx-4||x===cx+4)?'\u2551':' '; }
        g[potY-1][cx-5]='('; g[potY-1][cx+5]=')';
        // burner flames reacting
        const fl=['\u2229','\u028c','\u2227'][f%3];
        for(let x=cx-3;x<=cx+3;x+=2) g[potY+1][x]= (f%2)? '\u028c':'\u2229';
        for(let x=cx-4;x<=cx+4;x++) g[potY+2][x]='\u2550';
        const L=[' KITCHEN \u00b7 experiment > recipe'];
        g.forEach(r=>L.push(' '+r.join('')));
        L.push(' Indian \u00b7 Asian \u00b7 Greek \u00b7 Mexican \u00b7 fusion');
        return L.join('\n');
      },
    };
})();
