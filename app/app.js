// My Baptism Story mobile flow. Everything stays on this device (sessionStorage + IndexedDB).
(function(){
  var KEY = 'mbs';
  function load(){ try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch(e){ return {}; } }
  function save(s){ try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} }
  var state = load();
  window.MBS = {
    get: function(k){ return state[k]; },
    set: function(k, v){ state[k] = v; save(state); },
    all: function(){ return state; }
  };

  // Bind any field with data-key to saved state
  document.querySelectorAll('[data-key]').forEach(function(el){
    var k = el.getAttribute('data-key');
    if (el.type === 'radio'){
      if (state[k] === el.value) el.checked = true;
      el.addEventListener('change', function(){ if (el.checked) MBS.set(k, el.value); });
    } else if (el.type === 'checkbox'){
      var list = state[k] || [];
      if (list.indexOf(el.value) > -1) el.checked = true;
      el.addEventListener('change', function(){
        var cur = (state[k] || []).filter(function(v){ return v !== el.value; });
        if (el.checked) cur.push(el.value);
        MBS.set(k, cur);
      });
    } else {
      if (state[k] != null) el.value = state[k];
      var fn = function(){ MBS.set(k, el.value); };
      el.addEventListener('input', fn); el.addEventListener('change', fn);
    }
  });

  // Fill any data-show with saved values
  document.querySelectorAll('[data-show]').forEach(function(el){
    var v = state[el.getAttribute('data-show')];
    if (v) el.textContent = v;
  });

  // Validate before following a [data-need] link
  document.querySelectorAll('a[data-need]').forEach(function(a){
    a.addEventListener('click', function(e){
      var need = a.getAttribute('data-need').split(',');
      var missing = need.filter(function(k){ var v = state[k]; return !v || (v.trim && !v.trim()); });
      var msg = document.getElementById('msg');
      if (missing.length){
        e.preventDefault();
        if (msg) msg.textContent = a.getAttribute('data-msg') || 'Please fill in the required fields.';
      }
    });
  });

  // Today's date
  document.querySelectorAll('[data-today]').forEach(function(el){
    el.textContent = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
  });

  // Media saved between pages
  function db(){ return new Promise(function(res, rej){
    var r = indexedDB.open('mbs', 1);
    r.onupgradeneeded = function(){ r.result.createObjectStore('media'); };
    r.onsuccess = function(){ res(r.result); }; r.onerror = rej;
  }); }
  MBS.putMedia = function(file){ return db().then(function(d){ return new Promise(function(res, rej){
    var t = d.transaction('media', 'readwrite'); t.objectStore('media').put(file, 'story');
    t.oncomplete = res; t.onerror = rej;
  }); }); };
  MBS.getMedia = function(){ return db().then(function(d){ return new Promise(function(res){
    var r = d.transaction('media').objectStore('media').get('story');
    r.onsuccess = function(){ res(r.result || null); }; r.onerror = function(){ res(null); };
  }); }).catch(function(){ return null; }); };

  // Public story link a friend can open (first name, city, type, one quote only)
  MBS.storyUrl = function(){
    var base = location.href.replace(/[^\/]*([?#].*)?$/, '') + 'story.html';
    var q = state.a3 || state.a2 || state.a1 || '';
    var p = new URLSearchParams();
    if (state.first) p.set('n', state.first.trim());
    if (state.city) p.set('c', state.city.trim());
    p.set('t', state.cat === 'renewal' ? 'Baptized before (renewal)' : 'First-time baptism');
    if (q) p.set('q', q.trim().slice(0, 400));
    return base + '?' + p.toString();
  };
})();
