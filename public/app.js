
/* ============================================================
   FASTRACK AGILE — light platform (single file)
   Works fully in DEMO MODE (browser storage). Flip to Supabase
   later by setting keys below — every data call already tries
   Supabase first and falls back to the demo store.
   ============================================================ */

/* ===== 1. CONFIG =====
   Integration keys come from env (via window.__FA_ENV, injected by app/page.tsx
   from NEXT_PUBLIC_* variables in .env.local). See .env.example. */
const _ENV = (typeof window!=="undefined" && window.__FA_ENV) || {};
const SUPABASE_URL = _ENV.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = _ENV.SUPABASE_ANON_KEY || "";
const RAZORPAY_KEY_ID = _ENV.RAZORPAY_KEY_ID || "";   // blank = demo payments
const ADMIN_EMAIL = (_ENV.ADMIN_EMAIL || "info@fastrackagile.com").toLowerCase();
const WHATSAPP = _ENV.WHATSAPP || "919966080123";
const CALENDLY_URL = _ENV.CALENDLY_URL || "https://calendly.com/easyagilelearning/career-coaching-discussion";
const CALL_FEE = Number(_ENV.CALL_FEE) || 99;          // "Book Your Call" booking fee in INR
const REGISTER_FEE = Number(_ENV.REGISTER_FEE) || 29000; // fallback program fee (used only if a slug isn't in COURSE_PRICES)
const GST_RATE = 0.18; // 18% GST added on top of each program's base fee
// Per-course base fee in INR (exclusive of GST). Also mirrored server-side in /api/razorpay/order.
const COURSE_PRICES = {
  "practical-scrum-launchpad-weekday": 35000,
  "practical-scrum-launchpad-weekend": 40000,
  "practical-scrum-interview-mastery": 10000,
  "scrum-certification-program":       21000,
  "scrum-growth-mentorship":           50000,
  "scrum-smartpath":                   15000,
};
const priceINR   = n => "₹" + Number(n).toLocaleString("en-IN"); // e.g. ₹35,000
const basePrice  = slug => COURSE_PRICES[slug] || REGISTER_FEE;   // fee before GST
const totalPrice = slug => Math.round(basePrice(slug) * (1 + GST_RATE)); // fee incl. GST

let createClient = null, supabase = null;
const USE_SUPABASE = SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;
if (USE_SUPABASE) {
  try { ({ createClient } = await import("https://esm.sh/@supabase/supabase-js@2"));
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); }
  catch(e){ console.warn("Supabase failed to load; using demo store.", e); }
}
const MODE = supabase ? "live" : "demo";

/* ===== 2. SEED COURSES ===== */
const COURSES = [
 {id:"c1",slug:"practical-scrum-launchpad-weekday",title:"Practical Scrum Launchpad (Weekday)",subtitle:"Deep Diving into Scrum",mode:"Online",duration:"1 Month",schedule:"Mon–Fri · 6:45–8:15 AM IST (90 min)",summary:"Move beyond theory with real-world Scrum Master skills — an end-to-end roadmap from Scrum fundamentals to interview readiness. Covers Agile, Scrum, Kanban, SAFe, Jira and Confluence through a unique 4-phase model: learn, practice on a 2-week Jira sprint simulation, then get hired with guaranteed mock interviews."},
 {id:"c2",slug:"practical-scrum-launchpad-weekend",title:"Practical Scrum Launchpad (Weekend)",subtitle:"Weekend Classes",mode:"Online",duration:"90 Days",schedule:"Sat & Sun · 8:30–10:30 AM IST",summary:"The full Launchpad program for working professionals who can only train on weekends. Learn Scrum Master skills in focused 2.5-hour Saturday & Sunday sessions — Agile, Scrum, Kanban, SAFe, Jira and Confluence with real-time examples, a hands-on Jira sprint simulation and guaranteed mock interviews — without disturbing your current job."},
 {id:"c3",slug:"practical-scrum-interview-mastery",title:"Practical Scrum Interview Mastery",subtitle:"Mock Practice Bootcamp",mode:"Online",duration:"1 Week",schedule:"Mon–Fri · 10 AM–12:30 PM IST",summary:"A focused bootcamp for trained professionals who know the theory but freeze in interviews. Real-time Scrum Master interview simulation with daily live practice, situational and behavioural questions, and structured feedback — so you walk in confident and convert interviews into offers."},
 {id:"c4",slug:"scrum-certification-program",title:"Scrum Certification Program",subtitle:"Get Global Certification from ScrumStudy",mode:"Offline",duration:"2 Days",schedule:"2 Days · 10 AM–6 PM IST",summary:"An in-room, instructor-led workshop leading to a globally valid ScrumStudy Scrum Master certification (valid 3 years). Face-to-face practical learning with agile games, team collaboration and mock practice — built for working professionals transitioning into or growing within Agile roles."},
 {id:"c5",slug:"scrum-growth-mentorship",title:"Scrum Growth Mentorship (On Job Support)",subtitle:"Only for pre-qualified professionals",mode:"Online",duration:"30 Days",schedule:"Flexible timings",summary:"A personal, high-impact mentorship for pre-qualified professionals — 10 dedicated 1:1 sessions with an expert mentor, assignment-based learning and focused skill development. Starts with an evaluation call, then customised coaching to grow into and beyond the Scrum Master role."},
 {id:"c6",slug:"scrum-smartpath",title:"Scrum SmartPath",subtitle:"Self-Learning Module",mode:"Online",duration:"365 Days",schedule:"Self-paced",summary:"A 100% self-paced module with a full year of access — learn Scrum on your own schedule using recorded sessions from completed batches, plus lifetime access to weekly live support sessions for your queries and interview prep. The most affordable way into Scrum, with 350+ member community access."}
];
const WHY={"practical-scrum-launchpad-weekday":["Complete roadmap from Scrum fundamentals to interview readiness","Covers Agile, Scrum, Kanban, SAFe, Jira and Confluence in one program","Unique 4-Phase Learning Model: learn → practice → get hired","Hands-on 2-week Jira Sprint Simulation for real project experience","Guaranteed mock interviews with detailed personalized feedback","Practical teaching that simplifies complex Agile concepts"],
 "practical-scrum-launchpad-weekend":["Learn Scrum Master skills in 2.5-hour focused sessions every Saturday & Sunday","Covers Agile, Scrum, Kanban, SAFe, Jira and Confluence with real-time examples","Hands-on Jira Sprint Simulation explained in a simplified, easy-to-follow format","Guaranteed mock interview opportunities with detailed feedback","Interactive weekend sessions with agile games and collaborative learning","Flexible schedule keeps your existing job and workflow undisturbed"],
 "practical-scrum-interview-mastery":["Real-time Scrum Master interview simulation with practical scenarios","Daily live mock practice with structured, personalised feedback","Learn to handle situational and behavioural questions confidently","Practice in a safe environment before facing real recruiters","Quickly identifies gaps in communication, structure and mindset","Reduces interview anxiety and increases your offer conversion"],
 "scrum-certification-program":["In-room, face-to-face practical learning with real-time guidance","Globally valid ScrumStudy Scrum Master certification for 3 years","Live instructor-led offline training with agile games and collaboration","Mock practice to sharpen your facilitation and leadership skills","Networking with other working professionals","Lifetime community access for continuous post-program support"],
 "scrum-growth-mentorship":["10 dedicated 1:1 sessions tailored to your challenges","Expert-led guidance from an experienced Scrum mentor","Assignment-based learning with structured, practical tasks","Starts with an evaluation call to map your goals","Focused skill development in the areas that matter most","Ongoing support for real-world Scrum practice clarity"],
 "scrum-smartpath":["100% self-paced — access recorded sessions from completed batches","Lifetime access to weekly live support sessions for all your queries","The most affordable way to gain valuable Scrum knowledge","Learn anytime, anywhere, at your own pace","Weekly Q&A and interview-preparation support","Membership in a 350+ strong Scrum community with career support"],
 "default":["Practical, hands-on training — not just theory","Live, mentor-led sessions with Ram","Real-world tools and scenarios (Jira, Confluence)","Interview preparation and career guidance","Lifetime community access","Built for non-IT professionals breaking into IT"]};
const BENEFITS=["Deep clarity on Agile frameworks and real Scrum Master responsibilities","Real-time exposure to industry tools like Jira and Confluence","Confidence in facilitation, communication and stakeholder discussions","Resume and LinkedIn optimization for recruiter visibility","Ongoing support sessions even after training","Faster transition from learning to applying on the job"];
const CLUSTERS=[{h:"Career Transition",items:["How to become a Scrum Master without IT experience","Is Scrum Master a good career in India?","Can freshers become Scrum Masters?","Scrum Master salary in India"]},{h:"Interview Prep",items:["Top Scrum Master interview questions","Jira interview questions","Agile scenario questions","Scrum Master resume examples"]},{h:"Certification",items:["CSM vs PSM","Best Scrum certification","Is Scrum certification worth it?","PSM certification guide"]},{h:"Agile Basics",items:["What is Agile?","What does a Scrum Master do?","Scrum vs Agile","Scrum ceremonies explained"]}];

/* Real Google Business Profile data: "Easy Agile Learning" */
const GMB={rating:"5.0",count:73,name:"Easy Agile Learning",
  url:"https://www.google.com/search?q=Easy+Agile+Learning+Hyderabad+reviews",
  mapsEmbed:"https://www.google.com/maps?q=Indeqube+Building+Mindspace+Road+Gachibowli+Hyderabad&output=embed",
  address:"Ground Floor, Indeqube Building, Mindspace Rd, beside Rolling Hills, HUDA Techno Enclave, Gachibowli, Hyderabad, Telangana 500032",
  phone:"099660 80123",hours:"Mon–Sat · 9:00 AM – 6:00 PM · Opens 9 AM Sun"};
const REVIEWS=[
  {n:"Priyanka R.",c:"#5b8def",t:"Mr Ram really gives quality time and suggestions to work on. The sessions are practical, not just theory — exactly what I needed to feel confident."},
  {n:"Rahul M.",c:"#e0902b",t:"I highly recommend Ram for anyone seeking to elevate their Agile skills. Real-world scenarios and honest mentorship made all the difference."},
  {n:"Sneha K.",c:"#1f7a55",t:"Came from a completely non-IT background. The hands-on Jira practice and interview preparation helped me crack my first Scrum Master role."},
  {n:"Arvind T.",c:"#9b59b6",t:"The SAFe and Scrum training is hands-on and real-time. Ram explains complex concepts simply and is always available for doubts."},
  {n:"Meghana S.",c:"#e74c3c",t:"Best decision for my career switch. Live, interactive classes — no boring slides. The mentorship continues even after the course."},
  {n:"Karthik V.",c:"#16a085",t:"Genuinely practical training. The mock interviews and resume guidance gave me the confidence to clear multiple rounds."}
];
const CERTS=[
  {nm:"ScrumStudy",ds:"Global SMC™ certification"},
  {nm:"Agile & Scrum",ds:"Practical frameworks"},
  {nm:"SAFe",ds:"Scaled Agile training"},
  {nm:"Jira & Confluence",ds:"Industry tools"},
  {nm:"Kanban",ds:"Flow-based delivery"}
];
/* Real learner success stories — shared by students in our community group after placement */
const SUCCESS_STORIES=[
  {n:"Venkat",b:"Batch 15",role:"Scrum Master",co:"Ascent Group",t:"I've been selected as a Scrum Master in the Ascent Group! This wouldn't have been possible without Ram's incredible support, guidance and mentorship. The regular support sessions bridged the gap between theory and real-world application, and the mock interview questions boosted my confidence to face the actual interview with clarity and conviction."},
  {n:"Suparna",b:"Batch 13",role:"Senior Scrum Master",co:"Wipro",t:"I'm thrilled to share that I have joined Wipro as a Senior Scrum Master. Thank you, Ram, for the support and for building my confidence. I'm deeply grateful for the mentorship and support you've provided."},
  {n:"Shaheena",b:"Batch 15",role:"Scrum Master",co:"Deloitte",t:"I have accepted a position as a Scrum Master at Deloitte! Ram, your mentorship has been invaluable. From the very first day of training — the sessions, the questions, the shared insights — everything contributed to my growth and ultimately led me to secure this job."},
  {n:"Ravi",b:"Batch 14",role:"Scrum Master",co:"Ascent Health Care",t:"After completing the Scrum Training, I got placed as a Scrum Master in Ascent Health Care, Hyderabad — and landed my dream job with a high package! The best part was you never hesitated in clearing doubts and accepting calls 24/7 whenever I needed your assistance."},
  {n:"Priyanka",b:"Batch 19",role:"Scrum Master",co:"Verizon",t:"I have accepted an offer as a Scrum Master at Verizon. A big thank you to Ram for the excellent training sessions. Your way of teaching made everything so much easier to understand, and your support throughout my interview process is much appreciated."},
  {n:"Tusshar",b:"Batch 21",role:"Scrum Master",co:"",t:"I've officially been placed as a Scrum Master! This achievement wouldn't have been possible without the constant guidance, support and mentorship of Ram. Thank you, sir, for being a true guru and showing me the right path. Your insights, patience and belief in me played a huge role in this journey."},
  {n:"Swathi",b:"Scrum Batch",role:"Scrum Master",co:"Infosys / Innova",t:"I'm glad to inform you that I have got 2 offers — Innova Software Solutions and Infosys. I'm really glad to be trained with Ram because of his detailed and incremental approach towards the concepts and the practical aspects that helped me get through the interviews."},
  {n:"Rajesh",b:"Batch 17",role:"Scrum Master",co:"Amgen",t:"I've accepted an offer as a Scrum Master with Amgen, Hyderabad. A huge thank you to Ram for the guidance and support in helping me land this job. Your mentorship and encouragement made all the difference — grateful for your efforts in shaping my success!"},
  {n:"Akbar",b:"Batch 17",role:"Lead Scrum Master",co:"Franklin Templeton",t:"Very happy to share the exciting news of the offer I got as a Lead Scrum Master role in Franklin Templeton. Special thanks to Ram for his dedication and support — the training, mentorship, meetups and regular mock interview sessions played a crucial role in building my skills and confidence."},
  {n:"Abhilash",b:"Batch 16",role:"Scrum Master",co:"Infosys",t:"I received an offer and have joined Infosys as a Scrum Master. A few months ago, I lost my job and was under immense stress. Ram's support and confidence-boosting advice played a crucial role in helping me secure this new role. The interview support sessions were incredibly beneficial."},
  {n:"Shwetha",b:"Batch 7",role:"Scrum Master",co:"Fidelity National",t:"I got offers from 4 companies and finally joined Fidelity National Finance — this is all because of your help and support. Thank you, Ram!"},
  {n:"Divya",b:"NHT IDR",role:"Scrum Master",co:"Colabera",t:"I was working with Colabera as a Scrum Master for a top consumer healthcare client. Out of 10 team members, only 2 of us were offered full-time roles, and I'm happy to be one of them! Big thanks to Ram for the amazing Scrum training — it truly made a difference."},
  {n:"Tanwisha",b:"NHT 16",role:"Scrum Master",co:"Koenig Solutions",t:"I'm pleased to inform you all that I got my 2nd offer from Koenig Solutions as a Scrum Master. Again, thank you Ram for your support and efforts."},
  {n:"Jayachandra",b:"Scrum Batch",role:"Scrum Master",co:"F1Studioz",t:"I've accepted an offer from F1Studioz. A big thanks to Ram — he laid the foundation for my journey. He was not just a trainer but a mentor, a guide, and a whole package of positivity. I feel lucky to have had him as my trainer."},
  {n:"Dharma",b:"Batch 6",role:"Scrum Master",co:"",t:"I'm happy to share that I got my first offer and got placed in one of my dream organizations. Loads of thanks to Balram, who helped me transform my career into the IT domain as a Scrum Master."},
  {n:"Lavina",b:"NHT",role:"Scrum Master",co:"",t:"I have bagged 2 offer letters and will be joining one company next month. All the credit goes to Balram — the kind of belief he showed in me and the efforts he put in have finally reaped results. Thank you, Ram!"},
  {n:"Ruth",b:"BOA",role:"Scrum Master",co:"Infosys",t:"Received the offer letter from Infosys! A big thanks to Ram, who made me think differently and had complete trust in me. Thank you, Balram."},
  {n:"Sameera",b:"Community",role:"Senior Project Manager",co:"Jocata",t:"I got placed in a product-based company named Jocata as a Senior Project Manager. I express my sincere gratitude to Ram, whose motivation gave me so much confidence. Each time I faced challenges, he was always there to guide and push me to reach my full potential."},
  {n:"Veda",b:"Batch 8",role:"Learner",co:"",t:"Ram, you are my Scrum Guruji. You helped me through and through with all my doubts. The kind of faith you had in me gave me hope, and the patience you showed me kept me going. Thank you so much for the support."},
  {n:"Ipsita",b:"Batch 8",role:"Learner",co:"",t:"After not getting calls for more than a month, I was truly losing hope. But your words motivated me again — and there's no doubt that Ram is a great trainer."},
  {n:"Praveen",b:"Scrum Batch",role:"Learner",co:"",t:"Dear Ram, thank you for the excellent training on Agile and Scrum. Your clear explanations and practical approach made the concepts easy to understand and apply. I truly appreciate your guidance and the valuable knowledge you shared."}
];
/* Real student & meetup photos (sidecar files in ./assets) */
/* Real student & meetup photos — embedded as base64 (self-contained) */
const HERO_PHOTOS=[
  "/img/asset-1.jpg",
  "/img/asset-2.jpg",
  "/img/asset-3.jpg",
  "/img/asset-4.jpg",
  "/img/asset-5.jpg",
  "/img/asset-6.jpg",
  "/img/asset-7.jpg",
  "/img/asset-8.jpg",
  "/img/asset-9.jpg"
];
const STORY_PHOTOS=[
  {name:"Chandra", src:"/img/asset-10.jpg"},
  {name:"Sameera", src:"/img/asset-11.jpg"},
  {name:"Divya", src:"/img/asset-12.jpg"},
  {name:"Swati", src:"/img/asset-13.jpg"},
  {name:"Priyanka", src:"/img/asset-14.jpg"},
  {name:"Prem", src:"/img/asset-15.jpg"},
  {name:"Ravi", src:"/img/asset-16.jpg"},
  {name:"Rajesh", src:"/img/asset-17.jpg"},
  {name:"Naveen", src:"/img/asset-18.jpg"},
  {name:"Purna", src:"/img/asset-19.jpg"},
  {name:"Akbar", src:"/img/asset-20.jpg"},
];

function storyCard(item,i){
  const src = typeof item === "string" ? item : item.src;
  const name = typeof item === "string" ? "" : item.name;
  return `<figure class="story-card" data-d="${i}">
    <img loading="lazy" decoding="async" src="${src}" alt="Fastrack Agile success story — ${name||"verified learner"}" width="400" height="711">
    <figcaption>${name?`<span class="story-name">${name}</span>`:""}<span class="story-badge">✓ Success Story</span></figcaption>
  </figure>`;
}

/* ===== 3. DEMO STORE (browser localStorage) ===== */
const DB_KEY="fa_demo_v1";
function seedDB(){
  return {
    profiles:[
      {id:"u_ram",full_name:"Ram Choudry",email:ADMIN_EMAIL,phone:"+919966080123",role:"admin"},
      {id:"u_priya",full_name:"Priya Sharma",email:"priya@example.com",phone:"+919812345678",role:"learner"},
      {id:"u_arjun",full_name:"Arjun Kumar",email:"arjun@example.com",phone:"+919898989898",role:"learner"}
    ],
    enrollments:[
      {id:"e1",user_id:"u_priya",course_id:"c1",status:"active",payment_status:"paid",requested_at:Date.now()-86400000*6,activated_at:Date.now()-86400000*5},
      {id:"e2",user_id:"u_arjun",course_id:"c3",status:"requested",payment_status:"pending",requested_at:Date.now()-86400000*1}
    ],
    materials:[
      {id:"m1",course_id:"c1",title:"Course schedule & batch calendar",type:"schedule",url:"https://fastrackagile.com/",visible:true},
      {id:"m2",course_id:"c1",title:"Scrum fundamentals workbook (PDF)",type:"link",url:"https://fastrackagile.com/",visible:true},
      {id:"m3",course_id:"c1",title:"Jira sprint simulation guide",type:"link",url:"https://fastrackagile.com/",visible:true}
    ],
    certificates:[
      {id:"cert1",user_id:"u_priya",course_id:"c1",title:"ScrumStudy SMC™ Certificate",file_path:"https://fastrackagile.com/",issued_on:"2026-05-20"}
    ],
    leads:[
      {id:"l1",name:"Meena Iyer",email:"meena@example.com",phone:"+919777666555",message:"Is the weekend batch good for someone from a teaching background?",source:"contact",created_at:Date.now()-86400000*2}
    ],
    assessment_access:[
      {id:"aa1",user_id:"u_priya",full_name:"Priya Sharma",email:"priya@example.com",mobile:"+919812345678",status:"approved",requested_at:Date.now()-86400000*3,decided_at:Date.now()-86400000*2},
      {id:"aa2",user_id:"u_arjun",full_name:"Arjun Kumar",email:"arjun@example.com",mobile:"+919898989898",status:"pending",requested_at:Date.now()-3600000*5,decided_at:null}
    ],
    blog_posts:[
      {id:"bp1",slug:"how-to-become-a-scrum-master-without-it-background",title:"How to become a Scrum Master without an IT background",excerpt:"You don't need to code. Here's the exact path non-IT professionals take to land a Scrum Master role — and where most people get stuck.",cover:"",author:"Ram Choudry",status:"published",created_at:Date.now()-86400000*8,publish_at:Date.now()-86400000*8,published_at:Date.now()-86400000*8,
        body:"The biggest myth about breaking into IT is that you need to write code. You don't.\n\n## Scrum Master is a people role\n\nAt its core, the Scrum Master role is about facilitation, communication and helping a team deliver. Your experience coordinating people, running meetings and solving real-world problems transfers directly.\n\n## The 4 things that actually get you hired\n\n- A working understanding of Agile, Scrum and the ceremonies\n- Hands-on practice with Jira and a real sprint simulation\n- Interview readiness — the scenario questions you'll actually be asked\n- The confidence to talk about it all like you've done it\n\n## Where people get stuck\n\nMost self-learners stop at theory. They watch videos, pass a quiz, and freeze in interviews. The fix is **doing** — running a real 2-week sprint simulation and rehearsing interviews until it's second nature.\n\nThat's exactly what our Practical Scrum Launchpad is built around."},
      {id:"bp2",slug:"csm-vs-psm-which-scrum-certification-is-worth-it",title:"CSM vs PSM: which Scrum certification is actually worth it?",excerpt:"A quick, honest comparison of the two most common Scrum Master certifications — and what recruiters in India really look for.",cover:"",author:"Ram Choudry",status:"published",created_at:Date.now()-86400000*3,publish_at:Date.now()-86400000*3,published_at:Date.now()-86400000*3,
        body:"Both CSM (Scrum Alliance) and PSM (Scrum.org) are respected. Here's the short version.\n\n## CSM\n\nInstructor-led, two-day course, then an exam. Good for structured learners who want the classroom experience and the Scrum Alliance network.\n\n## PSM\n\nSelf-study, tougher exam, no mandatory course. Often seen as more rigorous because the pass mark is high and there's no hand-holding.\n\n## What actually matters\n\nRecruiters care far more about whether you can **do the job** than which badge you hold. A certificate opens the door; a real sprint simulation and strong interview answers get you the offer.\n\nTrain for the work first. Add the certificate that fits your budget and learning style second."}
    ],
    content:{courses:{},stories:null,text:{}},  // admin content overrides (demo)
    session:null  // {user_id}
  };
}
function loadDB(){ try{const r=localStorage.getItem(DB_KEY);if(r)return JSON.parse(r);}catch(e){} const d=seedDB();saveDB(d);return d; }
function saveDB(d){ try{localStorage.setItem(DB_KEY,JSON.stringify(d));}catch(e){} }
let DB = (MODE==="demo") ? loadDB() : null;
if(DB && !DB.assessment_access){ DB.assessment_access=[]; saveDB(DB); } // migrate older demo stores
if(DB && !DB.content){ DB.content={courses:{},stories:null,text:{}}; saveDB(DB); }
function resetDemo(){ DB=seedDB(); saveDB(DB); toast("Demo data reset."); }

/* ===== 4. DATA LAYER (Supabase-first, demo fallback) ===== */
const uid=()=>"id_"+Math.random().toString(36).slice(2,9);

async function currentSession(){
  if(supabase){const{data}=await supabase.auth.getSession();return data.session?{user_id:data.session.user.id}:null;}
  return DB.session;
}
async function currentProfile(){
  if(supabase){const s=await currentSession();if(!s)return null;const{data}=await supabase.from("profiles").select("*").eq("id",s.user_id).single();return data;}
  if(!DB.session)return null;
  return DB.profiles.find(p=>p.id===DB.session.user_id)||null;
}
/* ---- Editable content overrides (admin-managed, demo store) ---- */
/* Content cache — loaded once at boot (loadContent). Readers are sync (used in
   render templates). Demo → localStorage; live → courses table + site_content table.
   Course overrides are keyed by slug (stable across demo/live). */
let _content={courses:{},stories:null,text:{}};
async function loadContent(){
  if(supabase){
    const co=await supabase.from("courses").select("slug,title,subtitle,mode,duration,schedule,summary");
    const cmap={};(co.data||[]).forEach(c=>{cmap[c.slug]={title:c.title,subtitle:c.subtitle,mode:c.mode,duration:c.duration,schedule:c.schedule,summary:c.summary};});
    let stories=null,text={};
    const sc=await supabase.from("site_content").select("key,value");
    if(!sc.error){(sc.data||[]).forEach(r=>{ if(r.key==="stories"){try{stories=JSON.parse(r.value);}catch(e){}} else {text[r.key]=r.value;} });}
    _content={courses:cmap,stories,text};
  }else{
    _content=(DB&&DB.content)?DB.content:{courses:{},stories:null,text:{}};
  }
}
function mergedCourses(){ return COURSES.map(c=>({...c, ...((_content.courses&&_content.courses[c.slug])||{})})); }
function storiesData(){ return Array.isArray(_content.stories) ? _content.stories : SUCCESS_STORIES; }
function txt(key,fallback){ const v=_content.text&&_content.text[key]; return (v!=null&&v!=="")?v:fallback; }
async function saveCourseContent(slug,fields){
  if(supabase){ await supabase.from("courses").update(fields).eq("slug",slug); }
  else { DB.content=DB.content||{courses:{},stories:null,text:{}}; DB.content.courses=DB.content.courses||{}; DB.content.courses[slug]={...(DB.content.courses[slug]||{}),...fields}; saveDB(DB); }
  _content.courses=_content.courses||{}; _content.courses[slug]={...(_content.courses[slug]||{}),...fields};
}
async function saveStoriesContent(arr){
  const val=(Array.isArray(arr)&&arr.length)?arr:null;
  if(supabase){ if(val)await supabase.from("site_content").upsert({key:"stories",value:JSON.stringify(val)}); else await supabase.from("site_content").delete().eq("key","stories"); }
  else { DB.content=DB.content||{}; DB.content.stories=val; saveDB(DB); }
  _content.stories=val;
}
async function saveTextContent(map){
  _content.text=_content.text||{};
  if(supabase){
    const ups=[];const del=[];
    Object.keys(map).forEach(k=>{const v=map[k]; if(v==null||v===""){del.push(k);delete _content.text[k];} else {ups.push({key:k,value:v});_content.text[k]=v;}});
    if(ups.length)await supabase.from("site_content").upsert(ups);
    for(const k of del)await supabase.from("site_content").delete().eq("key",k);
  }else{
    DB.content=DB.content||{};DB.content.text=DB.content.text||{};
    Object.keys(map).forEach(k=>{const v=map[k]; if(v==null||v===""){delete DB.content.text[k];delete _content.text[k];} else {DB.content.text[k]=v;_content.text[k]=v;}});
    saveDB(DB);
  }
}
async function resetContent(kind){
  if(supabase){
    if(kind==="stories"){await supabase.from("site_content").delete().eq("key","stories");_content.stories=null;}
    else if(kind==="text"){const keys=Object.keys(_content.text||{});for(const k of keys)await supabase.from("site_content").delete().eq("key",k);_content.text={};}
    else if(kind==="courses"){toast("In live mode, edit course fields directly (they're the source of truth).");}
    return;
  }
  DB.content=DB.content||{courses:{},stories:null,text:{}};
  if(kind==="courses"){DB.content.courses={};_content.courses={};}
  else if(kind==="stories"){DB.content.stories=null;_content.stories=null;}
  else if(kind==="text"){DB.content.text={};_content.text={};}
  saveDB(DB);
}
async function listCourses(){
  if(supabase){const{data}=await supabase.from("courses").select("*").eq("is_active",true).order("sort_order");if(data&&data.length)return data;}
  return mergedCourses();
}
async function getCourse(slug){
  if(supabase){const{data}=await supabase.from("courses").select("*").eq("slug",slug).single();if(data)return data;}
  return mergedCourses().find(c=>c.slug===slug)||mergedCourses()[0];
}
/* ---- Blog ---- */
function slugify(s){return String(s||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80)||("post-"+Date.now());}
function postIsLive(p){return p&&p.status==="published"&&(!p.publish_at||p.publish_at<=Date.now());}
async function listPosts(all){
  if(supabase){let q=supabase.from("blog_posts").select("*").order("published_at",{ascending:false});const{data}=await q;let rows=data||[];if(!all)rows=rows.filter(postIsLive);return rows;}
  let rows=[...(DB.blog_posts||[])].sort((a,b)=>(b.publish_at||b.published_at||b.created_at||0)-(a.publish_at||a.published_at||a.created_at||0));
  if(!all)rows=rows.filter(postIsLive);
  return rows;
}
async function getPost(slug){
  if(supabase){const{data}=await supabase.from("blog_posts").select("*").eq("slug",slug).single();return data||null;}
  return (DB.blog_posts||[]).find(p=>p.slug===slug)||null;
}
async function savePost(post){
  if(supabase){
    const run=p=>post.id?supabase.from("blog_posts").update(p).eq("id",post.id):supabase.from("blog_posts").insert(p);
    let res=await run(post);
    // If the author column hasn't been added to the DB yet, retry without it so saving still works.
    if(res&&res.error&&/author/i.test(res.error.message||"")){const{author,...rest}=post;res=await run(rest);}
    return res;
  }
  DB.blog_posts=DB.blog_posts||[];
  if(post.id){const i=DB.blog_posts.findIndex(p=>p.id===post.id);if(i>=0)DB.blog_posts[i]={...DB.blog_posts[i],...post};}
  else{post.id=uid();post.created_at=Date.now();DB.blog_posts.unshift(post);}
  saveDB(DB);return post;
}
async function deletePost(id){
  if(supabase)return supabase.from("blog_posts").delete().eq("id",id);
  DB.blog_posts=(DB.blog_posts||[]).filter(p=>p.id!==id);saveDB(DB);
}

/* demo auth: OTP code is always 123456 */
async function sendOtp(email,name,phone){
  if(supabase){return supabase.auth.signInWithOtp({email,options:{shouldCreateUser:true,data:{full_name:name,phone}}});}
  // demo: remember pending registration
  DB._pending={email:email.toLowerCase(),name,phone};saveDB(DB);
  return {error:null,demo:true};
}
async function verifyOtp(email,token){
  if(supabase){return supabase.auth.verifyOtp({email,token,type:"email"});}
  if(token!=="123456")return {error:{message:"Demo code is 123456."}};
  email=email.toLowerCase();
  let p=DB.profiles.find(x=>x.email.toLowerCase()===email);
  if(!p){
    const pend=DB._pending||{};
    p={id:uid(),full_name:pend.name||email.split("@")[0],email,phone:pend.phone||"",role:(email===ADMIN_EMAIL?"admin":"learner")};
    DB.profiles.push(p);
  } else if(email===ADMIN_EMAIL){ p.role="admin"; }
  DB.session={user_id:p.id};delete DB._pending;saveDB(DB);
  return {error:null};
}
async function signOutNow(){ if(supabase)await supabase.auth.signOut(); else{DB.session=null;saveDB(DB);} }
/* Admin sign-in with email + password (separate from the learner email-OTP flow) */
async function adminPasswordLogin(email,password){
  email=(email||"").trim().toLowerCase();
  if(supabase){
    const{error}=await supabase.auth.signInWithPassword({email,password});
    if(error)return {error};
    const prof=await currentProfile();
    if(!prof||prof.role!=="admin"){await signOutNow();return {error:{message:"That account isn't an admin."}};}
    return {error:null};
  }
  // demo fallback: admin email + any password
  if(email!==ADMIN_EMAIL)return {error:{message:"Use the admin email."}};
  let p=DB.profiles.find(x=>x.email.toLowerCase()===email);
  if(!p){p={id:uid(),full_name:"Ram Choudry",email,phone:"",role:"admin"};DB.profiles.push(p);}
  p.role="admin";DB.session={user_id:p.id};saveDB(DB);
  return {error:null};
}

async function myEnrollments(){
  const prof=await currentProfile();if(!prof)return [];
  if(supabase){const{data}=await supabase.from("enrollments").select("*, courses(*)").order("requested_at",{ascending:false});return data||[];}
  return DB.enrollments.filter(e=>e.user_id===prof.id).map(e=>({...e,courses:COURSES.find(c=>c.id===e.course_id)})).sort((a,b)=>b.requested_at-a.requested_at);
}
async function myCertificates(){
  const prof=await currentProfile();if(!prof)return [];
  if(supabase){const{data}=await supabase.from("certificates").select("*, courses(title)").order("issued_on",{ascending:false});return data||[];}
  return DB.certificates.filter(c=>c.user_id===prof.id).map(c=>({...c,courses:COURSES.find(x=>x.id===c.course_id)}));
}
async function materialsFor(courseId){
  if(supabase){const{data}=await supabase.from("materials").select("*").eq("course_id",courseId).eq("visible",true).order("sort_order");return data||[];}
  return DB.materials.filter(m=>m.course_id===courseId&&m.visible);
}
async function requestEnrollment(course){
  const prof=await currentProfile();
  if(supabase){
    const{data:c}=await supabase.from("courses").select("id").eq("slug",course.slug).single();
    return supabase.from("enrollments").insert({user_id:prof.id,course_id:c.id,status:"requested",payment_status:"pending"});
  }
  const exists=DB.enrollments.find(e=>e.user_id===prof.id&&e.course_id===course.id);
  if(exists)return {error:{message:"duplicate"}};
  DB.enrollments.unshift({id:uid(),user_id:prof.id,course_id:course.id,status:"requested",payment_status:"pending",requested_at:Date.now(),activated_at:null});
  saveDB(DB);return {error:null};
}
/* ---- Open Assessment access (student requests → admin approves/denies) ---- */
async function myAssessmentAccess(){
  const prof=await currentProfile();if(!prof)return null;
  if(supabase){const{data}=await supabase.from("assessment_access").select("*").eq("user_id",prof.id).order("requested_at",{ascending:false}).limit(1);return (data&&data[0])||null;}
  const list=(DB.assessment_access||[]).filter(a=>a.user_id===prof.id).sort((a,b)=>b.requested_at-a.requested_at);
  return list[0]||null;
}
async function requestAssessmentAccess(form){
  const prof=await currentProfile();if(!prof)return {error:{message:"Please log in first."}};
  let res;
  if(supabase){
    res=await supabase.from("assessment_access").insert({user_id:prof.id,full_name:form.full_name,email:form.email,mobile:form.mobile,status:"pending"});
  }else{
    DB.assessment_access=DB.assessment_access||[];
    const ex=DB.assessment_access.find(a=>a.user_id===prof.id&&(a.status==="pending"||a.status==="approved"));
    if(ex)return {error:{message:"exists"}};
    DB.assessment_access.unshift({id:uid(),user_id:prof.id,full_name:form.full_name,email:form.email,mobile:form.mobile,status:"pending",requested_at:Date.now(),decided_at:null});
    saveDB(DB);res={error:null};
  }
  // also log it as a lead so it shows up (with its source) under Admin → Leads
  if(!res.error){ try{ await submitLead({name:form.full_name,email:form.email,phone:form.mobile,message:"Requested Open Assessment access",source:"assessment"}); }catch(e){} }
  return res;
}
async function listAssessmentRequests(){
  if(supabase){const{data}=await supabase.from("assessment_access").select("*, profiles(full_name,email,phone)").order("requested_at",{ascending:false});return data||[];}
  return (DB.assessment_access||[]).slice().sort((a,b)=>b.requested_at-a.requested_at);
}
async function setAssessmentAccess(id,status){
  if(supabase)return supabase.from("assessment_access").update({status,decided_at:Date.now()}).eq("id",id);
  const r=(DB.assessment_access||[]).find(a=>a.id===id);if(r){r.status=status;r.decided_at=Date.now();saveDB(DB);}
  return {error:null};
}
async function submitLead(lead){
  if(supabase)return supabase.from("leads").insert(lead);
  DB.leads.unshift({id:uid(),...lead,created_at:Date.now()});saveDB(DB);return {error:null};
}

/* admin */
async function adminEnrollments(){
  if(supabase){const{data}=await supabase.from("enrollments").select("*, courses(title), profiles(full_name,email,phone)").order("requested_at",{ascending:false});return data||[];}
  return DB.enrollments.map(e=>({...e,courses:COURSES.find(c=>c.id===e.course_id),profiles:DB.profiles.find(p=>p.id===e.user_id)})).sort((a,b)=>b.requested_at-a.requested_at);
}
async function adminLeads(){
  if(supabase){const{data}=await supabase.from("leads").select("*").order("created_at",{ascending:false});return data||[];}
  return [...DB.leads].sort((a,b)=>b.created_at-a.created_at);
}
async function adminPayments(){
  if(supabase){const{data}=await supabase.from("payments").select("*").order("created_at",{ascending:false});return data||[];}
  return [...(DB.payments||[])].sort((a,b)=>b.created_at-a.created_at);
}
async function adminUpdateEnrollment(id,field,value){
  if(supabase){const patch={[field]:value};if(field==="status"&&value==="active")patch.activated_at=Date.now();return supabase.from("enrollments").update(patch).eq("id",id);}
  const e=DB.enrollments.find(x=>x.id===id);if(e){e[field]=value;if(field==="status"&&value==="active")e.activated_at=Date.now();}saveDB(DB);return {error:null};
}
async function adminAddCertificate(userId,courseId,title,fileNameOrUrl){
  if(supabase){const{data:{user}}=await supabase.auth.getUser();return supabase.from("certificates").insert({user_id:userId,course_id:courseId,title,file_path:fileNameOrUrl,uploaded_by:user.id});}
  DB.certificates.unshift({id:uid(),user_id:userId,course_id:courseId,title,file_path:fileNameOrUrl||"https://fastrackagile.com/",issued_on:new Date().toISOString().slice(0,10)});saveDB(DB);return {error:null};
}
async function adminListLearners(){
  if(supabase){const{data}=await supabase.from("profiles").select("*").order("created_at",{ascending:false});return data||[];}
  return DB.profiles.filter(p=>p.role!=="admin");
}

const A = {"LOGO_MARK": "/img/asset-21.png", "LOGO_TEXT": "/img/asset-22.png", "LOGO_FULL": "/img/asset-23.png", "RAM": "/img/asset-24.png", "RAM_PORTRAIT": "/img/asset-25.png"};
/* ===== 5. helpers ===== */
function toast(msg,err=false){let t=document.querySelector(".toast");if(!t){t=document.createElement("div");t.className="toast";document.body.appendChild(t);}t.textContent=msg;t.classList.toggle("err",err);t.classList.add("show");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("show"),3200);}

/* ===== Book Your Call — ₹99 Razorpay gate, then Calendly ===== */
function ensureRazorpay(cb){
  if(window.Razorpay)return cb(true);
  const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";
  s.onload=()=>cb(!!window.Razorpay);s.onerror=()=>cb(false);document.body.appendChild(s);
}
/* Generic Razorpay payment popup. opts: {title, subtitle, amount, feeLabel, icon,
   successTitle, successHTML, successBtnHTML, onSuccess(modalEl)} */
function openPayment(opts){
  let m=document.getElementById("pay-modal");
  if(!m){m=document.createElement("div");m.id="pay-modal";m.className="bc-overlay";document.body.appendChild(m);}
  const demo=!RAZORPAY_KEY_ID;
  const goLabel=opts.collect?"Continue to payment →":`Pay ${priceINR(opts.amount)} &amp; continue →`;
  // Register flow collects the buyer's details first, then opens the gateway.
  const formHTML=opts.collect?`
    <div class="pay-form">
      <input id="pf-name" placeholder="Full name" autocomplete="name">
      <input id="pf-phone" type="tel" inputmode="tel" placeholder="Mobile number" autocomplete="tel">
      <input id="pf-email" type="email" inputmode="email" placeholder="Email address" autocomplete="email">
    </div>`:"";
  m.innerHTML=`<div class="bc-card">
    <button class="bc-close" aria-label="Close">&times;</button>
    <div class="bc-ic">${opts.icon||"₹"}</div>
    <h3>${esc(opts.title||"Payment")}</h3>
    <p class="bc-sub">${esc(opts.subtitle||"")}</p>
    <div class="bc-fee">${priceINR(opts.amount)}<span>${esc(opts.feeLabel||"one-time")}</span></div>
    ${formHTML}
    <button class="btn btn-primary full-btn" id="pay-go">${goLabel}</button>
    <p class="bc-note">${demo?"Demo mode — no real charge yet. Add your Razorpay key to accept live payments.":"Secured by Razorpay · UPI, cards &amp; net-banking"}</p>
  </div>`;
  m.classList.add("open");
  const close=()=>m.classList.remove("open");
  m.querySelector(".bc-close").onclick=close;
  m.onclick=e=>{if(e.target===m)close();};
  const gv=id=>{const el=document.getElementById(id);return el?el.value.trim():"";};
  document.getElementById("pay-go").onclick=()=>{
    if(opts.collect){
      const name=gv("pf-name"),phone=gv("pf-phone"),email=gv("pf-email");
      if(!name){toast("Please enter your full name.",true);document.getElementById("pf-name")?.focus();return;}
      if(!/^\+?[0-9][0-9\s-]{7,14}$/.test(phone)){toast("Please enter a valid mobile number.",true);document.getElementById("pf-phone")?.focus();return;}
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){toast("Please enter a valid email address.",true);document.getElementById("pf-email")?.focus();return;}
      opts.prefill={name,email,contact:phone};
      opts.customer={name,email,phone};
      // Capture the enquiry as a lead so the contact is saved even if payment is abandoned.
      try{ Promise.resolve(submitLead({name,email,phone,source:"register",message:opts.title||""})).catch(()=>{}); }catch(e){}
    }
    runPayment(m,opts);
  };
  if(opts.collect) document.getElementById("pf-name")?.focus();
}
function paySuccess(m,opts){
  m.querySelector(".bc-card").innerHTML=`<button class="bc-close" aria-label="Close">&times;</button>
    <div class="bc-ic ok">✓</div><h3>${esc(opts.successTitle||"Payment received")}</h3>
    <p class="bc-sub">${opts.successHTML||esc(opts.successText||"You're all set.")}</p>
    ${opts.successBtnHTML||""}`;
  m.querySelector(".bc-close").onclick=()=>m.classList.remove("open");
  if(opts.onSuccess){try{opts.onSuccess(m);}catch(e){}}
}
async function runPayment(m,opts){
  const goLabel=opts.collect?"Continue to payment →":("Pay "+priceINR(opts.amount)+" &amp; continue →");
  const btn=document.getElementById("pay-go");const reset=()=>{if(btn){btn.disabled=false;btn.innerHTML=goLabel;}};
  if(btn){btn.disabled=true;btn.textContent="Processing…";}
  if(!RAZORPAY_KEY_ID){ setTimeout(()=>paySuccess(m,opts),700); return; } // demo: simulate a successful payment
  // 1) Ask our own server to create a Razorpay order — the server decides the real amount.
  let order;
  try{
    const r=await fetch("/api/razorpay/order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:opts.kind,slug:opts.slug||""})});
    order=await r.json();
    if(!r.ok||!order.orderId) throw new Error(order&&order.error);
  }catch(e){ toast("Couldn't start the payment. Please try again.",true); reset(); return; }
  const me=await currentProfile().catch(()=>null); const _uid=(me&&me.id)||"";
  // 2) Load Razorpay Checkout and open it against that server order.
  ensureRazorpay(ok=>{
    if(!ok){toast("Couldn't load the payment gateway — check your connection and try again.",true);reset();return;}
    const rzp=new window.Razorpay({
      key:order.keyId||RAZORPAY_KEY_ID, order_id:order.orderId, amount:order.amount, currency:order.currency||"INR",
      name:"Fastrack Agile", description:opts.title||"Fastrack Agile", theme:{color:"#0c1c33"},
      prefill:opts.prefill||{},
      handler:async function(resp){
        // 3) Verify the signature on our server BEFORE unlocking anything.
        if(btn){btn.disabled=true;btn.textContent="Verifying…";}
        try{
          const v=await fetch("/api/razorpay/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...resp,kind:opts.kind,slug:opts.slug||"",userId:_uid})});
          const vj=await v.json();
          if(v.ok&&vj.valid){ paySuccess(m,opts); }
          else{ toast("We couldn't verify your payment. If money was deducted, please contact us and we'll sort it out.",true); reset(); }
        }catch(e){ toast("Payment verification failed — please contact us if you were charged.",true); reset(); }
      },
      modal:{ondismiss:reset}
    });
    if(rzp.on)rzp.on("payment.failed",function(){toast("Payment failed. Please try again.",true);reset();});
    rzp.open();
  });
}
function bookCallModal(){
  openPayment({
    title:"Book Your Call", icon:"📞", feeLabel:"booking fee", amount:CALL_FEE, kind:"call",
    subtitle:"A 1-on-1 career coaching discussion with Ram. Confirm your slot with a small booking fee.",
    successTitle:"Payment received",
    successHTML:"You're all set — pick a time that works for you on the booking page.",
    successBtnHTML:`<a class="btn btn-primary full-btn" href="${CALENDLY_URL}" target="_blank" rel="noopener">Choose your slot →</a><p class="bc-note">If the booking page didn't open automatically, use the button above.</p>`,
    onSuccess:()=>{ try{window.open(CALENDLY_URL,"_blank","noopener");}catch(e){} }
  });
}
async function startRegister(course){
  // Pay-only flow — no login required. The payment is logged server-side (with the
  // payer's email/phone from Razorpay). If the buyer happens to be logged in, we
  // also record the enrollment on their dashboard; registerPaid() no-ops otherwise.
  const base=basePrice(course.slug), total=totalPrice(course.slug), gst=total-base;
  openPayment({
    title:course.title, icon:"🎓", feeLabel:"incl. GST", amount:total, kind:"register", slug:course.slug, collect:true,
    subtitle:`Program fee ${priceINR(base)} + ${Math.round(GST_RATE*100)}% GST ${priceINR(gst)} = ${priceINR(total)}. Enter your details, then pay to secure your seat.`,
    successTitle:"You're registered! 🎉",
    successHTML:"Your seat is confirmed — Ram's team will reach out on WhatsApp to finalise your batch schedule, onboarding and next steps.",
    successBtnHTML:`<a class="btn btn-primary full-btn" href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">Message us on WhatsApp →</a>`,
    onSuccess: async ()=>{ try{ await registerPaid(course); }catch(e){} }
  });
}
async function registerPaid(course){
  const prof=await currentProfile(); if(!prof)return;
  if(supabase){
    const{data:c}=await supabase.from("courses").select("id").eq("slug",course.slug).single();
    if(c)await supabase.from("enrollments").insert({user_id:prof.id,course_id:c.id,status:"active",payment_status:"paid",activated_at:Date.now()});
    return;
  }
  const ex=DB.enrollments.find(e=>e.user_id===prof.id&&e.course_id===course.id);
  if(ex){ex.status="active";ex.payment_status="paid";ex.activated_at=Date.now();}
  else DB.enrollments.unshift({id:uid(),user_id:prof.id,course_id:course.id,status:"active",payment_status:"paid",requested_at:Date.now(),activated_at:Date.now()});
  saveDB(DB);
}
// Any element with [data-book-call] (header + About/Contact/etc.) opens the ₹99 gate.
document.addEventListener("click",e=>{const b=e.target.closest("[data-book-call]");if(b){e.preventDefault();bookCallModal();}});
const esc=s=>(s||"").toString().replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmtDate=d=>{const t=typeof d==="number"?d:Date.parse(d);return isNaN(t)?(d||"—"):new Date(t).toLocaleDateString();};
function statusPill(s){if(s==="active")return `<span class="pill pill-active">Active</span>`;if(s==="completed")return `<span class="pill pill-active">Completed</span>`;if(s==="cancelled")return `<span class="pill pill-pending">Cancelled</span>`;return `<span class="pill pill-req">Awaiting confirmation</span>`;}
function payPill(s){return s==="paid"?`<span class="pill pill-paid">Paid</span>`:`<span class="pill pill-pending">Pending</span>`;}

/* ===== 6. CHROME: marketing header, app shell, footer ===== */

async function renderHeader(){
  const prof=await currentProfile();const isAdmin=prof?.role==="admin";
  const auth=prof
   ?`<a class="btn btn-ghost btn-sm" href="/dashboard">My Dashboard</a>${isAdmin?`<a class="btn btn-ghost btn-sm" href="/admin">Admin</a>`:""}<button class="btn btn-ink btn-sm" id="signout">Sign out</button>`
   :`<a class="btn btn-primary" href="/contact">Contact us</a><span class="auth-later" hidden><a class="btn btn-ghost" href="/login">Log in</a><a class="btn btn-primary" href="/login">Register free</a></span>`;
  document.getElementById("site-header").innerHTML=`
   <div class="urgency-bar">
     <span class="ub-live"><span class="ld"></span> Live Cohort · Hands-On Practical Scrum Training</span>
     <span class="ub-seg"><span class="ub-batch">New Batch Starts on <b>15th July 2026</b></span> · <span class="ub-time">Mon–Fri · 6:45–8:15 AM IST</span></span>
     <a class="ub-cta" href="${CALENDLY_URL}" data-book-call target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg> Book Your Call</a>
   </div>
   <header><div class="wrap nav">
     <a class="brand-logo" href="/" aria-label="Fastrack Agile"><img src="${A.LOGO_MARK}" class="logo-mark" alt=""><img src="${A.LOGO_TEXT}" class="logo-text" alt="Fastrack Agile"></a>
     <nav class="navlinks"><a href="/">Home</a><a href="/about">About Us</a><a href="/courses">Programs</a><a href="/calendar">Training Calendar</a><a href="/resources">Resources</a><a href="/stories">Success Stories</a><a href="/contact">Contact</a></nav>
     <div class="nav-cta">${auth}</div>
     <a class="nav-book" href="${CALENDLY_URL}" data-book-call target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg> Book a Call</a>
     <button class="menu-btn" id="menu-btn" aria-label="Menu">☰</button>
   </div>
   <div class="mobile-drawer" id="mobile-drawer">
     <a href="/">Home</a><a href="/about">About Us</a><a href="/courses">Programs</a><a href="/calendar">Training Calendar</a><a href="/resources">Resources</a><a href="/stories">Success Stories</a><a href="/contact">Contact</a>
     <div class="divider"></div>
     ${prof?`<a href="/dashboard">My Dashboard</a>${isAdmin?`<a href="/admin">Admin Console</a>`:""}<a href="javascript:void(0)" id="m-signout">Sign out</a>`:`<a href="/contact" class="accent">Contact us</a><span class="auth-later" hidden><a href="/login">Log in</a><a href="/login" class="accent">Register free</a></span>`}
   </div></header>`;
  document.getElementById("signout")?.addEventListener("click",async()=>{await signOutNow();await renderHeader();navigate("/");});
  const mb=document.getElementById("menu-btn"),dr=document.getElementById("mobile-drawer");
  mb?.addEventListener("click",()=>dr.classList.toggle("open"));
  dr?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>dr.classList.remove("open")));
  document.getElementById("m-signout")?.addEventListener("click",async()=>{await signOutNow();await renderHeader();navigate("/");});
  if(typeof startCountdown==="function") startCountdown();
}
function renderFooter(){
  document.getElementById("site-footer").innerHTML=`
  <footer>
    <div class="foot-texture" aria-hidden="true"></div>
    <svg class="foot-deco" viewBox="0 0 380 460" aria-hidden="true" focusable="false" preserveAspectRatio="xMaxYMid slice">
      <defs>
        <pattern id="fdots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.6" fill="#1d4ed8"/>
        </pattern>
        <linearGradient id="fgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#1d4ed8"/><stop offset="1" stop-color="#1BA9DC"/>
        </linearGradient>
      </defs>
      <g opacity=".06" fill="url(#fgrad)">
        <polygon points="380,30 250,170 380,170"/>
        <polygon points="380,200 270,320 380,320"/>
        <polygon points="230,330 350,330 230,450"/>
      </g>
      <rect x="60" y="40" width="92" height="92" fill="url(#fdots)" opacity=".5"/>
      <rect x="300" y="350" width="66" height="66" fill="url(#fdots)" opacity=".45"/>
      <circle cx="120" cy="300" r="34" fill="none" stroke="#1d4ed8" stroke-width="1.5" opacity=".12"/>
      <circle cx="120" cy="300" r="20" fill="none" stroke="#1BA9DC" stroke-width="1.5" opacity=".14"/>
      <rect x="250" y="60" width="30" height="30" fill="none" stroke="#1d4ed8" stroke-width="1.5" opacity=".14" transform="rotate(20 265 75)"/>
      <path d="M40 200 l14 0 M47 193 l0 14" stroke="#1d4ed8" stroke-width="1.6" opacity=".18"/>
      <path d="M340 140 l14 0 M347 133 l0 14" stroke="#1BA9DC" stroke-width="1.6" opacity=".2"/>
    </svg>
    <svg class="foot-deco-l" viewBox="0 0 220 300" aria-hidden="true" focusable="false">
      <circle cx="40" cy="40" r="3" fill="#1d4ed8" opacity=".15"/>
      <circle cx="60" cy="40" r="3" fill="#1d4ed8" opacity=".12"/>
      <circle cx="40" cy="60" r="3" fill="#1d4ed8" opacity=".1"/>
      <rect x="20" y="180" width="26" height="26" fill="none" stroke="#1d4ed8" stroke-width="1.4" opacity=".12" transform="rotate(-15 33 193)"/>
      <path d="M150 250 l16 0 M158 242 l0 16" stroke="#1BA9DC" stroke-width="1.6" opacity=".16"/>
    </svg>
    <div class="wrap">
      <div class="foot-main">
        <div class="foot-brandcol">
          <a class="brand-logo" href="/" aria-label="Fastrack Agile — home"><img src="${A.LOGO_MARK}" class="logo-mark" alt=""><img src="${A.LOGO_TEXT}" class="logo-text" alt="Fastrack Agile"></a>
          <p class="blurb">Master Agile &amp; Scrum the practical way. Career-focused training for non-IT professionals breaking into IT — led personally by Ram Choudry.</p>
          <a class="foot-explore-btn" href="/courses">Explore Our Courses <svg class="ico" aria-hidden="true"><use href="#i-arrow-r"/></svg></a>
        </div>

        <div class="foot-col">
          <h4>Explore</h4><div class="h4-rule"></div>
          <a class="foot-link" href="/about"><svg class="ico" aria-hidden="true"><use href="#i-users"/></svg> About Us</a>
          <a class="foot-link" href="/courses"><svg class="ico" aria-hidden="true"><use href="#i-book"/></svg> Courses</a>
          <a class="foot-link" href="/calendar"><svg class="ico" aria-hidden="true"><use href="#i-cal"/></svg> Training Calendar</a>
          <a class="foot-link" href="/resources"><svg class="ico" aria-hidden="true"><use href="#i-folder"/></svg> Resources</a>
          <a class="foot-link" href="/contact"><svg class="ico" aria-hidden="true"><use href="#i-mail"/></svg> Contact</a>
        </div>

        <div class="foot-col">
          <h4>Visit / Contact</h4><div class="h4-rule"></div>
          <div class="foot-info"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg><a href="tel:+919966080123">+91 99660 80123</a></div>
          <div class="foot-info"><svg class="ico" aria-hidden="true"><use href="#i-mail"/></svg><a href="mailto:info@fastrackagile.com">info@fastrackagile.com</a></div>
          <div class="foot-info"><svg class="ico" aria-hidden="true"><use href="#i-pin"/></svg><span>Indeqube Building,<br>Mindspace Rd,<br>Gachibowli, Hyderabad<br>500032</span></div>
        </div>

        <div class="foot-col">
          <h4>Follow Us</h4><div class="h4-rule"></div>
          <div class="foot-social">
            <a href="https://www.linkedin.com/company/fastrack-agile/" target="_blank" rel="noopener"><span class="soc-chip soc-in"><svg class="ico" aria-hidden="true"><use href="#i-in"/></svg></span> LinkedIn</a>
            <a href="https://www.facebook.com/fastrackagile" target="_blank" rel="noopener"><span class="soc-chip soc-fb"><svg class="ico" aria-hidden="true"><use href="#i-fb"/></svg></span> Facebook</a>
            <a href="https://www.instagram.com/fastrackagile_official" target="_blank" rel="noopener"><span class="soc-chip soc-ig"><svg class="ico" aria-hidden="true"><use href="#i-ig"/></svg></span> Instagram</a>
            <a href="https://www.youtube.com/@Fastrack_Agile" target="_blank" rel="noopener"><span class="soc-chip soc-yt"><svg class="ico" aria-hidden="true"><use href="#i-yt"/></svg></span> YouTube</a>
          </div>
        </div>
      </div>

      <div class="foot-bottom">
        <span class="fb-badge"><svg class="ico" aria-hidden="true"><use href="#i-shield"/></svg> Practice Driven Scrum</span>
        <span class="fb-sep"></span>
        <span class="fb-copy"><svg class="ico" aria-hidden="true" style="width:16px;height:16px;vertical-align:-.15em;color:#5a6478"><use href="#i-lock"/></svg> © 2026 Fastrack Agile. All rights reserved.</span>
        <span class="foot-legal"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Use</a><a href="/refund">Refund Policy</a></span>
      </div>
    </div>
  </footer>`;
}

/* APP SHELL — used by dashboard & admin. Hides marketing header/footer, shows sidebar. */
function appShell(active, profile, bodyHtml, isAdmin){
  const initials=(profile?.full_name||"U").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  const learnerNav=[["dashboard","My Dashboard","▣"],["assessment","Open Assessment","📝"],["courses","Browse Courses","◳"],["certs","My Certificate","🏅"]];
  const adminNav=[["admin","Overview","▣"],["admin-enroll","Enrollments","◳"],["admin-payments","Payments","₹"],["admin-assess","Assessments","📝"],["admin-content","Content","✎"],["admin-blog","Blog","✍"],["admin-learners","Learners","☻"],["admin-leads","Leads","✉"],["admin-certs","Certificates","🏅"]];
  const nav=isAdmin?adminNav:learnerNav;
  const links=nav.map(([k,label,ic])=>`<a class="snav-link ${active===k?'on':''}" href="/${k==='certs'?'dashboard':k==='courses'?'courses':k}">${ic} <span>${label}</span></a>`).join("");
  return `<div class="shell">
    <aside class="sidebar">
      <a class="brand-logo" href="/" style="margin-bottom:1.6rem"><img src="${A.LOGO_MARK}" style="height:38px" alt=""><img src="${A.LOGO_TEXT}" style="height:22px" alt="Fastrack Agile"></a>
      <div class="snav">${links}</div>
      <div class="snav" style="margin-top:auto">
        <a class="snav-link" href="/">↩ <span>Back to site</span></a>
        <a class="snav-link" id="shell-signout" href="javascript:void(0)">⏻ <span>Sign out</span></a>
      </div>
    </aside>
    <div class="shell-main">
      <div class="topbar">
        <div class="tb-title">${isAdmin?"Admin Console":"Learner Portal"} ${MODE==="demo"?'<span class="mode-chip">Demo</span>':'<span class="mode-chip live">Live</span>'}</div>
        <div class="tb-user"><div class="avatar-sm">${initials}</div><div><div class="tb-name">${esc(profile?.full_name||"User")}</div><div class="tb-mail">${esc(profile?.email||"")}</div></div></div>
      </div>
      <div class="shell-body">${bodyHtml}</div>
    </div>
  </div>`;
}
function bindShell(){
  document.getElementById("shell-signout")?.addEventListener("click",async()=>{await signOutNow();await renderHeader();navigate("/");});
}
function showChrome(show){
  document.getElementById("site-header").style.display=show?"":"none";
  document.getElementById("site-footer").style.display=show?"":"none";
  document.querySelector(".sticky-actions").style.display=show?"":"none";
  const cta=document.getElementById("sticky-cta"); if(cta){cta.style.display=show?"":"none"; if(!show)cta.classList.remove("show");}
}

/* ===== 7. VIEWS ===== */
const app=()=>document.getElementById("app");

/* ---- HOME (rebuilt, clean) ---- */
function viewHome(){
  const prog=mergedCourses().slice(0,3).map(c=>`<article class="course-card"><div class="cc-top"></div><div class="cc-body"><span class="cc-mode">${esc(c.mode)}</span><h3>${esc(c.title)}</h3><div class="cc-sub">${esc(c.subtitle||"")}</div><p class="cc-summary">${esc(c.summary)}</p><div class="cc-meta"><span>🗓 ${esc(c.duration)}</span><span>⏰ ${esc(c.schedule)}</span></div><div class="cc-actions"><a class="btn btn-primary btn-sm" href="/course/${c.slug}">View &amp; enroll →</a></div></div></article>`).join("");
  const cert=CERTS.map(c=>`<div class="cert-chip"><div class="nm">${esc(c.nm)}</div><div class="ds">${esc(c.ds)}</div></div>`).join("");
  const faqs=[["I'm from a non-IT background — is this really possible for me?","Absolutely. Non-IT professionals often make excellent Scrum Masters. Companies hire Scrum Masters for leadership, communication, coordination and stakeholder management — not for coding. If you come from operations, support, sales or any coordination role, you already have the core skills recruiters look for; we simply help you reframe your background for IT hiring managers."],["Do I need to learn coding or any technical tools first?","No — there are no technical prerequisites. Scrum Masters are not developers; you are not expected to write code or debug applications. The role is about understanding team dynamics, tracking project progress and removing obstacles, not programming."],["How long does it realistically take to transition into a Scrum Master role?","For most working professionals it takes about 6 to 12 months, depending on your experience, effort and how consistently you apply what you learn. We share realistic timelines — never unrealistic overnight claims."],["What salary can I expect after becoming a Scrum Master?","Entry-level roles typically range from ₹8–12 LPA, growing to ₹15–20 LPA with experience, and can go beyond ₹30 LPA at senior levels. We keep salary expectations transparent and realistic."],["I'm already working full-time — can I manage this transition?","Yes. Most of our successful learners are working professionals. The program is structured to fit around full-time jobs, families and busy schedules."],["Do you provide placement assistance?","Yes — resume refinement, LinkedIn optimisation, interview coaching, mock interviews and application guidance. That said, placement is not magic: your active participation and effort are what turn this support into real offers."],["I'm earning very low right now — is this path financially worth it?","For experienced professionals who want to avoid a coding career, this is one of the highest-ROI transitions available — a realistic step up from ₹3–6 LPA roles into far higher-paying Scrum Master positions."],["Is a Scrum Master certification alone enough to get a job?","No. Recruiters don't hire certificates — they hire people who can demonstrate real-world Scrum understanding, leadership ability and interview readiness. A certificate helps, but it is not enough on its own, which is exactly why our training is practical and interview-focused."]];
  const faq=faqs.map(([q,a])=>`<div class="faq2-item"><button class="faq2-q">${q} <span class="pm">+</span></button><div class="faq2-a"><p>${a}</p></div></div>`).join("");

  return `
  <!-- HERO -->
  <section class="hero2 hero-banner">
    <div class="hb-gallery" id="hero-gallery" aria-hidden="true">
      ${HERO_PHOTOS.map((src,i)=>`<img class="hg-slide${i===0?' on':''}" src="${src}" alt=""${i===0?' fetchpriority="high"':' loading="lazy"'} decoding="async" draggable="false">`).join("")}
    </div>
    <div class="hb-scrim"></div>
    <div class="wrap hb-inner">
      <div class="hero2-copy">
        <span class="eyebrow anim-1" style="text-transform:none;letter-spacing:.04em">Only for Professionals Seeking a Career Switch</span>
        <h1 class="anim-2">${txt("home_hero_title","Break into IT as a <em>Scrum Master</em> — no coding required.")}</h1>
        <p class="lede anim-3">${txt("home_hero_lede","Practical, live Agile and Scrum training with Jira simulations, interview prep, and personal mentorship from Ram — built for people switching from non-tech careers.")}</p>
        <div class="hero2-cta anim-4">
          <a class="btn btn-primary" href="/courses">Register Now →</a>
          <a class="btn btn-ghost btn-on-dark" href="/courses">Programs</a>
        </div>
        <div class="hero2-ticks anim-4"><span><svg class="ico tk" aria-hidden="true"><use href="#i-check"/></svg> Online &amp; In-Person</span><span><svg class="ico tk" aria-hidden="true"><use href="#i-check"/></svg> Placement Support</span></div>
      </div>
    </div>
    <div class="hb-dots" id="hg-dots">${HERO_PHOTOS.map((_,i)=>`<button class="hg-dot${i===0?' on':''}" data-i="${i}" aria-label="Show photo ${i+1}"></button>`).join("")}</div>
  </section>

  <!-- TRUST BAR -->
  <section class="trustbar"><div class="wrap trustbar-grid reveal r-scale" data-stagger>
    <div class="tb-item"><div class="v"><span class="counter" data-count="17" data-suffix="+">17+</span></div><div class="k">Years of corporate experience</div></div>
    <div class="tb-item"><div class="v"><span class="counter" data-count="350" data-suffix="+">350+</span></div><div class="k">Learners Mentored</div></div>
    <div class="tb-item"><div class="v"><span class="counter" data-count="200" data-suffix="+">200+</span></div><div class="k">Placements Supported</div></div>
    <div class="tb-item"><div class="v">Live</div><div class="k">Online &amp; in-person (Gachibowli)</div></div>
  </div></section>

  <!-- FOUNDER -->
  <section class="sec-block founder2"><div class="wrap founder2-grid">
    <div class="founder2-portrait reveal r-left"><img src="${A.RAM_PORTRAIT}" alt="Balaram (Ram) Choudry, Founder of Fastrack Agile"><div class="sig">Balaram Choudry<small>(Known as Ram)</small></div></div>
    <div class="reveal r-right">
      <span class="eyebrow on-amber">Meet your mentor</span>
      <p class="quote mt-3">"I switched into IT from a non-tech background myself. <span>Now I make sure you don't have to do it alone.</span>"</p>
      <p class="body">Fastrack Agile is led personally by Ram Choudry — with over a decade of hands-on Agile delivery and hundreds of professionals mentored out of stuck careers into Scrum Master roles. When you train here, you train with him.</p>
      <div class="creds">
        <div><span class="ic">✦</span> 17+ years of hands-on Agile, Scrum &amp; SAFe delivery</div>
        <div><span class="ic">✦</span> 350+ learners mentored, 200+ placements supported</div>
        <div><span class="ic">✦</span> Real-time practical training — online and at our Gachibowli center</div>
        <div><span class="ic">✦</span> Proven, verifiable track record — connect with Ram on LinkedIn</div>
      </div>
      <div class="hero2-cta"><a class="btn btn-primary" href="https://www.linkedin.com/in/balram-choudry/" target="_blank" rel="noopener">Connect on LinkedIn →</a><a class="btn" style="background:rgba(255,255,255,.12);color:#fff;border:1.5px solid rgba(255,255,255,.35)" href="/about">His full story</a></div>
    </div>
  </div></section>

  <!-- MYTH -->
  <section class="sec-block"><div class="wrap">
    <div class="sec-head reveal"><span class="eyebrow">The biggest blocker</span><h2>You think you need to code to get into IT. You don't.</h2><p>Most non-IT professionals talk themselves out of a Scrum Master career before they start. Here's the truth about what the role actually needs.</p></div>
    <div class="myth-grid">
      <div class="myth-card bad reveal r-left"><span class="tag">The myth</span><h3>Common Myths About Becoming a Scrum Master</h3><ul>${["IT isn't for people like me.","I need to learn programming before becoming a Scrum Master.","I need a Computer Science or Engineering degree.","Companies only hire people with prior Scrum Master experience.","My non-IT experience has no value in Agile.","I'm too old or it's too late to switch careers.","A Scrum certification alone is enough to get hired.","I need years of technical experience to become a Scrum Master.","Scrum Master interviews are highly technical and coding-based.","Without an IT background, I can't compete with experienced candidates.","Only developers can build a successful career in Agile.","Career transition to Scrum Master is nearly impossible."].map(t=>`<li><span class="mk">✕</span> ${t}</li>`).join("")}</ul></div>
      <div class="myth-card good reveal r-right"><span class="tag">The reality</span><h3>The Reality of Becoming a Scrum Master</h3><ul>${["Scrum welcomes professionals from diverse backgrounds — not just IT.","Programming or coding is not required for a Scrum Master role.","Communication, facilitation, leadership and problem-solving matter more than your degree.","Your previous experience gives you transferable skills that organizations value.","Certifications build knowledge, but practical training builds confidence.","Hands-on sprint simulations and real-time Scrum activities prepare you for actual project situations.","Working through real interview scenarios and case studies helps you answer situational questions naturally.","The more you practice articulating Scrum concepts, the more your confidence shows in interviews.","Interviewers look for practical thinking and problem-solving — not memorized definitions.","Consistent practice, mock interviews and expert feedback significantly improve your chances of getting hired."].map(t=>`<li><svg class="ico mk" aria-hidden="true"><use href="#i-check"/></svg> ${t}</li>`).join("")}</ul></div>
    </div>
  </div></section>

  <!-- 4-PHASE JOURNEY (signature) -->
  <section class="sec-block"><div class="wrap">
    <div class="sec-head center reveal"><span class="eyebrow">The 4-phase model</span><h2>Learn. Practice. Simulate. Get hired.</h2><p>A proven path that takes you from Scrum fundamentals to a real 2-week Jira sprint simulation, mock interviews, and placement readiness.</p></div>
    <div class="journey reveal" role="list">
      <div class="jp" role="listitem"><div class="jp-node"><span class="jp-num">1</span><svg class="ico" aria-hidden="true"><use href="#i-book"/></svg></div><h4>Learn</h4><p>Agile, Scrum, Kanban, SAFe, Jira &amp; Confluence — taught live, not from slides.</p></div>
      <div class="jp" role="listitem"><div class="jp-node"><span class="jp-num">2</span><svg class="ico" aria-hidden="true"><use href="#i-spark"/></svg></div><h4>Practice</h4><p>Hands-on exercises and real-world scenarios that build true facilitation skill.</p></div>
      <div class="jp" role="listitem"><div class="jp-node"><span class="jp-num">3</span><svg class="ico" aria-hidden="true"><use href="#i-target"/></svg></div><h4>Simulate</h4><p>A 2-week live Jira sprint simulation — experience the role before the job.</p></div>
      <div class="jp" role="listitem"><div class="jp-node"><span class="jp-num">4</span><svg class="ico" aria-hidden="true"><use href="#i-badge"/></svg></div><h4>Get hired</h4><p>Guaranteed mock interviews, personalised feedback, and placement guidance.</p></div>
    </div>
  </div></section>

  <!-- PROGRAMS PREVIEW -->
  <section class="sec-block tint"><div class="wrap">
    <div class="sec-head center reveal"><span class="eyebrow">Programs</span><h2>Choose your path into Scrum.</h2><p>Six practical programs — weekday, weekend, interview bootcamp, certification, mentorship, and self-paced.</p></div>
    <div class="prog-urgency reveal"><span class="pu-live"><span class="ld"></span> Enrolling now</span><span>Next weekday cohort closes in <b id="prog-countdown">soon</b></span></div>
    <div class="prog-grid reveal" data-stagger>${prog}</div>
    <div class="center-txt mt-8"><a class="btn btn-primary" href="/courses">View all 6 programs →</a></div>
  </div></section>

  <!-- SUCCESS STORIES (real learner placements) -->
  <section class="sec-block"><div class="wrap">
    <div class="sec-head center reveal"><span class="eyebrow">Success stories</span><h2>From non-IT careers to Scrum Master roles.</h2><p>Real messages from our learners after they landed Scrum Master roles at leading companies across India and beyond.</p></div>
    <div class="reviews-grid reveal" data-stagger>${storiesData().map((s,i)=>`<div class="review"><div class="review-top"><div class="review-av" style="background:${["#5b8def","#e0902b","#1f7a55","#9b59b6","#e74c3c","#16a085","#d4762a","#3b7dd8"][i%8]}">${esc(s.n[0])}</div><div><div class="review-name">${esc(s.n)}</div><div class="review-role">${esc(s.b)}${s.role?" · "+esc(s.role):""}</div></div></div><p class="review-txt">"${esc(s.t)}"</p><div class="review-foot"><svg class="ico" aria-hidden="true" style="width:15px;height:15px;color:#1f7a55"><use href="#i-check"/></svg> Verified placement</div></div>`).join("")}</div>
    <div class="center-txt mt-8"><a class="btn btn-primary" href="/stories">See all success stories →</a></div>
  </div></section>

  <!-- SUCCESS STORY WALL (real learners) -->
  <section class="sec-block tint"><div class="wrap">
    <div class="sec-head center reveal"><span class="eyebrow">Real people, real switches</span><h2>The faces behind the success stories.</h2><p>These are actual learners who walked in from non-IT backgrounds and walked out into Scrum Master roles — photographed at our Gachibowli center.</p></div>
    <div class="story-wall reveal" data-stagger>${STORY_PHOTOS.map(storyCard).join("")}</div>
    <div class="story-stat-row reveal" data-stagger>
      <div class="story-stat"><b><span class="counter" data-count="350" data-suffix="+">0</span></b><span>Learners mentored</span></div>
      <div class="story-stat"><b><span class="counter" data-count="200" data-suffix="+">0</span></b><span>Career switches</span></div>
      <div class="story-stat"><b><span class="counter" data-count="17" data-suffix="+">0</span></b><span>Years Experience</span></div>
    </div>
    <p class="story-note reveal">Every photo here is a real Fastrack Agile graduate. Your story could be next.</p>
  </div></section>

  <!-- CERTIFICATIONS -->
  <section class="sec-block tint"><div class="wrap">
    <div class="sec-head center reveal"><span class="eyebrow">What you'll master</span><h2>Globally recognised frameworks &amp; tools.</h2><p>Training spans the certifications and industry tools employers actually look for.</p></div>
    <div class="cert-strip reveal" data-stagger>${cert}</div>
  </div></section>

  <!-- COMMUNITY / MEETUP GALLERY -->
  <section class="sec-block"><div class="wrap">
    <div class="sec-head center reveal"><span class="eyebrow">More than a course</span><h2>You're joining a 350+ strong community.</h2><p>Regular meetups, peer practice, and an alumni network that keeps growing — here's the Fastrack Agile family in Hyderabad.</p></div>
    <div class="gwrap reveal"><div class="ggrid" data-stagger>
      ${HERO_PHOTOS.slice(0,8).map((src,i)=>`<div class="gtile ${i===0?'feat':'wide'}" data-d="${i}"><img loading="lazy" decoding="async" src="${src}" alt="Fastrack Agile community meetup, Hyderabad" width="1000" height="563"></div>`).join("")}
    </div></div>
  </div></section>

  <!-- TRAINING CENTER -->
  <section class="sec-block"><div class="wrap center-grid">
    <div class="center-card reveal r-left"><div class="center-map"><div class="map-fallback">📍 Gachibowli, Hyderabad<br><span>Indeqube Building, Mindspace Rd</span></div><iframe loading="lazy" src="${GMB.mapsEmbed}" title="Fastrack Agile location"></iframe></div></div>
    <div class="center-info reveal r-right">
      <span class="eyebrow">Visit us</span>
      <h2>Train online — or in person in Gachibowli.</h2>
      <p style="color:var(--ink-soft);margin-top:.8rem">Our Hyderabad training center runs hands-on, real-time Agile, Scrum &amp; SAFe sessions. Drop by, or join the same live experience online.</p>
      <div class="row"><div class="ic">📍</div><div><strong>Address</strong><span>${GMB.address}</span></div></div>
      <div class="row"><div class="ic">📞</div><div><strong>Phone</strong><span><a href="tel:9966080123" style="color:var(--amber-deep)">${GMB.phone}</a></span></div></div>
      <div class="row"><div class="ic">🕐</div><div><strong>Hours</strong><span>${GMB.hours}</span></div></div>
      <div class="hero2-cta"><a class="btn btn-primary" href="https://www.google.com/maps?q=Indeqube+Building+Mindspace+Road+Gachibowli+Hyderabad" target="_blank" rel="noopener">Get directions →</a></div>
    </div>
  </div></section>

  <!-- FAQ -->
  <section class="sec-block tint"><div class="wrap">
    <div class="sec-head center reveal"><span class="eyebrow">Common questions</span><h2>Everything you're wondering, answered.</h2></div>
    <div class="faq2">${faq}</div>
  </div></section>

  <!-- FINAL CTA -->
  <section class="sec-block final2"><div class="wrap reveal r-scale">
    <h2>Your first step into IT starts with one conversation.</h2>
    <p>Register free, book a no-pressure call, and we'll map out your transition — honestly.</p>
    <div class="hero2-cta" style="justify-content:center"><a class="btn btn-ink" href="/courses">Register Now →</a><a class="btn btn-ghost" href="https://wa.me/${WHATSAPP}" style="border-color:var(--ink)">Chat on WhatsApp</a></div>
  </div></section>`;
}

/* ---- COURSES ---- */
async function viewCourses(){
  const cs=await listCourses();
  const card=c=>`<article class="course-card"><div class="cc-top"></div><div class="cc-body">
    <span class="cc-mode">${esc(c.mode||"Online")}</span><h3>${esc(c.title)}</h3>
    <div class="cc-sub">${esc(c.subtitle||"")}</div><p class="cc-summary">${esc(c.summary||"")}</p>
    <div class="cc-meta"><span>🗓 ${esc(c.duration||"")}</span><span>⏰ ${esc(c.schedule||"")}</span></div>
    <div class="cc-price" style="font-weight:800;font-size:1.15rem;color:var(--ink);margin:.15rem 0 .2rem">${priceINR(basePrice(c.slug))} <span style="font-weight:500;font-size:.8rem;color:var(--ink-soft)">+ GST</span></div>
    <div class="cc-actions"><a class="btn btn-primary btn-sm" href="/course/${c.slug}">View &amp; enroll →</a>
    <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hi, I want details about '+c.title)}">WhatsApp</a></div>
    </div></article>`;
  return `<section class="page-head wrap reveal"><span class="eyebrow">Programs</span>
    <h1>Six ways to get into a Scrum Master career.</h1>
    <p style="max-width:none;font-size:1rem">Every program is hands-on, mentor-led, and designed to help experienced professionals build practical Agile and Scrum expertise. <strong>A minimum of 4 years of professional work experience in any domain — IT or non-IT — is mandatory</strong> to enroll. Whether you're an IT professional looking to advance your career or a non-IT professional transitioning into Agile, our programs provide the knowledge, mentorship, and real-world guidance needed to become a successful Scrum Master. Choose the program that best fits your schedule and career goals.</p></section>
    <div class="wrap"><div class="course-grid reveal" data-stagger>${cs.map(card).join("")}</div></div>`;
}

/* ---- COURSE DETAIL ---- */
async function viewCourse(slug){
  const c=await getCourse(slug);const why=WHY[slug]||WHY.default;
  setTimeout(()=>{
    document.getElementById("register-btn")?.addEventListener("click",()=>startRegister(c));
    if(sessionStorage.getItem("register_after_login")===slug){ sessionStorage.removeItem("register_after_login"); startRegister(c); }
  },0);
  return `<section class="course-hero"><div class="wrap reveal">
    <a class="back" href="/courses">← All courses</a>
    <div class="eyebrow" style="margin-top:1rem">${esc(c.mode)} program</div>
    <h1>${esc(c.title)}</h1>${c.subtitle?`<div class="sub">${esc(c.subtitle)}</div>`:""}<p class="lede">${esc(c.summary||"")}</p>
    <div class="spec-row">
      <div class="spec"><div class="k">Schedule</div><div class="v">${esc(c.schedule||"—")}</div></div>
      <div class="spec"><div class="k">Duration</div><div class="v">${esc(c.duration||"—")}</div></div>
      <div class="spec"><div class="k">Mode</div><div class="v">${esc(c.mode||"—")}</div></div>
      <div class="spec"><div class="k">Mentor</div><div class="v">Ram Choudry</div></div>
    </div></div></section>
    <div class="wrap"><div class="detail-grid">
      <div class="detail-main reveal">
        <h2 class="sec">Why this program</h2><ul class="feature-list">${why.map(w=>`<li><svg class="ico mk" aria-hidden="true"><use href="#i-check"/></svg><span>${esc(w)}</span></li>`).join("")}</ul>
        <h2 class="sec">What you'll gain</h2><ul class="feature-list">${BENEFITS.map(b=>`<li><svg class="ico mk" aria-hidden="true"><use href="#i-check"/></svg><span>${esc(b)}</span></li>`).join("")}</ul>
      </div>
      <aside class="detail-aside"><div class="panel enroll-card"><h3>Join this program</h3>
        <div class="enroll-price" style="font-size:2rem;font-weight:800;color:var(--ink);line-height:1;margin:.2rem 0 .1rem">${priceINR(basePrice(c.slug))}<span style="font-size:.9rem;font-weight:500;color:var(--ink-soft)"> + GST</span></div>
        <p class="price-line">Program fee ${priceINR(basePrice(c.slug))} + ${Math.round(GST_RATE*100)}% GST — ${priceINR(totalPrice(c.slug))} payable. Secure your seat online in a couple of minutes.</p>
        <button class="btn btn-primary" id="register-btn">Register Now →</button>
        <hr class="divider">
        <div class="note"><strong>How it works:</strong> <b>Register Now</b> — pay ${priceINR(totalPrice(c.slug))} (${priceINR(basePrice(c.slug))} + GST) to lock your seat instantly. Our team then reaches out on WhatsApp to finalise your batch schedule, and your dashboard unlocks the study materials and (on completion) a lifetime certificate.</div>
      </div></aside></div></div>`;
}
async function doEnroll(course){
  const s=await currentSession();
  if(!s){sessionStorage.setItem("enroll_after_login",course.slug);toast("Please register or log in first — it's free.");setTimeout(()=>navigate("/login"),700);return;}
  const{error}=await requestEnrollment(course);
  if(error&&!String(error.message).includes("duplicate")){toast(error.message,true);return;}
  if(error&&String(error.message).includes("duplicate")){toast("You've already requested this course.");}
  else toast("Request sent! It's now in your dashboard.");
  setTimeout(()=>navigate("/dashboard"),900);
}

/* ---- ABOUT ---- */
function viewAbout(){
  if(typeof window!=="undefined") window.__faTeamFallback=HERO_PHOTOS[0]; // shown until public/about-team.jpg exists
  return `
  <section class="abt-hero wrap reveal">
    <span class="eyebrow">About</span>
    <h1>Fastrack Agile</h1>
    <p class="abt-akoa">(formerly known as <span class="akoa-big">Easy Agile Learning</span>)</p>
    <p class="lede">Some careers change because of an opportunity. Others change because someone believes in your potential before you do. Fastrack Agile was built on that belief.</p>
  </section>
  <div class="wrap">
    <section class="abt-intro reveal">
      <div class="abt-intro-text">
        <span class="eyebrow">Who we are</span>
        <p>Fastrack Agile is a <strong>career transformation startup</strong> — dedicated to helping experienced professionals confidently move into high-paying <strong>Scrum Master</strong> and <strong>Product Owner</strong> roles through practical learning, real-world coaching, and continuous mentorship.</p>
        <p>Knowledge alone doesn't get people hired — <strong>confidence and practical experience do.</strong> Instead of overwhelming learners with theory, we immerse them in real Agile environments where they learn to think, communicate and lead like seasoned professionals.</p>
        <ul class="abt-check">
          <li><svg class="ico mk" aria-hidden="true"><use href="#i-check"/></svg><span>Sprint simulations &amp; hands-on Jira exercises</span></li>
          <li><svg class="ico mk" aria-hidden="true"><use href="#i-check"/></svg><span>Mock interviews with real, personalised feedback</span></li>
          <li><svg class="ico mk" aria-hidden="true"><use href="#i-check"/></svg><span>1:1 coaching, mentorship &amp; real industry scenarios</span></li>
        </ul>
        <blockquote class="abt-statement">Our mission isn't to help someone pass an exam. <span>It's to help someone build a career.</span></blockquote>
      </div>
      <div class="abt-intro-media reveal r-right">
        <img src="/about-team.jpg" onerror="this.onerror=null;this.src=window.__faTeamFallback" alt="The Fastrack Agile learner community in Hyderabad" loading="lazy" decoding="async">
        <span class="abt-media-tag">350+ learners &amp; growing</span>
      </div>
    </section>

    <section class="abt-founder">
      <div class="abt-portrait-col">
        <div class="abt-portrait reveal r-left"><img src="${A.RAM_PORTRAIT}" alt="Balaram (Ram) Choudry, Founder of Fastrack Agile"><span class="sig">Balaram Choudry<small>(Known as Ram)</small></span></div>
        <div class="abt-role">Founder of Fastrack Agile</div>
      </div>
      <div class="abt-story reveal r-right">
        <span class="eyebrow">Meet the Founder</span>
        <h2>Balaram Choudry — “Ram”.</h2>
        <p>Behind Fastrack Agile is <strong>Balaram Choudry</strong>, affectionately known as Ram by hundreds of professionals he has coached over the years. Ram brings more than <strong>17 years of corporate experience</strong>, having worked with globally respected organizations such as <strong>Bank of America, Amazon, and Carelon</strong> — leading teams, delivering complex projects, mentoring professionals, and enabling Agile transformations across diverse business environments.</p>
        <p>Yet if you ask his students what makes him different, very few begin with his corporate résumé. They talk about his patience. His ability to simplify even the most complex Agile concepts. His insistence on practical learning over memorization. And his relentless belief that anyone with the right mindset can transform their career.</p>
        <p>Outside the corporate world, Ram is a passionate public speaker and an accomplished <strong>Toastmaster</strong>, having served in multiple leadership roles within the Toastmasters community. Years of speaking, coaching, mentoring and leadership have shaped a unique teaching style — one that builds not only knowledge, but communication, confidence, executive presence, and interview excellence.</p>
        <blockquote class="abt-quote">“Don't prepare for an interview. Prepare for the role. Interviews will take care of themselves.”</blockquote>
        <div class="abt-stats">
          <div class="abt-stat"><b>17+</b><span>Years of corporate experience</span></div>
          <div class="abt-stat"><b>350+</b><span>Learners in the community</span></div>
          <div class="abt-stat"><b>200+</b><span>Placements Supported</span></div>
        </div>
        <div class="abt-cta"><button class="btn btn-primary" type="button" data-book-call>📞 Book a 1:1 call →</button><a class="btn btn-ghost" href="/courses">See the programs</a><a class="btn btn-ghost" href="https://www.linkedin.com/in/balram-choudry/" target="_blank" rel="noopener">Connect on LinkedIn</a></div>
      </div>
    </section>

    <section class="abt-origin reveal">
      <div class="abt-origin-text">
        <span class="eyebrow">Our origin</span>
        <h2>It all began with one conversation.</h2>
        <p>Our story didn't begin with a business plan, an office, or a marketing campaign. It began with a single <strong>LinkedIn message</strong> — and a professional who wanted a new chapter.</p>
        <p>A professional named <strong>Chitra</strong>, working in Australia, dreamed of returning to India — not to her old career, but as a Scrum Master. She'd taken trainings, watched videos and read blogs. What she lacked wasn't information; it was <em>clarity and confidence</em>. She needed someone who had actually lived the role.</p>
        <p>After connecting with Ram, they began working together — no lengthy programs, no complicated curriculum. Just practical Scrum, real interview scenarios, Agile thinking, stakeholder management, and the confidence required to perform. Within just <strong>2–3 sessions</strong>, Chitra stopped answering interview questions like a student and started answering them like a Scrum Master — securing multiple offers even before boarding her flight back to India.</p>
        <p>Grateful, she referred four friends, each transitioning into Scrum Master roles within weeks. They referred others, then another batch, and another. No ads, no sales teams — the community grew because people trusted results.</p>
        <p>Within a few months, more than <strong>50 professionals</strong> had joined the journey. Today, Fastrack Agile is a community of <strong>350+ learners</strong> — from IT, banking, operations, BPO, quality assurance, customer support and beyond, united by one goal. Many arrive uncertain and leave with confidence, and many return not as students, but as mentors for the next generation.</p>
      </div>
      <div class="abt-origin-media reveal r-right">
        <img src="${HERO_PHOTOS[3]}" alt="A Fastrack Agile coaching session in Hyderabad" loading="lazy" decoding="async">
      </div>
    </section>

    <section class="abt-mission reveal r-scale">
      <span class="eyebrow on-amber">Your story could be next</span>
      <h2>You're not joining a course. You're joining a community.</h2>
      <p>Every day we meet professionals who feel stuck — some believe they're too late to switch careers, some think they don't have the “perfect” technical background, others simply don't know where to begin. We've seen those stories before. More importantly, we've seen how they end: with the right guidance, practical coaching, and consistent support, careers change, confidence grows, and opportunities appear.</p>
      <p>Whether you're preparing for your first Scrum Master interview, aiming to move into a Product Owner role, or looking to accelerate your Agile career, we'll walk that journey with you — every sprint, every interview, and every milestone. <strong>The next success story we celebrate could be yours.</strong></p>
      <div class="abt-cta" style="justify-content:center;margin-top:1.4rem"><a class="btn btn-primary" href="/courses">Explore the programs →</a><button class="btn btn-ghost btn-on-dark" type="button" data-book-call>Book a 1:1 call</button></div>
    </section>

    <section style="padding:44px 0 84px">
      <div class="sec-head center reveal"><span class="eyebrow">The community</span><h2 style="font-size:1.9rem">350+ learners, and counting.</h2><p>Meetups, Networking &amp; Success Celebrations at Fastrack Agile Training Center, Gachibowli, Hyderabad.</p></div>
      <div class="ggrid reveal mt-8" data-stagger>
        ${HERO_PHOTOS.slice(0,9).map((src,i)=>`<div class="gtile ${i===0?'feat':'wide'}" data-d="${i}"><img loading="lazy" decoding="async" src="${src}" alt="Fastrack Agile community meetup, Hyderabad" width="1000" height="563"></div>`).join("")}
      </div>
    </section>
  </div>`;
}

/* ---- SUCCESS STORIES (screenshot gallery) ----
   Images live in public/stories/. Discovery happens in bindStories():
   it reads manifest.json (any filenames — run normalize-stories.ps1 to make it)
   or, with no manifest, probes story-1..48 (.jpg/.png). Only images that
   actually load are rendered, so there are never broken-image tiles. When the
   folder is empty a clean "coming soon" placeholder shows instead. */
function viewStories(){
  setTimeout(bindStories,0);
  return `
  <section class="abt-hero wrap reveal">
    <span class="eyebrow">Success stories</span>
    <h1>Real students. Real placements.</h1>
    <p class="lede">Unfiltered messages from our learners in the Fastrack Agile community — the moment they landed their Scrum Master roles. Your story could be next.</p>
    <div style="margin-top:1.5rem"><a class="btn btn-primary" href="/courses">Start your journey →</a></div>
  </section>
  <div class="wrap" style="padding:34px 0 88px">
    <div class="st-grid" id="st-grid"></div>
    <div class="st-empty" id="st-empty"><div class="st-empty-ic">🖼️</div><p><strong>Success stories are on their way.</strong></p><p class="note" style="margin-top:.4rem">We're adding our learners' placement messages here shortly. Meanwhile, see written testimonials on the <a class="accent" href="/">home page</a>.</p></div>
  </div>
  <div class="st-lightbox" id="st-lightbox" aria-hidden="true"><button class="st-close" aria-label="Close">&times;</button><img alt="Success story"></div>`;
}
function stImgExists(url){return new Promise(res=>{const im=new Image();im.onload=()=>res(true);im.onerror=()=>res(false);im.src=url;});}
async function bindStories(){
  const grid=document.getElementById("st-grid"),empty=document.getElementById("st-empty");
  if(!grid) return;
  let urls=[];
  // 1) manifest.json (preferred — any filenames, correct order)
  try{const r=await fetch("/stories/manifest.json",{cache:"no-store"});if(r.ok){const j=await r.json();if(Array.isArray(j))urls=j.map(fn=>"/stories/"+encodeURIComponent(fn));}}catch(e){}
  // 2) no manifest: probe story-1..48 (.jpg then .png), keep only ones that load
  if(!urls.length){
    const probe=n=>new Promise(res=>{const jpg="/stories/story-"+n+".jpg";stImgExists(jpg).then(ok=>{if(ok)return res(jpg);const png="/stories/story-"+n+".png";stImgExists(png).then(ok2=>res(ok2?png:null));});});
    const found=await Promise.all(Array.from({length:48},(_,k)=>probe(k+1)));
    urls=found.filter(Boolean);
  }
  if(document.getElementById("st-grid")!==grid) return; // navigated away during async probe
  if(!urls.length){if(empty)empty.style.display="block";return;}
  if(empty)empty.style.display="none";
  grid.innerHTML=urls.map((u,k)=>`<figure class="st-tile"><img loading="lazy" decoding="async" alt="Fastrack Agile learner success story ${k+1}" src="${u}"></figure>`).join("");
  // lightbox
  const lb=document.getElementById("st-lightbox");if(!lb) return;
  const img=lb.querySelector("img");
  grid.addEventListener("click",e=>{const t=e.target.closest(".st-tile img");if(!t) return;img.src=t.src;lb.classList.add("open");lb.setAttribute("aria-hidden","false");});
  lb.addEventListener("click",()=>{lb.classList.remove("open");lb.setAttribute("aria-hidden","true");img.src="";});
  if(!window._stKey){window._stKey=true;document.addEventListener("keydown",e=>{if(e.key==="Escape"){const l=document.getElementById("st-lightbox");if(l&&l.classList.contains("open")){l.classList.remove("open");l.setAttribute("aria-hidden","true");const im=l.querySelector("img");if(im)im.src="";}}});}
}

/* ---- CONTACT ---- */
function viewContact(){
  setTimeout(()=>document.getElementById("c-send")?.addEventListener("click",sendContact),0);
  const rows=[["📞","Phone",'<a href="tel:9966080123">+91 99660 80123</a>'],['<svg class="ico" style="width:24px;height:24px;color:#25D366" aria-hidden="true"><use href="#i-wa"/></svg>',"WhatsApp",'<a href="https://wa.me/919966080123" target="_blank" rel="noopener">Chat with us now</a>'],["✉","Email",'<a href="mailto:info@fastrackagile.com">info@fastrackagile.com</a>'],["📍","Address","IndiQube Pearl – Gachibowli, Hyderabad, Telangana 500032"],["🕐","Office hours","Monday – Saturday · 8:00 AM – 6:00 PM"]];
  return `<section class="page-head wrap reveal"><span class="eyebrow">Contact</span><h1>Let's map out your transition.</h1>
    <p>Questions about a program, schedule, or whether Scrum is right for you? Reach out — Ram's team replies personally.</p></section>
    <div class="wrap"><div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;padding:20px 0 90px" class="contact-grid">
      <div style="display:flex;flex-direction:column;gap:1.2rem">${rows.map(([i,t,v])=>`<div style="display:flex;gap:.9rem;align-items:flex-start"><div style="width:44px;height:44px;border-radius:11px;background:var(--paper-2);display:grid;place-items:center;font-size:1.2rem;flex:none">${i}</div><div><strong style="display:block">${t}</strong><span class="muted">${v}</span></div></div>`).join("")}<div class="contact-book"><div><strong style="display:block">Prefer a quick call?</strong><span class="muted">Book a 1:1 career coaching discussion with Ram — ₹99 booking fee.</span></div><button class="btn btn-primary" type="button" data-book-call>📞 Book Your Call →</button></div></div>
      <div class="panel"><h2 style="font-size:1.5rem;margin-bottom:1rem">Send a message</h2>
        <div class="field"><label for="c-name">Full name</label><input id="c-name" autocomplete="name" placeholder="Your name"></div>
        <div class="field"><label for="c-email">Email</label><input id="c-email" type="email" autocomplete="email" placeholder="you@email.com"></div>
        <div class="field"><label for="c-phone">Phone</label><input id="c-phone" type="tel" autocomplete="tel" placeholder="+91 …"></div>
        <div class="field"><label for="c-msg">Message</label><textarea id="c-msg" rows="4" placeholder="How can we help?"></textarea></div>
        <button class="btn btn-primary full-btn" id="c-send">Send message →</button>
      </div></div></div>`;
}
async function sendContact(){
  const v=id=>document.getElementById(id).value.trim();
  if(!v("c-name")||!v("c-email")){toast("Please add your name and email.",true);return;}
  await submitLead({name:v("c-name"),email:v("c-email"),phone:v("c-phone"),message:v("c-msg"),source:"contact"});
  toast("Thanks — we'll be in touch soon. (Visible to admin under Leads.)");
  ["c-name","c-email","c-phone","c-msg"].forEach(id=>document.getElementById(id).value="");
}

/* ---- BLOG ---- */
function mdInline(s){return s.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>");}
function renderPostBody(body){
  // Normalise CRLF/CR (Windows line endings from the DB seed or pasted text) to LF
  // so paragraph/heading/list detection below works.
  return String(body||"").replace(/\r\n?/g,"\n").split(/\n{2,}/).map(block=>{
    block=block.trim();if(!block)return"";
    if(/^###\s+/.test(block))return `<h3>${mdInline(esc(block.replace(/^###\s+/,"")))}</h3>`;
    if(/^##\s+/.test(block))return `<h2>${mdInline(esc(block.replace(/^##\s+/,"")))}</h2>`;
    const lines=block.split(/\n/).map(l=>l.trim()).filter(Boolean);
    if(lines.length&&lines.every(l=>/^(-|\*)\s+/.test(l)))return `<ul>${lines.map(l=>`<li>${mdInline(esc(l.replace(/^(-|\*)\s+/,"")))}</li>`).join("")}</ul>`;
    return `<p>${mdInline(esc(block)).replace(/\n/g,"<br>")}</p>`;
  }).join("");
}
function blogCard(p){
  return `<a class="blog-card" href="/post/${esc(p.slug)}">
    ${p.cover?`<div class="blog-cover" style="background-image:url('${esc(p.cover)}')"></div>`:`<div class="blog-cover blog-cover-ph"><span>Fastrack Agile</span></div>`}
    <div class="blog-card-body"><div class="blog-date">${p.author?`Author : ${esc(p.author)} · `:""}${fmtDate(p.publish_at||p.created_at)}</div><h3>${esc(p.title)}</h3><p>${esc(p.excerpt||"")}</p><span class="blog-more">Read more →</span></div></a>`;
}
async function viewBlog(){
  const posts=await listPosts(false);
  return `<section class="page-head wrap reveal"><span class="eyebrow">Blog</span><h1>Scrum Master career resources.</h1>
    <p>Practical guides on switching from non-IT, acing interviews, choosing certifications, and learning Agile from scratch.</p></section>
    <div class="wrap" style="padding-bottom:84px">${posts.length?`<div class="blog-grid reveal" data-stagger>${posts.map(blogCard).join("")}</div>`:`<div class="panel empty">No articles published yet — check back soon.</div>`}</div>`;
}
async function viewPost(slug){
  const p=await getPost(slug);
  if(!postIsLive(p)){
    return `<section class="page-head wrap reveal"><span class="eyebrow">Blog</span><h1>Article not found</h1>
      <p>This post may have been moved, or it isn't published yet.</p><div class="mt-4"><a class="btn btn-primary" href="/blog">← Back to the blog</a></div></section>`;
  }
  return `<article class="post">
    <div class="wrap post-head reveal"><a class="back" href="/blog">← All articles</a>
      <div class="blog-date" style="margin-top:1.1rem">${p.author?`Author : ${esc(p.author)} · `:""}${fmtDate(p.publish_at||p.created_at)}</div>
      <h1>${esc(p.title)}</h1></div>
    ${p.cover?`<div class="wrap"><div class="post-cover" style="background-image:url('${esc(p.cover)}')"></div></div>`:""}
    <div class="wrap post-body reveal">${renderPostBody(p.body)}
      <div class="post-cta"><a class="btn btn-primary" href="/courses">Explore our programs →</a></div>
    </div>
  </article>`;
}

/* ---- TRAINING CALENDAR ---- */
function viewCalendar(){
  const batches=[
    {course:"Practical Scrum Launchpad (Weekday)",slug:"practical-scrum-launchpad-weekday",start:"6 Jul 2026",time:"Mon–Fri · 6:45–8:15 AM IST",mode:"Online"},
    {course:"Practical Scrum Launchpad (Weekend)",slug:"practical-scrum-launchpad-weekend",start:"12 Jul 2026",time:"Sat & Sun · 8:30 AM IST",mode:"Online"},
    {course:"Practical Scrum Interview Mastery",slug:"practical-scrum-interview-mastery",start:"14 Jul 2026",time:"Mon–Fri · 10 AM–12:30 PM IST",mode:"Online"},
    {course:"Scrum Certification Program (ScrumStudy)",slug:"scrum-certification-program",start:"26–27 Jul 2026",time:"10 AM–6 PM IST",mode:"In Person/Offline"},
    {course:"Scrum Growth Mentorship (On Job Support)",slug:"scrum-growth-mentorship",start:"Rolling",time:"Flexible",mode:"Online"}
  ];
  const row=b=>`<tr><td><strong>${esc(b.course)}</strong></td><td style="white-space:nowrap">${esc(b.start)}</td><td style="white-space:nowrap">${esc(b.time)}</td><td style="white-space:nowrap;text-align:center">${esc(b.mode)}</td><td style="text-align:center"><a class="btn btn-primary btn-sm" style="white-space:nowrap;display:inline-block" href="/course/${b.slug}">Reserve seat</a></td></tr>`;
  return `<section class="page-head wrap reveal"><span class="eyebrow">Training Calendar</span><h1>Upcoming batches.</h1>
    <p>Live online and in-person cohorts in Hyderabad. Reserve a seat over WhatsApp — pricing is shared personally.</p></section>
    <div class="wrap" style="padding-bottom:80px"><div class="panel" style="overflow-x:auto"><table class="table"><thead><tr><th>Program</th><th>Starts</th><th>Schedule</th><th style="text-align:center">Mode</th><th></th></tr></thead><tbody>${batches.map(row).join("")}</tbody></table></div>
    <p class="note mt-4">Dates indicative — confirm the live schedule on WhatsApp or the <a href="/contact" class="accent">contact page</a>.</p></div>`;
}

/* ---- RESOURCES hub (Blog · Podcast · FAQ) ---- */
async function viewResources(){
  const posts=await listPosts(false);
  return `<section class="page-head wrap reveal"><span class="eyebrow">Blog</span><h1>Resources</h1>
    <p>In-depth articles and guides on switching from non-IT, acing interviews, choosing certifications, and learning Agile from scratch.</p></section>
    <div class="wrap" style="padding-bottom:84px">${posts.length?`<div class="blog-grid reveal" data-stagger>${posts.map(blogCard).join("")}</div>`:`<div class="panel empty">No articles published yet — check back soon.</div>`}</div>`;
}

/* ---- LOGIN (with quick demo logins) ---- */
/* ---- ADMIN LOGIN (email + password) ---- */
function viewAdminLogin(){
  setTimeout(bindAdminLogin,0);
  return `<div class="auth-wrap admin-auth"><div class="panel admin-login-card">
    <div class="al-badge">🔒 Admin</div>
    <h2>Admin sign in</h2>
    <p class="note" style="margin-bottom:1.2rem">Sign in with your admin email and password to open the console.</p>
    <div class="field"><label for="al-email">Email</label><input id="al-email" type="email" autocomplete="username" value="${esc(ADMIN_EMAIL)}" placeholder="admin@fastrackagile.com"></div>
    <div class="field"><label for="al-pass">Password</label><input id="al-pass" type="password" autocomplete="current-password" placeholder="••••••••"></div>
    <button class="btn btn-primary full-btn" id="al-go">Sign in →</button>
    <p class="note center-txt mt-4"><a class="lk" href="/login">← Learner login (email code)</a></p>
  </div></div>`;
}
function bindAdminLogin(){
  const go=async()=>{
    const email=document.getElementById("al-email").value;
    const pass=document.getElementById("al-pass").value;
    if(!email||!pass){toast("Enter your email and password.",true);return;}
    const btn=document.getElementById("al-go");btn.disabled=true;btn.textContent="Signing in…";
    const{error}=await adminPasswordLogin(email,pass);
    btn.disabled=false;btn.textContent="Sign in →";
    if(error){toast(error.message||"Sign in failed.",true);return;}
    await renderHeader();toast("Welcome back, Ram.");navigate("/admin");
  };
  document.getElementById("al-go")?.addEventListener("click",go);
  document.getElementById("al-pass")?.addEventListener("keydown",e=>{if(e.key==="Enter")go();});
}

let loginMode="register",loginEmail="";
function viewLogin(){
  setTimeout(bindLogin,0);
  const demoBox = "";
  return `<div class="auth-wrap" style="display:grid;grid-template-columns:1fr 1fr;min-height:calc(100vh - 84px)">
    <aside class="auth-aside" style="background:linear-gradient(165deg,#0c1c33,#16294a);color:#fff;padding:60px 48px;display:flex;flex-direction:column;justify-content:center">
      <span class="eyebrow on-amber">Your free learner account</span>
      <h2 style="font-size:2.2rem;margin:.8rem 0 1rem">One account. Everything in one place.</h2>
      <p style="color:#c4d0e4;max-width:30em">Registering is free and takes seconds — no password to remember. Just verify your email with a one-time code.</p>
      <ul style="list-style:none;margin-top:1.6rem;display:flex;flex-direction:column;gap:.8rem">${["Request enrollment in any program","Track your course status and schedule","Unlock study materials once enrolled","Keep your Scrum certificate for life"].map(t=>`<li style="display:flex;gap:.6rem;color:#dde5f1"><span style="color:var(--amber);font-weight:700">✓</span> ${t}</li>`).join("")}</ul>
    </aside>
    <main style="display:grid;place-items:center;padding:48px 28px"><div class="panel" style="max-width:440px;width:100%">
      ${demoBox}
      <div id="step-enter">
        <h2 style="font-size:1.7rem;margin-bottom:.3rem">Register or log in</h2>
        <p class="note" style="margin-bottom:1.4rem">Free account · email verification · no password.</p>
        <div class="field" id="name-field"><label for="l-name">Full name</label><input id="l-name" autocomplete="name" placeholder="Your name"></div>
        <div class="field" id="phone-field"><label for="l-phone">Phone (for WhatsApp follow-up)</label><input id="l-phone" type="tel" autocomplete="tel" placeholder="+91 …"></div>
        <div class="field"><label for="l-email">Email</label><input id="l-email" type="email" autocomplete="email" placeholder="you@email.com"></div>
        <button class="btn btn-primary full-btn" id="send-otp">Send my code →</button>
        <p class="note center-txt mt-4" id="toggle-wrap">Already registered? <a id="toggle-login" class="lk">Just log in</a></p>
      </div>
      <div id="step-otp" style="display:none">
        <h2 style="font-size:1.7rem;margin-bottom:.3rem">Enter your code</h2>
        <p class="note" style="margin-bottom:1.4rem">We sent a 6-digit code to <strong id="email-echo"></strong>.</p>
        <div class="field"><label>6-digit code</label><input id="l-otp" inputmode="numeric" maxlength="6" placeholder="••••••" class="otp-input" aria-label="6-digit verification code" inputmode="numeric" autocomplete="one-time-code"></div>
        <button class="btn btn-primary full-btn" id="verify-otp">Verify &amp; continue →</button>
        <p class="note center-txt mt-4"><a id="otp-back" class="lk">← Use a different email</a></p>
      </div>
    </div></main></div>`;
}
function afterLogin(){
  const reg=sessionStorage.getItem("register_after_login");
  if(reg){navigate("/course/"+reg);return;} // viewCourse re-opens the payment popup
  const pending=sessionStorage.getItem("enroll_after_login");
  if(pending){sessionStorage.removeItem("enroll_after_login");navigate("/course/"+pending);}
  else navigate("/dashboard");
}
async function quickDemo(role){
  const email=role==="admin"?ADMIN_EMAIL:"priya@example.com";
  await sendOtp(email,role==="admin"?"Ram Choudry":"Priya Sharma","");
  await verifyOtp(email,"123456");
  await renderHeader();toast(role==="admin"?"Logged in as Ram (admin).":"Logged in as Priya (learner).");
  navigate(role==="admin"?"/admin":"/dashboard");
}
function bindLogin(){
  document.querySelectorAll("[data-demo]").forEach(b=>b.addEventListener("click",()=>quickDemo(b.dataset.demo)));
  const tgl=document.getElementById("toggle-login");
  tgl&&(tgl.onclick=()=>{loginMode=loginMode==="register"?"login":"register";const reg=loginMode==="register";
    document.getElementById("name-field").style.display=reg?"block":"none";
    document.getElementById("phone-field").style.display=reg?"block":"none";
    document.getElementById("toggle-wrap").innerHTML=reg?'Already registered? <a id="toggle-login" class="lk">Just log in</a>':'New here? <a id="toggle-login" class="lk">Create a free account</a>';
    bindLogin();});
  document.getElementById("send-otp")?.addEventListener("click",async()=>{
    loginEmail=document.getElementById("l-email").value.trim();
    const name=document.getElementById("l-name").value.trim(),phone=document.getElementById("l-phone").value.trim();
    if(!loginEmail){toast("Please enter your email.",true);return;}
    if(loginMode==="register"&&!name){toast("Please enter your name.",true);return;}
    const btn=document.getElementById("send-otp");btn.disabled=true;btn.textContent="Sending…";
    const{error}=await sendOtp(loginEmail,name,phone);btn.disabled=false;btn.textContent="Send my code →";
    if(error){toast(error.message,true);return;}
    document.getElementById("email-echo").textContent=loginEmail;
    document.getElementById("step-enter").style.display="none";document.getElementById("step-otp").style.display="block";
  });
  document.getElementById("verify-otp")?.addEventListener("click",async()=>{
    const token=document.getElementById("l-otp").value.trim();if(token.length<6){toast("Enter the 6-digit code.",true);return;}
    const btn=document.getElementById("verify-otp");btn.disabled=true;btn.textContent="Verifying…";
    const{error}=await verifyOtp(loginEmail,token);btn.disabled=false;btn.textContent="Verify & continue →";
    if(error){toast(error.message,true);return;}
    await renderHeader();toast("You're in!");afterLogin();
  });
  document.getElementById("otp-back")?.addEventListener("click",()=>{document.getElementById("step-otp").style.display="none";document.getElementById("step-enter").style.display="block";});
}

/* ---- DASHBOARD (app shell) ---- */
async function viewDashboard(){
  const prof=await currentProfile();
  if(!prof){navigate("/login");return "";}
  const enrolls=await myEnrollments();const certs=await myCertificates();
  const active=enrolls.filter(e=>e.status==="active").length;
  let courseHtml="";
  if(!enrolls.length){courseHtml=`<div class="panel empty">You haven't requested any programs yet.<div class="mt-4"><a class="btn btn-primary" href="/courses">Browse courses →</a></div></div>`;}
  else{courseHtml=`<div style="display:grid;gap:16px">`;
    for(const e of enrolls){const c=e.courses||{};let mats="";
      if(e.status==="active"){const ms=await materialsFor(e.course_id);
        if(ms.length){mats=`<div style="margin-top:1rem;border-top:1px solid var(--line);padding-top:1rem"><strong style="font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-soft)">Study materials &amp; schedule</strong>`;
          for(const m of ms){const ic=m.type==="schedule"?"🗓":m.type==="video"?"▶":"📄";mats+=`<a href="${m.url||'#'}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:.6rem;padding:.55rem 0"><span style="width:30px;height:30px;border-radius:8px;background:var(--paper-2);display:grid;place-items:center">${ic}</span> ${esc(m.title)}</a>`;}
          mats+=`</div>`;}
        else mats=`<div class="locked-note">Materials will appear here as Ram adds them for this batch.</div>`;}
      else mats=`<div class="locked-note">🔒 Materials unlock once Ram confirms your enrollment. <a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener" class="accent">Message him now</a>.</div>`;
      courseHtml+=`<div class="panel"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap"><div><h3 style="font-size:1.2rem">${esc(c.title||"Course")}</h3><div class="cc-sub">${esc(c.subtitle||"")}</div></div>${statusPill(e.status)}</div><div class="cc-meta" style="margin-top:.6rem;color:var(--ink-soft);font-size:.88rem"><span>🗓 ${esc(c.schedule||"")}</span> <span>⏰ ${esc(c.duration||"")}</span> <span>📍 ${esc(c.mode||"")}</span></div>${mats}</div>`;}
    courseHtml+=`</div>`;}
  let certHtml="";
  if(certs.length){certHtml=`<div style="display:grid;gap:16px">`;
    for(const ct of certs){certHtml+=`<div class="panel" style="background:linear-gradient(160deg,#fff,#fdf6ea);border:1px solid var(--amber);display:flex;align-items:center;gap:1.2rem"><div style="width:52px;height:52px;border-radius:12px;background:var(--amber);color:var(--ink);display:grid;place-items:center;font-size:1.5rem;flex:none">🏅</div><div style="flex:1"><strong>${esc(ct.title)}</strong><div class="note">${ct.courses?.title?esc(ct.courses.title)+" · ":""}Issued ${fmtDate(ct.issued_on)} · Yours for life</div></div><a class="btn btn-primary btn-sm" href="${ct.file_path||'#'}" target="_blank" rel="noopener">View / Download</a></div>`;}
    certHtml+=`</div>`;}
  else certHtml=`<div class="panel empty">Your certificate will appear here once Ram issues it — and it stays free, for life.</div>`;

  const firstName=esc((prof.full_name||"there").trim().split(/\s+/)[0]);
  const body=`
    <div class="dash-greet"><h2 class="shell-h" style="margin:0 0 .2rem">Welcome back, ${firstName} 👋</h2><p class="note">Here's everything happening with your learning journey.</p></div>
    <div class="stat-row">
      ${[[enrolls.length,"Programs requested"],[active,"Active now"],[certs.length,"Certificates"]].map(([n,l])=>`<div class="statcard"><div class="n">${n}</div><div class="l">${l}</div></div>`).join("")}
      <a class="statcard cta" href="/courses"><div class="n">+</div><div class="l">Browse more courses</div></a>
    </div>
    <a class="assess-cta" href="/assessment"><div class="assess-cta-ic">📝</div><div class="assess-cta-copy"><strong>Open Assessment</strong><span>Test your Scrum knowledge — 20 random questions with instant scoring &amp; explanations.</span></div><span class="assess-cta-go">Start →</span></a>
    <h2 class="shell-h">My programs</h2>${courseHtml}
    <h2 class="shell-h" style="margin-top:2rem">My certificate</h2>${certHtml}`;
  setTimeout(bindShell,0);
  return appShell("dashboard",prof,body,false);
}

/* ---- ADMIN (app shell, multiple sub-views) ---- */
async function viewAdmin(sub){
  const prof=await currentProfile();
  if(!prof){navigate("/admin-login");return "";}
  if(prof.role!=="admin"){return `<section class="page-head wrap reveal"><h1>Admin access only</h1><p>This account isn't an admin. Sign in with the admin account to manage the platform.</p><div class="mt-4"><a class="btn btn-primary" href="/admin-login">Admin sign in</a></div></section>`;}
  const enrolls=await adminEnrollments();const leads=await adminLeads();const learners=await adminListLearners();
  const req=enrolls.filter(e=>e.status==="requested").length,act=enrolls.filter(e=>e.status==="active").length,paid=enrolls.filter(e=>e.payment_status==="paid").length;
  let body="";
  if(!sub||sub==="admin"){
    body=`<div class="stat-row">
      ${[[enrolls.length,"Total requests"],[req,"Awaiting activation"],[act,"Active learners"],[leads.length,"New leads"]].map(([n,l])=>`<div class="statcard"><div class="n">${n}</div><div class="l">${l}</div></div>`).join("")}</div>
      <h2 class="shell-h">Recent enrollment requests</h2>${enrollTable(enrolls.slice(0,6))}
      <div style="margin-top:1.4rem"><a class="btn btn-ghost btn-sm" href="/admin-enroll">View all enrollments →</a> <a class="btn btn-ghost btn-sm" href="/admin-leads">View leads →</a></div>`;
  } else if(sub==="admin-enroll"){
    body=`<h2 class="shell-h">All enrollments</h2><p class="note" style="margin-bottom:1rem">Change a status to <b>active</b> to unlock that learner's materials. Mark payment when received over WhatsApp.</p>${enrollTable(enrolls)}`;
  } else if(sub==="admin-payments"){
    const pays=await adminPayments();
    const total=pays.reduce((s,p)=>s+(p.amount||0),0);
    const inr=n=>"₹"+((n||0)/100).toLocaleString("en-IN");
    const kindLabel=k=>k==="call"?"Book a Call":(k==="register"?"Registration":(k||"—"));
    body=`<h2 class="shell-h">Payments</h2>
      <p class="note" style="margin-bottom:1rem">Every verified Razorpay payment. Amounts are confirmed on our server — only genuinely paid transactions appear here.</p>
      <div class="stat-row">
        <div class="statcard"><div class="n">${inr(total)}</div><div class="l">Total collected</div></div>
        <div class="statcard"><div class="n">${pays.length}</div><div class="l">Payments</div></div>
        <div class="statcard"><div class="n">${pays.filter(p=>p.kind==="call").length}</div><div class="l">Call bookings</div></div>
        <div class="statcard"><div class="n">${pays.filter(p=>p.kind==="register").length}</div><div class="l">Registrations</div></div>
      </div>
      <div class="panel" style="overflow-x:auto;margin-top:1.2rem"><table class="table"><thead><tr><th>When</th><th>For</th><th>Amount</th><th>Method</th><th>Contact</th><th>Payment ID</th></tr></thead><tbody>
      ${pays.length?pays.map(p=>`<tr><td>${fmtDate(p.created_at)}</td><td><span class="lead-src">${esc(kindLabel(p.kind))}</span>${p.slug?`<br><span class="note">${esc(p.slug)}</span>`:""}</td><td><strong>${inr(p.amount)}</strong></td><td>${esc(p.method||"—")}</td><td>${esc(p.email||"")}${p.contact?`<br><span class="note">${esc(p.contact)}</span>`:""}</td><td><span class="note">${esc(p.payment_id||"")}</span></td></tr>`).join(""):`<tr><td colspan="6" class="empty">No payments yet — verified payments appear here automatically.</td></tr>`}
      </tbody></table></div>`;
  } else if(sub==="admin-assess"){
    const reqs=await listAssessmentRequests();
    const nm=r=>r.full_name||(r.profiles&&r.profiles.full_name)||"—",em=r=>r.email||(r.profiles&&r.profiles.email)||"";
    const pend=reqs.filter(r=>r.status==="pending").length;
    body=`<h2 class="shell-h">Open Assessment access</h2><p class="note" style="margin-bottom:1rem">Approve students who have completed training so they can take the ${ASSESS_MINUTES}-minute timed Open Assessment. Approving unlocks it in their portal; denying keeps it locked.${pend?` <b>${pend} awaiting review.</b>`:""}</p>
      <div class="panel" style="overflow-x:auto"><table class="table"><thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Requested</th><th>Status</th><th>Action</th></tr></thead><tbody>
      ${reqs.length?reqs.map(r=>{
        const badge=r.status==="approved"?`<span class="pill pill-active">Approved</span>`:(r.status==="denied"?`<span class="pill pill-req">Denied</span>`:`<span class="pill">Pending</span>`);
        return `<tr><td><strong>${esc(nm(r))}</strong></td><td>${esc(em(r))}</td><td>${esc(r.mobile||"—")}</td><td>${fmtDate(r.requested_at)}</td><td>${badge}</td><td><div class="qa-admin-btns"><button class="btn btn-primary btn-sm" data-aa="${r.id}" data-act="approved"${r.status==="approved"?" disabled":""}>Approve</button><button class="btn btn-ghost btn-sm" data-aa="${r.id}" data-act="denied"${r.status==="denied"?" disabled":""}>Deny</button></div></td></tr>`;
      }).join(""):`<tr><td colspan="6" class="empty">No access requests yet.</td></tr>`}
      </tbody></table></div>`;
    setTimeout(bindAssessAdmin,0);
  } else if(sub==="admin-content"){
    const cs=mergedCourses();
    const stories=storiesData();
    const PAGE_FIELDS=[
      ["home_hero_title","Home · hero headline","Break into IT as a <em>Scrum Master</em> — no coding required."],
      ["home_hero_lede","Home · hero subtext","Practical, live Agile and Scrum training with Jira simulations, interview prep, and personal mentorship from Ram — built for people switching from non-tech careers."],
      ["about_title","About · headline","Meet Your Scrum Coach, Mr. Ram."],
      ["about_lede","About · subtext","Founder of Fastrack Agile — and the reason hundreds of non-IT professionals now work as Scrum Masters."],
      ["about_story_title","About · story heading","It started with one success."],
      ["about_story_p1","About · story paragraph 1","Fastrack Agile began with <strong>Chitra</strong> — a professional in Australia who wanted to return to India as a Scrum Master. She found Ram on LinkedIn. In just 2–3 focused sessions, he helped her master Scrum, interview strategy, and real-world Agile — and she cracked multiple offers before even flying home."],
      ["about_story_p2","About · story paragraph 2","Four of her friends came next — all placed within a month. Word spread. Within three months, 50+ professionals had joined, most placed. Today Fastrack Agile is a community of <strong>350+ learners</strong>."],
      ["about_mission_title","About · mission heading","Turning non-IT careers into Scrum Master roles."],
      ["about_mission_body","About · mission text","To empower aspiring and working professionals to transition into high-demand Scrum roles through practical, hands-on training, expert mentorship, and lifelong community support — even without prior IT experience."]
    ];
    const courseCards=cs.map(c=>`<div class="ct-course" data-slug="${esc(c.slug)}">
      <div class="ct-course-h">${esc(c.title)}</div>
      <div class="ct-grid">
        <label>Title<input data-f="title" value="${esc(c.title)}"></label>
        <label>Subtitle<input data-f="subtitle" value="${esc(c.subtitle||"")}"></label>
        <label>Mode<input data-f="mode" value="${esc(c.mode||"")}"></label>
        <label>Duration<input data-f="duration" value="${esc(c.duration||"")}"></label>
        <label>Schedule<input data-f="schedule" value="${esc(c.schedule||"")}"></label>
      </div>
      <label class="ct-full">Summary<textarea data-f="summary" rows="2">${esc(c.summary||"")}</textarea></label>
      <button class="btn btn-primary btn-sm ct-save-course" data-slug="${esc(c.slug)}">Save this course</button>
    </div>`).join("");
    const storyRows=stories.map((s,i)=>storyEditorRow(s,i)).join("");
    const textFields=PAGE_FIELDS.map(([k,label,def])=>`<label class="ct-full">${esc(label)}<textarea data-tk="${k}" rows="${def.length>120?3:2}">${esc(txt(k,def))}</textarea></label>`).join("");
    body=`<h2 class="shell-h">Content</h2>
      <p class="note" style="margin-bottom:1.2rem">Edit your courses, success stories and key page text. Changes are saved instantly and shown across the live site.</p>
      <div class="ct-tabs" id="ct-tabs"><button class="ct-tab on" data-t="courses">Courses</button><button class="ct-tab" data-t="stories">Success Stories</button><button class="ct-tab" data-t="text">Page Text</button></div>

      <section class="ct-panel" data-panel="courses">
        <div class="ct-panel-head"><h3>Courses</h3><button class="btn btn-ghost btn-sm" id="ct-reset-courses">Reset all to defaults</button></div>
        ${courseCards}
      </section>

      <section class="ct-panel" data-panel="stories" hidden>
        <div class="ct-panel-head"><h3>Success stories (written cards)</h3><button class="btn btn-ghost btn-sm" id="ct-reset-stories">Reset to defaults</button></div>
        <p class="note" style="margin-bottom:.8rem">These are the quote cards on the home page. (The screenshot gallery is managed from the <b>/stories</b> image folder.)</p>
        <div id="ct-stories">${storyRows}</div>
        <div style="margin-top:1rem;display:flex;gap:.6rem;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" id="ct-add-story">+ Add story</button><button class="btn btn-primary" id="ct-save-stories">Save success stories</button></div>
      </section>

      <section class="ct-panel" data-panel="text" hidden>
        <div class="ct-panel-head"><h3>Page text</h3><button class="btn btn-ghost btn-sm" id="ct-reset-text">Reset to defaults</button></div>
        <p class="note" style="margin-bottom:.8rem">Basic HTML (e.g. &lt;strong&gt;, &lt;em&gt;) is allowed. Leave a field blank to use the built-in default.</p>
        ${textFields}
        <button class="btn btn-primary" id="ct-save-text" style="margin-top:.6rem">Save page text</button>
      </section>`;
    setTimeout(bindContentAdmin,0);
  } else if(sub==="admin-blog"){
    const posts=await listPosts(true);
    const ep=_editingPost?posts.find(p=>p.id===_editingPost):null;
    const f=ep||{title:"",slug:"",author:"",excerpt:"",cover:"",body:"",status:"draft",publish_at:null};
    body=`<h2 class="shell-h">Blog</h2>
      <div class="panel bp-editor"><h3 class="lt-h">${ep?"Edit post":"Write a new post"}</h3>
        <div class="field"><label for="bp-title">Title</label><input id="bp-title" value="${esc(f.title||"")}" placeholder="Post title"></div>
        <div class="field"><label for="bp-author">Author name</label><input id="bp-author" value="${esc(f.author||"")}" placeholder="e.g. Ram Choudry"></div>
        <div class="field"><label for="bp-slug">URL slug <span class="note">(leave blank to auto-generate)</span></label><input id="bp-slug" value="${esc(f.slug||"")}" placeholder="my-post-title"></div>
        <div class="field"><label for="bp-excerpt">Excerpt / summary</label><textarea id="bp-excerpt" rows="2" placeholder="One or two lines shown on the blog list">${esc(f.excerpt||"")}</textarea></div>
        <div class="field"><label for="bp-cover">Cover image <span class="note">(optional)</span></label>
          <input id="bp-cover" value="${esc(f.cover||"")}" placeholder="Paste an image URL, or upload below…">
          <div style="display:flex;align-items:center;gap:.7rem;margin-top:.55rem;flex-wrap:wrap">
            <label class="btn btn-ghost btn-sm" style="cursor:pointer;margin:0">⬆ Upload image<input id="bp-cover-file" type="file" accept="image/*" style="display:none"></label>
            <span class="note" id="bp-cover-status"></span>
          </div>
          <div id="bp-cover-preview" style="margin-top:.6rem">${f.cover?`<img src="${esc(f.cover)}" alt="cover preview" style="max-height:120px;max-width:100%;border-radius:8px;border:1px solid var(--line)">`:""}</div>
        </div>
        <div class="field"><label for="bp-body">Body</label><textarea id="bp-body" rows="12" placeholder="Write your post… Blank line = new paragraph · ## Heading · - list item · **bold**">${esc(f.body||"")}</textarea><div class="note" style="margin-top:.3rem">Formatting: blank line = paragraph, <b>## </b>heading, <b>### </b>sub-heading, <b>- </b>list item, <b>**bold**</b>.</div></div>
        <div class="ct-grid">
          <label>Status<select id="bp-status"><option value="draft"${f.status!=="published"?" selected":""}>Draft</option><option value="published"${f.status==="published"?" selected":""}>Published</option></select></label>
          <label>Publish date/time <span class="note">(optional — schedule)</span><input id="bp-date" type="datetime-local" value="${f.publish_at?fmtLocalInput(f.publish_at):""}"></label>
        </div>
        <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.6rem"><button class="btn btn-primary" id="bp-save">${ep?"Update post":"Save post"}</button>${ep?`<a class="btn btn-ghost" href="/post/${esc(f.slug||"")}" target="_blank" rel="noopener">Preview</a><button class="btn btn-ghost" id="bp-cancel">Cancel edit</button>`:""}</div>
      </div>
      <h2 class="shell-h" style="margin-top:1.6rem">All posts (${posts.length})</h2>
      <div class="panel" style="overflow-x:auto"><table class="table"><thead><tr><th>Title</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>
      ${posts.length?posts.map(p=>{
        const pub=p.status==="published",sched=pub&&p.publish_at&&p.publish_at>Date.now();
        const badge=sched?`<span class="pill pill-req">Scheduled</span>`:(pub?`<span class="pill pill-active">Published</span>`:`<span class="pill">Draft</span>`);
        return `<tr><td><strong>${esc(p.title||"Untitled")}</strong><br><span class="note">/${esc(p.slug||"")}</span></td><td>${badge}</td><td>${fmtDate(p.publish_at||p.created_at)}</td><td><div class="qa-admin-btns"><button class="btn btn-ghost btn-sm" data-bp-edit="${p.id}">Edit</button>${pub?`<button class="btn btn-ghost btn-sm" data-bp-toggle="${p.id}" data-to="draft">Unpublish</button>`:`<button class="btn btn-primary btn-sm" data-bp-toggle="${p.id}" data-to="published">Publish</button>`}<button class="btn btn-ghost btn-sm" data-bp-del="${p.id}">Delete</button></div></td></tr>`;
      }).join(""):`<tr><td colspan="4" class="empty">No posts yet — write your first above.</td></tr>`}
      </tbody></table></div>`;
    setTimeout(bindBlogAdmin,0);
  } else if(sub==="admin-learners"){
    body=`<h2 class="shell-h">Learners</h2><div class="panel" style="overflow-x:auto"><table class="table"><thead><tr><th>Name</th><th>Email</th><th>WhatsApp</th><th>Enrollments</th></tr></thead><tbody>${learners.length?learners.map(l=>{const n=enrolls.filter(e=>e.user_id===l.id).length;return `<tr><td><strong>${esc(l.full_name)}</strong></td><td>${esc(l.email)}</td><td><a href="https://wa.me/${(l.phone||'').replace(/\\D/g,'')}" target="_blank" rel="noopener">${esc(l.phone||'—')}</a></td><td>${n}</td></tr>`;}).join(""):`<tr><td colspan="4" class="empty">No learners yet.</td></tr>`}</tbody></table></div>`;
  } else if(sub==="admin-leads"){
    body=`<h2 class="shell-h">Leads</h2>
      <p class="note" style="margin-bottom:1rem">Every enquiry, tagged with the form it came from. Add leads by hand, or import a batch from Excel/CSV.</p>
      <div class="lead-tools">
        <div class="panel"><h3 class="lt-h">Add a lead manually</h3>
          <div class="field"><label for="ld-name">Full name</label><input id="ld-name" placeholder="Name"></div>
          <div class="field"><label for="ld-email">Email</label><input id="ld-email" type="email" placeholder="you@email.com"></div>
          <div class="field"><label for="ld-phone">Phone</label><input id="ld-phone" type="tel" placeholder="+91 …"></div>
          <div class="field"><label for="ld-source">Source</label><select id="ld-source"><option value="manual">Manual entry</option><option value="phone">Phone call</option><option value="referral">Referral</option><option value="walkin">Walk-in</option><option value="social">Social media</option><option value="contact">Contact form</option><option value="other">Other</option></select></div>
          <div class="field"><label for="ld-msg">Note</label><textarea id="ld-msg" rows="2" placeholder="Optional"></textarea></div>
          <button class="btn btn-primary full-btn" id="ld-add">Add lead</button>
        </div>
        <div class="panel"><h3 class="lt-h">Bulk upload (Excel / CSV)</h3>
          <p class="note">Upload an <b>.xlsx</b> or <b>.csv</b> file. First row = headers, columns: <b>Name, Email, Phone, Source, Message</b>. At least a name, email or phone per row.</p>
          <button class="btn btn-ghost btn-sm" id="ld-template">↓ Download template</button>
          <div class="field" style="margin-top:.9rem"><label for="ld-file">Choose file</label><input id="ld-file" type="file" accept=".xlsx,.xls,.csv"></div>
          <button class="btn btn-primary full-btn" id="ld-import">Import leads</button>
          <div class="note" id="ld-import-status" style="margin-top:.6rem"></div>
        </div>
      </div>
      <h2 class="shell-h" style="margin-top:1.6rem">All leads (${leads.length})</h2>
      <div class="panel" style="overflow-x:auto"><table class="table"><thead><tr><th>Name</th><th>Source</th><th>Email</th><th>Phone</th><th>Message</th><th>When</th></tr></thead><tbody>${leads.length?leads.map(l=>`<tr><td><strong>${esc(l.name||'—')}</strong></td><td><span class="lead-src">${esc(leadSourceLabel(l.source))}</span></td><td>${esc(l.email||'')}</td><td>${esc(l.phone||'')}</td><td>${esc(l.message||'')}</td><td>${fmtDate(l.created_at)}</td></tr>`).join(""):`<tr><td colspan="6" class="empty">No leads yet.</td></tr>`}</tbody></table></div>`;
    setTimeout(bindLeadTools,0);
  } else if(sub==="admin-certs"){
    body=`<h2 class="shell-h">Issue a certificate</h2><p class="note" style="margin-bottom:1rem">Upload a learner's certificate — it appears in their dashboard for life.</p>
      <div class="panel" style="max-width:520px">
        <div class="field"><label>Learner</label><select id="cert-user">${learners.map(l=>`<option value="${l.id}">${esc(l.full_name)} (${esc(l.email)})</option>`).join("")}</select></div>
        <div class="field"><label>Certificate title</label><input id="cert-title" value="ScrumStudy Certificate"></div>
        <div class="field"><label>Related course (optional)</label><select id="cert-course"><option value="">— none —</option>${COURSES.map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join("")}</select></div>
        <div class="field"><label>Certificate file</label><input id="cert-file" type="file" accept=".pdf,image/*"><div class="note" style="margin-top:.3rem">${MODE==="demo"?"In demo, the file isn't stored — a sample link is saved so you can see the flow.":"PDF or image, up to 10 MB. Uploaded to Supabase Storage and linked in the learner's dashboard."}</div></div>
        <button class="btn btn-primary full-btn" id="cert-upload">Issue certificate</button>
      </div>
      <h2 class="shell-h" style="margin-top:2rem">Issued certificates</h2>${await certTable()}`;
    setTimeout(bindCert,0);
  }
  setTimeout(()=>{bindShell();bindEnrollControls();},0);
  return appShell(sub||"admin",prof,body,true);
}
function enrollTable(rows){
  return `<div class="panel" style="overflow-x:auto"><table class="table"><thead><tr><th>Learner</th><th>WhatsApp</th><th>Course</th><th>Status</th><th>Payment</th><th>Requested</th></tr></thead><tbody>
    ${rows.length?rows.map(e=>{const p=e.profiles||{},c=e.courses||{};
      const ss=`<select class="mini" data-id="${e.id}" data-field="status">${["requested","active","completed","cancelled"].map(s=>`<option ${e.status===s?"selected":""}>${s}</option>`).join("")}</select>`;
      const ps=`<select class="mini" data-id="${e.id}" data-field="payment_status">${["pending","paid"].map(s=>`<option ${e.payment_status===s?"selected":""}>${s}</option>`).join("")}</select>`;
      return `<tr><td><strong>${esc(p.full_name||"—")}</strong><br><span class="note">${esc(p.email||"")}</span></td><td><a href="https://wa.me/${(p.phone||'').replace(/\\D/g,'')}" target="_blank" rel="noopener">${esc(p.phone||"—")}</a></td><td>${esc(c.title||"—")}</td><td>${ss}</td><td>${ps}</td><td>${fmtDate(e.requested_at)}</td></tr>`;}).join("")
      :`<tr><td colspan="6" class="empty">No enrollment requests yet.</td></tr>`}
  </tbody></table></div>`;
}
async function certTable(){
  let all;
  if(supabase){
    const{data}=await supabase.from("certificates").select("*, courses(title), profiles(full_name)").order("issued_on",{ascending:false});
    all=(data||[]).map(c=>({...c,profile:c.profiles,course:c.courses}));
  }else{
    all=DB.certificates.map(c=>({...c,profile:DB.profiles.find(p=>p.id===c.user_id),course:COURSES.find(x=>x.id===c.course_id)}));
  }
  if(!all.length)return `<div class="panel empty">No certificates issued yet.</div>`;
  return `<div class="panel" style="overflow-x:auto"><table class="table"><thead><tr><th>Learner</th><th>Title</th><th>Course</th><th>Issued</th></tr></thead><tbody>${all.map(c=>`<tr><td>${esc(c.profile?.full_name||'')}</td><td>${esc(c.title)}</td><td>${esc(c.course?.title||'—')}</td><td>${fmtDate(c.issued_on)}</td></tr>`).join("")}</tbody></table></div>`;
}
function bindEnrollControls(){
  document.querySelectorAll("select.mini[data-field]").forEach(s=>s.addEventListener("change",async()=>{
    await adminUpdateEnrollment(s.dataset.id,s.dataset.field,s.value);
    toast(s.dataset.field==="status"&&s.value==="active"?"Activated — learner's materials are now unlocked.":"Updated.");
  }));
}
function bindAssessAdmin(){
  document.querySelectorAll("button[data-aa]").forEach(b=>b.addEventListener("click",async()=>{
    await setAssessmentAccess(b.dataset.aa,b.dataset.act);
    toast(b.dataset.act==="approved"?"Access approved — the student can now take the assessment.":"Access denied.");
    go();
  }));
}
/* ---- Leads: source labels, manual add, bulk Excel/CSV import ---- */
function leadSourceLabel(s){
  const map={contact:"Contact Form",manual:"Manual Entry",bulk:"Bulk Import",assessment:"Open Assessment",phone:"Phone Call",referral:"Referral",walkin:"Walk-in",social:"Social Media",other:"Other"};
  if(!s)return "Website";
  return map[s]||String(s).replace(/\b\w/g,c=>c.toUpperCase());
}
async function addLeadsBulk(rows){
  const clean=rows.map(r=>({name:(r.name||"").trim(),email:(r.email||"").trim(),phone:(r.phone||"").trim(),message:(r.message||"").trim(),source:((r.source||"").trim()||"bulk")})).filter(r=>r.name||r.email||r.phone);
  if(!clean.length)return {count:0};
  if(supabase){const{error}=await supabase.from("leads").insert(clean);return {count:error?0:clean.length,error};}
  const now=Date.now();
  clean.forEach((r,i)=>DB.leads.unshift({id:uid(),...r,created_at:now-i}));
  saveDB(DB);return {count:clean.length};
}
function mapLeadRow(obj){
  const norm={};Object.keys(obj||{}).forEach(k=>{norm[String(k).toLowerCase().replace(/[^a-z0-9]/g,"")]=obj[k];});
  const g=(...keys)=>{for(const k of keys){if(norm[k]!=null&&String(norm[k]).trim()!=="")return String(norm[k]).trim();}return "";};
  return {
    name:g("name","fullname","fullnames"),
    email:g("email","emailid","mail","emailaddress"),
    phone:g("phone","mobile","mobilenumber","phonenumber","contact","contactnumber","whatsapp"),
    source:g("source","form","leadsource")||"bulk",
    message:g("message","note","notes","enquiry","remarks","comment","comments")
  };
}
function bindLeadTools(){
  document.getElementById("ld-add")?.addEventListener("click",async()=>{
    const v=id=>document.getElementById(id).value.trim();
    const name=v("ld-name"),email=v("ld-email"),phone=v("ld-phone");
    if(!name&&!email&&!phone){toast("Add at least a name, email or phone.",true);return;}
    await submitLead({name,email,phone,message:v("ld-msg"),source:document.getElementById("ld-source").value});
    toast("Lead added.");go();
  });
  document.getElementById("ld-template")?.addEventListener("click",()=>{
    const csv="Name,Email,Phone,Source,Message\nRavi Kumar,ravi@example.com,+91 90000 00000,Referral,Interested in the weekend batch\nAnita Rao,anita@example.com,+91 98888 88888,Social Media,Saw the Instagram post\n";
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="fastrack-leads-template.csv";
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  });
  document.getElementById("ld-import")?.addEventListener("click",async()=>{
    const f=document.getElementById("ld-file").files[0];
    const status=document.getElementById("ld-import-status");
    if(!f){toast("Choose a .xlsx or .csv file first.",true);return;}
    status.textContent="Reading file…";
    const isCsv=/\.csv$/i.test(f.name);
    let rows=null;
    try{
      const XLSX=await import("https://esm.sh/xlsx@0.18.5");
      const buf=await f.arrayBuffer();
      const wb=XLSX.read(buf,{type:"array"});
      const ws=wb.Sheets[wb.SheetNames[0]];
      rows=XLSX.utils.sheet_to_json(ws,{defval:""}).map(mapLeadRow);
    }catch(e){
      if(isCsv){ try{ rows=parseCSVLeads(await f.text()).map(mapLeadRow); }catch(e2){} }
    }
    if(!rows){status.textContent="Couldn't read that file. .xlsx needs an internet connection (the reader loads on demand); .csv also works offline.";return;}
    const{count,error}=await addLeadsBulk(rows);
    if(error){status.textContent="Import failed: "+(error.message||error);return;}
    if(!count){status.textContent="No valid rows found — check the headers (Name, Email, Phone, Source, Message).";return;}
    toast(count+" lead"+(count>1?"s":"")+" imported.");go();
  });
}
function parseCSVLeads(text){
  const lines=text.split(/\r?\n/).filter(l=>l.trim()!=="");
  if(!lines.length)return [];
  const split=l=>{const out=[];let cur="",q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(ch==='"'){if(q&&l[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(ch===","&&!q){out.push(cur);cur="";}else cur+=ch;}out.push(cur);return out;};
  const headers=split(lines[0]);
  return lines.slice(1).map(l=>{const cells=split(l);const o={};headers.forEach((h,i)=>o[h]=cells[i]||"");return o;});
}
/* ---- Admin content editor (courses / success stories / page text) ---- */
function storyEditorRow(s,i){
  s=s||{};
  return `<div class="ct-story" data-i="${i}">
    <div class="ct-grid">
      <label>Name<input data-sf="n" value="${esc(s.n||"")}"></label>
      <label>Batch<input data-sf="b" value="${esc(s.b||"")}"></label>
      <label>Role<input data-sf="role" value="${esc(s.role||"")}"></label>
    </div>
    <label class="ct-full">Quote<textarea data-sf="t" rows="3">${esc(s.t||"")}</textarea></label>
    <button class="btn btn-ghost btn-sm ct-del-story">Remove</button>
  </div>`;
}
function bindContentAdmin(){
  document.querySelectorAll(".ct-tab").forEach(t=>t.addEventListener("click",()=>{
    document.querySelectorAll(".ct-tab").forEach(x=>x.classList.toggle("on",x===t));
    document.querySelectorAll(".ct-panel").forEach(p=>{p.hidden=(p.dataset.panel!==t.dataset.t);});
  }));
  document.querySelectorAll(".ct-save-course").forEach(btn=>btn.addEventListener("click",async()=>{
    const card=btn.closest(".ct-course");const fields={};
    card.querySelectorAll("[data-f]").forEach(el=>fields[el.dataset.f]=el.value.trim());
    btn.disabled=true;btn.textContent="Saving…";
    await saveCourseContent(btn.dataset.slug,fields);
    btn.disabled=false;btn.textContent="Save this course";toast("Course updated — live on the site.");
  }));
  document.getElementById("ct-reset-courses")?.addEventListener("click",async()=>{if(confirm("Reset ALL courses to their original content?")){await resetContent("courses");toast("Courses reset.");go();}});
  const stEl=()=>document.getElementById("ct-stories");
  const bindDeletes=()=>document.querySelectorAll(".ct-del-story").forEach(b=>{b.onclick=()=>b.closest(".ct-story").remove();});
  bindDeletes();
  document.getElementById("ct-add-story")?.addEventListener("click",()=>{
    stEl().insertAdjacentHTML("beforeend",storyEditorRow({},stEl().querySelectorAll(".ct-story").length));
    bindDeletes();
  });
  document.getElementById("ct-save-stories")?.addEventListener("click",async()=>{
    const arr=[...stEl().querySelectorAll(".ct-story")].map(row=>{const o={};row.querySelectorAll("[data-sf]").forEach(el=>o[el.dataset.sf]=el.value.trim());return o;}).filter(o=>o.n||o.t);
    const btn=document.getElementById("ct-save-stories");btn.disabled=true;btn.textContent="Saving…";
    await saveStoriesContent(arr);
    btn.disabled=false;btn.textContent="Save success stories";toast(arr.length+" success stories saved — live on the home page.");
  });
  document.getElementById("ct-reset-stories")?.addEventListener("click",async()=>{if(confirm("Reset success stories to the built-in set?")){await resetContent("stories");toast("Success stories reset.");go();}});
  document.getElementById("ct-save-text")?.addEventListener("click",async()=>{
    const map={};document.querySelectorAll("[data-tk]").forEach(el=>map[el.dataset.tk]=el.value.trim());
    const btn=document.getElementById("ct-save-text");btn.disabled=true;btn.textContent="Saving…";
    await saveTextContent(map);
    btn.disabled=false;btn.textContent="Save page text";toast("Page text saved — live on the site.");
  });
  document.getElementById("ct-reset-text")?.addEventListener("click",async()=>{if(confirm("Reset all page text to defaults?")){await resetContent("text");toast("Page text reset.");go();}});
}
/* ---- Admin blog editor ---- */
let _editingPost=null;
function fmtLocalInput(ts){const d=new Date(ts);const p=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"T"+p(d.getHours())+":"+p(d.getMinutes());}
function setCoverPreview(url){const pv=document.getElementById("bp-cover-preview");if(pv)pv.innerHTML=url?`<img src="${esc(url)}" alt="cover preview" style="max-height:120px;max-width:100%;border-radius:8px;border:1px solid var(--line)">`:"";}
function bindBlogAdmin(){
  // Cover image: keep the preview in sync when the URL is edited by hand.
  document.getElementById("bp-cover")?.addEventListener("input",e=>setCoverPreview(e.target.value.trim()));
  // Cover image: upload a file to Supabase Storage (public bucket) and use its URL.
  document.getElementById("bp-cover-file")?.addEventListener("change",async e=>{
    const file=e.target.files&&e.target.files[0]; if(!file)return;
    const status=document.getElementById("bp-cover-status"), coverInput=document.getElementById("bp-cover");
    if(file.size>5*1024*1024){ if(status)status.textContent="Image is too large (max 5 MB)."; return; }
    if(!supabase){ // demo mode: preview locally (not persisted to a server)
      const rd=new FileReader(); rd.onload=()=>{coverInput.value=rd.result;setCoverPreview(rd.result);if(status)status.textContent="Loaded (demo — not uploaded).";}; rd.readAsDataURL(file); return;
    }
    if(status)status.textContent="Uploading…";
    try{
      const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
      const path="cover-"+Date.now()+"-"+Math.floor(Math.random()*1e4)+"."+ext;
      const{error}=await supabase.storage.from("blog-covers").upload(path,file,{contentType:file.type,upsert:false});
      if(error)throw error;
      const{data}=supabase.storage.from("blog-covers").getPublicUrl(path);
      const url=(data&&data.publicUrl)||"";
      coverInput.value=url; setCoverPreview(url);
      if(status)status.textContent="Uploaded ✓";
    }catch(err){ if(status)status.textContent="Upload failed: "+((err&&err.message)||"is the blog-covers bucket set up?"); }
  });
  document.getElementById("bp-save")?.addEventListener("click",async()=>{
    const val=id=>document.getElementById(id).value.trim();
    const title=val("bp-title");if(!title){toast("Add a title.",true);return;}
    const status=document.getElementById("bp-status").value;
    const dateVal=document.getElementById("bp-date").value;
    const publish_at=dateVal?new Date(dateVal).getTime():(status==="published"?Date.now():null);
    const post={id:_editingPost||undefined,title,author:val("bp-author"),slug:slugify(val("bp-slug")||title),excerpt:val("bp-excerpt"),cover:val("bp-cover"),body:document.getElementById("bp-body").value,status,publish_at,published_at:status==="published"?(publish_at||Date.now()):null};
    const res=await savePost(post);_editingPost=null;
    if(res&&res.error){toast("Couldn't save the post: "+(res.error.message||"unknown error"),true);return;}
    toast(status==="published"?(publish_at&&publish_at>Date.now()?"Post scheduled.":"Post published — live on the blog."):"Draft saved.");
    go();window.scrollTo(0,0);
  });
  document.getElementById("bp-cancel")?.addEventListener("click",()=>{_editingPost=null;go();window.scrollTo(0,0);});
  document.querySelectorAll("[data-bp-edit]").forEach(b=>b.addEventListener("click",()=>{_editingPost=b.dataset.bpEdit;go();window.scrollTo(0,0);}));
  document.querySelectorAll("[data-bp-toggle]").forEach(b=>b.addEventListener("click",async()=>{
    const posts=await listPosts(true);const p=posts.find(x=>x.id===b.dataset.bpToggle);if(!p)return;
    const to=b.dataset.to;
    await savePost({id:p.id,status:to,publish_at:to==="published"?(p.publish_at&&p.publish_at>Date.now()?p.publish_at:Date.now()):p.publish_at,published_at:to==="published"?(p.published_at||Date.now()):p.published_at});
    toast(to==="published"?"Published.":"Moved to draft.");go();
  }));
  document.querySelectorAll("[data-bp-del]").forEach(b=>b.addEventListener("click",async()=>{if(confirm("Delete this post? This can't be undone.")){await deletePost(b.dataset.bpDel);if(_editingPost===b.dataset.bpDel)_editingPost=null;toast("Post deleted.");go();}}));
}
function bindCert(){
  document.getElementById("cert-upload")?.addEventListener("click",async()=>{
    const btn=document.getElementById("cert-upload");
    const userId=document.getElementById("cert-user").value;
    const title=document.getElementById("cert-title").value.trim()||"Scrum Certificate";
    const courseId=document.getElementById("cert-course").value||null;
    const file=document.getElementById("cert-file").files[0];
    if(!userId){toast("Choose a learner.",true);return;}
    if(!file&&MODE!=="demo"){toast("Choose a file.",true);return;}
    let fileUrl="https://fastrackagile.com/";
    if(file&&supabase){
      if(file.size>10*1024*1024){toast("File is too large (max 10 MB).",true);return;}
      if(btn){btn.disabled=true;btn.textContent="Uploading…";}
      try{
        const ext=(file.name.split(".").pop()||"pdf").toLowerCase().replace(/[^a-z0-9]/g,"")||"pdf";
        const path=userId+"/cert-"+Date.now()+"."+ext;
        const{error}=await supabase.storage.from("certificates").upload(path,file,{contentType:file.type,upsert:false});
        if(error)throw error;
        const{data}=supabase.storage.from("certificates").getPublicUrl(path);
        fileUrl=(data&&data.publicUrl)||fileUrl;
      }catch(err){ if(btn){btn.disabled=false;btn.textContent="Issue certificate";} toast("Upload failed: "+((err&&err.message)||"is the certificates bucket set up?"),true); return; }
      if(btn){btn.disabled=false;btn.textContent="Issue certificate";}
    }
    await adminAddCertificate(userId,courseId,title,fileUrl);
    toast("Certificate issued — visible in the learner's dashboard.");
    navigate("/admin-certs");go();
  });
}

/* ---- LEGAL PAGES (Privacy · Terms · Refund) ---- */
function legalPage(eyebrow,title,intro,sections){
  const blocks=sections.map(([h,body])=>`<h2 style="font-size:1.15rem;margin:1.6rem 0 .5rem">${h}</h2>${body}`).join("");
  return `<section class="page-head wrap reveal"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1>
    <p>${intro}</p></section>
    <div class="wrap" style="padding-bottom:80px;max-width:820px"><div class="panel" style="line-height:1.7;color:var(--ink-soft)">
      <p class="note" style="margin-bottom:1rem">Last updated: 30 June 2026</p>
      ${blocks}
      <p style="margin-top:1.8rem">Questions about this policy? Email <a class="accent" href="mailto:info@fastrackagile.com">info@fastrackagile.com</a> or message us on <a class="accent" href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a>.</p>
    </div></div>`;
}
function viewPrivacy(){
  return legalPage("Privacy Policy","Your privacy matters.",
    "This policy explains what information Fastrack Agile collects, how we use it, and the choices you have.",
    [
      ["1. Who we are","<p>Fastrack Agile provides practical Agile and Scrum Master training, based in Gachibowli, Hyderabad. References to \"we\", \"us\" or \"our\" mean Fastrack Agile.</p>"],
      ["2. Information we collect","<p>We collect details you give us when you register or enquire — your name, email address and phone number — and basic usage data needed to run your learner account (such as the programs you request and your course progress).</p>"],
      ["3. How we use your information","<p>We use your information to create and manage your account, confirm enrolments, share schedules and study materials, respond to your enquiries, and send you relevant updates about your training. We do not sell your personal data.</p>"],
      ["4. Communication","<p>We may contact you by email, phone or WhatsApp regarding your enrolment, batches and support. You can opt out of non-essential messages at any time by contacting us.</p>"],
      ["5. Data security &amp; retention","<p>We take reasonable measures to protect your information and retain it only as long as needed to provide our services or meet legal obligations.</p>"],
      ["6. Your rights","<p>You can ask us to access, correct or delete your personal information. To make a request, email <a class=\"accent\" href=\"mailto:info@fastrackagile.com\">info@fastrackagile.com</a>.</p>"],
      ["7. Third-party links","<p>Our site may link to external platforms (such as YouTube, Instagram, Facebook, LinkedIn or WhatsApp). Their use of your data is governed by their own privacy policies.</p>"]
    ]);
}
function viewTerms(){
  return legalPage("Terms of Use","Terms of use.",
    "By using the Fastrack Agile website and services, you agree to these terms.",
    [
      ["1. Use of the site","<p>You may use this site for lawful purposes only and must not misuse it or attempt to disrupt its operation.</p>"],
      ["2. Accounts","<p>You are responsible for the accuracy of the details you provide and for activity under your account. Accounts are intended for the registered individual.</p>"],
      ["3. Enrolment &amp; payments","<p>Enrolment is confirmed once payment is completed as agreed. Course content, schedules and pricing may change; we will communicate any changes that affect you.</p>"],
      ["4. Intellectual property","<p>All training materials, content and branding are the property of Fastrack Agile and may not be copied, resold or redistributed without written permission.</p>"],
      ["5. Limitation of liability","<p>We deliver training in good faith but do not guarantee specific employment outcomes. Career results depend on individual effort, market conditions and other factors.</p>"],
      ["6. Contact","<p>For any questions about these terms, contact <a class=\"accent\" href=\"mailto:info@fastrackagile.com\">info@fastrackagile.com</a>.</p>"]
    ]);
}
function viewRefund(){
  return legalPage("Refund Policy","Refund &amp; cancellation policy.",
    "We want you to be confident enrolling with Fastrack Agile. This policy explains our refund and cancellation terms.",
    [
      ["1. Cancellation before a batch starts","<p>If you cancel before your batch start date, you are eligible for a refund of fees paid, minus any non-refundable processing charges. Contact us as early as possible to request a cancellation.</p>"],
      ["2. After a batch begins","<p>Once a batch has started and training/materials have been accessed, fees are generally non-refundable, as your seat and resources have already been committed. In genuine exceptional cases, please reach out and we will review your situation fairly.</p>"],
      ["3. Rescheduling","<p>If you are unable to continue, we will do our best to transfer you to a later batch of the same program, subject to availability, instead of a refund.</p>"],
      ["4. How to request","<p>To request a refund or reschedule, email <a class=\"accent\" href=\"mailto:info@fastrackagile.com\">info@fastrackagile.com</a> or message us on <a class=\"accent\" href=\"https://wa.me/${WHATSAPP}\" target=\"_blank\" rel=\"noopener\">WhatsApp</a> with your name, registered email and program details.</p>"],
      ["5. Processing time","<p>Approved refunds are processed back to the original payment method, typically within 7–10 business days.</p>"]
    ]);
}

/* ---- OPEN ASSESSMENT (Scrum Master practice quiz) ----
   Draws 20 questions at random from window.SCRUM_QA (200-question bank),
   shuffles them each attempt, scores on submit, and shows explanations. */
const ASSESS_SIZE=20;
const ASSESS_MINUTES=30;
let _assess=null; // { items:[{q, chosen}], submitted, endsAt }
let _assessTimer=null;
function qaShuffle(arr){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}
function newAssessment(){
  const pool=Array.isArray(window.SCRUM_QA)?window.SCRUM_QA:[];
  const picked=qaShuffle(pool).slice(0,ASSESS_SIZE);
  _assess={items:picked.map(q=>({q,chosen:null})),submitted:false,endsAt:Date.now()+ASSESS_MINUTES*60000};
}
function stopAssessTimer(){ if(_assessTimer){clearInterval(_assessTimer);_assessTimer=null;} }
function startAssessTimer(){
  stopAssessTimer();
  const tick=()=>{
    if(!_assess||_assess.submitted){stopAssessTimer();return;}
    const rem=Math.max(0,_assess.endsAt-Date.now());
    const el=document.getElementById("qa-timer");
    if(el){const m=Math.floor(rem/60000),s=Math.floor(rem%60000/1000);el.textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");el.classList.toggle("warn",rem<=120000);}
    if(rem<=0){stopAssessTimer();_assess.submitted=true;toast("Time's up — your assessment was submitted automatically.");go();window.scrollTo(0,0);}
  };
  tick();_assessTimer=setInterval(tick,1000);
}
async function viewAssessment(){
  const prof=await currentProfile();
  if(!prof){navigate("/login");return "";}
  const pool=Array.isArray(window.SCRUM_QA)?window.SCRUM_QA:[];
  if(!pool.length){
    return appShell("assessment",prof,`<div class="panel empty"><strong>Assessment bank not loaded.</strong><p class="mt-2">The question bank could not be loaded. Please refresh the page and try again.</p></div>`,false);
  }
  const access=await myAssessmentAccess();
  const status=access?access.status:"none";
  if(status!=="approved"){
    stopAssessTimer();_assess=null;
    setTimeout(bindAssessGate,0);
    return appShell("assessment",prof,assessmentGate(status,prof),false);
  }
  setTimeout(bindAssessment,0);
  let body;
  if(!_assess) body=assessmentIntro();
  else if(_assess.submitted) body=assessmentResults();
  else body=assessmentQuiz();
  return appShell("assessment",prof,body,false);
}
function assessmentGate(status,prof){
  const fn=esc((prof.full_name||"there").trim().split(/\s+/)[0]);
  const wa=`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hi Ram, I would like access to the Open Assessment. My name is '+(prof.full_name||''))}`;
  if(status==="pending"){
    return `<div class="dash-greet"><h2 class="shell-h" style="margin:0 0 .2rem">Open Assessment</h2></div>
      <div class="panel qa-status"><div class="qa-status-ic pend">⏳</div><h3>Your request is awaiting approval</h3>
      <p class="note">Thanks, ${fn}. Ram will review your request and approve access shortly. Once approved, you'll be able to take the ${ASSESS_MINUTES}-minute timed assessment right here.</p>
      <a class="btn btn-ghost" href="${wa}" target="_blank" rel="noopener">Message Ram on WhatsApp</a></div>`;
  }
  if(status==="denied"){
    return `<div class="dash-greet"><h2 class="shell-h" style="margin:0 0 .2rem">Open Assessment</h2></div>
      <div class="panel qa-status"><div class="qa-status-ic deny">🔒</div><h3>Access not granted yet</h3>
      <p class="note">The Open Assessment is reserved for learners who have attended Fastrack Agile training. If you've completed training or believe this is a mistake, please reach out to Ram.</p>
      <a class="btn btn-primary" href="${wa}" target="_blank" rel="noopener">Contact Ram</a></div>`;
  }
  return `<div class="dash-greet"><h2 class="shell-h" style="margin:0 0 .2rem">Open Assessment · Request access</h2>
    <p class="note">The Open Assessment is available to Fastrack Agile students who have attended training. Share your details to request access — Ram will review and approve it, and then you can take the ${ASSESS_MINUTES}-minute timed assessment here.</p></div>
    <div class="panel qa-gate">
      <div class="field"><label for="ga-name">Full name</label><input id="ga-name" autocomplete="name" value="${esc(prof.full_name||"")}" placeholder="Your full name"></div>
      <div class="field"><label for="ga-email">Email ID</label><input id="ga-email" type="email" autocomplete="email" value="${esc(prof.email||"")}" placeholder="you@email.com"></div>
      <div class="field"><label for="ga-mobile">Mobile number</label><input id="ga-mobile" type="tel" autocomplete="tel" value="${esc(prof.phone||"")}" placeholder="+91 …"></div>
      <button class="btn btn-primary full-btn" id="ga-submit">Request access →</button>
    </div>`;
}
function bindAssessGate(){
  document.getElementById("ga-submit")?.addEventListener("click",async()=>{
    const full_name=document.getElementById("ga-name").value.trim();
    const email=document.getElementById("ga-email").value.trim();
    const mobile=document.getElementById("ga-mobile").value.trim();
    if(!full_name||!email||!mobile){toast("Please fill in your name, email and mobile number.",true);return;}
    const btn=document.getElementById("ga-submit");btn.disabled=true;btn.textContent="Sending…";
    const{error}=await requestAssessmentAccess({full_name,email,mobile});
    btn.disabled=false;btn.textContent="Request access →";
    if(error&&error.message!=="exists"){toast(error.message,true);return;}
    toast("Request sent! Ram will review and approve your access.");
    go();window.scrollTo(0,0);
  });
}
function assessmentIntro(){
  const bank=(window.SCRUM_QA||[]).length;
  return `
    <div class="dash-greet"><h2 class="shell-h" style="margin:0 0 .2rem">Open Assessment · Scrum Master Practice</h2><p class="note"><span class="qa-ok-badge">✓ Access approved</span> You're all set to begin.</p></div>
    <div class="panel qa-intro">
      <h3>Before you begin</h3>
      <ul class="qa-rules">
        <li><b>${ASSESS_SIZE} questions</b> drawn at random from our ${bank}-question bank — every attempt is a fresh, shuffled set.</li>
        <li><b>${ASSESS_MINUTES} minutes.</b> A live countdown runs at the top of the screen, and the assessment <b>submits automatically</b> when time runs out.</li>
        <li>Pick the single best answer for each question. You can change answers any time before you submit.</li>
        <li>You'll get your score and a full explanation for every question at the end. Passing benchmark: <b>85%</b> (PSM I / CSM style).</li>
      </ul>
      <button class="btn btn-primary" id="qa-start">Start the ${ASSESS_MINUTES}-minute assessment →</button>
    </div>`;
}
function assessmentQuiz(){
  const total=_assess.items.length;
  const qs=_assess.items.map((it,i)=>{
    const opts=it.q.a.map((opt,j)=>`<label class="qa-opt${it.chosen===j?' sel':''}" data-i="${i}" data-j="${j}"><span class="qa-letter">${String.fromCharCode(65+j)}</span><span class="qa-opt-txt">${esc(opt)}</span></label>`).join("");
    return `<div class="qa-card" id="qa-${i}"><div class="qa-qhead"><span class="qa-num">Q${i+1}<i>/${total}</i></span><p class="qa-qtext">${esc(it.q.q)}</p></div><div class="qa-opts">${opts}</div></div>`;
  }).join("");
  return `
    <div class="qa-runhead">
      <div><h2 class="shell-h" style="margin:0 0 .1rem">Open Assessment</h2><span class="note">${total} questions · choose the best answer</span></div>
      <div class="qa-timer" id="qa-timer" title="Time remaining">${String(ASSESS_MINUTES).padStart(2,"0")}:00</div>
    </div>
    <div class="qa-progwrap"><div class="qa-prog"><div class="qa-prog-bar" id="qa-bar"></div></div><span class="note" id="qa-count">0 of ${total} answered</span></div>
    <div id="qa-list">${qs}</div>
    <div class="qa-actions"><button class="btn btn-primary" id="qa-submit">Submit assessment →</button></div>`;
}
function assessmentResults(){
  const items=_assess.items,total=items.length;
  const correct=items.filter(it=>it.chosen===it.q.c).length;
  const pct=Math.round(correct/total*100),pass=pct>=85;
  const review=items.map((it,i)=>{
    const opts=it.q.a.map((opt,j)=>{
      let cls="qa-opt qa-rev";
      if(j===it.q.c)cls+=" correct";else if(j===it.chosen)cls+=" wrong";
      const mark=j===it.q.c?"✓":(j===it.chosen?"✗":"");
      return `<div class="${cls}"><span class="qa-letter">${String.fromCharCode(65+j)}</span><span class="qa-opt-txt">${esc(opt)}</span><span class="qa-mark">${mark}</span></div>`;
    }).join("");
    const ok=it.chosen===it.q.c;
    const unans=it.chosen===null?`<p class="qa-exp" style="color:var(--amber-deep);margin-bottom:.4rem">You didn't answer this question.</p>`:"";
    return `<div class="qa-card"><div class="qa-qhead"><span class="qa-num ${ok?'ok':'no'}">Q${i+1}</span><p class="qa-qtext">${esc(it.q.q)}</p></div><div class="qa-opts">${opts}</div>${unans}<p class="qa-exp"><strong>Explanation.</strong> ${esc(it.q.e)}</p></div>`;
  }).join("");
  return `
    <div class="qa-score">
      <div class="qa-ring ${pass?'pass':'fail'}"><b>${pct}%</b><span>${correct}/${total}</span></div>
      <div class="qa-score-copy">
        <h2 class="shell-h" style="margin:0 0 .3rem">${pass?'Great work — you passed! 🎉':'Good effort — keep practising 💪'}</h2>
        <p class="note">You answered <strong>${correct}</strong> of <strong>${total}</strong> correctly. The PSM I / CSM benchmark is around 85%. Review the explanations below, then take a fresh set.</p>
        <div class="qa-score-btns"><button class="btn btn-primary" id="qa-retake">Take a new assessment →</button><a class="btn btn-ghost" href="/dashboard">Back to dashboard</a></div>
      </div>
    </div>
    <h2 class="shell-h" style="margin-top:2rem">Review &amp; explanations</h2>
    <div id="qa-list">${review}</div>`;
}
function updateAssessProgress(){
  if(!_assess) return;
  const total=_assess.items.length,answered=_assess.items.filter(it=>it.chosen!==null).length;
  const bar=document.getElementById("qa-bar");if(bar)bar.style.width=(answered/total*100)+"%";
  const c=document.getElementById("qa-count");if(c)c.textContent=answered+" of "+total+" answered";
}
function bindAssessment(){
  const start=document.getElementById("qa-start");
  if(start){ start.addEventListener("click",()=>{newAssessment();go();window.scrollTo(0,0);}); return; }
  document.querySelectorAll(".qa-opt:not(.qa-rev)").forEach(el=>{
    el.addEventListener("click",()=>{
      const i=+el.dataset.i,j=+el.dataset.j;
      _assess.items[i].chosen=j;
      document.querySelectorAll('.qa-opt[data-i="'+i+'"]').forEach(o=>o.classList.toggle("sel",+o.dataset.j===j));
      updateAssessProgress();
    });
  });
  updateAssessProgress();
  document.getElementById("qa-submit")?.addEventListener("click",()=>{
    const missing=_assess.items.filter(it=>it.chosen===null).length;
    if(missing>0 && !confirm("You have "+missing+" unanswered question"+(missing>1?"s":"")+". Submit anyway?")) return;
    stopAssessTimer();_assess.submitted=true;go();window.scrollTo(0,0);
  });
  document.getElementById("qa-retake")?.addEventListener("click",()=>{newAssessment();go();window.scrollTo(0,0);});
  if(_assess && !_assess.submitted) startAssessTimer(); else stopAssessTimer();
}

/* ===== 8. ROUTER ===== */
const APP_ROUTES=["dashboard","assessment","admin","admin-enroll","admin-payments","admin-assess","admin-content","admin-blog","admin-learners","admin-leads","admin-certs"];
function skeletonFor(route){
  const card=`<div class="skel-card"><div class="bar"></div><div class="skel skel-chip"></div><div class="skel skel-title"></div><div class="skel skel-line w-100"></div><div class="skel skel-line w-80"></div><div class="skel skel-line w-60"></div><div class="row mt-4"><div class="skel skel-btn"></div><div class="skel skel-btn"></div></div></div>`;
  if(route==="courses"||route==="course"){
    return `<div class="wrap"><div class="center-txt mt-16"><div class="skel skel-title" style="margin:0 auto 1rem;width:38%"></div><div class="skel skel-line w-60" style="margin:.5rem auto"></div></div><div class="skel-grid">${card.repeat(3)}</div></div>`;
  }
  return `<div class="wrap"><div class="center-txt mt-16"><div class="skel skel-title" style="margin:0 auto 1rem;width:42%"></div><div class="skel skel-line w-60" style="margin:.5rem auto"></div><div class="skel skel-line w-40" style="margin:.5rem auto"></div></div><div class="panel mt-12"><div class="skel skel-line w-100"></div><div class="skel skel-line w-100"></div><div class="skel skel-line w-80"></div></div></div>`;
}
async function go(){
  const parts=(location.pathname||"/").replace(/^\/+|\/+$/g,"").split("/").filter(Boolean).map(s=>{try{return decodeURIComponent(s);}catch(e){return s;}});const route=parts[0]||"";
  if(_heroTimer){clearInterval(_heroTimer);_heroTimer=null;}
  if(_assessTimer && route!=="assessment"){stopAssessTimer();} // leaving the assessment cancels its clock
  window.scrollTo(0,0);
  const isApp=APP_ROUTES.includes(route);
  showChrome(!isApp);
  // active nav highlight on marketing header
  if(route===""||route==="home"){app().innerHTML=viewHome();runHomeScripts();syncStickyCta(true);return;}
  app().innerHTML=skeletonFor(route);
  let html="";
  if(route==="courses")html=await viewCourses();
  else if(route==="course")html=await viewCourse(parts[1]);
  else if(route==="about")html=viewAbout();
  else if(route==="contact")html=viewContact();
  else if(route==="blog")html=await viewBlog();
  else if(route==="post")html=await viewPost(parts[1]);
  else if(route==="calendar")html=viewCalendar();
  else if(route==="resources")html=await viewResources();
  else if(route==="stories")html=await viewStories();
  else if(route==="privacy")html=viewPrivacy();
  else if(route==="terms")html=viewTerms();
  else if(route==="refund")html=viewRefund();
  else if(route==="login")html=viewLogin();
  else if(route==="admin-login")html=viewAdminLogin();
  else if(route==="dashboard")html=await viewDashboard();
  else if(route==="assessment")html=await viewAssessment();
  else if(route.startsWith("admin"))html=await viewAdmin(route);
  else html=viewHome();
  app().innerHTML=html;
  if(route!==""&&route!=="home") initPageMotion();
  syncStickyCta(!isApp);
}
/* ===== MOTION ENGINE (added) ===== */
const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

// generic reveal + stagger + counters for ANY page
function initPageMotion(){
  // staggered children timing
  document.querySelectorAll('[data-stagger]').forEach(group=>{
    [...group.children].forEach((c,i)=>c.style.setProperty('--d', (i*90)));
  });
  const io=new IntersectionObserver((es)=>{es.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('in');
      if(e.target.hasAttribute('data-count')) animateCount(e.target);
      e.target.querySelectorAll&&e.target.querySelectorAll('[data-count]').forEach(animateCount);
      io.unobserve(e.target);
    }
  // threshold:0 (fire as soon as any part enters) — a % threshold is unreachable for
  // elements taller than the viewport (e.g. a tall single-column grid on mobile), which
  // left those sections stuck invisible. rootMargin delays the trigger slightly instead.
  });},{threshold:0,rootMargin:'0px 0px -12% 0px'});
  document.querySelectorAll('.reveal,[data-stagger],[data-count]').forEach(el=>io.observe(el));
  // faq toggles (present on several pages)
  document.querySelectorAll('.faq2-q').forEach(q=>{if(q.dataset.faqBound)return;q.dataset.faqBound="1";q.addEventListener('click',()=>q.parentElement.classList.toggle('open'));});
}

const _counted=new WeakSet();
function animateCount(el){
  if(_counted.has(el))return; _counted.add(el);
  const target=parseFloat(el.dataset.count);
  const suffix=el.dataset.suffix||''; const dec=(el.dataset.dec|0);
  if(REDUCED){el.textContent=target.toFixed(dec)+suffix;return;}
  const dur=1400, t0=performance.now();
  const tick=(t)=>{const p=Math.min(1,(t-t0)/dur);const e=1-Math.pow(1-p,3);
    el.textContent=(target*e).toFixed(dec)+suffix;
    if(p<1)requestAnimationFrame(tick);else el.textContent=target.toFixed(dec)+suffix;};
  requestAnimationFrame(tick);
}

function runHomeScripts(){
  initPageMotion();
  // rotating Ken Burns hero banner gallery
  startHeroGallery();
}
let _heroTimer=null;
function startHeroGallery(){
  const g=document.getElementById('hero-gallery');
  if(!g) return;
  const banner=g.closest('.hero-banner')||g;
  const slides=[...g.querySelectorAll('.hg-slide')];
  const dots=[...(document.getElementById('hg-dots')?.querySelectorAll('.hg-dot')||[])];
  if(slides.length<2) return;
  let i=0;
  const HOLD=2500; // ms per slide
  const show=(n)=>{
    const prev=i;
    i=(n+slides.length)%slides.length;
    if(i===prev) return;
    const s=slides[i];
    // bring the incoming slide up first so the two overlap (true crossfade)
    s.classList.remove('on'); void s.offsetWidth; s.classList.add('on');
    dots[i]&&dots[i].classList.add('on');
    // fade the outgoing slide out underneath it
    slides[prev]&&slides[prev].classList.remove('on');
    dots[prev]&&dots[prev].classList.remove('on');
  };
  const next=()=>show(i+1);
  const schedule=()=>{ if(_heroTimer) clearInterval(_heroTimer); if(!REDUCED) _heroTimer=setInterval(next,HOLD); };
  dots.forEach(d=>d.addEventListener('click',()=>{ show(parseInt(d.dataset.i,10)); schedule(); }));
  // pause on hover, resume on leave (bound to whole banner)
  banner.addEventListener('mouseenter',()=>{ if(_heroTimer){clearInterval(_heroTimer);_heroTimer=null;} });
  banner.addEventListener('mouseleave',schedule);
  // preload the rest after first paint
  slides.slice(1).forEach(s=>{ const im=new Image(); im.src=s.getAttribute('src'); });
  schedule();
}

/* ===== scroll progress + sticky CTA + countdown (global) ===== */
function initGlobalUI(){
  const prog=document.getElementById('scroll-prog');
  const onScroll=()=>{
    const h=document.documentElement;
    const sc=h.scrollTop/((h.scrollHeight-h.clientHeight)||1);
    if(prog)prog.style.width=(sc*100)+'%';
    // sticky CTA appears after scrolling past hero, hides near very bottom
    const cta=document.getElementById('sticky-cta');
    if(cta&&cta.dataset.enabled==='1'){
      const show = window.scrollY>520 && sc<0.93;
      cta.classList.toggle('show',show);
    }
  };
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll);
  onScroll();
  startCountdown();
}
function syncStickyCta(enable){
  const cta=document.getElementById('sticky-cta');
  if(!cta)return;
  cta.dataset.enabled=enable?'1':'0';
  if(!enable)cta.classList.remove('show');
}

// next-batch countdown: next Monday 09:30 IST as a friendly target
function nextBatchDate(){
  // Fixed announced weekday batch: 15 July 2026, 6:45 AM IST.
  const fixed=new Date(2026,6,15,6,45,0,0);
  if(fixed-new Date()>0) return fixed;
  // After it passes, fall back to the next Monday 6:45 AM so the clock keeps working.
  const d=new Date();
  let add=((1-d.getDay())+7)%7; if(add===0)add=7;
  d.setDate(d.getDate()+add); d.setHours(6,45,0,0);
  return d;
}
let _cdTarget=nextBatchDate();
function startCountdown(){
  const tick=()=>{
    let diff=_cdTarget-new Date();
    if(diff<0){_cdTarget=nextBatchDate();diff=_cdTarget-new Date();}
    const dd=Math.floor(diff/864e5), hh=Math.floor(diff%864e5/36e5), mm=Math.floor(diff%36e5/6e4), ss=Math.floor(diff%6e4/1e3);
    const el=document.getElementById('hdr-countdown');
    if(el)el.innerHTML=`<span class="cd-box">${dd}</span>d <span class="cd-box">${String(hh).padStart(2,'0')}</span>h <span class="cd-box">${String(mm).padStart(2,'0')}</span>m <span class="cd-box">${String(ss).padStart(2,'0')}</span>s`;
    const pel=document.getElementById('prog-countdown');
    if(pel)pel.textContent=`${dd}d ${String(hh).padStart(2,'0')}h ${String(mm).padStart(2,'0')}m`;
  };
  tick(); clearInterval(window._cdInt);
  window._cdInt=setInterval(tick, REDUCED?30000:1000);
}

// ---- Clean-URL routing (History API) ----
// Programmatic navigation used across the app (replaces the old navigate("/…")).
function navigate(path){
  if(!path)path="/";
  if(path.charAt(0)!=="/")path="/"+path;
  if(path!==location.pathname){history.pushState(null,"",path);}
  window.scrollTo(0,0);
  go();
}
// Intercept clicks on internal links so navigation stays a single-page transition.
document.addEventListener("click",e=>{
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const a=e.target.closest("a");
  if(!a)return;
  const href=a.getAttribute("href");
  if(!href||href.charAt(0)!=="/"||href.charAt(1)==="/")return;      // only same-origin absolute paths
  if(a.target==="_blank"||a.hasAttribute("download")||a.getAttribute("rel")==="external")return;
  e.preventDefault();
  navigate(href);
});
window.addEventListener("popstate",()=>{window.scrollTo(0,0);go();});
(async()=>{await loadContent();await renderHeader();renderFooter();initGlobalUI();await go();})();

