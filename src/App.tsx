import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Camera, 
  Music, 
  Utensils, 
  MessageSquare, 
  Phone, 
  ChevronRight,
  QrCode,
  Send,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from './lib/utils';

// --- Types ---
interface RSVPFormData {
  fullName: string;
  attending: 'yes' | 'no';
  withPartner: 'yes' | 'no';
  partnerName: string;
  comment: string;
}

const heroImage = new URL('../IMG_0188.JPG', import.meta.url).href;
const weddingMusic = new URL('../wedding-music.mp3', import.meta.url).href;
const EVENT_TITLE = 'Свадьба Курбана и Фатимы';
const EVENT_LOCATION = 'Ресторан RIO, Тараз, Казахстан';
const EVENT_START_UTC = new Date('2026-08-03T13:00:00Z'); // 18:00 in Taraz (UTC+5)
const EVENT_END_UTC = new Date('2026-08-03T18:00:00Z');
const detailsBgImage = new URL('../IMG_0190.JPG', import.meta.url).href;
const RSVP_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyemVx2SUmVdupBZI3jzWQwScbF3_Yfx7g4rga5DEyEuoJ6jUlheQCMvKaew-LgO7ii/exec';

// --- Components ---

const SectionTitle = ({ children, subtitle, titleClassName }: { children: React.ReactNode, subtitle?: string, titleClassName?: string }) => (
  <div className="text-center mb-16 space-y-4">
    {subtitle && (
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-gold uppercase tracking-[0.4em] text-[10px] md:text-xs font-semibold"
      >
        {subtitle}
      </motion.p>
    )}
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1, duration: 0.8 }}
      className={cn("text-4xl md:text-6xl font-serif text-charcoal font-light tracking-[0.05em]", titleClassName)}
    >
      {children}
    </motion.h2>
    <motion.div 
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3, duration: 1 }}
      className="h-px w-32 bg-gold/30 mx-auto" 
    />
  </div>
);

const CountdownItem = ({ value, label }: { value: number, label: string }) => (
  <div className="flex flex-col items-center px-3 md:px-6">
    <span className="text-3xl md:text-6xl font-serif text-pure-white font-light tracking-tighter">{value.toString().padStart(2, '0')}</span>
    <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-pure-white/80 mt-2 font-bold">{label}</span>
  </div>
);

export default function App() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const heroRef = useRef(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RSVPFormData>({
    defaultValues: {
      attending: 'yes',
      withPartner: 'no',
    },
  });
  const withPartner = watch('withPartner');

  const formatICSDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const downloadCalendarEvent = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Wedding Vogue//RSVP Calendar//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@wedding-vogue`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(EVENT_START_UTC)}`,
      `DTEND:${formatICSDate(EVENT_END_UTC)}`,
      `SUMMARY:${EVENT_TITLE}`,
      `LOCATION:${EVENT_LOCATION}`,
      'DESCRIPTION:С нетерпением ждем вас на нашем свадебном вечере.',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wedding-invite.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const weddingDate = EVENT_START_UTC.getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = weddingDate - now;
      
      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.2;

    if (isMuted) {
      audio.pause();
      return;
    }

    audio.play().catch(() => {
      // Autoplay may be blocked until user interaction.
      setIsMuted(true);
    });
  }, [isMuted]);

  const handleAudioToggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      try {
        await audio.play();
        setIsMuted(false);
      } catch {
        setIsMuted(true);
      }
      return;
    }

    audio.pause();
    setIsMuted(true);
  };

  const onRSVPSubmit = async (data: RSVPFormData) => {
    setIsSubmitting(true);
    try {
      await fetch(RSVP_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          ...data,
          submittedAt: new Date().toISOString(),
          source: 'wedding-vogue-site',
        }),
      });
    } catch (error) {
      console.error('RSVP submit failed:', error);
    }

    if (data.attending === 'yes') {
      downloadCalendarEvent();
    }
    setRsvpSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen selection:bg-pure-black selection:text-pure-white flex flex-col items-center bg-pure-white scroll-smooth uppercase tracking-widest">
      
      {/* Audio Toggle (Aesthetic) */}
      <button 
        onClick={handleAudioToggle}
        className="fixed top-6 right-6 z-50 p-3 bg-pure-black text-pure-white border border-pure-white/20 hover:bg-pure-white hover:text-pure-black transition-all shadow-2xl"
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
      <audio ref={audioRef} src={weddingMusic} loop preload="auto" autoPlay />

      {/* 1. Hero Section */}
      <section ref={heroRef} className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-pure-black">
        {/* Parallax Background */}
        <motion.div style={{ y, scale }} className="absolute inset-0 z-0 opacity-80 grayscale">
          <img 
            src={heroImage} 
            alt="Mansur & Fatima"
            className="w-full h-full object-cover object-[center_32%]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 luxury-gradient" />
        </motion.div>

        <motion.div style={{ opacity }} className="relative z-10 text-center space-y-6 md:space-y-8 px-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="text-pure-white wedding-script normal-case text-3xl md:text-6xl font-light mb-4 md:mb-8 -translate-y-4 md:-translate-y-8"
          >
            Weeding Day
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.3 }}
            className="space-y-2 md:space-y-4 -translate-y-4 md:-translate-y-8"
          >
            <h1 className="text-[10vw] md:text-[5rem] font-serif text-pure-white tracking-tight leading-[0.95] font-extralight wedding-script normal-case not-italic whitespace-nowrap">
              Kurban & Fatima
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex flex-col items-center space-y-10 md:space-y-12 mt-80 md:mt-50"
          >
            <p className="text-pure-white wedding-script normal-case text-3xl md:text-5xl tracking-[0.2em] md:tracking-[0.25em] font-light -mb-4 md:-mb-6">
              03 . 08 . 26
            </p>
            
            <div className="flex items-center justify-center p-6 md:p-8 bg-transparent border border-pure-white/20 backdrop-blur-sm scale-90 md:scale-100 mt-4 md:mt-6">
              <CountdownItem value={timeLeft.days} label="дней" />
              <div className="h-10 md:h-12 w-px bg-pure-white/20" />
              <CountdownItem value={timeLeft.hours} label="часов" />
              <div className="h-10 md:h-12 w-px bg-pure-white/20" />
              <CountdownItem value={timeLeft.minutes} label="минут" />
              <div className="h-10 md:h-12 w-px bg-pure-white/20" />
              <CountdownItem value={timeLeft.seconds} label="секунд" />
            </div>
            
            <motion.a
              href="#rsvp"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-pure-white text-pure-black px-10 md:px-12 py-4 md:py-5 rounded-none uppercase tracking-[0.3em] md:tracking-[0.4em] text-[10px] md:text-xs font-bold shadow-2xl hover:bg-stone hover:text-pure-white transition-all"
            >
              ПОДТВЕРДИТЬ УЧАСТИЕ
            </motion.a>
          </motion.div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-pure-white/50 flex flex-col items-center gap-4"
        >
          <div className="w-px h-16 bg-pure-white/30" />
          <span className="text-[10px] tracking-[0.5em] font-bold rotate-90">ВНИЗ</span>
        </motion.div>
      </section>

      {/* 2. Invitation Section */}
      <section className="py-24 px-6 md:py-64 max-w-5xl mx-auto text-center space-y-16 md:space-y-24 border-x border-pure-black/5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-8 md:space-y-12"
        >
          <span className="text-pure-black/30 text-[10px] md:text-xs font-bold tracking-[0.4em] md:tracking-[0.6em]">EST. 2026</span>
          <h2 className="text-4xl md:text-8xl font-serif text-pure-black leading-tight md:leading-[1.1] font-extralight tracking-tighter">
            "САМЫЕ ВАЖНЫЕ МОМЕНТЫ <br className="hidden md:block" /> ХОЧЕТСЯ РАЗДЕЛИТЬ С БЛИЗКИМИ."
          </h2>
          <div className="h-px w-24 md:w-32 bg-pure-black mx-auto" />
          <p className="text-pure-black/70 leading-[1.8] md:leading-[2.3] text-lg md:text-2xl font-sans normal-case tracking-[0.08em] max-w-3xl mx-auto">
           Приглашаем вас разделить с нами один из самых важных и счастливых дней нашей жизни.
          </p>
        </motion.div>
      </section>

      {/* 3. Event Details */}
      <section className="relative w-full py-24 md:py-32 px-6 overflow-hidden">
        <img
          src={detailsBgImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center grayscale opacity-100"
        />
        <div className="absolute inset-0 bg-soft-gray/75" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <SectionTitle subtitle="ДЕТАЛИ">ГДЕ И КОГДА</SectionTitle>
          
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-5 md:left-6 top-6 bottom-6 w-px bg-pure-black/15" />

            {[
              {
                icon: Calendar,
                title: 'ДАТА И ВРЕМЯ',
                main: '03 АВГУСТА 2026',
                sub: 'НАЧАЛО В 18:00',
              },
              {
                icon: MapPin,
                title: 'ЛОКАЦИЯ',
                main: 'РЕСТОРАН RIO',
                sub: 'ТАРАЗ, КАЗАХСТАН',
                href: 'https://2gis.kz/taraz/firm/70000001051255903',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-14 md:pl-16 pb-10 md:pb-12 last:pb-0"
              >
                <div className="absolute left-0 top-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-pure-white border border-pure-black/15 flex items-center justify-center shadow-sm">
                  <item.icon className="w-4 h-4 md:w-5 md:h-5 text-pure-black/70" />
                </div>
                <p className="font-sans text-[11px] md:text-xs font-semibold tracking-[0.22em] text-pure-black/60 mb-3">{item.title}</p>
                <p className="text-pure-black font-serif text-2xl md:text-3xl italic">{item.main}</p>
                <p className="text-pure-black/50 text-xs tracking-[0.18em] font-semibold mt-2">{item.sub}</p>
                {item.href && (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-3 text-[10px] tracking-[0.2em] font-semibold text-pure-black/60 hover:text-pure-black underline underline-offset-4"
                  >
                    ОТКРЫТЬ НА КАРТЕ
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. RSVP Section */}
      <section id="rsvp" className="py-24 px-4 md:py-40 md:px-6 w-full max-w-5xl mx-auto">
        <SectionTitle subtitle="REGISTRY" titleClassName="text-3xl md:text-5xl">П О Д Т В Е Р Ж Д Е Н И Е</SectionTitle>
        
        <div className="bg-pure-white p-6 md:p-24 border border-pure-black shadow-[20px_20px_0px_rgba(0,0,0,0.05)]">
          <AnimatePresence mode="wait">
            {!rsvpSubmitted ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit(onRSVPSubmit)}
                className="space-y-10 md:space-y-12"
              >
                <div className="space-y-4">
                  <label className="text-[11px] md:text-xs font-semibold tracking-[0.25em] text-pure-black uppercase">Ваше имя</label>
                  <input 
                    {...register('fullName', { required: true })}
                    placeholder="ВВЕДИТЕ ФИО"
                    className="w-full bg-transparent border-b border-pure-black py-3 md:py-4 px-1 focus:outline-none transition-colors text-pure-black font-serif italic text-2xl md:text-[2rem]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
                  <div className="space-y-4">
                    <label className="text-[11px] md:text-xs font-semibold tracking-[0.25em] text-pure-black uppercase">Участие</label>
                    <select 
                      {...register('attending')}
                      className="w-full bg-transparent border-b border-pure-black py-3 md:py-4 px-1 focus:outline-none text-pure-black font-serif italic text-2xl md:text-[2rem]"
                    >
                      <option value="yes">ПРИДУ С РАДОСТЬЮ</option>
                      <option value="no">НЕ СМОГУ ПРИЙТИ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
                  <div className="space-y-4">
                    <label className="text-[11px] md:text-xs font-semibold tracking-[0.25em] text-pure-black uppercase">Вы будете с парой?</label>
                    <select
                      {...register('withPartner')}
                      className="w-full bg-transparent border-b border-pure-black py-3 md:py-4 px-1 focus:outline-none text-pure-black font-serif italic text-2xl md:text-[2rem]"
                    >
                      <option value="no">НЕТ</option>
                      <option value="yes">ДА</option>
                    </select>
                  </div>

                  {withPartner === 'yes' && (
                    <div className="space-y-4">
                      <label className="text-[11px] md:text-xs font-semibold tracking-[0.25em] text-pure-black uppercase">Имя пары</label>
                      <input
                        {...register('partnerName', {
                          validate: (value) => withPartner !== 'yes' || !!value?.trim() || 'Укажите имя пары',
                        })}
                        placeholder="ИМЯ И ФАМИЛИЯ"
                        className="w-full bg-transparent border-b border-pure-black py-3 md:py-4 px-1 focus:outline-none transition-colors text-pure-black font-serif italic text-2xl md:text-[2rem]"
                      />
                      {errors.partnerName && (
                        <p className="text-[10px] tracking-[0.15em] text-pure-black/50 uppercase">{errors.partnerName.message}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-12">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-pure-black text-pure-white py-6 rounded-none font-sans font-semibold uppercase tracking-[0.32em] text-xs hover:bg-stone transition-all flex items-center justify-center gap-4"
                  >
                    {isSubmitting ? 'ОТПРАВКА...' : 'ПОДТВЕРДИТЬ УЧАСТИЕ'} <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24 space-y-12"
              >
                <div className="w-24 h-px bg-pure-black mx-auto" />
                <h3 className="text-5xl font-serif font-extralight tracking-tighter italic">ПОДТВЕРЖДЕНО.</h3>
                <p className="text-pure-black/50 text-xs font-bold tracking-[0.5em]">МЫ ЖДЕМ ВАС.</p>
                <button 
                  onClick={() => setRsvpSubmitted(false)}
                  className="text-pure-black/30 hover:text-pure-black uppercase tracking-widest text-[10px] font-bold underline underline-offset-8"
                >
                  ИЗМЕНИТЬ ДАННЫЕ
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

    </div>
  );
}
