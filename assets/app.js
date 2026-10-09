(()=>{'use strict';const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;const y=$('#year');if(y)y.textContent=new Date().getFullYear();const menu=$('#menu'),links=$('#navlinks');if(menu&&links){menu.addEventListener('click',()=>{const open=links.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'×':'☰'});$$('#navlinks a').forEach(a=>a.addEventListener('click',()=>{links.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰'}))}
if(!reduce&&'IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.12});$$('.reveal').forEach(el=>io.observe(el))}else $$('.reveal').forEach(el=>el.classList.add('visible'));
const pg=$('#pageProgress');function progress(){if(pg){const max=document.documentElement.scrollHeight-innerHeight;pg.style.width=(max>0?scrollY/max*100:0)+'%'}}addEventListener('scroll',progress,{passive:true});progress();

/* Storytelling Scroll Engine & 3D Shuffling Deck */
const story=$('#story');
if(story){
  const beats=$$('.story-beat',story);
  const cards=$$('.deck-card',story);
  const dots=$$('.deck-dot',story);
  const deck=$('#storyDeck');
  const storyClock=$('#storyClock');
  const storyCounter=$('#storyCounter');
  const progressBar=$('#deckProgressBar');
  const cnt=$('#cnt');
  const prevBtn=$('#deckPrev');
  const nextBtn=$('#deckNext');
  const totalBeats=cards.length||5;
  let currentBeat=-1;
  let counted=false;
  const timeLabels=[
    '09:41 AM / THE SILENCE',
    '09:41 AM / THE FRICTION',
    '09:41 AM / THE GHOSTING',
    'DAY 0 / THE SYSTEM',
    'DAY 0 / THE CLOSE'
  ];

  const navClock=$('#navClock');
  const clockBeats=['09:41 AM','09:41 AM','09:41 AM','Day 0','Day 0'];

  function updateDeck(beatIndex,fractionInBeat=0){
    if(beatIndex<0)beatIndex=0;
    if(beatIndex>=totalBeats)beatIndex=totalBeats-1;

    // Stop Plateau: when fractionInBeat < 0.7, card is firmly stopped and readable
    const isStopped=fractionInBeat<0.7;
    if(deck)deck.classList.toggle('is-stopped',isStopped);

    cards.forEach((card,idx)=>{
      const isActive=idx===beatIndex;
      card.setAttribute('aria-hidden',String(!isActive));
      if(isActive){
        card.removeAttribute('inert');
      }else{
        card.setAttribute('inert','');
      }

      card.style.transform='';
      card.style.opacity='';

      if(idx<beatIndex){
        card.setAttribute('data-state','exited');
      }else if(idx===beatIndex){
        card.setAttribute('data-state','active');
      }else if(idx===beatIndex+1){
        card.setAttribute('data-state','next-1');
      }else if(idx===beatIndex+2){
        card.setAttribute('data-state','next-2');
      }else{
        card.setAttribute('data-state','queued');
      }
    });

    if(currentBeat!==beatIndex){
      currentBeat=beatIndex;
      beats.forEach((b,i)=>b.classList.toggle('active',i===beatIndex));
      dots.forEach((d,i)=>d.classList.toggle('active',i===beatIndex));
      if(storyClock)storyClock.textContent=timeLabels[beatIndex]||'DAY 0';
      if(storyCounter)storyCounter.textContent=`0${beatIndex+1} / 05`;
      if(navClock)navClock.textContent=clockBeats[beatIndex]||'Day 0';

      if(beatIndex===4&&cnt&&!counted){
        counted=true;
        if(!reduce){
          let startT=null;
          const anim=(t)=>{
            if(!startT)startT=t;
            const k=Math.min(1,(t-startT)/1100);
            const val=Math.round(28500*(1-Math.pow(1-k,3)));
            cnt.textContent='₦'+val.toLocaleString('en-NG');
            if(k<1)requestAnimationFrame(anim);
          };
          requestAnimationFrame(anim);
        }else{
          cnt.textContent='₦28,500';
        }
      }
    }

    if(progressBar){
      const totalProgress=(beatIndex+fractionInBeat)/(totalBeats-1);
      progressBar.style.width=Math.min(100,Math.max(5,Math.round(totalProgress*100)))+'%';
    }
  }

  let isProgrammaticScroll=false;

  function onScroll(){
    if(isProgrammaticScroll)return;
    const rect=story.getBoundingClientRect();
    const track=story.offsetHeight-innerHeight;
    if(track<=0)return;
    const p=Math.min(1,Math.max(0,-rect.top/track));
    const rawP=p*totalBeats;
    const beatIndex=Math.min(totalBeats-1,Math.floor(rawP));
    const fractionInBeat=Math.min(1,rawP-beatIndex);
    updateDeck(beatIndex,fractionInBeat);
  }

  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',onScroll);
  onScroll();

  function jumpToBeat(targetBeat){
    isProgrammaticScroll=true;
    updateDeck(targetBeat,0);
    const track=story.offsetHeight-innerHeight;
    const targetTop=story.offsetTop+((targetBeat+0.25)/totalBeats)*track;
    window.scrollTo({top:targetTop,behavior:reduce?'auto':'smooth'});
    setTimeout(()=>{isProgrammaticScroll=false;},reduce?50:800);
  }

  dots.forEach(dot=>{
    dot.addEventListener('click',()=>{
      const targetBeat=Number(dot.dataset.goto||0);
      jumpToBeat(targetBeat);
    });
  });

  if(prevBtn){
    prevBtn.addEventListener('click',()=>{
      const targetBeat=Math.max(0,currentBeat-1);
      jumpToBeat(targetBeat);
    });
  }

  if(nextBtn){
    nextBtn.addEventListener('click',()=>{
      const targetBeat=Math.min(totalBeats-1,currentBeat+1);
      jumpToBeat(targetBeat);
    });
  }
}

const filterBtns=$$('.filter-btn'),projectCards=$$('.project-card');filterBtns.forEach(b=>b.addEventListener('click',()=>{filterBtns.forEach(x=>x.classList.toggle('active',x===b));projectCards.forEach(c=>c.hidden=b.dataset.filter!=='all'&&c.dataset.type!==b.dataset.filter)}));
const calc=$('#priceCalculator');if(calc){const base=()=>Number($('input[name="package"]:checked',calc)?.value||0);const extras=()=>$$('[data-extra]:checked',calc).reduce((s,e)=>s+Number(e.value||0),0);const pages=$('#extraPages');function update(){const n=Math.max(0,Math.min(20,Number(pages?.value||0)));if(pages)pages.value=n;const selected=$('input[name="package"]:checked',calc);const custom=selected?.dataset.custom==='true';const isGrowing=selected?.dataset.label==='Growing business website';const addOnTotal=$$('[data-extra]:checked',calc).reduce((sum,e)=>sum+((isGrowing&&e.dataset.label==='Analytics')?0:Number(e.value||0)),0);const total=base()+addOnTotal+n*10000;$('#calcTotal').textContent=custom?'Custom quote':'₦'+total.toLocaleString('en-NG');$('#calcBreakdown').textContent=custom?'Your requirements need a tailored scope and quote.':'Starting estimate. Your final fixed price is confirmed before work begins.';if(isGrowing&&$('[data-extra][data-label="Analytics"]',calc)?.checked)$('#calcBreakdown').textContent+=' Analytics is included in the Growing website and was not added to the total.';const monthly=$('input[name="care"]:checked',calc);$('#monthlyCost').textContent=monthly&&monthly.value!=='0'?'Monthly care: ₦'+Number(monthly.value).toLocaleString('en-NG')+'/month':'No monthly care selected';const params=new URLSearchParams();if(selected)params.set('package',selected.dataset.label||selected.parentElement.innerText.trim());$$('[data-extra]:checked',calc).forEach(e=>params.append('addOn',e.dataset.label||e.parentElement.innerText.trim()));if(n)params.set('extraPages',String(n));if(monthly&&monthly.value!=='0')params.set('care',monthly.value);$$('[data-carry]').forEach(a=>a.href='start.html?'+params.toString())}calc.addEventListener('change',update);pages?.addEventListener('input',update);update()}
const form=$('#projectForm');if(form){const params=new URLSearchParams(location.search);const pkg=$('#projectType');if(pkg&&params.get('package')){const raw=params.get('package').toLowerCase();for(const opt of pkg.options)if(raw.includes(opt.text.toLowerCase())||opt.text.toLowerCase().includes(raw)){pkg.value=opt.value;break}}const summary=$('#formSummary');if(summary){summary.textContent=params.toString()?('Your selections: '+params.toString().replaceAll('+',' ')):'No calculator selections carried over.'}form.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form);const lines=['TRIXELTECH PROJECT ENQUIRY','',...Array.from(data.entries()).map(([k,v])=>k+': '+v), '',summary?.textContent||''];const message=encodeURIComponent(lines.join('\\n'));const url='https://t.me/trixeltech?text='+message;$('#submitMessage').textContent='Your enquiry is prepared. Continue to Telegram to send it. If Telegram does not open, copy the summary below and email hello@trixeltech.com.';$('#submissionSummary').textContent=lines.join('\\n');$('#telegramContinue').href=url;$('#submitResult').hidden=false;$('#submitResult').scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'})})}
const copy=$('#copySummary');if(copy)copy.addEventListener('click',async()=>{const text=$('#submissionSummary')?.textContent||'';try{await navigator.clipboard.writeText(text);copy.textContent='Copied ✓'}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();copy.textContent='Copied ✓'}});
})();