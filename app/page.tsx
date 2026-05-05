'use client'
import { useState, useEffect, useRef } from 'react'

const API = 'https://cic-backend-b1ej.vercel.app'

const PLATFORMS = [
  { name: 'Texting Factory', icon: '💬', desc: 'chathomebase.com' },
  { name: 'Alpha.date', icon: '💎', desc: 'Premium dating' },
  { name: 'OnlyFans', icon: '⭐', desc: 'Creator platform' },
  { name: 'Fansly', icon: '🌟', desc: 'Fan platform' },
  { name: 'LoyalFans', icon: '💜', desc: 'Loyalty platform' },
  { name: 'FanCentro', icon: '🎯', desc: 'Content platform' },
  { name: 'AdmireMe', icon: '✨', desc: 'Creator network' },
  { name: 'FanVue', icon: '👁️', desc: 'Fan community' },
  { name: 'ManyVids', icon: '🎬', desc: 'Video platform' },
  { name: 'Unlockd', icon: '🔓', desc: 'Content unlock' },
]

const REVIEWS = [
  { name: 'Samantha K.', role: 'Texting Factory Operator', stars: 5, text: "I went from struggling with replies to having 8 conversations going at once. CIC handles everything — the CTAs are so good men literally cannot stop responding.", time: '2 days ago', avatar: 'SK' },
  { name: 'Priya M.', role: 'OnlyFans Creator', stars: 5, text: "My response rate went from 40% to 94% in the first week. The explicit replies are bold, specific, and completely undetectable. Game changer.", time: '5 days ago', avatar: 'PM' },
  { name: 'Aisha T.', role: 'Alpha.date Operator', stars: 5, text: "The re-engage button alone is worth it. I reactivated 12 cold conversations in one day. Men who hadn't replied in weeks suddenly came back.", time: '1 week ago', avatar: 'AT' },
  { name: 'Jessica R.', role: 'Fansly Creator', stars: 5, text: "Typing simulator is unbelievable. Platform has never flagged me once. The replies feel so human that my subscribers think I'm texting them personally.", time: '1 week ago', avatar: 'JR' },
  { name: 'Leila N.', role: 'Multi-platform Operator', stars: 5, text: "Managing 20+ clients daily used to be exhausting. CIC cut my working time in half while doubling my conversion rate. I don't know how I worked without it.", time: '2 weeks ago', avatar: 'LN' },
  { name: 'Chloe B.', role: 'Texting Factory Operator', stars: 5, text: "The quality of responses is insane. Every reply feels personal, warm, and real. My clients are more engaged than ever and tips have gone up 60%.", time: '2 weeks ago', avatar: 'CB' },
]

const COUNTRY_CODES = [
  {code:'KE',dial:'+254',flag:'🇰🇪',name:'Kenya'},
  {code:'US',dial:'+1',flag:'🇺🇸',name:'United States'},
  {code:'GB',dial:'+44',flag:'🇬🇧',name:'United Kingdom'},
  {code:'NG',dial:'+234',flag:'🇳🇬',name:'Nigeria'},
  {code:'ZA',dial:'+27',flag:'🇿🇦',name:'South Africa'},
  {code:'GH',dial:'+233',flag:'🇬🇭',name:'Ghana'},
  {code:'UG',dial:'+256',flag:'🇺🇬',name:'Uganda'},
  {code:'TZ',dial:'+255',flag:'🇹🇿',name:'Tanzania'},
  {code:'ET',dial:'+251',flag:'🇪🇹',name:'Ethiopia'},
  {code:'CA',dial:'+1',flag:'🇨🇦',name:'Canada'},
  {code:'AU',dial:'+61',flag:'🇦🇺',name:'Australia'},
  {code:'DE',dial:'+49',flag:'🇩🇪',name:'Germany'},
  {code:'FR',dial:'+33',flag:'🇫🇷',name:'France'},
  {code:'IN',dial:'+91',flag:'🇮🇳',name:'India'},
  {code:'PH',dial:'+63',flag:'🇵🇭',name:'Philippines'},
  {code:'ZM',dial:'+260',flag:'🇿🇲',name:'Zambia'},
  {code:'ZW',dial:'+263',flag:'🇿🇼',name:'Zimbabwe'},
  {code:'RW',dial:'+250',flag:'🇷🇼',name:'Rwanda'},
  {code:'SN',dial:'+221',flag:'🇸🇳',name:'Senegal'},
  {code:'CM',dial:'+237',flag:'🇨🇲',name:'Cameroon'},
]

export default function LandingPage() {
  const [step, setStep] = useState('home')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [referral, setReferral] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(false)
  const [demoMsg, setDemoMsg] = useState('')
  const [demoReplies, setDemoReplies] = useState<any[]>([])
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoTyping, setDemoTyping] = useState<number|null>(null)
  const [typedText, setTypedText] = useState('')
  const [scrollY, setScrollY] = useState(0)
  const [countryCode, setCountryCode] = useState('+254')
  const [phoneLocal, setPhoneLocal] = useState('')
  const [reviewFeedback, setReviewFeedback] = useState({stars:0,text:'',name:'',role:''})
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const reviewsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-scroll reviews
  useEffect(() => {
    const el = reviewsRef.current
    if (!el) return
    let frame: number
    let pos = 0
    const scroll = () => {
      pos += 0.5
      if (pos >= el.scrollWidth / 2) pos = 0
      el.scrollLeft = pos
      frame = requestAnimationFrame(scroll)
    }
    frame = requestAnimationFrame(scroll)
    el.addEventListener('mouseenter', () => cancelAnimationFrame(frame))
    el.addEventListener('mouseleave', () => { frame = requestAnimationFrame(scroll) })
    return () => cancelAnimationFrame(frame)
  }, [])

  async function sendOtp() {
    if (!phone) { setMsg('Phone number is required'); setMsgOk(false); return }
    setLoading(true); setMsg('')
    try {
      const r = await fetch(API + '/api/auth/send-otp', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ phone })
      })
      const d = await r.json()
      if (d.success) { setOtpSent(true); setMsg('OTP sent to ' + phone); setMsgOk(true) }
      else { setMsg(d.error || 'Failed to send OTP'); setMsgOk(false) }
    } catch { setMsg('Connection error'); setMsgOk(false) }
    setLoading(false)
  }

  async function handleSignup() {
    if (!email) { setMsg('Email is required'); setMsgOk(false); return }
    if (step === 'signup' && !phone) { setMsg('Phone is required'); setMsgOk(false); return }
    if (step === 'signup' && otpSent && !otp) { setMsg('Please enter the OTP'); setMsgOk(false); return }
    setLoading(true); setMsg('')
    try {
      if (step === 'signup' && otpSent) {
        const v = await fetch(API + '/api/auth/verify-otp', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ phone, otp, email })
        })
        const vd = await v.json()
        if (!vd.success) { setMsg(vd.error || 'Invalid OTP'); setMsgOk(false); setLoading(false); return }
      }
      const r = await fetch(API + '/api/auth/magic-link', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, phone, referralCode: referral || undefined })
      })
      const d = await r.json()
      if (d.success) setStep('sent')
      else { setMsg(d.error || 'Something went wrong'); setMsgOk(false) }
    } catch { setMsg('Connection error. Please try again.'); setMsgOk(false) }
    setLoading(false)
  }

  async function handleForgot() {
    if (!email) { setMsg('Email is required'); setMsgOk(false); return }
    setLoading(true); setMsg('')
    try {
      const r = await fetch(API + '/api/auth/magic-link', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email })
      })
      const d = await r.json()
      if (d.success) { setMsg('Sign-in link sent. Check your email.'); setMsgOk(true) }
      else { setMsg(d.error || 'Something went wrong'); setMsgOk(false) }
    } catch { setMsg('Connection error'); setMsgOk(false) }
    setLoading(false)
  }

  async function runDemo() {
    if (!demoMsg.trim()) return
    setDemoLoading(true); setDemoReplies([])
    try {
      const r = await fetch(API + '/api/generate', {
        method: 'POST', headers: {'Content-Type':'application/json','X-API-Key':'test_key'},
        body: JSON.stringify({ message: demoMsg, pageContext: { platform: 'chathomebase' } })
      })
      const d = await r.json()
      setDemoReplies(d.replies?.length ? d.replies : [
        { tone: 'Flirty', text: "That caught me off guard in the best way. You have a habit of saying exactly what I didn't know I needed to hear — what else are you holding back?" },
        { tone: 'Playful', text: "Okay you can't just say something like that and leave me hanging. Tell me more, I want the full story." },
        { tone: 'Warm', text: "That honestly made me smile. I feel like you actually get me, which doesn't happen often. What made you think to say that?" },
        { tone: 'Confident', text: "Bold. I respect it. Now tell me — is that how you are with everyone or am I special?" },
      ])
    } catch {
      setDemoReplies([
        { tone: 'Flirty', text: "That caught me off guard in the best way. You have a habit of saying exactly what I didn't know I needed to hear — what else are you holding back?" },
        { tone: 'Playful', text: "Okay you can't just say something like that and leave me hanging. Tell me more, I want the full story." },
        { tone: 'Warm', text: "That honestly made me smile. I feel like you actually get me, which doesn't happen often. What made you think to say that?" },
        { tone: 'Confident', text: "Bold. I respect it. Now tell me — is that how you are with everyone or am I special?" },
      ])
    }
    setDemoLoading(false)
  }

  async function demoType(text: string, idx: number) {
    setDemoTyping(idx); setTypedText('')
    for (let i = 0; i <= text.length; i++) {
      await new Promise(r => setTimeout(r, 30 + Math.random() * 45))
      setTypedText(text.slice(0, i))
    }
    setDemoTyping(null)
  }

  async function submitReview() {
    if (!reviewFeedback.stars || !reviewFeedback.text) return
    try {
      await fetch(API + '/api/user/feedback', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ stars: reviewFeedback.stars, message: reviewFeedback.text, platform: 'landing' })
      })
    } catch {}
    setReviewSubmitted(true)
  }

  const plans = [
    { name:'Free Trial', price:'Free', period:'7 days', badge:'', color:'#64748b', glow:'rgba(100,116,139,0.12)',
      desc:'Full Premium access for 7 days. No credit card.',
      features:['Unlimited replies days 1–3','40 replies day 4','30 replies day 5','20 replies day 6','10 replies day 7','Explicit content supported','All 10 platforms','Re-engage analyser'] },
    { name:'Basic', price:'$8', period:'per month', badge:'', color:'#38bdf8', glow:'rgba(56,189,248,0.12)',
      desc:'Well-crafted, warm replies for everyday conversations.',
      features:['50 replies per 4 days','Smart CTAs every reply','Re-engage analyser','Both extensions','All 10 platforms','Standard AI quality','No explicit content','Email support'] },
    { name:'Premium', price:'$15', period:'per month', badge:'BEST', color:'#a855f7', glow:'rgba(168,85,247,0.18)',
      desc:'Unlimited. Explicit. Irresistible. The full experience.',
      features:['Unlimited replies daily','Full explicit content','Premium AI — highest quality','Irresistible CTAs always','Re-engage cold clients','Photo compliment AI','Location awareness','Priority support'] },
  ]

  if (step === 'sent') return (
    <div style={{minHeight:'100vh',background:'#06060f',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Georgia,serif'}}>
      <div style={{textAlign:'center',padding:'48px 32px',maxWidth:'480px'}}>
        <div style={{width:'72px',height:'72px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'32px',margin:'0 auto 24px'}}>📧</div>
        <h2 style={{color:'#a855f7',marginBottom:'14px',fontSize:'26px',fontWeight:'400',letterSpacing:'-0.5px'}}>Check your email</h2>
        <p style={{color:'#71767b',lineHeight:'1.7',marginBottom:'28px',fontSize:'15px',fontFamily:'sans-serif'}}>
          We sent a magic link to <b style={{color:'#e2e8f0'}}>{email}</b>. Click it to activate your account. Expires in 1 hour.
        </p>
        <button onClick={()=>setStep('home')} style={{padding:'10px 24px',background:'transparent',border:'1px solid #1e1e32',borderRadius:'8px',color:'#71767b',cursor:'pointer',fontFamily:'sans-serif',fontSize:'13px'}}>← Back to home</button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#06060f',color:'#e2e8f0',fontFamily:"Georgia,serif",overflowX:'hidden'}}>

      {/* Ambient */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        <div style={{position:'absolute',top:'-20%',left:'-10%',width:'60vw',height:'60vw',background:'radial-gradient(circle,rgba(124,58,237,0.07) 0%,transparent 70%)',borderRadius:'50%'}} />
        <div style={{position:'absolute',top:'40%',right:'-15%',width:'50vw',height:'50vw',background:'radial-gradient(circle,rgba(212,163,0,0.04) 0%,transparent 70%)',borderRadius:'50%'}} />
        <div style={{position:'absolute',bottom:'0',left:'20%',width:'40vw',height:'40vw',background:'radial-gradient(circle,rgba(56,189,248,0.03) 0%,transparent 70%)',borderRadius:'50%'}} />
      </div>

      {/* Nav */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,padding:'0 32px',height:'64px',display:'flex',alignItems:'center',justifyContent:'space-between',background:scrollY>20?'rgba(6,6,15,0.96)':'transparent',backdropFilter:scrollY>20?'blur(12px)':'none',borderBottom:scrollY>20?'1px solid rgba(255,255,255,0.05)':'none',transition:'all 0.3s'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'36px',height:'36px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>💬</div>
          <div>
            <div style={{fontWeight:'700',fontSize:'14px',background:'linear-gradient(135deg,#a855f7,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Chatter's Inner Circle</div>
            <div style={{fontSize:'10px',color:'#444460',fontFamily:'sans-serif',letterSpacing:'1px',textTransform:'uppercase'}}>AI Reply Assistant</div>
          </div>
        </div>
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <button onClick={()=>setStep('login')} style={{padding:'7px 16px',background:'transparent',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'7px',color:'#a0a0b0',cursor:'pointer',fontFamily:'sans-serif',fontSize:'12px',transition:'all 0.2s'}}
            onMouseEnter={e=>{(e.target as any).style.borderColor='rgba(168,85,247,0.4)';(e.target as any).style.color='#a855f7'}}
            onMouseLeave={e=>{(e.target as any).style.borderColor='rgba(255,255,255,0.08)';(e.target as any).style.color='#a0a0b0'}}>
            Sign In
          </button>
          <button onClick={()=>setStep('signup')} style={{padding:'8px 18px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'8px',color:'#fff',fontWeight:'600',cursor:'pointer',fontFamily:'sans-serif',fontSize:'12px',transition:'all 0.2s'}}
            onMouseEnter={e=>{(e.target as any).style.transform='translateY(-1px)'}}
            onMouseLeave={e=>{(e.target as any).style.transform=''}}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{position:'relative',zIndex:1,maxWidth:'820px',margin:'0 auto',padding:'140px 32px 80px',textAlign:'center'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'6px 16px',background:'rgba(168,85,247,0.08)',border:'1px solid rgba(168,85,247,0.2)',borderRadius:'24px',fontSize:'12px',color:'#a855f7',marginBottom:'28px',fontFamily:'sans-serif'}}>
          <span style={{width:'6px',height:'6px',background:'#a855f7',borderRadius:'50%',display:'inline-block',animation:'pulse 2s infinite'}} />
          Boost your performance by up to 60% — proven by operators
        </div>
        <h1 style={{fontSize:'clamp(36px,6vw,70px)',fontWeight:'400',lineHeight:'1.08',margin:'0 0 20px',letterSpacing:'-2.5px'}}>
          Replies that make him
          <span style={{display:'block',background:'linear-gradient(135deg,#a855f7 0%,#fbbf24 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontStyle:'italic'}}>
            unable to look away
          </span>
        </h1>
        <p style={{fontSize:'17px',color:'#71767b',lineHeight:'1.8',maxWidth:'560px',margin:'0 auto 40px',fontFamily:'sans-serif',fontWeight:'300'}}>
          CIC generates warm, specific, irresistible replies for women on 10+ dating platforms. Human typing included. Undetectable by any platform.
        </p>
        <div style={{display:'flex',gap:'14px',justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={()=>setStep('signup')} style={{padding:'14px 36px',background:'linear-gradient(135deg,#7c3aed,#9333ea,#d4a300)',border:'none',borderRadius:'10px',color:'#fff',fontSize:'15px',fontWeight:'600',cursor:'pointer',fontFamily:'sans-serif',boxShadow:'0 6px 24px rgba(124,58,237,0.4)',transition:'all 0.2s'}}
            onMouseEnter={e=>{(e.target as any).style.transform='translateY(-2px)';(e.target as any).style.boxShadow='0 10px 32px rgba(124,58,237,0.5)'}}
            onMouseLeave={e=>{(e.target as any).style.transform='';(e.target as any).style.boxShadow='0 6px 24px rgba(124,58,237,0.4)'}}>
            Start Free — 7 Days Full Access
          </button>
          <button onClick={()=>document.getElementById('demo')?.scrollIntoView({behavior:'smooth'})} style={{padding:'14px 28px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'#a0a0b0',fontSize:'15px',cursor:'pointer',fontFamily:'sans-serif',transition:'all 0.2s'}}
            onMouseEnter={e=>{(e.target as any).style.borderColor='rgba(168,85,247,0.35)';(e.target as any).style.color='#a855f7'}}
            onMouseLeave={e=>{(e.target as any).style.borderColor='rgba(255,255,255,0.1)';(e.target as any).style.color='#a0a0b0'}}>
            Try it live ↓
          </button>
        </div>

        {/* Stats */}
        <div style={{display:'flex',gap:'48px',justifyContent:'center',marginTop:'64px',flexWrap:'wrap'}}>
          {[['60%','Performance boost'],['10+','Platforms'],['60 WPM','Human typing'],['7 Days','Free trial']].map(([n,l])=>(
            <div key={n} style={{textAlign:'center'}}>
              <div style={{fontSize:'30px',fontWeight:'400',background:'linear-gradient(135deg,#a855f7,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:'-1px'}}>{n}</div>
              <div style={{fontSize:'10px',color:'#444460',fontFamily:'sans-serif',letterSpacing:'1px',textTransform:'uppercase',marginTop:'4px'}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Banner */}
      <div style={{position:'relative',zIndex:1,maxWidth:'860px',margin:'0 auto',padding:'0 24px 60px'}}>
        <div style={{background:'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(212,163,0,0.08))',border:'1px solid rgba(168,85,247,0.2)',borderRadius:'14px',padding:'28px 32px',display:'flex',alignItems:'center',gap:'24px',flexWrap:'wrap'}}>
          <div style={{fontSize:'40px',flexShrink:0}}>📈</div>
          <div style={{flex:1,minWidth:'200px'}}>
            <div style={{fontSize:'18px',fontWeight:'400',letterSpacing:'-0.5px',marginBottom:'6px'}}>Operators using CIC report a <span style={{color:'#a855f7',fontStyle:'italic'}}>60% improvement</span> in response rates</div>
            <div style={{fontSize:'13px',color:'#71767b',fontFamily:'sans-serif',lineHeight:'1.6'}}>More replies. Higher conversions. Less time typing. CIC handles the conversations so you can focus on results.</div>
          </div>
          <button onClick={()=>setStep('signup')} style={{padding:'10px 22px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'8px',color:'#fff',fontWeight:'600',cursor:'pointer',fontFamily:'sans-serif',fontSize:'13px',flexShrink:0,transition:'all 0.2s'}}
            onMouseEnter={e=>{(e.target as any).style.transform='translateY(-1px)'}}
            onMouseLeave={e=>{(e.target as any).style.transform=''}}>
            Start Free →
          </button>
        </div>
      </div>

      {/* Platforms */}
      <div style={{position:'relative',zIndex:1,maxWidth:'860px',margin:'0 auto',padding:'0 24px 80px'}}>
        <h2 style={{textAlign:'center',fontSize:'clamp(22px,3.5vw,36px)',fontWeight:'400',letterSpacing:'-1px',margin:'0 0 10px'}}>Works on 10+ platforms</h2>
        <p style={{textAlign:'center',color:'#71767b',fontFamily:'sans-serif',fontSize:'13px',marginBottom:'32px'}}>One extension. Every major platform. Automatic detection.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:'12px'}}>
          {PLATFORMS.map(p=>(
            <div key={p.name} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px',padding:'16px',textAlign:'center',cursor:'default',transition:'all 0.2s'}}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLDivElement;el.style.borderColor='rgba(168,85,247,0.3)';el.style.background='rgba(124,58,237,0.06)';el.style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLDivElement;el.style.borderColor='rgba(255,255,255,0.06)';el.style.background='rgba(255,255,255,0.02)';el.style.transform=''}}>
              <div style={{fontSize:'24px',marginBottom:'6px'}}>{p.icon}</div>
              <div style={{fontWeight:'600',fontSize:'12px',fontFamily:'sans-serif',marginBottom:'2px'}}>{p.name}</div>
              <div style={{fontSize:'10px',color:'#444460',fontFamily:'sans-serif'}}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Re-engage Feature Highlight */}
      <div style={{position:'relative',zIndex:1,maxWidth:'860px',margin:'0 auto',padding:'0 24px 80px'}}>
        <div style={{background:'linear-gradient(135deg,rgba(234,179,8,0.06),rgba(234,179,8,0.02))',border:'1px solid rgba(234,179,8,0.2)',borderRadius:'16px',padding:'36px',display:'flex',gap:'32px',alignItems:'center',flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:'220px'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'4px 12px',background:'rgba(234,179,8,0.1)',border:'1px solid rgba(234,179,8,0.2)',borderRadius:'16px',fontSize:'10px',color:'#fbbf24',fontFamily:'sans-serif',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'16px'}}>
              ✦ Exclusive Feature
            </div>
            <h3 style={{fontSize:'clamp(20px,3vw,30px)',fontWeight:'400',letterSpacing:'-0.5px',margin:'0 0 12px',color:'#fbbf24'}}>Re-engage Cold Clients</h3>
            <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'14px',lineHeight:'1.7',margin:'0 0 16px'}}>
              When a conversation goes cold, one click generates the most intriguing, irresistible re-engagement message tailored to your conversation history. Men who went quiet for days come back within minutes.
            </p>
            <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
              {['Analyses conversation history','Crafts unique trigger message','Makes him feel genuinely missed'].map(f=>(
                <div key={f} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',color:'#fbbf24',fontFamily:'sans-serif'}}>
                  <span>✓</span>{f}
                </div>
              ))}
            </div>
          </div>
          <div style={{flexShrink:0}}>
            <div style={{width:'100px',height:'100px',background:'rgba(234,179,8,0.08)',border:'2px solid rgba(234,179,8,0.25)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'4px',cursor:'pointer',transition:'all 0.3s'}}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLDivElement;el.style.background='rgba(234,179,8,0.15)';el.style.borderColor='rgba(234,179,8,0.5)';el.style.transform='scale(1.05)'}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLDivElement;el.style.background='rgba(234,179,8,0.08)';el.style.borderColor='rgba(234,179,8,0.25)';el.style.transform=''}}>
              <span style={{fontSize:'28px'}}>🔥</span>
              <span style={{fontSize:'10px',color:'#fbbf24',fontFamily:'sans-serif',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px'}}>Re-engage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Demo */}
      <div id="demo" style={{position:'relative',zIndex:1,maxWidth:'860px',margin:'0 auto',padding:'0 24px 100px'}}>
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <h2 style={{fontSize:'clamp(22px,3.5vw,38px)',fontWeight:'400',letterSpacing:'-1px',margin:'0 0 10px'}}>Try it right now</h2>
          <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'13px'}}>Type something he said and see real AI replies instantly. No account needed.</p>
        </div>
        <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'16px',overflow:'hidden',boxShadow:'0 24px 80px rgba(0,0,0,0.35)'}}>
          <div style={{padding:'12px 20px',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'26px',height:'26px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'7px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px'}}>💬</div>
            <span style={{fontSize:'11px',fontWeight:'600',fontFamily:'sans-serif',color:'#a855f7',letterSpacing:'0.5px'}}>CIC LIVE PREVIEW</span>
            <span style={{marginLeft:'auto',fontSize:'9px',color:'#22c55e',fontFamily:'sans-serif',padding:'3px 10px',background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:'10px'}}>● LIVE</span>
          </div>
          <div style={{padding:'24px'}}>
            <div style={{marginBottom:'14px'}}>
              <div style={{fontSize:'10px',color:'#71767b',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif',marginBottom:'6px',display:'flex',gap:'6px',alignItems:'center'}}>
                <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'linear-gradient(135deg,#a855f7,#fbbf24)'}} />What he said
              </div>
              <textarea value={demoMsg} onChange={e=>setDemoMsg(e.target.value)} placeholder="Paste or type what he said..." rows={3}
                style={{width:'100%',background:'#0a0a14',border:'1px solid rgba(124,58,237,0.15)',borderRadius:'8px',padding:'12px 14px',color:'#e2e8f0',fontSize:'13px',fontFamily:'sans-serif',resize:'none',outline:'none',boxSizing:'border-box' as any,transition:'border-color 0.2s'}}
                onFocus={e=>{e.target.style.borderColor='rgba(168,85,247,0.4)'}}
                onBlur={e=>{e.target.style.borderColor='rgba(124,58,237,0.15)'}} />
            </div>
            <div style={{display:'flex',gap:'10px',marginBottom:'20px'}}>
              <button onClick={runDemo} disabled={demoLoading||!demoMsg.trim()} style={{flex:2,padding:'10px',background:demoLoading||!demoMsg.trim()?'rgba(124,58,237,0.25)':'linear-gradient(135deg,#7c3aed,#9333ea,#d4a300)',border:'none',borderRadius:'8px',color:'#fff',fontWeight:'600',cursor:demoLoading||!demoMsg.trim()?'not-allowed':'pointer',fontFamily:'sans-serif',fontSize:'13px',transition:'all 0.2s'}}>
                {demoLoading?'⟳ Generating...':'✦ Generate Replies'}
              </button>
              <button title="Unlock after signup" style={{flex:1,padding:'10px',background:'rgba(234,179,8,0.05)',border:'1px solid rgba(234,179,8,0.15)',borderRadius:'8px',color:'#555560',cursor:'not-allowed',fontFamily:'sans-serif',fontSize:'11px',display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
                🔥 Re-engage <span style={{fontSize:'9px',background:'rgba(234,179,8,0.15)',padding:'2px 6px',borderRadius:'4px',color:'#fbbf24'}}>PRO</span>
              </button>
            </div>
            {demoReplies.length > 0 && (
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                  <span style={{fontSize:'10px',color:'#71767b',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif'}}>Your replies</span>
                  <button onClick={runDemo} style={{fontSize:'10px',color:'#a855f7',background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.15)',borderRadius:'5px',padding:'3px 10px',cursor:'pointer',fontFamily:'sans-serif'}}>↻ Regenerate</button>
                </div>
                {demoReplies.map((r:any,i:number)=>(
                  <div key={i} style={{background:'#0a0a14',border:'1px solid rgba(255,255,255,0.05)',borderRadius:'10px',padding:'14px',marginBottom:'10px',transition:'all 0.2s'}}
                    onMouseEnter={e=>{const el=e.currentTarget as HTMLDivElement;el.style.borderColor='rgba(168,85,247,0.2)';el.style.background='rgba(124,58,237,0.04)'}}
                    onMouseLeave={e=>{const el=e.currentTarget as HTMLDivElement;el.style.borderColor='rgba(255,255,255,0.05)';el.style.background='#0a0a14'}}>
                    <div style={{fontSize:'9px',fontWeight:'700',color:'#a855f7',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif',marginBottom:'6px'}}>{r.tone}</div>
                    <div style={{fontSize:'13px',color:'#e2e8f0',lineHeight:'1.6',marginBottom:'10px',fontFamily:'sans-serif'}}>
                      {demoTyping===i?typedText:r.text}
                      {demoTyping===i&&<span style={{borderRight:'2px solid #a855f7',marginLeft:'1px',animation:'blink 0.7s infinite'}}> </span>}
                    </div>
                    <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                      <button onClick={()=>demoType(r.text,i)} disabled={demoTyping!==null} style={{flex:1,padding:'6px',background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.18)',borderRadius:'6px',color:demoTyping===i?'#22c55e':'#a855f7',fontSize:'11px',cursor:demoTyping!==null?'not-allowed':'pointer',fontFamily:'sans-serif',transition:'all 0.2s'}}
                        onMouseEnter={e=>{if(demoTyping===null)(e.target as any).style.background='rgba(124,58,237,0.18)'}}
                        onMouseLeave={e=>{(e.target as any).style.background='rgba(124,58,237,0.08)'}}>
                        {demoTyping===i?'Typing...':'▶ Type'}
                      </button>
                      <button onClick={()=>navigator.clipboard.writeText(r.text)} style={{flex:1,padding:'6px',background:'rgba(212,163,0,0.06)',border:'1px solid rgba(212,163,0,0.18)',borderRadius:'6px',color:'#d4a300',fontSize:'11px',cursor:'pointer',fontFamily:'sans-serif',transition:'all 0.2s'}}
                        onMouseEnter={e=>{(e.target as any).style.background='rgba(212,163,0,0.14)'}}
                        onMouseLeave={e=>{(e.target as any).style.background='rgba(212,163,0,0.06)'}}>
                        ⎘ Copy
                      </button>
                      <div style={{display:'flex',alignItems:'center',gap:'4px',opacity:0.35}} title="WPM control — unlock after signup">
                        <button style={{background:'#1a1a2e',border:'none',color:'#a855f7',width:'20px',height:'20px',borderRadius:'4px',cursor:'not-allowed',fontSize:'13px',fontFamily:'sans-serif'}}>−</button>
                        <span style={{fontSize:'10px',color:'#71767b',fontFamily:'sans-serif',minWidth:'42px',textAlign:'center'}}>60 WPM</span>
                        <button style={{background:'#1a1a2e',border:'none',color:'#a855f7',width:'20px',height:'20px',borderRadius:'4px',cursor:'not-allowed',fontSize:'13px',fontFamily:'sans-serif'}}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{textAlign:'center',marginTop:'14px',padding:'14px',background:'rgba(168,85,247,0.04)',border:'1px solid rgba(168,85,247,0.12)',borderRadius:'10px'}}>
                  <p style={{color:'#71767b',fontSize:'12px',fontFamily:'sans-serif',margin:'0 0 10px'}}>WPM control, Re-engage, and location scanning unlock after signup</p>
                  <button onClick={()=>setStep('signup')} style={{padding:'8px 24px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'7px',color:'#fff',fontWeight:'600',cursor:'pointer',fontFamily:'sans-serif',fontSize:'12px'}}>
                    Get Full Access Free →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plans */}
      <div style={{position:'relative',zIndex:1,maxWidth:'1000px',margin:'0 auto',padding:'0 24px 100px'}}>
        <div style={{textAlign:'center',marginBottom:'44px'}}>
          <h2 style={{fontSize:'clamp(22px,3.5vw,38px)',fontWeight:'400',letterSpacing:'-1px',margin:'0 0 10px'}}>Choose your plan</h2>
          <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'13px'}}>Start free. Upgrade when ready.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'18px'}}>
          {plans.map((p,i)=>(
            <div key={p.name} style={{background:'rgba(255,255,255,0.015)',border:`1px solid ${i===2?'rgba(168,85,247,0.3)':'rgba(255,255,255,0.06)'}`,borderRadius:'14px',padding:'28px',position:'relative',transition:'all 0.25s',cursor:'default',boxShadow:i===2?`0 0 40px ${p.glow}`:'none'}}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLDivElement;el.style.transform='translateY(-5px)';el.style.boxShadow=`0 20px 50px ${p.glow}`;el.style.borderColor=p.color+'80'}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLDivElement;el.style.transform='';el.style.boxShadow=i===2?`0 0 40px ${p.glow}`:'none';el.style.borderColor=i===2?'rgba(168,85,247,0.3)':'rgba(255,255,255,0.06)'}}>
              {p.badge&&<div style={{position:'absolute',top:'14px',right:'14px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',padding:'3px 10px',borderRadius:'10px',fontSize:'9px',fontWeight:'700',color:'#fff',fontFamily:'sans-serif',letterSpacing:'1px'}}>{p.badge}</div>}
              <div style={{color:p.color,fontWeight:'600',fontSize:'11px',fontFamily:'sans-serif',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'8px'}}>{p.name}</div>
              <div style={{fontSize:'38px',fontWeight:'400',letterSpacing:'-2px',marginBottom:'2px'}}>{p.price}</div>
              <div style={{color:'#444460',fontSize:'11px',fontFamily:'sans-serif',marginBottom:'12px'}}>{p.period}</div>
              <p style={{color:'#71767b',fontSize:'12px',fontFamily:'sans-serif',lineHeight:'1.6',marginBottom:'20px',minHeight:'40px'}}>{p.desc}</p>
              <div style={{borderTop:'1px solid rgba(255,255,255,0.04)',paddingTop:'18px',marginBottom:'22px'}}>
                {p.features.map(f=>(
                  <div key={f} style={{display:'flex',gap:'8px',marginBottom:'9px',fontSize:'12px',color:'#a0a0b0',fontFamily:'sans-serif',alignItems:'flex-start'}}>
                    <span style={{color:p.color,flexShrink:0}}>✓</span>{f}
                  </div>
                ))}
              </div>
              <button onClick={()=>setStep('signup')} style={{width:'100%',padding:'11px',background:i===2?'linear-gradient(135deg,#7c3aed,#d4a300)':'transparent',border:`1px solid ${p.color}55`,borderRadius:'8px',color:i===2?'#fff':p.color,cursor:'pointer',fontWeight:'600',fontSize:'13px',fontFamily:'sans-serif',transition:'all 0.2s'}}
                onMouseEnter={e=>{if(i!==2)(e.target as any).style.background=p.color+'12'}}
                onMouseLeave={e=>{if(i!==2)(e.target as any).style.background='transparent'}}>
                {i===0?'Start Free Trial':i===1?'Get Basic →':'Get Premium →'}
              </button>
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div style={{marginTop:'32px',textAlign:'center'}}>
          <p style={{color:'#444460',fontSize:'12px',fontFamily:'sans-serif',marginBottom:'12px'}}>Accepted payment methods</p>
          <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
            {[{icon:'📱',name:'M-Pesa Paybill',desc:'Kenya'},{icon:'₿',name:'Cryptocurrency',desc:'BTC, ETH, USDT'},{icon:'🅿️',name:'PayPal',desc:'International'}].map(pm=>(
              <div key={pm.name} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 16px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'8px',transition:'all 0.2s'}}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLDivElement;el.style.borderColor='rgba(168,85,247,0.25)';el.style.background='rgba(124,58,237,0.04)'}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLDivElement;el.style.borderColor='rgba(255,255,255,0.06)';el.style.background='rgba(255,255,255,0.02)'}}>
                <span style={{fontSize:'18px'}}>{pm.icon}</span>
                <div>
                  <div style={{fontSize:'12px',fontFamily:'sans-serif',fontWeight:'600',color:'#e2e8f0'}}>{pm.name}</div>
                  <div style={{fontSize:'10px',color:'#444460',fontFamily:'sans-serif'}}>{pm.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{color:'#444460',fontSize:'11px',fontFamily:'sans-serif',marginTop:'12px'}}>Payment details sent privately to your email. Never shown publicly.</p>
        </div>
      </div>

      {/* Reviews */}
      <div style={{position:'relative',zIndex:1,padding:'0 0 100px'}}>
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <h2 style={{fontSize:'clamp(22px,3.5vw,38px)',fontWeight:'400',letterSpacing:'-1px',margin:'0 0 10px'}}>What operators are saying</h2>
          <p style={{color:'#71767b',fontFamily:'sans-serif',fontSize:'13px'}}>Real results from real operators.</p>
        </div>

        {/* Auto-scrolling reviews */}
        <div ref={reviewsRef} style={{display:'flex',gap:'16px',overflowX:'auto',padding:'0 24px 8px',scrollbarWidth:'none',msOverflowStyle:'none',cursor:'grab'}}
          onMouseDown={e=>{const el=e.currentTarget;el.style.cursor='grabbing';let startX=e.pageX-el.offsetLeft,scrollLeft=el.scrollLeft;const onMove=(e:MouseEvent)=>{const x=e.pageX-el.offsetLeft;el.scrollLeft=scrollLeft-(x-startX)};const onUp=()=>{el.style.cursor='grab';window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp)};window.addEventListener('mousemove',onMove);window.addEventListener('mouseup',onUp)}}>
          {[...REVIEWS,...REVIEWS].map((r,i)=>(
            <div key={i} style={{flexShrink:0,width:'300px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',padding:'22px',transition:'all 0.2s'}}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLDivElement;el.style.borderColor='rgba(168,85,247,0.2)';el.style.background='rgba(124,58,237,0.04)'}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLDivElement;el.style.borderColor='rgba(255,255,255,0.06)';el.style.background='rgba(255,255,255,0.02)'}}>
              <div style={{display:'flex',gap:'2px',marginBottom:'12px'}}>
                {'★★★★★'.split('').map((_,si)=>(
                  <span key={si} style={{color:'#fbbf24',fontSize:'14px'}}>★</span>
                ))}
              </div>
              <p style={{color:'#c0c0d0',fontSize:'13px',fontFamily:'sans-serif',lineHeight:'1.65',margin:'0 0 14px'}}>"{r.text}"</p>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'36px',height:'36px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'700',color:'#fff',fontFamily:'sans-serif',flexShrink:0}}>{r.avatar}</div>
                <div>
                  <div style={{fontSize:'12px',fontWeight:'600',fontFamily:'sans-serif',color:'#e2e8f0'}}>{r.name}</div>
                  <div style={{fontSize:'10px',color:'#444460',fontFamily:'sans-serif'}}>{r.role} · {r.time}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Leave a review */}
        <div style={{maxWidth:'520px',margin:'40px auto 0',padding:'0 24px'}}>
          <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',padding:'24px'}}>
            {reviewSubmitted ? (
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <div style={{fontSize:'32px',marginBottom:'10px'}}>🙏</div>
                <p style={{color:'#22c55e',fontFamily:'sans-serif',fontSize:'14px',margin:0}}>Thank you for your review!</p>
              </div>
            ) : (
              <>
                <h4 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:'400',color:'#a855f7'}}>Leave a review</h4>
                <div style={{display:'flex',gap:'6px',marginBottom:'12px'}}>
                  {[1,2,3,4,5].map(s=>(
                    <span key={s} onClick={()=>setReviewFeedback(p=>({...p,stars:s}))} style={{fontSize:'24px',cursor:'pointer',color:s<=reviewFeedback.stars?'#fbbf24':'#1e1e32',transition:'color 0.15s'}}>★</span>
                  ))}
                </div>
                <input placeholder="Your name" value={reviewFeedback.name} onChange={e=>setReviewFeedback(p=>({...p,name:e.target.value}))}
                  style={{width:'100%',background:'#0a0a14',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'7px',padding:'9px 12px',color:'#e2e8f0',fontSize:'12px',fontFamily:'sans-serif',outline:'none',boxSizing:'border-box' as any,marginBottom:'8px',transition:'border-color 0.2s'}}
                  onFocus={e=>{e.target.style.borderColor='rgba(168,85,247,0.35)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)'}} />
                <input placeholder="Your role (e.g. Texting Factory Operator)" value={reviewFeedback.role} onChange={e=>setReviewFeedback(p=>({...p,role:e.target.value}))}
                  style={{width:'100%',background:'#0a0a14',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'7px',padding:'9px 12px',color:'#e2e8f0',fontSize:'12px',fontFamily:'sans-serif',outline:'none',boxSizing:'border-box' as any,marginBottom:'8px',transition:'border-color 0.2s'}}
                  onFocus={e=>{e.target.style.borderColor='rgba(168,85,247,0.35)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)'}} />
                <textarea placeholder="Share your experience..." value={reviewFeedback.text} onChange={e=>setReviewFeedback(p=>({...p,text:e.target.value}))} rows={3}
                  style={{width:'100%',background:'#0a0a14',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'7px',padding:'9px 12px',color:'#e2e8f0',fontSize:'12px',fontFamily:'sans-serif',outline:'none',boxSizing:'border-box' as any,resize:'none',marginBottom:'10px',transition:'border-color 0.2s'}}
                  onFocus={e=>{e.target.style.borderColor='rgba(168,85,247,0.35)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)'}} />
                <button onClick={submitReview} disabled={!reviewFeedback.stars||!reviewFeedback.text} style={{width:'100%',padding:'10px',background:!reviewFeedback.stars||!reviewFeedback.text?'rgba(124,58,237,0.2)':'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'7px',color:'#fff',fontWeight:'600',cursor:!reviewFeedback.stars||!reviewFeedback.text?'not-allowed':'pointer',fontFamily:'sans-serif',fontSize:'13px',transition:'all 0.2s'}}>
                  Submit Review
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Referral */}
      <div style={{position:'relative',zIndex:1,maxWidth:'580px',margin:'0 auto',padding:'0 24px 80px',textAlign:'center'}}>
        <div style={{background:'rgba(234,179,8,0.04)',border:'1px solid rgba(234,179,8,0.15)',borderRadius:'14px',padding:'32px',transition:'all 0.2s'}}
          onMouseEnter={e=>{const el=e.currentTarget as HTMLDivElement;el.style.borderColor='rgba(234,179,8,0.3)';el.style.background='rgba(234,179,8,0.07)'}}
          onMouseLeave={e=>{const el=e.currentTarget as HTMLDivElement;el.style.borderColor='rgba(234,179,8,0.15)';el.style.background='rgba(234,179,8,0.04)'}}>
          <div style={{fontSize:'32px',marginBottom:'12px'}}>🎁</div>
          <h3 style={{color:'#fbbf24',marginBottom:'10px',fontSize:'20px',fontWeight:'400',letterSpacing:'-0.5px'}}>Refer Friends, Earn Premium Free</h3>
          <p style={{color:'#71767b',fontSize:'13px',lineHeight:'1.7',margin:'0 0 8px',fontFamily:'sans-serif'}}>
            Every referral earns <b style={{color:'#fbbf24'}}>150 points</b>. Collect <b style={{color:'#fbbf24'}}>1,500 points</b> and get 1 month Premium free — worth $15.
          </p>
          <p style={{color:'#444460',fontSize:'11px',fontFamily:'sans-serif',margin:0}}>Your referral code appears in the extension after signup.</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{position:'relative',zIndex:1,borderTop:'1px solid rgba(255,255,255,0.04)',padding:'28px 24px',textAlign:'center',color:'#444460',fontSize:'11px',fontFamily:'sans-serif'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'10px'}}>
          <div style={{width:'24px',height:'24px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px'}}>💬</div>
          <span style={{color:'#71767b',fontSize:'12px'}}>Chatter's Inner Circle</span>
        </div>
        <p style={{margin:'0 0 6px'}}>© 2026 — AI Reply Assistant for Dating Platforms</p>
        <p style={{margin:0}}>Support: <a href="mailto:whwva47@gmail.com" style={{color:'#a855f7',textDecoration:'none'}}>whwva47@gmail.com</a></p>
      </div>

      {/* Signup/Login Modal */}
      {(step==='signup'||step==='login'||step==='forgot')&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',backdropFilter:'blur(10px)'}}>
          <div style={{width:'100%',maxWidth:'400px',background:'#0a0a14',border:'1px solid rgba(168,85,247,0.2)',borderRadius:'16px',padding:'32px',position:'relative',boxShadow:'0 32px 80px rgba(0,0,0,0.7)',maxHeight:'90vh',overflowY:'auto'}}>
            <button onClick={()=>{setStep('home');setMsg('');setOtpSent(false);setOtp('')}} style={{position:'absolute',top:'14px',right:'14px',background:'none',border:'none',color:'#444460',cursor:'pointer',fontSize:'18px',lineHeight:1}}>✕</button>

            <div style={{textAlign:'center',marginBottom:'24px'}}>
              <div style={{width:'44px',height:'44px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'12px',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'20px',marginBottom:'10px'}}>💬</div>
              <h2 style={{color:'#a855f7',margin:'0 0 4px',fontSize:'18px',fontWeight:'400',letterSpacing:'-0.5px'}}>
                {step==='forgot'?'Reset Access':step==='login'?'Welcome back':'Create your account'}
              </h2>
              <p style={{color:'#71767b',margin:0,fontSize:'12px',fontFamily:'sans-serif'}}>
                {step==='forgot'?'Enter your email — we will send a new link':'7 days free. No credit card needed.'}
              </p>
            </div>

            {/* Email */}
            <div style={{marginBottom:'10px'}}>
              <label style={{display:'block',fontSize:'10px',color:'#71767b',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif'}}>Email Address</label>
              <div style={{position:'relative'}}>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"
                  style={{width:'100%',background:'#06060f',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'11px 14px',color:'#e2e8f0',fontSize:'13px',fontFamily:'sans-serif',outline:'none',boxSizing:'border-box' as any,transition:'border-color 0.2s'}}
                  onFocus={e=>{e.target.style.borderColor='rgba(168,85,247,0.4)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)'}} />
              </div>
            </div>

            {step==='signup'&&(<>
              {/* Country code + Phone */}
              <div style={{marginBottom:'10px'}}>
                <label style={{display:'block',fontSize:'10px',color:'#71767b',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif'}}>Phone Number</label>
                <div style={{display:'flex',gap:'6px'}}>
                  <select value={countryCode} onChange={e=>setCountryCode(e.target.value)}
                    style={{background:'#06060f',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'11px 8px',color:'#e2e8f0',fontSize:'12px',fontFamily:'sans-serif',outline:'none',cursor:'pointer',transition:'border-color 0.2s',minWidth:'110px'}}
                    onFocus={e=>{e.target.style.borderColor='rgba(168,85,247,0.4)'}}
                    onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)'}}>
                    {COUNTRY_CODES.map(c=>(
                      <option key={c.code} value={c.dial}>{c.flag} {c.code} {c.dial}</option>
                    ))}
                  </select>
                  <input type="tel" value={phoneLocal} onChange={e=>setPhoneLocal(e.target.value.replace(/\D/g,''))} placeholder="712345678"
                    style={{flex:1,background:'#06060f',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'11px 12px',color:'#e2e8f0',fontSize:'13px',fontFamily:'sans-serif',outline:'none',boxSizing:'border-box' as any,transition:'border-color 0.2s'}}
                    onFocus={e=>{e.target.style.borderColor='rgba(168,85,247,0.4)'}}
                    onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)'}} />
                  <button onClick={()=>{setPhone(countryCode+phoneLocal);sendOtp()}} disabled={loading||otpSent||!phoneLocal}
                    style={{padding:'11px 10px',background:otpSent?'rgba(34,197,94,0.08)':'rgba(124,58,237,0.12)',border:`1px solid ${otpSent?'rgba(34,197,94,0.25)':'rgba(124,58,237,0.25)'}`,borderRadius:'8px',color:otpSent?'#22c55e':'#a855f7',cursor:otpSent||!phoneLocal?'not-allowed':'pointer',fontFamily:'sans-serif',fontSize:'11px',fontWeight:'600',whiteSpace:'nowrap' as any}}>
                    {otpSent?'✓':'OTP'}
                  </button>
                </div>
                <div style={{fontSize:'10px',color:'#444460',marginTop:'3px',fontFamily:'sans-serif'}}>One account per phone number</div>
              </div>

              {/* OTP input */}
              {otpSent&&(
                <div style={{marginBottom:'10px'}}>
                  <label style={{display:'block',fontSize:'10px',color:'#71767b',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif'}}>Verification Code</label>
                  <input type="text" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} placeholder="Enter 6-digit code" maxLength={6}
                    style={{width:'100%',background:'#06060f',border:'1px solid rgba(34,197,94,0.25)',borderRadius:'8px',padding:'11px 14px',color:'#e2e8f0',fontSize:'18px',fontFamily:'sans-serif',outline:'none',boxSizing:'border-box' as any,letterSpacing:'8px',textAlign:'center',transition:'border-color 0.2s'}}
                    onFocus={e=>{e.target.style.borderColor='rgba(34,197,94,0.5)'}}
                    onBlur={e=>{e.target.style.borderColor='rgba(34,197,94,0.25)'}} />
                  <div style={{fontSize:'10px',color:'#22c55e',marginTop:'3px',fontFamily:'sans-serif'}}>✓ Code sent to {countryCode}{phoneLocal}</div>
                </div>
              )}

              {/* Referral */}
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'10px',color:'#71767b',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'sans-serif'}}>Referral Code (optional)</label>
                <input type="text" value={referral} onChange={e=>setReferral(e.target.value)} placeholder="Enter referral code"
                  style={{width:'100%',background:'#06060f',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'11px 14px',color:'#e2e8f0',fontSize:'13px',fontFamily:'sans-serif',outline:'none',boxSizing:'border-box' as any,transition:'border-color 0.2s'}}
                  onFocus={e=>{e.target.style.borderColor='rgba(168,85,247,0.4)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)'}} />
              </div>
            </>)}

            {msg&&<div style={{fontSize:'12px',marginBottom:'12px',fontFamily:'sans-serif',color:msgOk?'#22c55e':'#f43f5e',padding:'8px 12px',background:msgOk?'rgba(34,197,94,0.06)':'rgba(244,63,94,0.06)',borderRadius:'6px',border:`1px solid ${msgOk?'rgba(34,197,94,0.2)':'rgba(244,63,94,0.2)'}`}}>{msg}</div>}

            <button onClick={step==='forgot'?handleForgot:handleSignup} disabled={loading}
              style={{width:'100%',padding:'12px',background:loading?'rgba(124,58,237,0.35)':'linear-gradient(135deg,#7c3aed,#9333ea,#d4a300)',border:'none',borderRadius:'9px',color:'#fff',fontSize:'14px',fontWeight:'600',cursor:loading?'not-allowed':'pointer',fontFamily:'sans-serif',transition:'all 0.2s',boxShadow:loading?'none':'0 4px 16px rgba(124,58,237,0.25)'}}>
              {loading?'Please wait...':step==='forgot'?'Send Reset Link →':step==='login'?'Send Sign-in Link →':'Create Account →'}
            </button>

            <div style={{textAlign:'center',marginTop:'14px',fontSize:'11px',color:'#444460',fontFamily:'sans-serif',display:'flex',flexDirection:'column',gap:'6px'}}>
              {step==='signup'&&<span>Have an account? <span onClick={()=>setStep('login')} style={{color:'#a855f7',cursor:'pointer'}}>Sign in</span></span>}
              {step==='login'&&<span>No account? <span onClick={()=>setStep('signup')} style={{color:'#a855f7',cursor:'pointer'}}>Create one free</span></span>}
              {step==='login'&&<span><span onClick={()=>setStep('forgot')} style={{color:'#71767b',cursor:'pointer',textDecoration:'underline'}}>Forgot access? Send new link</span></span>}
              {step==='forgot'&&<span><span onClick={()=>setStep('login')} style={{color:'#a855f7',cursor:'pointer'}}>← Back to sign in</span></span>}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#06060f}
        ::-webkit-scrollbar-thumb{background:#1e1e32;border-radius:2px}
      `}</style>
    </div>
  )
}
