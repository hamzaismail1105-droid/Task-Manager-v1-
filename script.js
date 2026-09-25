const KEY="taskmate_tasks_v1";
let tasks=JSON.parse(localStorage.getItem(KEY)||"[]");
const $=id=>document.getElementById(id);
const now=new Date();
$("taskDate").value=now.toISOString().slice(0,10);
$("taskTime").value=new Date(now.getTime()+60*60*1000).toTimeString().slice(0,5);

function save(){localStorage.setItem(KEY,JSON.stringify(tasks));render();}
function escapeHTML(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function formatDateTime(t){return new Date(t.date+"T"+t.time).toLocaleString([], {dateStyle:"medium",timeStyle:"short"});}
function render(){
  const filter=$("filter").value;
  const list=tasks.filter(t=>filter==="all"||(filter==="completed"?t.done:!t.done))
    .sort((a,b)=>(a.date+"T"+a.time).localeCompare(b.date+"T"+b.time));
  $("taskList").innerHTML="";
  $("empty").style.display=list.length?"none":"block";
  list.forEach(t=>{
    const el=document.createElement("div");
    el.className="task "+(t.done?"done":"");
    el.innerHTML=`<input class="check" type="checkbox" ${t.done?"checked":""} aria-label="Complete task">
      <div class="task-info"><div class="task-title">${escapeHTML(t.title)}</div>
      <div class="task-meta">⏰ ${formatDateTime(t)}${t.repeat!=="none"?" · 🔁 "+t.repeat:""}</div></div>
      <div class="actions"><button data-edit="${t.id}">✏️</button><button data-delete="${t.id}">🗑️</button></div>`;
    el.querySelector(".check").onchange=()=>{t.done=!t.done; save();};
    el.querySelector("[data-delete]").onclick=()=>{tasks=tasks.filter(x=>x.id!==t.id);save();};
    el.querySelector("[data-edit]").onclick=()=>editTask(t);
    $("taskList").appendChild(el);
  });
  $("totalCount").textContent=tasks.length;
  $("pendingCount").textContent=tasks.filter(t=>!t.done).length;
  $("doneCount").textContent=tasks.filter(t=>t.done).length;
}
function editTask(t){
  const title=prompt("Task name:",t.title); if(title===null)return;
  t.title=title.trim()||t.title;
  const time=prompt("Time (HH:MM):",t.time); if(time)t.time=time;
  save(); toast("Task updated");
}
$("taskForm").onsubmit=e=>{
  e.preventDefault();
  tasks.push({id:Date.now(),title:$("taskTitle").value.trim(),date:$("taskDate").value,time:$("taskTime").value,repeat:$("repeat").value,done:false,reminded:false});
  save(); $("taskForm").reset(); $("taskDate").value=now.toISOString().slice(0,10);
  toast("Task added"); checkReminders();
};
$("filter").onchange=render;
$("notifyBtn").onclick=async()=>{
  if(!("Notification" in window)){toast("Notifications are not supported in this browser.");return;}
  const p=await Notification.requestPermission();
  toast(p==="granted"?"Notifications enabled!":"Notification permission was not granted.");
};
function checkReminders(){
  const now=new Date();
  tasks.forEach(t=>{
    if(t.done||t.reminded)return;
    const due=new Date(t.date+"T"+t.time);
    if(Math.abs(now-due)<=60000 && Notification.permission==="granted"){
      new Notification("Task Reminder",{body:t.title});
      t.reminded=true;
      if(t.repeat==="daily"){const d=new Date(due);d.setDate(d.getDate()+1);t.date=d.toISOString().slice(0,10);t.reminded=false;}
      else if(t.repeat==="weekly"){const d=new Date(due);d.setDate(d.getDate()+7);t.date=d.toISOString().slice(0,10);t.reminded=false;}
      save();
    }
  });
}
if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(()=>{});
render(); setInterval(checkReminders,30000); checkReminders();
function toast(msg){const x=$("toast");x.textContent=msg;x.style.display="block";setTimeout(()=>x.style.display="none",2200);}
