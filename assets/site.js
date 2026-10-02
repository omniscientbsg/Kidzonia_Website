/* Kidzonia internal pages: navigation, forms, centre search. No dependencies. */
(function(){
  'use strict';

  /* ---------- landing from the greeter tunnel: ease the page in ---------- */
  try{
    if(sessionStorage.getItem('kz-arrive')){
      sessionStorage.removeItem('kz-arrive');
      document.body.classList.add('arrive');
    }
  }catch(e){}

  /* ---------- mobile nav ---------- */
  var nav=document.getElementById('nav'),
      burger=document.querySelector('.burger'),
      closeBtn=document.querySelector('.nav-close'),
      scrim=document.querySelector('.scrim');

  function setNav(open){
    if(!nav) return;
    nav.classList.toggle('open',open);
    if(scrim) scrim.classList.toggle('on',open);
    if(burger) burger.setAttribute('aria-expanded',String(open));
    document.body.style.overflow=open?'hidden':'';
    if(open&&closeBtn) closeBtn.focus();
    if(!open&&burger&&nav.contains(document.activeElement)) burger.focus();
  }
  if(burger) burger.addEventListener('click',function(){setNav(true)});
  if(closeBtn) closeBtn.addEventListener('click',function(){setNav(false)});
  if(scrim) scrim.addEventListener('click',function(){setNav(false)});

  /* ---------- dropdowns: hover on desktop, click everywhere ---------- */
  var items=[].slice.call(document.querySelectorAll('.nav-item'));
  items.forEach(function(item){
    var btn=item.querySelector('.nav-top');
    btn.addEventListener('click',function(){
      var open=!item.classList.contains('open');
      items.forEach(function(i){i.classList.remove('open');i.querySelector('.nav-top').setAttribute('aria-expanded','false')});
      item.classList.toggle('open',open);
      btn.setAttribute('aria-expanded',String(open));
    });
  });
  document.addEventListener('click',function(e){
    if(!e.target.closest('.nav-item')) items.forEach(function(i){i.classList.remove('open');i.querySelector('.nav-top').setAttribute('aria-expanded','false')});
  });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape') return;
    if(nav&&nav.classList.contains('open')) return setNav(false);
    items.forEach(function(i){i.classList.remove('open')});
  });
  /* pages that don't exist yet stay visible in the menu but go nowhere */
  document.addEventListener('click',function(e){
    var a=e.target.closest('a.soon'); if(a) e.preventDefault();
  });

  /* ---------- forms ----------
     There is no backend yet: a valid form swaps to its confirmation panel.
     Wire each form's submit to the real endpoint before launch. */
  [].slice.call(document.querySelectorAll('form[data-form]')).forEach(function(form){
    var err=form.querySelector('.form-error');
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var bad=[];
      [].slice.call(form.querySelectorAll('[required]')).forEach(function(f){
        var ok=f.type==='radio'
          ? !!form.querySelector('input[name="'+f.name+'"]:checked')
          : f.checkValidity();
        f.setAttribute('aria-invalid',ok?'false':'true');
        if(!ok) bad.push(f);
      });
      if(bad.length){
        if(err){err.hidden=false;}
        bad[0].focus();
        return;
      }
      if(err) err.hidden=true;
      var done=document.getElementById(form.dataset.form);
      if(done){
        form.hidden=true; done.hidden=false;
        var h=done.querySelector('[tabindex="-1"]'); if(h) h.focus();
      }
    });
    form.addEventListener('input',function(e){
      if(e.target.getAttribute('aria-invalid')==='true'&&e.target.checkValidity()) e.target.setAttribute('aria-invalid','false');
    });
  });

  /* ---------- hero slider ----------
     Photos crossfade behind the headline. A slide whose image is missing is
     dropped, so the hero still works with a single photo. */
  [].slice.call(document.querySelectorAll('[data-slider]')).forEach(function(box){
    var imgs=[].slice.call(box.querySelectorAll('img')), dots=null, i=0, timer=null;
    var still=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function show(n){
      imgs[i].classList.remove('is-on');
      i=(n+imgs.length)%imgs.length;
      imgs[i].classList.add('is-on');
      if(dots) [].slice.call(dots.children).forEach(function(d,k){d.setAttribute('aria-current',String(k===i))});
    }
    function play(){ if(!still&&imgs.length>1){clearInterval(timer);timer=setInterval(function(){show(i+1)},6000);} }
    function stop(){ clearInterval(timer); }
    function build(){
      if(dots){dots.remove();dots=null;}
      stop();
      if(imgs.length<2) return;
      dots=document.createElement('div'); dots.className='hero-dots';
      imgs.forEach(function(img,k){
        var b=document.createElement('button'); b.type='button';
        b.setAttribute('aria-label','Show photo '+(k+1)+' of '+imgs.length);
        b.addEventListener('click',function(){show(k);play();});
        dots.appendChild(b);
      });
      box.parentNode.appendChild(dots);
      show(i); play();
    }
    function drop(img){
      var k=imgs.indexOf(img); if(k<0) return;
      var wasOn=img.classList.contains('is-on');
      img.remove(); imgs.splice(k,1);
      if(k<i||(wasOn&&i>=imgs.length)) i=Math.max(0,i-1);
      if(wasOn&&imgs[i]) imgs[i].classList.add('is-on');
      build();
    }
    imgs.slice().forEach(function(img){
      if(img.complete&&img.naturalWidth===0) drop(img);
      else img.addEventListener('error',function(){drop(img)});
    });
    var hero=box.parentNode;
    hero.addEventListener('mouseenter',stop); hero.addEventListener('mouseleave',play);
    hero.addEventListener('focusin',stop); hero.addEventListener('focusout',play);
    build();
  });

  /* ---------- centre finder ---------- */
  var q=document.getElementById('centre-q');
  if(q){
    var cities=[].slice.call(document.querySelectorAll('.city')),
        none=document.getElementById('no-centres'),
        status=document.getElementById('centre-status');
    var esc=function(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
    var run=function(){
      var term=q.value.trim().toLowerCase(), shown=0;
      cities.forEach(function(city){
        var cityName=city.dataset.city.toLowerCase(),
            cityHit=term&&cityName.indexOf(term)>-1, any=false;
        [].slice.call(city.querySelectorAll('.chips li')).forEach(function(li){
          var text=li.dataset.name, i=text.toLowerCase().indexOf(term);
          var hit=!term||cityHit||i>-1;
          li.hidden=!hit;
          li.innerHTML=(term&&i>-1)
            ? esc(text.slice(0,i))+'<mark>'+esc(text.slice(i,i+term.length))+'</mark>'+esc(text.slice(i+term.length))
            : esc(text);
          if(hit){any=true;shown++;}
        });
        city.hidden=!any;
      });
      none.hidden=shown>0;
      if(!shown) cities.forEach(function(c){c.hidden=false;[].slice.call(c.querySelectorAll('.chips li')).forEach(function(li){li.hidden=false})});
      status.textContent=term?(shown?shown+' matching centre areas':'No centres found in that area'):'';
    };
    [].slice.call(document.querySelectorAll('.chips li')).forEach(function(li){li.dataset.name=li.textContent});
    q.addEventListener('input',run);
    document.getElementById('centre-form').addEventListener('submit',function(e){e.preventDefault();run();});
  }
})();
