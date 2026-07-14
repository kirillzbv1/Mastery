/* Mastery cloud sync - self contained. Loads Supabase, adds login box, syncs mastery_* keys. */
(function(){
  var SUPABASE_URL = "https://rkvrwtjyeglgbkaxagig.supabase.co";
  var SUPABASE_KEY = "sb_publishable_RIuSyw9WrbLbjr0gJEEYKQ_CujEO3Jg";
  var SYNC_KEYS = ["mastery_day","mastery_archive","mastery_v6","mastery_lockin_day","mastery_scores","mastery_theme"];
  var sb = null, user = null, pushTimer = null, pulling = false;

  function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}

  function snapshot(){var o={};for(var i=0;i<SYNC_KEYS.length;i++){var k=SYNC_KEYS[i];var v=localStorage.getItem(k);if(v!==null)o[k]=v;}return o;}
  function applySnapshot(o){if(!o)return;pulling=true;try{for(var k in o){if(o.hasOwnProperty(k)&&SYNC_KEYS.indexOf(k)>=0){localStorage.setItem(k,o[k]);}}}finally{pulling=false;}}

  function schedulePush(){if(!user)return;if(pushTimer)clearTimeout(pushTimer);pushTimer=setTimeout(pushNow,1200);}
  function pushNow(){if(!user||!sb)return;var payload={user_id:user.id,data:snapshot(),updated_at:new Date().toISOString()};sb.from('user_data').upsert(payload,{onConflict:'user_id'}).then(function(r){if(r.error)console.warn('[sync] push error',r.error.message);else setStatus('Synced');});}

  function pull(){if(!user||!sb)return Promise.resolve();return sb.from('user_data').select('data,updated_at').eq('user_id',user.id).maybeSingle().then(function(r){
    if(r.error){console.warn('[sync] pull error',r.error.message);return;}
    if(r.data&&r.data.data&&Object.keys(r.data.data).length){
      var local=snapshot();var localHas=(local.mastery_archive&&local.mastery_archive.length>2);var remoteHas=(r.data.data.mastery_archive&&r.data.data.mastery_archive.length>2);
      // last-write-wins by presence: if remote has data, merge remote in, but keep local if remote empty
      applySnapshot(r.data.data);setStatus('Loaded from cloud');setTimeout(function(){location.reload();},300);
    } else {
      // first login on this account: push existing local data up so nothing is lost
      pushNow();setStatus('Backed up');
    }
  });}

  var statusEl=null;
  function setStatus(t){if(statusEl)statusEl.textContent=t;}

  function buildBox(){
    var wrap=document.createElement('div');wrap.id='cloudSyncBox';wrap.style.cssText='position:fixed;z-index:99999;right:12px;bottom:12px;font-family:system-ui,sans-serif;';
    wrap.innerHTML=''
      +'<div id="csToggle" style="background:#4f8cff;color:#fff;border-radius:20px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)">Cloud Sync</div>'
      +'<div id="csPanel" style="display:none;background:#1b1e24;color:#eee;border:1px solid #333;border-radius:12px;padding:14px;width:240px;margin-top:8px;box-shadow:0 8px 24px rgba(0,0,0,.4)">'
      +'<div id="csStatus" style="font-size:12px;color:#9fb4d6;margin-bottom:8px">Not signed in</div>'
      +'<input id="csEmail" type="email" placeholder="email" autocomplete="username" style="width:100%;box-sizing:border-box;margin-bottom:6px;padding:8px;border-radius:8px;border:1px solid #333;background:#0e1013;color:#fff">'
      +'<input id="csPass" type="password" placeholder="password" autocomplete="current-password" style="width:100%;box-sizing:border-box;margin-bottom:8px;padding:8px;border-radius:8px;border:1px solid #333;background:#0e1013;color:#fff">'
      +'<div style="display:flex;gap:6px">'
      +'<button id="csLogin" style="flex:1;padding:8px;border:0;border-radius:8px;background:#4f8cff;color:#fff;font-weight:600;cursor:pointer">Sign in</button>'
      +'<button id="csSignup" style="flex:1;padding:8px;border:0;border-radius:8px;background:#2a2f38;color:#fff;font-weight:600;cursor:pointer">Sign up</button>'
      +'</div>'
      +'<button id="csOut" style="display:none;width:100%;margin-top:8px;padding:8px;border:0;border-radius:8px;background:#3a2020;color:#fff;cursor:pointer">Sign out</button>'
      +'</div>';
    document.body.appendChild(wrap);
    statusEl=wrap.querySelector('#csStatus');
    wrap.querySelector('#csToggle').onclick=function(){var p=wrap.querySelector('#csPanel');p.style.display=p.style.display==='none'?'block':'none';};
    wrap.querySelector('#csLogin').onclick=doLogin;
    wrap.querySelector('#csSignup').onclick=doSignup;
    wrap.querySelector('#csOut').onclick=doLogout;
  }
  function creds(){return {email:document.getElementById('csEmail').value.trim(),password:document.getElementById('csPass').value};}
  function doSignup(){var c=creds();if(!c.email||!c.password){setStatus('Enter email + password');return;}setStatus('Creating...');sb.auth.signUp({email:c.email,password:c.password}).then(function(r){if(r.error){setStatus(r.error.message);}else{setStatus('Check your email to confirm, then sign in');}});}
  function doLogin(){var c=creds();if(!c.email||!c.password){setStatus('Enter email + password');return;}setStatus('Signing in...');sb.auth.signInWithPassword({email:c.email,password:c.password}).then(function(r){if(r.error){setStatus(r.error.message);}else{onAuth(r.data.user);}});}
  function doLogout(){sb.auth.signOut().then(function(){user=null;setStatus('Signed out');var o=document.getElementById('csOut');if(o)o.style.display='none';});}

  function onAuth(u){if(!u)return;user=u;setStatus('Signed in: '+u.email);var o=document.getElementById('csOut');if(o)o.style.display='block';pull();}

  // wrap setItem so any app write schedules a cloud push
  var _set=localStorage.setItem.bind(localStorage);
  localStorage.setItem=function(k,v){_set(k,v);if(!pulling&&SYNC_KEYS.indexOf(k)>=0){schedulePush();}};

  function init(){
    loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2').then(function(){
      sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
      if(document.body){buildBox();}else{window.addEventListener('DOMContentLoaded',buildBox);}
      sb.auth.getSession().then(function(r){if(r.data&&r.data.session){onAuth(r.data.session.user);}});
      sb.auth.onAuthStateChange(function(e,s){if(s&&s.user){onAuth(s.user);}});
    }).catch(function(e){console.warn('[sync] failed to load supabase',e);});
  }
  if(document.readyState==='loading'){window.addEventListener('DOMContentLoaded',init);}else{init();}
})();
