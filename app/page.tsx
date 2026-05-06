'use client'
import { useState, useEffect, useRef } from 'react'

const API = ''
const SITE = 'https://chattersinnercircle.vercel.app'

const PLATFORMS = [
  'Texting Factory','Alpha.date','OnlyFans','Fansly','LoyalFans',
  'FanCentro','AdmireMe','FanVue','ManyVids','Unlockd'
]

const FEATURES = [
  { icon:'✦', title:'AI Reply Generation', desc:'4 unique replies per message — Flirty, Warm, Playful, Confident. Every reply specific to exactly what he said, never generic.' },
  { icon:'🔥', title:'Re-engage Cold Clients', desc:'One click analyzes the conversation and crafts the most intriguing message to bring back men who went quiet — works within minutes.' },
  { icon:'▶', title:'Human Typing Simulator', desc:'Replies type at 60 WPM with natural rhythm, micro-pauses, and occasional typos. Every platform tested — completely undetectable.' },
  { icon:'📷', title:'Photo Recognition', desc:'Detects when he sends a photo and generates a specific, genuine compliment — never "nice pic." Makes him feel truly seen.' },
  { icon:'📍', title:'Location Intelligence', desc:'Scans his profile location automatically. When he asks where you are, gives a believable city 35 minutes away — never his exact city.' },
  { icon:'↻', title:'Unlimited Regeneration', desc:'Not happy with any reply? Regenerate instantly for 4 completely new options. Different tones, different angles, every time.' },
]

const REVIEWS = [
  { name:'Samantha K.', role:'Texting Factory Operator', stars:5, text:'I went from struggling with replies to having 8 conversations going at once. The CTAs are so good men literally cannot stop responding.', time:'2 days ago', av:'SK' },
  { name:'Priya M.', role:'OnlyFans Creator', stars:5, text:'My response rate went from 40% to 94% in the first week. The replies are bold, specific, and completely undetectable. Game changer.', time:'5 days ago', av:'PM' },
  { name:'Aisha T.', role:'Alpha.date Operator', stars:5, text:'The re-engage button alone is worth it. I reactivated 12 cold conversations in one day. Men who hadn\'t replied in weeks suddenly came back.', time:'1 week ago', av:'AT' },
  { name:'Jessica R.', role:'Fansly Creator', stars:5, text:'Typing simulator is unbelievable. The platform has never flagged me once. My subscribers think I\'m texting them personally.', time:'1 week ago', av:'JR' },
  { name:'Leila N.', role:'Multi-platform Operator', stars:5, text:'CIC cut my working time in half while doubling my conversion rate. I don\'t know how I worked without it.', time:'2 weeks ago', av:'LN' },
  { name:'Chloe B.', role:'Texting Factory Operator', stars:5, text:'The quality of responses is insane. Every reply feels personal, warm, and real. Tips have gone up 60%.', time:'2 weeks ago', av:'CB' },
]

const PLANS = [
  { name:'Free Trial', price:'Free', period:'7 days', color:'#64748b', badge:'',
    desc:'Full Premium access. See exactly what CIC can do.',
    features:['Unlimited replies days 1–3','40 replies day 4','30 day 5, 20 day 6, 10 day 7','Full explicit content support','All 10 platforms','Re-engage analyser','Human typing simulator','Photo compliment detection'] },
  { name:'Basic', price:'$8', period:'per month', color:'#38bdf8', badge:'',
    desc:'Well-crafted replies for everyday conversations.',
    features:['50 replies per 4 days','Smart CTAs every reply','Re-engage analyser','All 10 platforms','Standard AI quality','Human typing simulator','No explicit content','Email support'] },
  { name:'Premium', price:'$15', period:'per month', color:'#a855f7', badge:'BEST',
    desc:'Unlimited. Explicit. Irresistible. The full experience.',
    features:['Unlimited replies daily','Full explicit content','Premium AI — highest quality','Irresistible CTAs always','Re-engage cold clients','Photo compliment AI','Location awareness','Priority support'] },
]

const DEMO_REPLIES = [
  { tone:'Flirty', text:"That honestly caught me off guard — in the best way. You have this habit of saying exactly what I didn't know I needed to hear. What else are you holding back on me?" },
  { tone:'Playful', text:"Okay you can't just drop something like that and leave me hanging. I want the full story, don't you dare leave anything out." },
  { tone:'Warm', text:"That actually made me smile. I feel like you get me in a way most people don't, which is rare. What made you think to say that?" },
  { tone:'Confident', text:"Bold move. I respect it. Now tell me — is that how you are with everyone or am I getting something special here?" },
]

export default function LandingPage() {
  const [step, setStep] = useState('home')
  const [email, setEmail] = useState('')
  const [referral, setReferral] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(false)
  const [demoMsg, setDemoMsg] = useState('')
  const [demoReplies, setDemoReplies] = useState<any[]>([])
  const [demoTyping, setDemoTyping] = useState<number|null>(null)
  const [typedText, setTypedText] = useState('')
  const [scrollY, setScrollY] = useState(0)
  const [reviewStars, setReviewStars] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewSent, setReviewSent] = useState(false)
  const reviewsRef = useRef<HTMLDivElement>(null)
  const S = (x:any) => ({...x}) // style helper

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const el = reviewsRef.current
    if (!el) return
    let frame: number
    let pos = 0
    const scroll = () => { pos += 0.4; if (pos >= el.scrollWidth/2) pos = 0; el.scrollLeft = pos; frame = requestAnimationFrame(scroll) }
    frame = requestAnimationFrame(scroll)
    el.addEventListener('mouseenter', () => cancelAnimationFrame(frame))
    el.addEventListener('mouseleave', () => { frame = requestAnimationFrame(scroll) })
    return () => cancelAnimationFrame(frame)
  }, [])

  async function handleSignup() {
    if (!email || !email.includes('@')) { setMsg('Valid email required'); setMsgOk(false); return }
    setLoading(true); setMsg('')
    try {
      const r = await fetch(API + '/api/auth/magic-link', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: email.toLowerCase().trim(), referralCode: referral || undefined })
      })
      const d = await r.json()
      if (d.success) setStep('sent')
      else { setMsg(d.error || 'Something went wrong'); setMsgOk(false) }
    } catch { setMsg('Connection error. Try again.'); setMsgOk(false) }
    setLoading(false)
  }

  async function handleForgot() {
    if (!email || !email.includes('@')) { setMsg('Email required'); setMsgOk(false); return }
    setLoading(true); setMsg('')
    try {
      const r = await fetch(API + '/api/auth/magic-link', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      })
      const d = await r.json()
      if (d.success) { setMsg('Sign-in link sent. Check your email.'); setMsgOk(true) }
      else { setMsg(d.error || 'Error'); setMsgOk(false) }
    } catch { setMsg('Connection error'); setMsgOk(false) }
    setLoading(false)
  }

  function showDemo() {
    setDemoReplies(DEMO_REPLIES)
  }

  async function demoType(text: string, idx: number) {
    setDemoTyping(idx); setTypedText('')
    for (let i = 0; i <= text.length; i++) {
      await new Promise(r => setTimeout(r, 28 + Math.random() * 38))
      setTypedText(text.slice(0, i))
    }
    setDemoTyping(null)
  }

  async function submitReview() {
    if (!reviewStars || !reviewText) return
    await fetch(API + '/api/user/feedback', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ stars: reviewStars, message: reviewText, platform: 'landing' })
    }).catch(()=>{})
    setReviewSent(true)
  }

  const btn = (label:string, onClick:()=>void, style?:any) => (
    <button onClick={onClick} style={{padding:'13px 32px',background:'linear-gradient(135deg,#7c3aed,#9333ea,#d4a300)',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer',fontFamily:'sans-serif',boxShadow:'0 6px 24px rgba(124,58,237,0.35)',transition:'all 0.2s',...style}}
      onMouseEnter={e=>{(e.currentTarget as any).style.transform='translateY(-2px)';(e.currentTarget as any).style.boxShadow='0 10px 32px rgba(124,58,237,0.5)'}}
      onMouseLeave={e=>{(e.currentTarget as any).style.transform='';(e.currentTarget as any).style.boxShadow='0 6px 24px rgba(124,58,237,0.35)'}}>
      {label}
    </button>
  )

  // ── Sent Screen ───────────────────────────────────────────────────────────
  if (step === 'sent') return (
    <div style={{minHeight:'100vh',background:'#06060f',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Georgia,serif'}}>
      <div style={{textAlign:'center',padding:'48px 32px',maxWidth:'480px'}}>
        <div style={{width:'72px',height:'72px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'32px',margin:'0 auto 24px'}}>📧</div>
        <h2 style={{color:'#a855f7',marginBottom:'14px',fontSize:'26px',fontWeight:'400',letterSpacing:'-0.5px'}}>Check your email</h2>
        <p style={{color:'#71767b',lineHeight:'1.7',marginBottom:'10px',fontSize:'15px',fontFamily:'sans-serif'}}>
          We sent a magic link to <b style={{color:'#e2e8f0'}}>{email}</b>
        </p>
        <p style={{color:'#444460',fontSize:'13px',fontFamily:'sans-serif',marginBottom:'28px'}}>Click the link to activate your account. It expires in 1 hour.</p>
        <button onClick={()=>setStep('home')} style={{padding:'10px 24px',background:'transparent',border:'1px solid #1e1e32',borderRadius:'8px',color:'#71767b',cursor:'pointer',fontFamily:'sans-serif',fontSize:'13px'}}>← Back to home</button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#06060f',color:'#e2e8f0',fontFamily:'Georgia,serif',overflowX:'hidden'}}>

      {/* ── Ambient Glow ──────────────────────────────────────────── */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        <div style={{position:'absolute',top:'-15%',left:'-10%',width:'55vw',height:'55vw',background:'radial-gradient(circle,rgba(124,58,237,0.07) 0%,transparent 70%)',borderRadius:'50%'}} />
        <div style={{position:'absolute',top:'35%',right:'-12%',width:'45vw',height:'45vw',background:'radial-gradient(circle,rgba(212,163,0,0.04) 0%,transparent 70%)',borderRadius:'50%'}} />
        <div style={{position:'absolute',bottom:'10%',left:'25%',width:'35vw',height:'35vw',background:'radial-gradient(circle,rgba(56,189,248,0.03) 0%,transparent 70%)',borderRadius:'50%'}} />
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,padding:'0 40px',height:'66px',display:'flex',alignItems:'center',justifyContent:'space-between',background:scrollY>30?'rgba(6,6,15,0.97)':'transparent',backdropFilter:scrollY>30?'blur(16px)':'none',borderBottom:scrollY>30?'1px solid rgba(255,255,255,0.04)':'none',transition:'all 0.4s'}}>
        <div style={{display:'flex',alignItems:'center',gap:'11px'}}>
          <div style={{width:'36px',height:'36px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>💬</div>
          <div>
            <div style={{fontWeight:'700',fontSize:'14px',letterSpacing:'0.3px',background:'linear-gradient(135deg,#a855f7,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Chatter's Inner Circle</div>
            <div style={{fontSize:'9px',color:'#444460',fontFamily:'sans-serif',letterSpacing:'1.5px',textTransform:'uppercase'}}>AI Reply Assistant</div>
          </div>
        </div>
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <button onClick={()=>document.getElementById('how-it-works')?.scrollIntoView({behavior:'smooth'})}
            style={{padding:'7px 14px',background:'transparent',border:'none',color:'#71767b',cursor:'pointer',fontFamily:'sans-serif',fontSize:'12px',transition:'color 0.2s'}}
            onMouseEnter={e=>{(e.target as any).style.color='#e2e8f0'}}
            onMouseLeave={e=>{(e.target as any).style.color='#71767b'}}>How it works</button>
          <button onClick={()=>document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'})}
            style={{padding:'7px 14px',background:'transparent',border:'none',color:'#71767b',cursor:'pointer',fontFamily:'sans-serif',fontSize:'12px',transition:'color 0.2s'}}
            onMouseEnter={e=>{(e.target as any).style.color='#e2e8f0'}}
            onMouseLeave={e=>{(e.target as any).style.color='#71767b'}}>Pricing</button>
          <button onClick={()=>setStep('login')}
            style={{padding:'7px 16px',background:'transparent',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'7px',color:'#a0a0b0',cursor:'pointer',fontFamily:'sans-serif',fontSize:'12px',transition:'all 0.2s'}}
            onMouseEnter={e=>{(e.target as any).style.borderColor='rgba(168,85,247,0.4)';(e.target as any).style.color='#a855f7'}}
            onMouseLeave={e=>{(e.target as any).style.borderColor='rgba(255,255,255,0.08)';(e.target as any).style.color='#a0a0b0'}}>Sign In</button>
          <button onClick={()=>setStep('signup')}
            style={{padding:'8px 20px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'8px',color:'#fff',fontWeight:'600',cursor:'pointer',fontFamily:'sans-serif',fontSize:'12px',transition:'all 0.2s'}}
            onMouseEnter={e=>{(e.target as any).style.transform='translateY(-1px)'}}
            onMouseLeave={e=>{(e.target as any).style.transform=''}}>Get Started Free</button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div style={{position:'relative',zIndex:1,maxWidth:'860px',margin:'0 auto',padding:'148px 32px 80px',textAlign:'center'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'6px 18px',background:'rgba(168,85,247,0.08)',border:'1px solid rgba(168,85,247,0.2)',borderRadius:'24px',fontSize:'12px',color:'#a855f7',marginBottom:'28px',fontFamily:'sans-serif',letterSpacing:'0.3px'}}>
          <span style={{width:'6px',height:'6px',background:'#a855f7',borderRadius:'50%',display:'inline-block',animation:'pulse 2s infinite'}} />
          Operators report a 60% improvement in response rates
        </div>
        <h1 style={{fontSize:'clamp(38px,6.5vw,76px)',fontWeight:'400',lineHeight:'1.06',margin:'0 0 22px',letterSpacing:'-3px'}}>
          Replies that make him
          <span style={{display:'block',background:'linear-gradient(135deg,#a855f7 20%,#fbbf24 80%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontStyle:'italic'}}>
            unable to look away
          </span>
        </h1>
        <p style={{fontSize:'17px',color:'#71767b',lineHeight:'1.8',maxWidth:'580px',margin:'0 auto 44px',fontFamily:'sans-serif',fontWeight:'300',letterSpacing:'0.1px'}}>
          CIC is an AI-powered Chrome extension that generates warm, specific, and irresistible replies for women on dating and subscription platforms. Works on 10+ platforms. Completely undetectable.
        </p>
        <div style={{display:'flex',gap:'14px',justifyContent:'center',flexWrap:'wrap',marginBottom:'64px'}}>
          {btn('Start Free — 7 Days Full Access', ()=>setStep('signup'))}
          <button onClick={()=>document.getElementById('demo')?.scrollIntoView({behavior:'smooth'})}
            style={{padding:'13px 28px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'#a0a0b0',fontSize:'14px',cursor:'pointer',fontFamily:'sans-serif',transition:'all 0.2s'}}
            onMouseEnter={e=>{(e.target as any).style.borderColor='rgba(168,85,247,0.3)';(e.target as any).style.color='#a855f7'}}
            onMouseLeave={e=>{(e.target as any).style.borderColor='rgba(255,255,255,0.1)';(e.target as any).style.color='#a0a0b0'}}>
            See it live ↓
          </button>
        </div>

        {/* Stats */}
        <div style={{display:'flex',gap:'56px',justifyContent:'center',flexWrap:'wrap'}}>
          {[['60%','Performance boost'],['10+','Platforms'],['60 WPM','Human typing'],['7 Days','Free trial']].map(([n,l])=>(
            <div key={n} style={{textAlign:'center'}}>
              <div style={{fontSize:'32px',fontWeight:'400',background:'linear-gradient(135deg,#a855f7,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:'-1.5px'}}>{n}</div>
              <div style={{fontSize:'10px',color:'#444460',fontFamily:'sans-serif',letterSpacing:'1.2px',textTransform:'uppercase',marginTop:'5px'}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Platform Strip ────────────────────────────────────────── */}
      <div style={{position:'relative',zIndex:1,borderTop:'1px solid rgba(255,255,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.04)',padding:'18px 32px',background:'rgba(255,255,255,0.01)',marginBottom:'80px'}}>
        <div style={{maxWidth:'900px',margin:'0 auto',display:'flex',alignItems:'center',gap:'32px',overflowX:'auto',scrollbarWidth:'none'}}>
          <span style={{fontSize:'10px',color:'#444460',fontFamily:'sans-serif',letterSpacing:'1.5px',textTransform:'uppercase',flexShrink:0}}>Works on</span>
          {PLATFORMS.map(p=>(
            <span key={p} style={{fontSize:'12px',color:'#71767b',fontFamily:'sans-serif',flexShrink:0,letterSpacing:'0.3px'}}>{p}</span>
          ))}
        </div>
      </div>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <div id="how-it-works" style={{position:'relative',zIndex:1,maxWidth:'900px',margin:'0 auto',padding:'0 32px 100px'}}>
        <div style={{textAlign:'center',marginBottom:'56px'}}>
          <div style={{fontSize:'10px',color:'#a855f7',fontFamily:'sans-serif',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'12px'}}>How It Works</div>
          <h2 style={{fontSize:'clamp(24px,4vw,44px)',fontWeight:'400',letterSpacing:'-1.5px',margin:'0 0 14px'}}>From his message to your reply</h2>
          <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'14px',maxWidth:'480px',margin:'0 auto'}}>Three steps. Under 3 seconds. No one knows you had help.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'1px',background:'rgba(255,255,255,0.04)',borderRadius:'14px',overflow:'hidden'}}>
          {[
            { n:'01', title:'Extension scans the chat', desc:'CIC reads the full conversation, detects his location, identifies photo messages, and builds context — all automatically.' },
            { n:'02', title:'AI generates 4 replies', desc:'Premium AI writes 4 completely different replies in 2 seconds. Each one references something specific he said. No generic responses.' },
            { n:'03', title:'You pick, type, and send', desc:'Click Type — the reply types itself at human speed. Or copy and paste. WPM adjustable from 20 to 120.' },
          ].map((s,i)=>(
            <div key={s.n} style={{background:'#0a0a14',padding:'36px 32px',transition:'all 0.2s'}}
              onMouseEnter={e=>{(e.currentTarget as any).style.background='rgba(124,58,237,0.06)'}}
              onMouseLeave={e=>{(e.currentTarget as any).style.background='#0a0a14'}}>
              <div style={{fontSize:'48px',fontWeight:'300',color:'rgba(168,85,247,0.2)',letterSpacing:'-2px',marginBottom:'16px',fontFamily:'Georgia,serif'}}>{s.n}</div>
              <div style={{fontWeight:'600',fontSize:'15px',marginBottom:'10px',color:'#e2e8f0',letterSpacing:'-0.3px'}}>{s.title}</div>
              <div style={{fontSize:'13px',color:'#71767b',lineHeight:'1.7',fontFamily:'sans-serif'}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────────────── */}
      <div style={{position:'relative',zIndex:1,maxWidth:'960px',margin:'0 auto',padding:'0 32px 100px'}}>
        <div style={{textAlign:'center',marginBottom:'56px'}}>
          <div style={{fontSize:'10px',color:'#a855f7',fontFamily:'sans-serif',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'12px'}}>Features</div>
          <h2 style={{fontSize:'clamp(24px,4vw,44px)',fontWeight:'400',letterSpacing:'-1.5px',margin:0}}>Everything you need to dominate every conversation</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'16px'}}>
          {FEATURES.map(f=>(
            <div key={f.title} style={{background:'rgba(255,255,255,0.015)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',padding:'24px',transition:'all 0.25s',cursor:'default'}}
              onMouseEnter={e=>{const el=e.currentTarget as any;el.style.borderColor='rgba(168,85,247,0.25)';el.style.background='rgba(124,58,237,0.05)';el.style.transform='translateY(-3px)'}}
              onMouseLeave={e=>{const el=e.currentTarget as any;el.style.borderColor='rgba(255,255,255,0.06)';el.style.background='rgba(255,255,255,0.015)';el.style.transform=''}}>
              <div style={{fontSize:'24px',marginBottom:'12px'}}>{f.icon}</div>
              <div style={{fontWeight:'600',fontSize:'14px',marginBottom:'8px',color:'#e2e8f0',letterSpacing:'-0.2px'}}>{f.title}</div>
              <div style={{fontSize:'12px',color:'#71767b',lineHeight:'1.7',fontFamily:'sans-serif'}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Re-engage Spotlight ───────────────────────────────────── */}
      <div style={{position:'relative',zIndex:1,maxWidth:'900px',margin:'0 auto',padding:'0 32px 100px'}}>
        <div style={{background:'linear-gradient(135deg,rgba(234,179,8,0.06),rgba(234,179,8,0.02))',border:'1px solid rgba(234,179,8,0.18)',borderRadius:'16px',padding:'48px',display:'flex',gap:'48px',alignItems:'center',flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:'240px'}}>
            <div style={{display:'inline-block',padding:'4px 12px',background:'rgba(234,179,8,0.1)',border:'1px solid rgba(234,179,8,0.2)',borderRadius:'16px',fontSize:'10px',color:'#fbbf24',fontFamily:'sans-serif',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'18px'}}>Exclusive Feature</div>
            <h3 style={{fontSize:'clamp(20px,3vw,32px)',fontWeight:'400',letterSpacing:'-0.8px',margin:'0 0 14px',color:'#fbbf24'}}>Re-engage Cold Clients</h3>
            <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'14px',lineHeight:'1.75',margin:'0 0 20px'}}>
              When a conversation goes quiet, one click analyzes everything he said and crafts the most intriguing, personalized re-engagement message possible. Men who went quiet for days come back within minutes.
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {['Analyzes full conversation history','Crafts a trigger message unique to him','Makes him feel genuinely thought about'].map(f=>(
                <div key={f} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'#a0a0b0',fontFamily:'sans-serif'}}>
                  <span style={{color:'#fbbf24'}}>✓</span>{f}
                </div>
              ))}
            </div>
          </div>
          <div style={{flexShrink:0,textAlign:'center'}}>
            <div onClick={()=>setStep('signup')} style={{width:'110px',height:'110px',background:'rgba(234,179,8,0.08)',border:'2px solid rgba(234,179,8,0.25)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'6px',cursor:'pointer',transition:'all 0.3s',margin:'0 auto'}}
              onMouseEnter={e=>{const el=e.currentTarget as any;el.style.background='rgba(234,179,8,0.15)';el.style.borderColor='rgba(234,179,8,0.5)';el.style.transform='scale(1.06)'}}
              onMouseLeave={e=>{const el=e.currentTarget as any;el.style.background='rgba(234,179,8,0.08)';el.style.borderColor='rgba(234,179,8,0.25)';el.style.transform=''}}>
              <span style={{fontSize:'32px'}}>🔥</span>
              <span style={{fontSize:'10px',color:'#fbbf24',fontFamily:'sans-serif',fontWeight:'700',letterSpacing:'0.5px'}}>RE-ENGAGE</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live Demo ─────────────────────────────────────────────── */}
      <div id="demo" style={{position:'relative',zIndex:1,maxWidth:'880px',margin:'0 auto',padding:'0 32px 100px'}}>
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <div style={{fontSize:'10px',color:'#a855f7',fontFamily:'sans-serif',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'12px'}}>Live Demo</div>
          <h2 style={{fontSize:'clamp(22px,3.5vw,40px)',fontWeight:'400',letterSpacing:'-1px',margin:'0 0 10px'}}>See it before you sign up</h2>
          <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'13px'}}>Type something he said and see what CIC would generate. These are real reply styles.</p>
        </div>
        <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'16px',overflow:'hidden',boxShadow:'0 32px 80px rgba(0,0,0,0.4)'}}>
          <div style={{padding:'12px 20px',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'28px',height:'28px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>💬</div>
            <span style={{fontSize:'11px',fontWeight:'600',fontFamily:'sans-serif',color:'#a855f7',letterSpacing:'0.5px'}}>CIC PREVIEW</span>
            <span style={{marginLeft:'auto',fontSize:'9px',color:'#22c55e',fontFamily:'sans-serif',padding:'3px 10px',background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:'10px'}}>● SAMPLE</span>
          </div>
          <div style={{padding:'24px'}}>
            <div style={{marginBottom:'14px'}}>
              <div style={{fontSize:'10px',color:'#71767b',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif',marginBottom:'6px'}}>His message</div>
              <div style={{display:'flex',gap:'8px'}}>
                <input value={demoMsg} onChange={e=>setDemoMsg(e.target.value)} placeholder="Type what he said..."
                  style={{flex:1,background:'#0a0a14',border:'1px solid rgba(124,58,237,0.15)',borderRadius:'8px',padding:'11px 14px',color:'#e2e8f0',fontSize:'13px',fontFamily:'sans-serif',outline:'none',transition:'border-color 0.2s'}}
                  onFocus={e=>{e.target.style.borderColor='rgba(168,85,247,0.4)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(124,58,237,0.15)'}} />
                <button onClick={demoMsg.trim()?showDemo:()=>setStep('signup')}
                  style={{padding:'11px 18px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'8px',color:'#fff',fontWeight:'600',cursor:'pointer',fontFamily:'sans-serif',fontSize:'13px',flexShrink:0}}>
                  Generate
                </button>
              </div>
            </div>

            {demoReplies.length > 0 ? (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                  <span style={{fontSize:'10px',color:'#71767b',fontFamily:'sans-serif',textTransform:'uppercase',letterSpacing:'1px'}}>Sample replies</span>
                  <button onClick={showDemo} style={{fontSize:'10px',color:'#a855f7',background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.15)',borderRadius:'5px',padding:'3px 10px',cursor:'pointer',fontFamily:'sans-serif'}}>↻ New samples</button>
                </div>
                {demoReplies.map((r,i)=>(
                  <div key={i} style={{background:'#0a0a14',border:'1px solid rgba(255,255,255,0.05)',borderRadius:'10px',padding:'14px',marginBottom:'10px',transition:'all 0.2s'}}
                    onMouseEnter={e=>{const el=e.currentTarget as any;el.style.borderColor='rgba(168,85,247,0.2)';el.style.background='rgba(124,58,237,0.04)'}}
                    onMouseLeave={e=>{const el=e.currentTarget as any;el.style.borderColor='rgba(255,255,255,0.05)';el.style.background='#0a0a14'}}>
                    <div style={{fontSize:'9px',fontWeight:'700',color:'#a855f7',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif',marginBottom:'6px'}}>{r.tone}</div>
                    <div style={{fontSize:'13px',color:'#e2e8f0',lineHeight:'1.6',marginBottom:'10px',fontFamily:'sans-serif'}}>
                      {demoTyping===i?typedText:r.text}
                      {demoTyping===i&&<span style={{borderRight:'2px solid #a855f7',marginLeft:'1px'}}> </span>}
                    </div>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button onClick={()=>demoType(r.text,i)} disabled={demoTyping!==null}
                        style={{flex:1,padding:'6px',background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.18)',borderRadius:'6px',color:demoTyping===i?'#22c55e':'#a855f7',fontSize:'11px',cursor:demoTyping!==null?'not-allowed':'pointer',fontFamily:'sans-serif'}}>
                        {demoTyping===i?'Typing...':'▶ Type'}
                      </button>
                      <button onClick={()=>navigator.clipboard.writeText(r.text)}
                        style={{flex:1,padding:'6px',background:'rgba(212,163,0,0.06)',border:'1px solid rgba(212,163,0,0.18)',borderRadius:'6px',color:'#d4a300',fontSize:'11px',cursor:'pointer',fontFamily:'sans-serif'}}>
                        ⎘ Copy
                      </button>
                      <div style={{display:'flex',alignItems:'center',gap:'4px',opacity:0.3}} title="WPM control — sign up to unlock">
                        <div style={{background:'#1a1a2e',width:'20px',height:'20px',borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',color:'#a855f7'}}>−</div>
                        <span style={{fontSize:'10px',color:'#71767b',fontFamily:'sans-serif',minWidth:'42px',textAlign:'center'}}>60 WPM</span>
                        <div style={{background:'#1a1a2e',width:'20px',height:'20px',borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',color:'#a855f7'}}>+</div>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{marginTop:'14px',padding:'18px',background:'rgba(168,85,247,0.05)',border:'1px solid rgba(168,85,247,0.15)',borderRadius:'10px',textAlign:'center'}}>
                  <p style={{color:'#e2e8f0',fontSize:'13px',fontFamily:'sans-serif',margin:'0 0 4px',fontWeight:'600'}}>These are sample replies. Real ones are tailored to his exact words.</p>
                  <p style={{color:'#71767b',fontSize:'11px',fontFamily:'sans-serif',margin:'0 0 14px'}}>Sign up free — 7 days unlimited. One account per email.</p>
                  {btn('Create Free Account →', ()=>setStep('signup'), {padding:'10px 28px',fontSize:'13px'})}
                </div>
              </div>
            ) : (
              <div style={{textAlign:'center',padding:'28px',color:'#444460',fontFamily:'sans-serif',fontSize:'13px'}}>
                Type something he said above and click Generate to see sample replies.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Pricing ───────────────────────────────────────────────── */}
      <div id="pricing" style={{position:'relative',zIndex:1,maxWidth:'1000px',margin:'0 auto',padding:'0 32px 100px'}}>
        <div style={{textAlign:'center',marginBottom:'52px'}}>
          <div style={{fontSize:'10px',color:'#a855f7',fontFamily:'sans-serif',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'12px'}}>Pricing</div>
          <h2 style={{fontSize:'clamp(24px,4vw,44px)',fontWeight:'400',letterSpacing:'-1.5px',margin:'0 0 12px'}}>Start free. Upgrade when ready.</h2>
          <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'14px'}}>No credit card for the free trial. Cancel anytime.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:'18px',marginBottom:'40px'}}>
          {PLANS.map((p,i)=>(
            <div key={p.name} style={{background:'rgba(255,255,255,0.015)',border:`1px solid ${i===2?'rgba(168,85,247,0.3)':'rgba(255,255,255,0.06)'}`,borderRadius:'14px',padding:'30px',position:'relative',transition:'all 0.25s',boxShadow:i===2?'0 0 48px rgba(168,85,247,0.08)':''}}
              onMouseEnter={e=>{const el=e.currentTarget as any;el.style.transform='translateY(-5px)';el.style.boxShadow=`0 20px 56px ${p.color}18`;el.style.borderColor=p.color+'60'}}
              onMouseLeave={e=>{const el=e.currentTarget as any;el.style.transform='';el.style.boxShadow=i===2?'0 0 48px rgba(168,85,247,0.08)':'';el.style.borderColor=i===2?'rgba(168,85,247,0.3)':'rgba(255,255,255,0.06)'}}>
              {p.badge&&<div style={{position:'absolute',top:'16px',right:'16px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',padding:'3px 10px',borderRadius:'10px',fontSize:'9px',fontWeight:'700',color:'#fff',fontFamily:'sans-serif',letterSpacing:'1px'}}>{p.badge}</div>}
              <div style={{color:p.color,fontWeight:'600',fontSize:'11px',fontFamily:'sans-serif',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'10px'}}>{p.name}</div>
              <div style={{fontSize:'40px',fontWeight:'400',letterSpacing:'-2px',marginBottom:'2px'}}>{p.price}</div>
              <div style={{color:'#444460',fontSize:'11px',fontFamily:'sans-serif',marginBottom:'12px'}}>{p.period}</div>
              <p style={{color:'#71767b',fontSize:'12px',fontFamily:'sans-serif',lineHeight:'1.6',marginBottom:'22px',minHeight:'40px'}}>{p.desc}</p>
              <div style={{borderTop:'1px solid rgba(255,255,255,0.04)',paddingTop:'20px',marginBottom:'24px'}}>
                {p.features.map(f=>(
                  <div key={f} style={{display:'flex',gap:'8px',marginBottom:'10px',fontSize:'12px',color:'#a0a0b0',fontFamily:'sans-serif',alignItems:'flex-start'}}>
                    <span style={{color:p.color,flexShrink:0,marginTop:'1px'}}>✓</span>{f}
                  </div>
                ))}
              </div>
              <button onClick={()=>setStep('signup')}
                style={{width:'100%',padding:'11px',background:i===2?'linear-gradient(135deg,#7c3aed,#d4a300)':'transparent',border:`1px solid ${p.color}55`,borderRadius:'8px',color:i===2?'#fff':p.color,cursor:'pointer',fontWeight:'600',fontSize:'13px',fontFamily:'sans-serif',transition:'all 0.2s'}}
                onMouseEnter={e=>{if(i!==2)(e.target as any).style.background=p.color+'12'}}
                onMouseLeave={e=>{if(i!==2)(e.target as any).style.background='transparent'}}>
                {i===0?'Start Free Trial':i===1?'Get Basic':'Get Premium'}
              </button>
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div style={{textAlign:'center'}}>
          <p style={{color:'#444460',fontSize:'11px',fontFamily:'sans-serif',marginBottom:'14px',textTransform:'uppercase',letterSpacing:'1px'}}>Accepted payments</p>
          <div style={{display:'flex',gap:'10px',justifyContent:'center',flexWrap:'wrap'}}>
            {[{icon:'📱',name:'M-Pesa Paybill',sub:'Kenya'},{icon:'₿',name:'Cryptocurrency',sub:'BTC, ETH, USDT'},{icon:'🅿️',name:'PayPal',sub:'International'}].map(pm=>(
              <div key={pm.name} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 16px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:'8px',transition:'all 0.2s'}}
                onMouseEnter={e=>{const el=e.currentTarget as any;el.style.borderColor='rgba(168,85,247,0.2)';el.style.background='rgba(124,58,237,0.04)'}}
                onMouseLeave={e=>{const el=e.currentTarget as any;el.style.borderColor='rgba(255,255,255,0.05)';el.style.background='rgba(255,255,255,0.02)'}}>
                <span style={{fontSize:'18px'}}>{pm.icon}</span>
                <div>
                  <div style={{fontSize:'11px',fontFamily:'sans-serif',fontWeight:'600',color:'#e2e8f0'}}>{pm.name}</div>
                  <div style={{fontSize:'10px',color:'#444460',fontFamily:'sans-serif'}}>{pm.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{color:'#333350',fontSize:'11px',fontFamily:'sans-serif',marginTop:'12px'}}>Payment details sent privately to your email after upgrade request. Never shown publicly.</p>
        </div>
      </div>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <div style={{position:'relative',zIndex:1,padding:'0 0 100px'}}>
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <div style={{fontSize:'10px',color:'#a855f7',fontFamily:'sans-serif',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'12px'}}>Testimonials</div>
          <h2 style={{fontSize:'clamp(22px,3.5vw,40px)',fontWeight:'400',letterSpacing:'-1px',margin:0}}>Operators love CIC</h2>
        </div>
        <div ref={reviewsRef} style={{display:'flex',gap:'16px',overflowX:'auto',padding:'0 32px 8px',scrollbarWidth:'none',cursor:'grab',userSelect:'none'}}>
          {[...REVIEWS,...REVIEWS].map((r,i)=>(
            <div key={i} style={{flexShrink:0,width:'300px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:'12px',padding:'22px',transition:'all 0.2s'}}
              onMouseEnter={e=>{const el=e.currentTarget as any;el.style.borderColor='rgba(168,85,247,0.18)';el.style.background='rgba(124,58,237,0.04)'}}
              onMouseLeave={e=>{const el=e.currentTarget as any;el.style.borderColor='rgba(255,255,255,0.05)';el.style.background='rgba(255,255,255,0.02)'}}>
              <div style={{display:'flex',gap:'2px',marginBottom:'12px'}}>
                {'★★★★★'.split('').map((_,si)=><span key={si} style={{color:'#fbbf24',fontSize:'13px'}}>★</span>)}
              </div>
              <p style={{color:'#c0c0d0',fontSize:'13px',fontFamily:'sans-serif',lineHeight:'1.65',margin:'0 0 14px'}}>"{r.text}"</p>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'36px',height:'36px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'700',color:'#fff',fontFamily:'sans-serif',flexShrink:0}}>{r.av}</div>
                <div>
                  <div style={{fontSize:'12px',fontWeight:'600',fontFamily:'sans-serif',color:'#e2e8f0'}}>{r.name}</div>
                  <div style={{fontSize:'10px',color:'#444460',fontFamily:'sans-serif'}}>{r.role} · {r.time}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Leave a review */}
        <div style={{maxWidth:'480px',margin:'40px auto 0',padding:'0 32px'}}>
          <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:'12px',padding:'24px'}}>
            {reviewSent?(
              <div style={{textAlign:'center',padding:'16px 0'}}>
                <div style={{fontSize:'28px',marginBottom:'8px'}}>🙏</div>
                <p style={{color:'#22c55e',fontFamily:'sans-serif',fontSize:'13px',margin:0}}>Thank you for your review!</p>
              </div>
            ):(
              <>
                <h4 style={{margin:'0 0 14px',fontSize:'14px',fontWeight:'400',color:'#a855f7',letterSpacing:'-0.3px'}}>Leave a review</h4>
                <div style={{display:'flex',gap:'6px',marginBottom:'12px'}}>
                  {[1,2,3,4,5].map(s=>(
                    <span key={s} onClick={()=>setReviewStars(s)} style={{fontSize:'24px',cursor:'pointer',color:s<=reviewStars?'#fbbf24':'#1e1e32',transition:'color 0.15s'}}>★</span>
                  ))}
                </div>
                <textarea placeholder="Share your experience..." value={reviewText} onChange={e=>setReviewText(e.target.value)} rows={3}
                  style={{width:'100%',background:'#0a0a14',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'7px',padding:'9px 12px',color:'#e2e8f0',fontSize:'12px',fontFamily:'sans-serif',resize:'none',outline:'none',boxSizing:'border-box' as any,marginBottom:'10px'}} />
                <button onClick={submitReview} disabled={!reviewStars||!reviewText}
                  style={{width:'100%',padding:'9px',background:!reviewStars||!reviewText?'rgba(124,58,237,0.15)':'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'7px',color:'#fff',fontWeight:'600',cursor:!reviewStars||!reviewText?'not-allowed':'pointer',fontFamily:'sans-serif',fontSize:'12px'}}>
                  Submit Review
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Referral ──────────────────────────────────────────────── */}
      <div style={{position:'relative',zIndex:1,maxWidth:'580px',margin:'0 auto',padding:'0 32px 100px',textAlign:'center'}}>
        <div style={{background:'rgba(234,179,8,0.04)',border:'1px solid rgba(234,179,8,0.14)',borderRadius:'14px',padding:'36px',transition:'all 0.2s'}}
          onMouseEnter={e=>{const el=e.currentTarget as any;el.style.borderColor='rgba(234,179,8,0.28)';el.style.background='rgba(234,179,8,0.07)'}}
          onMouseLeave={e=>{const el=e.currentTarget as any;el.style.borderColor='rgba(234,179,8,0.14)';el.style.background='rgba(234,179,8,0.04)'}}>
          <div style={{fontSize:'32px',marginBottom:'12px'}}>🎁</div>
          <h3 style={{color:'#fbbf24',marginBottom:'10px',fontSize:'20px',fontWeight:'400',letterSpacing:'-0.5px'}}>Refer Friends, Earn Premium Free</h3>
          <p style={{color:'#71767b',fontSize:'13px',lineHeight:'1.7',margin:'0 0 8px',fontFamily:'sans-serif'}}>
            Every referral earns <b style={{color:'#fbbf24'}}>150 points</b>. Collect <b style={{color:'#fbbf24'}}>1,500 points</b> and get 1 month Premium free — worth $15.
          </p>
          <p style={{color:'#444460',fontSize:'11px',fontFamily:'sans-serif',margin:0}}>Your referral code appears in your dashboard after signup.</p>
        </div>
      </div>

      {/* ── CTA Banner ────────────────────────────────────────────── */}
      <div style={{position:'relative',zIndex:1,maxWidth:'800px',margin:'0 auto',padding:'0 32px 100px',textAlign:'center'}}>
        <div style={{background:'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(212,163,0,0.06))',border:'1px solid rgba(124,58,237,0.2)',borderRadius:'16px',padding:'56px 48px'}}>
          <h2 style={{fontSize:'clamp(24px,4vw,44px)',fontWeight:'400',letterSpacing:'-1.5px',margin:'0 0 14px'}}>Ready to change the way you work?</h2>
          <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'14px',margin:'0 0 32px',lineHeight:'1.7'}}>
            Join operators already using CIC to generate more replies, faster, with better results. 7 days free — no credit card.
          </p>
          {btn('Start Free Today', ()=>setStep('signup'), {padding:'16px 48px',fontSize:'15px'})}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div style={{position:'relative',zIndex:1,borderTop:'1px solid rgba(255,255,255,0.04)',padding:'36px 32px'}}>
        <div style={{maxWidth:'900px',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'30px',height:'30px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>💬</div>
            <div>
              <div style={{fontWeight:'700',fontSize:'12px',background:'linear-gradient(135deg,#a855f7,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Chatter's Inner Circle</div>
              <div style={{fontSize:'10px',color:'#444460',fontFamily:'sans-serif'}}>© 2026 — AI Reply Assistant</div>
            </div>
          </div>
          <div style={{display:'flex',gap:'24px',alignItems:'center'}}>
            <a href="mailto:whwva47@gmail.com" style={{fontSize:'12px',color:'#444460',fontFamily:'sans-serif',textDecoration:'none',transition:'color 0.2s'}}
              onMouseEnter={e=>{(e.target as any).style.color='#a855f7'}}
              onMouseLeave={e=>{(e.target as any).style.color='#444460'}}>Support</a>
            <span style={{fontSize:'12px',color:'#333350',fontFamily:'sans-serif'}}>whwva47@gmail.com</span>
          </div>
        </div>
      </div>

      {/* ── Signup / Login Modal ───────────────────────────────────── */}
      {(step==='signup'||step==='login'||step==='forgot')&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',backdropFilter:'blur(12px)'}}>
          <div style={{width:'100%',maxWidth:'390px',background:'#0a0a14',border:'1px solid rgba(168,85,247,0.2)',borderRadius:'16px',padding:'36px',position:'relative',boxShadow:'0 40px 100px rgba(0,0,0,0.8)'}}>
            <button onClick={()=>{setStep('home');setMsg('');setEmail('')}} style={{position:'absolute',top:'14px',right:'14px',background:'none',border:'none',color:'#444460',cursor:'pointer',fontSize:'18px',lineHeight:1}}>✕</button>
            <div style={{textAlign:'center',marginBottom:'26px'}}>
              <div style={{width:'44px',height:'44px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'12px',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'20px',marginBottom:'12px'}}>💬</div>
              <h2 style={{color:'#a855f7',margin:'0 0 4px',fontSize:'18px',fontWeight:'400',letterSpacing:'-0.5px'}}>
                {step==='forgot'?'Get a new sign-in link':step==='login'?'Welcome back':'Create your account'}
              </h2>
              <p style={{color:'#71767b',margin:0,fontSize:'12px',fontFamily:'sans-serif'}}>
                {step==='signup'?'7 days free. One account per email.':step==='login'?'Enter your email — we\'ll send a link.':'Enter your email below.'}
              </p>
            </div>

            <div style={{marginBottom:'14px'}}>
              <label style={{display:'block',fontSize:'10px',color:'#71767b',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif'}}>Email Address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&(step==='forgot'?handleForgot():handleSignup())}
                placeholder="your@email.com" autoFocus
                style={{width:'100%',background:'#06060f',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'11px 14px',color:'#e2e8f0',fontSize:'13px',fontFamily:'sans-serif',outline:'none',boxSizing:'border-box' as any,transition:'border-color 0.2s'}}
                onFocus={e=>{e.target.style.borderColor='rgba(168,85,247,0.4)'}}
                onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)'}} />
            </div>

            {step==='signup'&&(
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block',fontSize:'10px',color:'#71767b',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif'}}>Referral Code (optional)</label>
                <input type="text" value={referral} onChange={e=>setReferral(e.target.value)} placeholder="Enter referral code"
                  style={{width:'100%',background:'#06060f',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'11px 14px',color:'#e2e8f0',fontSize:'13px',fontFamily:'sans-serif',outline:'none',boxSizing:'border-box' as any,transition:'border-color 0.2s'}}
                  onFocus={e=>{e.target.style.borderColor='rgba(168,85,247,0.4)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)'}} />
              </div>
            )}

            {msg&&<div style={{fontSize:'12px',marginBottom:'12px',fontFamily:'sans-serif',color:msgOk?'#22c55e':'#f43f5e',padding:'8px 12px',background:msgOk?'rgba(34,197,94,0.06)':'rgba(244,63,94,0.06)',borderRadius:'6px',border:`1px solid ${msgOk?'rgba(34,197,94,0.2)':'rgba(244,63,94,0.2)'}`}}>{msg}</div>}

            <button onClick={step==='forgot'?handleForgot:handleSignup} disabled={loading}
              style={{width:'100%',padding:'12px',background:loading?'rgba(124,58,237,0.3)':'linear-gradient(135deg,#7c3aed,#9333ea,#d4a300)',border:'none',borderRadius:'9px',color:'#fff',fontSize:'14px',fontWeight:'600',cursor:loading?'not-allowed':'pointer',fontFamily:'sans-serif',boxShadow:loading?'none':'0 4px 16px rgba(124,58,237,0.25)',transition:'all 0.2s'}}>
              {loading?'Sending...':`Send Magic Link →`}
            </button>

            <div style={{textAlign:'center',marginTop:'14px',fontSize:'11px',fontFamily:'sans-serif',display:'flex',flexDirection:'column',gap:'7px'}}>
              {step==='signup'&&<span style={{color:'#444460'}}>Already have an account? <span onClick={()=>setStep('login')} style={{color:'#a855f7',cursor:'pointer'}}>Sign in</span></span>}
              {step==='login'&&<span style={{color:'#444460'}}>New here? <span onClick={()=>setStep('signup')} style={{color:'#a855f7',cursor:'pointer'}}>Create a free account</span></span>}
              {step==='login'&&<span onClick={()=>setStep('forgot')} style={{color:'#555570',cursor:'pointer',textDecoration:'underline'}}>Didn't get the link? Send again</span>}
              {step==='forgot'&&<span onClick={()=>setStep('login')} style={{color:'#a855f7',cursor:'pointer'}}>← Back to sign in</span>}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#06060f}
        ::-webkit-scrollbar-thumb{background:#1e1e32;border-radius:2px}
        ::selection{background:rgba(168,85,247,0.3)}
      `}</style>
    </div>
  )
}
