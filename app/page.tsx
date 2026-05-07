'use client'
import { useState } from 'react'

const API = ''

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // Detect Supabase magic link token in URL hash and redirect to /app
  if (typeof window !== 'undefined') {
    const hash = window.location.hash
    if (hash.includes('access_token=') && hash.includes('type=magiclink')) {
      // Extract email from token and store it
      try {
        const params = new URLSearchParams(hash.slice(1))
        const accessToken = params.get('access_token')
        if (accessToken) {
          const payload = JSON.parse(atob(accessToken.split('.')[1]))
          if (payload.email) {
            localStorage.setItem('cic_email', payload.email)
            localStorage.setItem('cic_plan', 'trial')
          }
        }
      } catch(e) {}
      window.location.href = '/app'
    }
  }

  async function handleSubmit() {
    if (!email || !email.includes('@')) { setError('Enter a valid email address'); return }
    setLoading(true); setError('')
    try {
      const r = await fetch(API + '/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      })
      const d = await r.json()
      if (d.success) setSent(true)
      else setError(d.error || 'Something went wrong')
    } catch { setError('Connection error. Try again.') }
    setLoading(false)
  }

  if (sent) return (
    <div style={{minHeight:'100vh',background:'#06060f',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Georgia',serif",padding:'24px'}}>
      <div style={{textAlign:'center',maxWidth:'420px'}}>
        <div style={{width:'64px',height:'64px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',margin:'0 auto 24px'}}>📧</div>
        <h2 style={{color:'#a855f7',fontSize:'26px',fontWeight:'400',letterSpacing:'-0.5px',margin:'0 0 12px'}}>Check your email</h2>
        <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'14px',lineHeight:'1.7',margin:'0 0 8px'}}>
          We sent a magic link to <b style={{color:'#e2e8f0'}}>{email}</b>
        </p>
        <p style={{color:'#444460',fontFamily:'sans-serif',fontSize:'12px',margin:0}}>Click the link to enter the app. It expires in 1 hour.</p>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#06060f',color:'#e2e8f0',fontFamily:"'Georgia',serif",overflowX:'hidden'}}>

      {/* Ambient */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        <div style={{position:'absolute',top:'-20%',left:'-10%',width:'60vw',height:'60vw',background:'radial-gradient(circle,rgba(124,58,237,0.06) 0%,transparent 70%)',borderRadius:'50%'}} />
        <div style={{position:'absolute',bottom:'10%',right:'-10%',width:'50vw',height:'50vw',background:'radial-gradient(circle,rgba(212,163,0,0.04) 0%,transparent 70%)',borderRadius:'50%'}} />
      </div>

      {/* Nav */}
      <nav style={{position:'relative',zIndex:10,padding:'24px 40px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'32px',height:'32px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>💬</div>
          <span style={{fontSize:'13px',fontWeight:'700',background:'linear-gradient(135deg,#a855f7,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Chatter's Inner Circle</span>
        </div>
        <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
          <a href="/guide" style={{fontSize:'12px',color:'#71767b',textDecoration:'none',fontFamily:'sans-serif',transition:'color 0.2s'}}
            onMouseEnter={e=>{(e.target as any).style.color='#e2e8f0'}}
            onMouseLeave={e=>{(e.target as any).style.color='#71767b'}}>Operator Guide</a>
          <button onClick={()=>document.getElementById('signup-box')?.scrollIntoView({behavior:'smooth'})}
            style={{padding:'8px 20px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'8px',color:'#fff',fontWeight:'600',cursor:'pointer',fontFamily:'sans-serif',fontSize:'12px'}}>
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{position:'relative',zIndex:1,maxWidth:'720px',margin:'0 auto',padding:'80px 32px 60px',textAlign:'center'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'5px 16px',background:'rgba(168,85,247,0.08)',border:'1px solid rgba(168,85,247,0.2)',borderRadius:'24px',fontSize:'11px',color:'#a855f7',marginBottom:'28px',fontFamily:'sans-serif',letterSpacing:'0.3px'}}>
          <span style={{width:'5px',height:'5px',background:'#a855f7',borderRadius:'50%',display:'inline-block',animation:'pulse 2s infinite'}} />
          Used by operators across 10+ platforms
        </div>
        <h1 style={{fontSize:'clamp(36px,6vw,68px)',fontWeight:'400',lineHeight:'1.06',margin:'0 0 20px',letterSpacing:'-2.5px'}}>
          Replies that make him
          <span style={{display:'block',background:'linear-gradient(135deg,#a855f7 20%,#fbbf24 80%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontStyle:'italic'}}> unable to stop</span>
        </h1>
        <p style={{fontSize:'16px',color:'#71767b',lineHeight:'1.8',maxWidth:'500px',margin:'0 auto 48px',fontFamily:'sans-serif',fontWeight:'300'}}>
          CIC is a Chrome extension that generates warm, specific, and irresistible replies for operators on dating and subscription platforms. Works on 10 platforms. Completely undetectable.
        </p>

        {/* Stats */}
        <div style={{display:'flex',gap:'48px',justifyContent:'center',flexWrap:'wrap',marginBottom:'64px'}}>
          {[['60%','Better response rate'],['10+','Platforms'],['60 WPM','Human typing'],['7 Days','Free trial']].map(([n,l])=>(
            <div key={n} style={{textAlign:'center'}}>
              <div style={{fontSize:'28px',fontWeight:'400',background:'linear-gradient(135deg,#a855f7,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:'-1px'}}>{n}</div>
              <div style={{fontSize:'10px',color:'#444460',fontFamily:'sans-serif',letterSpacing:'1px',textTransform:'uppercase',marginTop:'4px'}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Signup box */}
        <div id="signup-box" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px',padding:'32px',maxWidth:'420px',margin:'0 auto'}}>
          <h3 style={{fontSize:'18px',fontWeight:'400',margin:'0 0 6px',letterSpacing:'-0.3px'}}>Start your free 7-day trial</h3>
          <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'12px',margin:'0 0 20px'}}>One account per email. Returning operators sign in with the same email.</p>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
            placeholder="your@email.com" autoFocus
            style={{width:'100%',background:'#06060f',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',padding:'12px 14px',color:'#e2e8f0',fontSize:'14px',fontFamily:'sans-serif',outline:'none',boxSizing:'border-box' as any,marginBottom:'10px',transition:'border-color 0.2s'}}
            onFocus={e=>{e.target.style.borderColor='rgba(168,85,247,0.4)'}}
            onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.08)'}} />
          {error && <p style={{color:'#f43f5e',fontFamily:'sans-serif',fontSize:'12px',margin:'0 0 10px'}}>{error}</p>}
          <button onClick={handleSubmit} disabled={loading}
            style={{width:'100%',padding:'13px',background:loading?'rgba(124,58,237,0.3)':'linear-gradient(135deg,#7c3aed,#9333ea,#d4a300)',border:'none',borderRadius:'9px',color:'#fff',fontSize:'14px',fontWeight:'600',cursor:loading?'not-allowed':'pointer',fontFamily:'sans-serif',boxShadow:'0 4px 20px rgba(124,58,237,0.25)'}}>
            {loading ? 'Sending...' : 'Send Magic Link →'}
          </button>
          <p style={{color:'#333350',fontFamily:'sans-serif',fontSize:'11px',margin:'12px 0 0',textAlign:'center'}}>No password. No credit card. Just click the link in your email.</p>
        </div>
      </div>

      {/* Platform strip */}
      <div style={{position:'relative',zIndex:1,borderTop:'1px solid rgba(255,255,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.04)',padding:'16px 32px',background:'rgba(255,255,255,0.01)',marginBottom:'80px'}}>
        <div style={{maxWidth:'900px',margin:'0 auto',display:'flex',alignItems:'center',gap:'28px',overflowX:'auto',scrollbarWidth:'none' as any}}>
          <span style={{fontSize:'9px',color:'#333350',fontFamily:'sans-serif',letterSpacing:'1.5px',textTransform:'uppercase',flexShrink:0}}>Works on</span>
          {['Texting Factory','Alpha.date','OnlyFans','Fansly','LoyalFans','FanCentro','AdmireMe','FanVue','ManyVids','Unlockd'].map(p=>(
            <span key={p} style={{fontSize:'11px',color:'#71767b',fontFamily:'sans-serif',flexShrink:0}}>{p}</span>
          ))}
        </div>
      </div>

      {/* 3 steps */}
      <div style={{position:'relative',zIndex:1,maxWidth:'860px',margin:'0 auto',padding:'0 32px 80px'}}>
        <div style={{textAlign:'center',marginBottom:'48px'}}>
          <div style={{fontSize:'9px',color:'#a855f7',fontFamily:'sans-serif',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'10px'}}>How It Works</div>
          <h2 style={{fontSize:'clamp(22px,3.5vw,40px)',fontWeight:'400',letterSpacing:'-1px',margin:0}}>Three steps. Under three seconds.</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1px',background:'rgba(255,255,255,0.04)',borderRadius:'12px',overflow:'hidden'}}>
          {[
            {n:'01',t:'Extension scans',d:'CIC reads the full conversation, detects location, identifies photos, and builds context automatically.'},
            {n:'02',t:'AI generates 4 replies',d:'Premium AI writes 4 different replies in 2 seconds. Each one references something specific he said.'},
            {n:'03',t:'You pick and send',d:'Click Type — the reply types itself at human speed. Or copy and paste. WPM adjustable from 20 to 120.'},
          ].map(s=>(
            <div key={s.n} style={{background:'#0a0a14',padding:'32px 28px',transition:'all 0.2s'}}
              onMouseEnter={e=>{(e.currentTarget as any).style.background='rgba(124,58,237,0.05)'}}
              onMouseLeave={e=>{(e.currentTarget as any).style.background='#0a0a14'}}>
              <div style={{fontSize:'44px',fontWeight:'300',color:'rgba(168,85,247,0.15)',letterSpacing:'-2px',marginBottom:'14px',fontFamily:'Georgia,serif'}}>{s.n}</div>
              <div style={{fontWeight:'600',fontSize:'14px',marginBottom:'8px',color:'#e2e8f0'}}>{s.t}</div>
              <div style={{fontSize:'12px',color:'#71767b',lineHeight:'1.7',fontFamily:'sans-serif'}}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div style={{position:'relative',zIndex:1,maxWidth:'860px',margin:'0 auto',padding:'0 32px 100px'}}>
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <div style={{fontSize:'9px',color:'#a855f7',fontFamily:'sans-serif',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'10px'}}>Pricing</div>
          <h2 style={{fontSize:'clamp(22px,3.5vw,40px)',fontWeight:'400',letterSpacing:'-1px',margin:0}}>Start free. Upgrade when ready.</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'16px'}}>
          {[
            {name:'Free Trial',price:'Free',period:'7 days',color:'#64748b',features:['Full Pro access days 1-3','Reducing daily limit after','All 10 platforms','Human typing simulator']},
            {name:'Basic',price:'$8',period:'per month',color:'#38bdf8',features:['50 replies per 4 days','All platforms','Standard AI quality','No explicit content']},
            {name:'Pro',price:'$15',period:'per month',color:'#a855f7',badge:'BEST',features:['Unlimited daily replies','Full explicit content','Premium AI quality','Priority support']},
          ].map((p,i)=>(
            <div key={p.name} style={{background:'rgba(255,255,255,0.02)',border:`1px solid ${i===2?'rgba(168,85,247,0.3)':'rgba(255,255,255,0.06)'}`,borderRadius:'12px',padding:'24px',position:'relative',transition:'all 0.25s'}}
              onMouseEnter={e=>{const el=e.currentTarget as any;el.style.transform='translateY(-4px)';el.style.borderColor=p.color+'50'}}
              onMouseLeave={e=>{const el=e.currentTarget as any;el.style.transform='';el.style.borderColor=i===2?'rgba(168,85,247,0.3)':'rgba(255,255,255,0.06)'}}>
              {p.badge&&<div style={{position:'absolute',top:'14px',right:'14px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',padding:'2px 8px',borderRadius:'8px',fontSize:'9px',fontWeight:'700',color:'#fff',fontFamily:'sans-serif'}}>{p.badge}</div>}
              <div style={{color:p.color,fontWeight:'600',fontSize:'10px',fontFamily:'sans-serif',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'8px'}}>{p.name}</div>
              <div style={{fontSize:'36px',fontWeight:'400',letterSpacing:'-1.5px',marginBottom:'2px'}}>{p.price}</div>
              <div style={{color:'#444460',fontSize:'11px',fontFamily:'sans-serif',marginBottom:'16px'}}>{p.period}</div>
              {p.features.map(f=>(
                <div key={f} style={{display:'flex',gap:'8px',marginBottom:'8px',fontSize:'12px',color:'#a0a0b0',fontFamily:'sans-serif'}}>
                  <span style={{color:p.color,flexShrink:0}}>✓</span>{f}
                </div>
              ))}
              <button onClick={()=>document.getElementById('signup-box')?.scrollIntoView({behavior:'smooth'})}
                style={{width:'100%',marginTop:'16px',padding:'10px',background:i===2?'linear-gradient(135deg,#7c3aed,#d4a300)':'transparent',border:`1px solid ${p.color}40`,borderRadius:'8px',color:i===2?'#fff':p.color,cursor:'pointer',fontWeight:'600',fontSize:'12px',fontFamily:'sans-serif'}}>
                {i===0?'Start Free':'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{position:'relative',zIndex:1,borderTop:'1px solid rgba(255,255,255,0.04)',padding:'28px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <div style={{width:'26px',height:'26px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'7px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px'}}>💬</div>
          <span style={{fontSize:'11px',color:'#444460',fontFamily:'sans-serif'}}>© 2026 Chatter's Inner Circle</span>
        </div>
        <div style={{display:'flex',gap:'20px'}}>
          <a href="/guide" style={{fontSize:'11px',color:'#444460',fontFamily:'sans-serif',textDecoration:'none'}}>Operator Guide</a>
          <a href="mailto:whwva47@gmail.com" style={{fontSize:'11px',color:'#444460',fontFamily:'sans-serif',textDecoration:'none'}}>Support</a>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}*{box-sizing:border-box}::-webkit-scrollbar{display:none}`}</style>
    </div>
  )
}
