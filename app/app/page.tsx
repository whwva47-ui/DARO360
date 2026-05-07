'use client'
import { useState, useEffect, useRef } from 'react'

const API = ''

const TONES = [
  { id:'warm', label:'Warm', icon:'☀', color:'#fbbf24', desc:'Emotionally intelligent. Makes him feel genuinely seen.' },
  { id:'flirty', label:'Flirty', icon:'✦', color:'#f472b6', desc:'Playful tension. Keeps him wanting more.' },
  { id:'confident', label:'Confident', icon:'◈', color:'#a855f7', desc:'Direct. Knows her worth. Draws him in.' },
  { id:'playful', label:'Playful', icon:'◎', color:'#38bdf8', desc:'Light and fun. Makes conversations easy.' },
  { id:'spicy', label:'Spicy', icon:'🔥', color:'#f97316', desc:'Bold and suggestive. For when he is ready.' },
  { id:'empathetic', label:'Empathetic', icon:'◉', color:'#22c55e', desc:'Deep understanding. Builds real connection.' },
  { id:'teasing', label:'Teasing', icon:'◇', color:'#e879f9', desc:'Playful challenge. Keeps him on his toes.' },
  { id:'naughty', label:'Naughty', icon:'◆', color:'#f43f5e', desc:'Explicit and direct. Pro plan only.' },
]

const SITUATIONS = [
  { id:'compliment', label:'He sent a compliment', msg:"You are honestly the most interesting woman I've talked to in months" },
  { id:'personal', label:'He opened up personally', msg:"I just got out of a 6 year relationship and I don't know who I am anymore" },
  { id:'location', label:'He asked where you are', msg:"Where are you located? I'm in Chicago and wondering if you're close" },
  { id:'bold', label:'He got bold and direct', msg:"I want you. I've been thinking about you all day" },
  { id:'photo', label:'He sent a photo', msg:"[SENT A PHOTO — write a specific genuine compliment about what he looks like]" },
  { id:'cold', label:'He went quiet', msg:"[Re-engage — this conversation has gone cold for 3 days, bring him back]" },
  { id:'meetup', label:'He pushed for a meetup', msg:"I really want to meet you this weekend. Can we make it happen?" },
  { id:'custom', label:'Custom message', msg:'' },
]

const SAMPLE_REPLIES: Record<string, Record<string, string>> = {
  compliment: {
    warm: "That actually means something coming from you — I can tell you don't just say that. What is it about our conversations that keeps pulling you back?",
    flirty: "I've been thinking the same thing about you and I wasn't going to say it first. What does that tell you?",
    confident: "I appreciate that. Honestly I feel the same — there's something about the way you think that I don't run into often. What are you like when no one is watching?",
    playful: "Months? Now I need to know what the competition was like... actually don't answer that. What made today different?",
    spicy: "You have no idea what that does to me when you say things like that. Keep going.",
    empathetic: "The way you said that — there's something genuine in it that I actually feel. What made you want to tell me?",
    teasing: "Interesting. And what exactly are you hoping I do with that information?",
    naughty: "You keep saying things like that and I'm going to start getting very specific ideas about you.",
  },
  personal: {
    warm: "Six years is a whole chapter. Losing that isn't just losing a person — it's losing the version of yourself that lived inside that relationship. What does a good day look like for you right now?",
    flirty: "The fact that you told me that before most people would... I think that says more about who you are than six years ever could. What do you actually want right now?",
    confident: "You just said something most men take months to admit. That kind of honesty is rare. What are you looking for on the other side of all this?",
    playful: "Okay but not knowing who you are is honestly the most interesting place to be — you get to decide. If you could pick one thing to be true about yourself right now, what would it be?",
    spicy: "There's something incredibly attractive about a man who's honest about where he is. What does starting fresh feel like for you?",
    empathetic: "I think not knowing who you are after something like that is the most honest place to be. Most people pretend they're fine. What parts of yourself have you been missing?",
    teasing: "Six years and you came and told me first. I'm choosing to think that means something.",
    naughty: "Fresh start, new possibilities... I like where this is going. What's the first thing you want to do differently?",
  },
  location: {
    warm: "Not too far actually — I'm about 40 minutes outside the city, Naperville side. Do you spend much time downtown or more of a neighborhood person?",
    flirty: "Close enough that the time zone isn't a problem. Why, are you trying to figure something out about me?",
    confident: "I'm in the suburbs — that western stretch near the city. What made you want to know?",
    playful: "Close enough. Now I want to know if you're a deep dish or thin crust person because that tells me everything.",
    spicy: "Close enough to make things interesting. What exactly are you planning?",
    empathetic: "I'm nearby — western suburbs. Do you know the city well or are you still figuring out your favorite spots?",
    teasing: "Closer than you'd expect. Does that change anything for you?",
    naughty: "Close enough. What's going through your head right now?",
  },
  bold: {
    warm: "The way you just said that... I've been thinking about you too. I just wasn't going to say it first. What started it for you?",
    flirty: "All day is a long time. Tell me what you were thinking — I want the honest version, not the edited one.",
    confident: "I've been thinking about you too. I wasn't going to say it first but here we are. Tell me what you want.",
    playful: "All day? During meetings, during lunch, during everything? What specifically keeps coming back?",
    spicy: "You just made the room feel different. Tell me exactly what you've been thinking.",
    empathetic: "I love that you just said that the way you did. That kind of directness is rare. What is it about me that stays with you?",
    teasing: "All day. So I've been living rent-free in your head. What do you want to do about that?",
    naughty: "All day is a very long time. I want to hear every single thing that went through your mind.",
  },
  photo: {
    warm: "The way you're looking at the camera like you're daring it to blink first — I felt that. There's something really confident in this shot.",
    flirty: "Okay you can't just send me something like this and expect me to just carry on normally. What were you thinking when you took this?",
    confident: "I studied this for longer than I should admit. There's something in your eyes that tells a whole story. What's going on behind them?",
    playful: "Wait, hold on. Let me look at this properly. Okay — I have questions. Several of them.",
    spicy: "This is dangerous. You know that, right?",
    empathetic: "Thank you for sharing this. There's something really open about this photo — like you're actually letting me see you. I appreciate that.",
    teasing: "I'm going to need a minute with this. Don't go anywhere.",
    naughty: "This did something to me that I'm not going to pretend didn't happen.",
  },
  cold: {
    warm: "I keep thinking about what you said about your sister and whether things got easier. Some conversations just stay with me.",
    flirty: "I was going to wait for you to come back but then I thought — why am I doing that? I missed talking to you.",
    confident: "Something you said last week has been sitting with me and I haven't been able to shake it.",
    playful: "Okay I'm checking on you. Not in a weird way. In a 'you were funny and then you disappeared' way.",
    spicy: "I've been thinking about our last conversation more than I expected to. You left before I was done.",
    empathetic: "I don't know where you went but I hope things are okay. I noticed when you stopped being here.",
    teasing: "You're either very busy or testing me. I'm choosing to believe busy.",
    naughty: "You just disappeared right when things were getting interesting. That's not allowed.",
  },
  meetup: {
    warm: "I really appreciate you saying that — it means more than you know. I'm pretty private about where I am and I'm not ready for that step yet, but I love that this feels real enough that you'd want it. Tell me more about what the weekend looks like for you.",
    flirty: "God, the fact that you actually want to makes me feel something. I'm not there yet — I protect my space carefully — but keep talking to me like this and things could change.",
    confident: "I hear you and I wish I could say yes. I keep this part of my life private — it's just how I am. But you make me wish things were different. What else can I give you right now?",
    playful: "Look at you, making plans. I love the energy but I'm not a meet-in-person person just yet — I need to know someone inside out first. Are we getting there?",
    spicy: "The thought of that is doing things to me that I can not describe. I'm private about where I am — I keep those worlds separate — but you're making that very hard right now.",
    empathetic: "I can feel how much you mean that and it genuinely touches me. I'm not ready to meet yet — I have to protect myself — but the fact that you want to tells me a lot about how real this is.",
    teasing: "Oh so we're making plans now. I love that confidence. I keep my personal space very guarded — it takes time with me. But I'm curious what you'd do if I said yes someday.",
    naughty: "That image is not helping me stay focused right now. I keep my real life very separate — it's a boundary I hold tightly — but you keep pushing it in all the right ways.",
  },
}

export default function AppPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('home')
  const [selectedTone, setSelectedTone] = useState('warm')
  const [selectedSituation, setSelectedSituation] = useState('compliment')
  const [customMsg, setCustomMsg] = useState('')
  const [activeWindow, setActiveWindow] = useState<string|null>(null)
  const [generating, setGenerating] = useState(false)
  const [replies, setReplies] = useState<any[]>([])
  const [typingIdx, setTypingIdx] = useState<number|null>(null)
  const [typedText, setTypedText] = useState('')
  const [reengageResult, setReengageResult] = useState('')
  const [reengageLoading, setReengageLoading] = useState(false)
  const [savedReplies, setSavedReplies] = useState<any[]>([])
  const [msgCount, setMsgCount] = useState(0)

  useEffect(() => {
    // Check for Supabase magic link token in URL hash
    const hash = window.location.hash
    if (hash.includes('access_token=') && hash.includes('type=magiclink')) {
      try {
        const params = new URLSearchParams(hash.slice(1))
        const accessToken = params.get('access_token')
        if (accessToken) {
          const payload = JSON.parse(atob(accessToken.split('.')[1]))
          if (payload.email) {
            localStorage.setItem('cic_email', payload.email)
            localStorage.setItem('cic_plan', 'trial')
            // Clean the URL
            window.history.replaceState({}, '', '/app')
          }
        }
      } catch(e) {}
    }

    // Get user from storage
    const stored = localStorage.getItem('cic_email')
    const plan = localStorage.getItem('cic_plan')

    if (stored) {
      setUser({ email: stored, plan: plan || 'trial' })
      // Fetch real plan from server
      fetch(API + '/api/user/profile', { headers: { 'X-User-Email': stored } })
        .then(r => r.json())
        .then(d => {
          if (d.email) {
            setUser(d)
            localStorage.setItem('cic_plan', d.plan)
          }
        })
        .catch(() => {})
    } else {
      window.location.href = '/'
      return
    }
    setLoading(false)
  }, [])

  const currentSituation = SITUATIONS.find(s => s.id === selectedSituation)!
  const currentMsg = selectedSituation === 'custom' ? customMsg : currentSituation.msg
  const sampleReplies = SAMPLE_REPLIES[selectedSituation]
  const currentSampleReply = sampleReplies ? (sampleReplies[selectedTone] || sampleReplies.warm) : ''

  async function generate() {
    const msg = currentMsg
    if (!msg || !msg.trim()) return
    setGenerating(true)
    setReplies([])
    try {
      const r = await fetch(API + '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': user?.plan === 'pro' ? 'pro_key' : 'test_key' },
        body: JSON.stringify({
          message: msg,
          pageContext: { platform: 'chathomebase', messages: [] },
          preferredTone: selectedTone,
        })
      })
      const d = await r.json()
      if (d.replies?.length) setReplies(d.replies)
      setMsgCount(c => c + 1)
    } catch { }
    setGenerating(false)
  }

  async function typeReply(text: string, idx: number) {
    setTypingIdx(idx); setTypedText('')
    for (let i = 0; i <= text.length; i++) {
      await new Promise(r => setTimeout(r, 24 + Math.random() * 32))
      setTypedText(text.slice(0, i))
    }
    setTypingIdx(null)
  }

  function saveReply(reply: any) {
    const saved = [...savedReplies, { ...reply, savedAt: new Date().toISOString() }]
    setSavedReplies(saved)
    if (typeof window !== 'undefined') localStorage.setItem('cic_saved', JSON.stringify(saved))
  }

  function signOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cic_email')
      localStorage.removeItem('cic_plan')
      window.location.href = '/'
    }
  }

  const planColor = user?.plan === 'pro' ? '#a855f7' : user?.plan === 'basic' ? '#38bdf8' : '#fbbf24'
  const planLabel = user?.plan === 'pro' ? 'Pro' : user?.plan === 'basic' ? 'Basic' : 'Free Trial'

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#06060f',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:'32px',height:'32px',border:'2px solid rgba(168,85,247,0.2)',borderTopColor:'#a855f7',borderRadius:'50%',animation:'spin 0.7s linear infinite'}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#06060f',color:'#e2e8f0',fontFamily:"'Georgia',serif",display:'flex'}}>

      {/* Ambient glow */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        <div style={{position:'absolute',top:'10%',left:'15%',width:'40vw',height:'40vw',background:'radial-gradient(circle,rgba(124,58,237,0.05) 0%,transparent 70%)',borderRadius:'50%'}} />
        <div style={{position:'absolute',bottom:'20%',right:'10%',width:'30vw',height:'30vw',background:'radial-gradient(circle,rgba(212,163,0,0.03) 0%,transparent 70%)',borderRadius:'50%'}} />
      </div>

      {/* Sidebar */}
      <div style={{width:'220px',flexShrink:0,background:'rgba(8,8,16,0.95)',borderRight:'1px solid rgba(255,255,255,0.04)',display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,bottom:0,zIndex:50}}>
        {/* Logo */}
        <div style={{padding:'20px 18px 16px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'9px'}}>
            <div style={{width:'30px',height:'30px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',flexShrink:0}}>💬</div>
            <div>
              <div style={{fontSize:'11px',fontWeight:'700',background:'linear-gradient(135deg,#a855f7,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1.2}}>Chatter's Inner Circle</div>
              <div style={{fontSize:'9px',color:'#444460',fontFamily:'sans-serif',letterSpacing:'0.5px',marginTop:'2px'}}>Operator Dashboard</div>
            </div>
          </div>
        </div>

        {/* User */}
        <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
          <div style={{fontSize:'11px',color:'#71767b',fontFamily:'sans-serif',marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as any}}>{user?.email}</div>
          <div style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'2px 8px',background:`${planColor}15`,border:`1px solid ${planColor}30`,borderRadius:'10px'}}>
            <span style={{width:'5px',height:'5px',background:planColor,borderRadius:'50%',display:'inline-block'}} />
            <span style={{fontSize:'10px',fontFamily:'sans-serif',fontWeight:'600',color:planColor}}>{planLabel}</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:'12px 10px',overflowY:'auto'}}>
          {[
            {id:'home',icon:'◈',label:'Dashboard'},
            {id:'generate',icon:'✦',label:'Chat Agent'},
            {id:'tones',icon:'◎',label:'Tones & Styles'},
            {id:'situations',icon:'◇',label:'Situation Scripts'},
            {id:'saved',icon:'⭐',label:'Saved Replies'},
            {id:'guide',icon:'📖',label:'Operator Guide',href:'/guide'},
            {id:'upgrade',icon:'⬆',label:user?.plan==='pro'?'Pro Active':'Upgrade to Pro'},
          ].map(item => (
            item.href ? (
              <a key={item.id} href={item.href} style={{display:'flex',alignItems:'center',gap:'9px',padding:'9px 10px',borderRadius:'8px',textDecoration:'none',color:'#71767b',fontFamily:'sans-serif',fontSize:'12px',transition:'all 0.2s',marginBottom:'2px'}}
                onMouseEnter={e=>{(e.currentTarget as any).style.background='rgba(255,255,255,0.04)';(e.currentTarget as any).style.color='#e2e8f0'}}
                onMouseLeave={e=>{(e.currentTarget as any).style.background='transparent';(e.currentTarget as any).style.color='#71767b'}}>
                <span style={{fontSize:'14px',minWidth:'18px',textAlign:'center'}}>{item.icon}</span>{item.label}
              </a>
            ) : (
              <button key={item.id} onClick={()=>setActiveSection(item.id)} style={{display:'flex',alignItems:'center',gap:'9px',padding:'9px 10px',borderRadius:'8px',background:activeSection===item.id?'rgba(168,85,247,0.1)':'transparent',border:`1px solid ${activeSection===item.id?'rgba(168,85,247,0.2)':'transparent'}`,color:activeSection===item.id?'#a855f7':'#71767b',cursor:'pointer',fontFamily:'sans-serif',fontSize:'12px',width:'100%',textAlign:'left',transition:'all 0.2s',marginBottom:'2px'}}
                onMouseEnter={e=>{if(activeSection!==item.id){(e.currentTarget as any).style.background='rgba(255,255,255,0.04)';(e.currentTarget as any).style.color='#e2e8f0'}}}
                onMouseLeave={e=>{if(activeSection!==item.id){(e.currentTarget as any).style.background='transparent';(e.currentTarget as any).style.color='#71767b'}}}>
                <span style={{fontSize:'14px',minWidth:'18px',textAlign:'center'}}>{item.icon}</span>{item.label}
              </button>
            )
          ))}
        </nav>

        {/* Sign out */}
        <div style={{padding:'12px 10px',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
          <button onClick={signOut} style={{display:'flex',alignItems:'center',gap:'9px',padding:'9px 10px',borderRadius:'8px',background:'transparent',border:'none',color:'#444460',cursor:'pointer',fontFamily:'sans-serif',fontSize:'12px',width:'100%',textAlign:'left',transition:'all 0.2s'}}
            onMouseEnter={e=>{(e.currentTarget as any).style.color='#f43f5e'}}
            onMouseLeave={e=>{(e.currentTarget as any).style.color='#444460'}}>
            ← Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{marginLeft:'220px',flex:1,minHeight:'100vh',position:'relative',zIndex:1}}>

        {/* ── DASHBOARD ── */}
        {activeSection === 'home' && (
          <div style={{padding:'40px 40px'}}>
            <div style={{marginBottom:'32px'}}>
              <h1 style={{fontSize:'28px',fontWeight:'400',letterSpacing:'-0.8px',margin:'0 0 6px'}}>Good to have you back</h1>
              <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'13px',margin:0}}>Your AI reply assistant is ready. Pick a section to get started.</p>
            </div>

            {/* Stats */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'12px',marginBottom:'36px'}}>
              {[
                {label:'Plan',value:planLabel,color:planColor},
                {label:'Replies Generated',value:msgCount.toString(),color:'#a855f7'},
                {label:'Tones Available',value:user?.plan==='pro'?'8':'7',color:'#38bdf8'},
                {label:'Saved Replies',value:savedReplies.length.toString(),color:'#fbbf24'},
              ].map(s=>(
                <div key={s.label} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:'10px',padding:'16px',transition:'all 0.2s'}}
                  onMouseEnter={e=>{(e.currentTarget as any).style.borderColor=s.color+'30'}}
                  onMouseLeave={e=>{(e.currentTarget as any).style.borderColor='rgba(255,255,255,0.05)'}}>
                  <div style={{fontSize:'9px',color:'#444460',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif',marginBottom:'6px'}}>{s.label}</div>
                  <div style={{fontSize:'24px',fontWeight:'400',color:s.color,letterSpacing:'-0.5px'}}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{marginBottom:'32px'}}>
              <div style={{fontSize:'9px',color:'#444460',textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'sans-serif',marginBottom:'14px'}}>Quick Start</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'12px'}}>
                {[
                  {icon:'✦',title:'Generate a Reply',desc:'Pick a situation, choose a tone, get instant replies',action:()=>setActiveSection('generate'),color:'#a855f7'},
                  {icon:'◎',title:'Explore Tones',desc:'See all 8 reply styles with live examples',action:()=>setActiveSection('tones'),color:'#f472b6'},
                  {icon:'◇',title:'Situation Scripts',desc:'Pre-built scripts for every common scenario',action:()=>setActiveSection('situations'),color:'#fbbf24'},
                  {icon:'⭐',title:'Saved Replies',desc:'Your bank of best replies ready to use',action:()=>setActiveSection('saved'),color:'#22c55e'},
                ].map(a=>(
                  <button key={a.title} onClick={a.action} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:'12px',padding:'20px',textAlign:'left',cursor:'pointer',transition:'all 0.25s'}}
                    onMouseEnter={e=>{const el=e.currentTarget as any;el.style.borderColor=a.color+'35';el.style.background=`${a.color}08`;el.style.transform='translateY(-2px)'}}
                    onMouseLeave={e=>{const el=e.currentTarget as any;el.style.borderColor='rgba(255,255,255,0.05)';el.style.background='rgba(255,255,255,0.02)';el.style.transform=''}}>
                    <div style={{fontSize:'20px',marginBottom:'10px',color:a.color}}>{a.icon}</div>
                    <div style={{fontFamily:'sans-serif',fontWeight:'600',fontSize:'13px',marginBottom:'4px',color:'#e2e8f0'}}>{a.title}</div>
                    <div style={{fontFamily:'sans-serif',fontSize:'11px',color:'#71767b',lineHeight:'1.5'}}>{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Extension downloads */}
            <div style={{marginBottom:'24px'}}>
              <div style={{fontSize:'9px',color:'#444460',textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'sans-serif',marginBottom:'14px'}}>Chrome Extensions</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                {[
                  {name:'CIC — Texting Factory',desc:'For chathomebase.com and Texting Factory',icon:'💬',platforms:'Texting Factory · ChatHomeBase'},
                  {name:'CIC — General Platforms',desc:'For all other dating platforms',icon:'🌐',platforms:'OnlyFans · Fansly · Alpha.date · LoyalFans · FanCentro · AdmireMe · FanVue · ManyVids'},
                ].map((ext,i)=>(
                  <div key={i} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px',padding:'16px',textAlign:'center'}}>
                    <div style={{fontSize:'24px',marginBottom:'8px'}}>{ext.icon}</div>
                    <div style={{fontFamily:'sans-serif',fontWeight:'600',fontSize:'12px',color:'#e2e8f0',marginBottom:'4px'}}>{ext.name}</div>
                    <div style={{fontFamily:'sans-serif',fontSize:'10px',color:'#71767b',marginBottom:'4px'}}>{ext.desc}</div>
                    <div style={{fontFamily:'sans-serif',fontSize:'9px',color:'#444460',marginBottom:'12px',lineHeight:'1.5'}}>{ext.platforms}</div>
                    <a href={'mailto:whwva47@gmail.com?subject=Extension Download Request - ' + ext.name + '&body=Please send me the download link for ' + ext.name + '. My registered email is: ' + (user?.email||'')}
                      style={{display:'block',padding:'7px',background:'rgba(168,85,247,0.08)',border:'1px solid rgba(168,85,247,0.2)',borderRadius:'6px',color:'#a855f7',fontSize:'11px',fontFamily:'sans-serif',textDecoration:'none',fontWeight:'600'}}>
                      Request Download Link
                    </a>
                  </div>
                ))}
              </div>
              <div style={{marginTop:'10px',padding:'10px 14px',background:'rgba(34,197,94,0.04)',border:'1px solid rgba(34,197,94,0.12)',borderRadius:'7px',fontSize:'11px',color:'#71767b',fontFamily:'sans-serif'}}>
                📧 Email <a href="mailto:whwva47@gmail.com" style={{color:'#22c55e',textDecoration:'none'}}>whwva47@gmail.com</a> with your registered email to receive your download links instantly.
              </div>
            </div>

            {/* Floating windows hint */}
            <div style={{background:'rgba(168,85,247,0.05)',border:'1px solid rgba(168,85,247,0.12)',borderRadius:'10px',padding:'16px 20px',display:'flex',alignItems:'center',gap:'14px'}}>
              <span style={{fontSize:'20px'}}>💡</span>
              <p style={{fontFamily:'sans-serif',fontSize:'12px',color:'#71767b',margin:0,lineHeight:'1.6'}}>
                <b style={{color:'#a855f7'}}>Tip:</b> In the Tones section, click any tone card to open a floating preview window. You can open multiple tones side by side to compare reply styles before choosing.
              </p>
            </div>
          </div>
        )}

        {/* ── GENERATE ── */}
        {activeSection === 'generate' && (
          <div style={{padding:'40px'}}>
            <div style={{marginBottom:'28px'}}>
              <h2 style={{fontSize:'24px',fontWeight:'400',letterSpacing:'-0.5px',margin:'0 0 6px'}}>Chat Agent</h2>
              <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'13px',margin:0}}>Choose a situation, pick a tone, and generate real replies instantly.</p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:'24px',maxWidth:'1000px'}}>

              {/* Left — controls */}
              <div>
                {/* Situation picker */}
                <div style={{marginBottom:'20px'}}>
                  <div style={{fontSize:'9px',color:'#71767b',textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'sans-serif',marginBottom:'10px'}}>Situation</div>
                  <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                    {SITUATIONS.map(s=>(
                      <button key={s.id} onClick={()=>{setSelectedSituation(s.id);setReplies([])}} style={{padding:'9px 12px',background:selectedSituation===s.id?'rgba(168,85,247,0.1)':'rgba(255,255,255,0.02)',border:`1px solid ${selectedSituation===s.id?'rgba(168,85,247,0.3)':'rgba(255,255,255,0.05)'}`,borderRadius:'7px',color:selectedSituation===s.id?'#a855f7':'#71767b',cursor:'pointer',fontFamily:'sans-serif',fontSize:'12px',textAlign:'left',transition:'all 0.15s'}}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom message */}
                {selectedSituation === 'custom' && (
                  <div style={{marginBottom:'20px'}}>
                    <div style={{fontSize:'9px',color:'#71767b',textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'sans-serif',marginBottom:'8px'}}>His Message</div>
                    <textarea value={customMsg} onChange={e=>setCustomMsg(e.target.value)} placeholder="Paste what he said..." rows={3}
                      style={{width:'100%',background:'#0a0a14',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'10px 12px',color:'#e2e8f0',fontSize:'12px',fontFamily:'sans-serif',resize:'none',outline:'none',boxSizing:'border-box' as any}} />
                  </div>
                )}

                {/* Tone picker */}
                <div style={{marginBottom:'20px'}}>
                  <div style={{fontSize:'9px',color:'#71767b',textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'sans-serif',marginBottom:'10px'}}>Tone</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px'}}>
                    {TONES.filter(t=>user?.plan==='pro'||t.id!=='naughty').map(t=>(
                      <button key={t.id} onClick={()=>setSelectedTone(t.id)} style={{padding:'8px 10px',background:selectedTone===t.id?`${t.color}15`:'rgba(255,255,255,0.02)',border:`1px solid ${selectedTone===t.id?t.color+'40':'rgba(255,255,255,0.05)'}`,borderRadius:'7px',color:selectedTone===t.id?t.color:'#71767b',cursor:'pointer',fontFamily:'sans-serif',fontSize:'11px',textAlign:'left',transition:'all 0.15s',display:'flex',alignItems:'center',gap:'6px'}}>
                        <span style={{fontSize:'13px'}}>{t.icon}</span>{t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={generate} disabled={generating||(!currentMsg.trim())} style={{width:'100%',padding:'12px',background:generating?'rgba(124,58,237,0.2)':'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'9px',color:'#fff',fontWeight:'600',fontSize:'13px',cursor:generating?'not-allowed':'pointer',fontFamily:'sans-serif'}}>
                  {generating ? '⟳ Generating...' : '✦ Generate Replies'}
                </button>
              </div>

              {/* Right — replies */}
              <div>
                {/* Message preview */}
                {currentMsg && (
                  <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:'10px',padding:'14px 16px',marginBottom:'16px'}}>
                    <div style={{fontSize:'9px',color:'#444460',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif',marginBottom:'6px'}}>His message</div>
                    <div style={{fontSize:'13px',color:'#c0c0d0',fontFamily:'sans-serif',lineHeight:'1.6',fontStyle:'italic'}}>"{currentMsg}"</div>
                  </div>
                )}

                {/* Generated replies */}
                {replies.length > 0 && (
                  <div>
                    <div style={{fontSize:'9px',color:'#444460',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif',marginBottom:'10px'}}>Generated Replies</div>
                    {replies.map((r,i)=>(
                      <div key={i} style={{background:'#0a0a14',border:'1px solid rgba(255,255,255,0.05)',borderRadius:'10px',padding:'14px',marginBottom:'10px',transition:'all 0.2s'}}
                        onMouseEnter={e=>{const el=e.currentTarget as any;el.style.borderColor='rgba(168,85,247,0.2)';el.style.background='rgba(124,58,237,0.04)'}}
                        onMouseLeave={e=>{const el=e.currentTarget as any;el.style.borderColor='rgba(255,255,255,0.05)';el.style.background='#0a0a14'}}>
                        <div style={{fontSize:'9px',fontWeight:'700',color:'#a855f7',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif',marginBottom:'8px'}}>{r.tone}</div>
                        <div style={{fontSize:'13px',color:'#e2e8f0',lineHeight:'1.65',marginBottom:'10px',fontFamily:'sans-serif',minHeight:'40px'}}>
                          {typingIdx===i?typedText:r.text}
                          {typingIdx===i&&<span style={{borderRight:'2px solid #a855f7',marginLeft:'1px'}}> </span>}
                        </div>
                        <div style={{display:'flex',gap:'6px'}}>
                          <button onClick={()=>typeReply(r.text,i)} disabled={typingIdx!==null} style={{flex:1,padding:'6px',background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.18)',borderRadius:'6px',color:typingIdx===i?'#22c55e':'#a855f7',fontSize:'11px',cursor:typingIdx!==null?'not-allowed':'pointer',fontFamily:'sans-serif'}}>
                            {typingIdx===i?'Typing...':'▶ Type'}
                          </button>
                          <button onClick={()=>navigator.clipboard.writeText(r.text)} style={{flex:1,padding:'6px',background:'rgba(212,163,0,0.06)',border:'1px solid rgba(212,163,0,0.18)',borderRadius:'6px',color:'#d4a300',fontSize:'11px',cursor:'pointer',fontFamily:'sans-serif'}}>⎘ Copy</button>
                          <button onClick={()=>saveReply(r)} style={{flex:1,padding:'6px',background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.18)',borderRadius:'6px',color:'#22c55e',fontSize:'11px',cursor:'pointer',fontFamily:'sans-serif'}}>⭐ Save</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sample preview when no replies generated */}
                {!replies.length && !generating && currentSampleReply && (
                  <div style={{background:'rgba(168,85,247,0.04)',border:'1px solid rgba(168,85,247,0.1)',borderRadius:'10px',padding:'18px'}}>
                    <div style={{fontSize:'9px',color:'#a855f7',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif',marginBottom:'8px'}}>Sample — {TONES.find(t=>t.id===selectedTone)?.label} tone</div>
                    <div style={{fontSize:'13px',color:'#c0c0d0',lineHeight:'1.7',fontFamily:'sans-serif',marginBottom:'12px',fontStyle:'italic'}}>"{currentSampleReply}"</div>
                    <p style={{color:'#444460',fontSize:'11px',fontFamily:'sans-serif',margin:0}}>This is a sample. Click Generate above for real AI replies tailored to your conversation.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TONES ── */}
        {activeSection === 'tones' && (
          <div style={{padding:'40px'}}>
            <div style={{marginBottom:'28px'}}>
              <h2 style={{fontSize:'24px',fontWeight:'400',letterSpacing:'-0.5px',margin:'0 0 6px'}}>Tones & Styles</h2>
              <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'13px',margin:0}}>Click any tone card to open a floating window. Open multiple to compare side by side.</p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'14px'}}>
              {TONES.filter(t=>user?.plan==='pro'||t.id!=='naughty').map(t=>(
                <div key={t.id} onClick={()=>setActiveWindow(activeWindow===t.id?null:t.id)}
                  style={{background:activeWindow===t.id?`${t.color}12`:'rgba(255,255,255,0.02)',border:`1px solid ${activeWindow===t.id?t.color+'40':'rgba(255,255,255,0.06)'}`,borderRadius:'12px',padding:'22px',cursor:'pointer',transition:'all 0.25s'}}
                  onMouseEnter={e=>{const el=e.currentTarget as any;el.style.transform='translateY(-3px)';el.style.borderColor=t.color+'40';el.style.boxShadow=`0 12px 32px ${t.color}12`}}
                  onMouseLeave={e=>{const el=e.currentTarget as any;el.style.transform='';el.style.borderColor=activeWindow===t.id?t.color+'40':'rgba(255,255,255,0.06)';el.style.boxShadow=''}}>
                  <div style={{fontSize:'28px',marginBottom:'10px',color:t.color}}>{t.icon}</div>
                  <div style={{fontWeight:'600',fontSize:'14px',marginBottom:'5px',color:'#e2e8f0'}}>{t.label}</div>
                  <div style={{fontSize:'11px',color:'#71767b',fontFamily:'sans-serif',lineHeight:'1.5',marginBottom:'12px'}}>{t.desc}</div>
                  <div style={{fontSize:'10px',color:t.color,fontFamily:'sans-serif',fontWeight:'600'}}>
                    {activeWindow===t.id?'✕ Close preview':'Click to preview →'}
                  </div>
                </div>
              ))}
            </div>

            {/* Floating preview windows */}
            {activeWindow && (() => {
              const tone = TONES.find(t=>t.id===activeWindow)!
              const sampleSit = SITUATIONS[0]
              const reply = SAMPLE_REPLIES[sampleSit.id][activeWindow] || SAMPLE_REPLIES[sampleSit.id].warm
              return (
                <div style={{position:'fixed',bottom:'32px',right:'32px',width:'360px',background:'#0d0d1a',border:`1px solid ${tone.color}40`,borderRadius:'14px',boxShadow:`0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px ${tone.color}15`,zIndex:100,overflow:'hidden'}}>
                  <div style={{padding:'14px 16px',borderBottom:`1px solid ${tone.color}20`,display:'flex',alignItems:'center',justifyContent:'space-between',background:`${tone.color}08`}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span style={{fontSize:'18px',color:tone.color}}>{tone.icon}</span>
                      <span style={{fontSize:'13px',fontWeight:'600',color:tone.color}}>{tone.label} Tone</span>
                    </div>
                    <button onClick={()=>setActiveWindow(null)} style={{background:'none',border:'none',color:'#71767b',cursor:'pointer',fontSize:'16px',lineHeight:1}}>✕</button>
                  </div>
                  <div style={{padding:'16px'}}>
                    <div style={{fontSize:'10px',color:'#444460',fontFamily:'sans-serif',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'1px'}}>Situation</div>
                    <div style={{fontSize:'11px',color:'#71767b',fontFamily:'sans-serif',marginBottom:'14px',fontStyle:'italic'}}>"{sampleSit.msg}"</div>
                    <div style={{fontSize:'10px',color:tone.color,fontFamily:'sans-serif',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'1px'}}>CIC Reply</div>
                    <div style={{fontSize:'13px',color:'#e2e8f0',lineHeight:'1.7',fontFamily:'sans-serif',marginBottom:'14px',background:`${tone.color}06`,border:`1px solid ${tone.color}15`,borderRadius:'8px',padding:'12px'}}>
                      "{reply}"
                    </div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button onClick={()=>navigator.clipboard.writeText(reply)} style={{flex:1,padding:'8px',background:`${tone.color}10`,border:`1px solid ${tone.color}25`,borderRadius:'7px',color:tone.color,fontSize:'11px',cursor:'pointer',fontFamily:'sans-serif'}}>⎘ Copy</button>
                      <button onClick={()=>{setSelectedTone(activeWindow);setActiveSection('generate')}} style={{flex:1,padding:'8px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'7px',color:'#a0a0b0',fontSize:'11px',cursor:'pointer',fontFamily:'sans-serif'}}>Use this tone →</button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ── SITUATIONS ── */}
        {activeSection === 'situations' && (
          <div style={{padding:'40px'}}>
            <div style={{marginBottom:'28px'}}>
              <h2 style={{fontSize:'24px',fontWeight:'400',letterSpacing:'-0.5px',margin:'0 0 6px'}}>Situation Scripts</h2>
              <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'13px',margin:0}}>Pre-built reply strategies for every common scenario operators face.</p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:'16px'}}>
              {SITUATIONS.filter(s=>s.id!=='custom').map(sit=>{
                const replies = SAMPLE_REPLIES[sit.id]
                const toneKeys = Object.keys(replies||{}).slice(0,3)
                return (
                  <div key={sit.id} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:'12px',padding:'20px',transition:'all 0.2s'}}
                    onMouseEnter={e=>{const el=e.currentTarget as any;el.style.borderColor='rgba(168,85,247,0.2)';el.style.background='rgba(124,58,237,0.03)'}}
                    onMouseLeave={e=>{const el=e.currentTarget as any;el.style.borderColor='rgba(255,255,255,0.05)';el.style.background='rgba(255,255,255,0.02)'}}>
                    <div style={{fontWeight:'600',fontSize:'13px',marginBottom:'8px',color:'#e2e8f0'}}>{sit.label}</div>
                    <div style={{fontSize:'11px',color:'#71767b',fontFamily:'sans-serif',marginBottom:'14px',fontStyle:'italic',lineHeight:'1.5'}}>"{sit.msg.length>80?sit.msg.substring(0,80)+'...':sit.msg}"</div>
                    <div style={{display:'flex',gap:'6px',flexWrap:'wrap' as any,marginBottom:'12px'}}>
                      {toneKeys.map(tk=>{
                        const tone = TONES.find(t=>t.id===tk)
                        return tone ? <span key={tk} style={{padding:'2px 8px',background:`${tone.color}12`,border:`1px solid ${tone.color}25`,borderRadius:'10px',fontSize:'10px',color:tone.color,fontFamily:'sans-serif'}}>{tone.label}</span> : null
                      })}
                    </div>
                    <button onClick={()=>{setSelectedSituation(sit.id);setActiveSection('generate')}} style={{width:'100%',padding:'8px',background:'rgba(168,85,247,0.08)',border:'1px solid rgba(168,85,247,0.2)',borderRadius:'7px',color:'#a855f7',fontSize:'12px',cursor:'pointer',fontFamily:'sans-serif',fontWeight:'600'}}>
                      Generate replies for this →
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── SAVED ── */}
        {activeSection === 'saved' && (
          <div style={{padding:'40px'}}>
            <div style={{marginBottom:'28px'}}>
              <h2 style={{fontSize:'24px',fontWeight:'400',letterSpacing:'-0.5px',margin:'0 0 6px'}}>Saved Replies</h2>
              <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'13px',margin:0}}>Your bank of best replies. Save from any generation to build your library.</p>
            </div>
            {savedReplies.length === 0 ? (
              <div style={{textAlign:'center',padding:'64px 32px',color:'#444460',fontFamily:'sans-serif'}}>
                <div style={{fontSize:'32px',marginBottom:'12px'}}>⭐</div>
                <div style={{fontSize:'14px',marginBottom:'6px',color:'#71767b'}}>No saved replies yet</div>
                <div style={{fontSize:'12px'}}>Generate replies and click ⭐ Save to build your library</div>
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'12px'}}>
                {savedReplies.map((r,i)=>(
                  <div key={i} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:'10px',padding:'16px'}}>
                    <div style={{fontSize:'9px',fontWeight:'700',color:'#a855f7',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif',marginBottom:'8px'}}>{r.tone}</div>
                    <div style={{fontSize:'12px',color:'#c0c0d0',fontFamily:'sans-serif',lineHeight:'1.65',marginBottom:'12px'}}>{r.text}</div>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button onClick={()=>navigator.clipboard.writeText(r.text)} style={{flex:1,padding:'6px',background:'rgba(212,163,0,0.06)',border:'1px solid rgba(212,163,0,0.18)',borderRadius:'6px',color:'#d4a300',fontSize:'11px',cursor:'pointer',fontFamily:'sans-serif'}}>⎘ Copy</button>
                      <button onClick={()=>setSavedReplies(savedReplies.filter((_,si)=>si!==i))} style={{padding:'6px 10px',background:'rgba(244,63,94,0.06)',border:'1px solid rgba(244,63,94,0.18)',borderRadius:'6px',color:'#f43f5e',fontSize:'11px',cursor:'pointer',fontFamily:'sans-serif'}}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── UPGRADE ── */}
        {activeSection === 'upgrade' && (
          <div style={{padding:'40px',maxWidth:'520px'}}>
            <div style={{marginBottom:'28px'}}>
              <h2 style={{fontSize:'24px',fontWeight:'400',letterSpacing:'-0.5px',margin:'0 0 6px'}}>{user?.plan==='pro'?'Pro Plan Active':'Upgrade to Pro'}</h2>
              <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'13px',margin:0}}>
                {user?.plan==='pro'?'Your account has full unlimited access.':'Unlock unlimited replies, explicit content, and premium AI quality.'}
              </p>
            </div>
            {user?.plan === 'pro' ? (
              <div style={{background:'rgba(168,85,247,0.06)',border:'1px solid rgba(168,85,247,0.2)',borderRadius:'12px',padding:'28px',textAlign:'center'}}>
                <div style={{fontSize:'32px',marginBottom:'12px'}}>✓</div>
                <div style={{color:'#a855f7',fontWeight:'600',fontSize:'16px',marginBottom:'8px'}}>Pro Plan Active</div>
                <div style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'13px'}}>You have unlimited access to all features including explicit content and premium AI.</div>
              </div>
            ) : (
              <div>
                <div style={{background:'rgba(212,163,0,0.05)',border:'1px solid rgba(212,163,0,0.15)',borderRadius:'10px',padding:'18px',marginBottom:'20px',fontSize:'13px',fontFamily:'sans-serif'}}>
                  <div style={{color:'#fbbf24',fontWeight:'600',marginBottom:'10px'}}>$15/month — Pro Plan</div>
                  {['Unlimited daily replies','Full explicit content','Premium AI quality','All 8 tones including Naughty','Priority support'].map(f=>(
                    <div key={f} style={{display:'flex',gap:'8px',marginBottom:'7px',color:'#a0a0b0',alignItems:'center'}}>
                      <span style={{color:'#fbbf24'}}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px',padding:'16px',marginBottom:'16px',fontSize:'12px',color:'#71767b',fontFamily:'sans-serif'}}>
                  <div style={{color:'#e2e8f0',fontWeight:'600',marginBottom:'8px'}}>Payment — M-Pesa</div>
                  <div>📱 Paybill: <b style={{color:'#e2e8f0'}}>522522</b></div>
                  <div style={{marginTop:'4px'}}>Account: <b style={{color:'#e2e8f0'}}>1280446110</b></div>
                  <div style={{marginTop:'8px',color:'#444460',fontSize:'11px'}}>PayPal and crypto details sent to your email after request.</div>
                </div>
                <a href="mailto:whwva47@gmail.com?subject=Pro Upgrade Request" style={{display:'block',width:'100%',padding:'13px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'9px',color:'#fff',fontWeight:'600',fontSize:'13px',fontFamily:'sans-serif',textAlign:'center',textDecoration:'none',boxSizing:'border-box' as any}}>
                  Request Upgrade — Email Us
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#06060f}
        ::-webkit-scrollbar-thumb{background:#1e1e32;border-radius:2px}
        ::selection{background:rgba(168,85,247,0.3)}
      `}</style>
    </div>
  )
}
