<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Search, Play, Pause, SkipBack, SkipForward, Volume2, Music2, ExternalLink, AlertCircle, Headphones } from 'lucide-vue-next'
import { getTrending, search, type Track } from './api'

const tracks = ref<Track[]>([])
const query = ref('')
const loading = ref(false)
const error = ref('')
const current = ref<Track | null>(null)
const playing = ref(false)
const progress = ref(0)
const volume = ref(0.8)
const audio = ref<HTMLAudioElement>()

async function load(fn: () => Promise<Track[]>) {
  loading.value = true; error.value = ''
  try { tracks.value = await fn() }
  catch (e) { error.value = (e as Error).message }
  finally { loading.value = false }
}

onMounted(() => load(getTrending))

let timer: number
watch(query, q => {
  clearTimeout(timer)
  timer = window.setTimeout(() => load(q.trim() ? () => search(q) : getTrending), 350)
})

function play(t: Track) {
  if (!t.streamUrl) return t.pageUrl && window.open(t.pageUrl, '_blank')
  if (current.value?.id === t.id) return toggle()
  current.value = t
  requestAnimationFrame(() => audio.value?.play())
}
function toggle() { playing.value ? audio.value?.pause() : audio.value?.play() }
function step(d: number) {
  if (!current.value) return
  const i = tracks.value.findIndex(t => t.id === current.value!.id)
  const next = tracks.value[(i + d + tracks.value.length) % tracks.value.length]
  if (next) play(next)
}
function seek(e: Event) {
  const a = audio.value; if (!a?.duration) return
  a.currentTime = (Number((e.target as HTMLInputElement).value) / 100) * a.duration
}
function onTime(e: Event) {
  const a = e.target as HTMLAudioElement
  progress.value = (a.currentTime / (a.duration || 1)) * 100
}
watch(volume, v => { if (audio.value) audio.value.volume = v })
</script>

<template>
  <header class="top">
    <div class="brand"><Music2 :size="26" /> Wavelane</div>
    <label class="search">
      <Search :size="18" />
      <input v-model="query" placeholder="Search songs or artists" />
    </label>
  </header>

  <section class="hero">
    <span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span>
    <div class="hero-text">
      <span class="pill"><Headphones :size="16" /> Stream. Discover. Repeat.</span>
      <h1>Find your next <em>favourite</em> sound</h1>
      <p>Fresh trending tracks from artists around the world, one tap away.</p>
    </div>
    <div class="eq big"><i v-for="n in 12" :key="n" :style="{ animationDelay: n * 0.09 + 's' }"></i></div>
  </section>

  <main>
    <h2>{{ query ? `Results for “${query}”` : 'Trending now' }}</h2>
    <p v-if="error" class="state error"><AlertCircle :size="20" /> {{ error }}</p>
    <p v-else-if="!loading && !tracks.length" class="state">Nothing found.</p>

    <section v-if="loading" class="grid">
      <div v-for="n in 8" :key="n" class="card skeleton"><div class="cover"></div><h3></h3><p></p></div>
    </section>

    <TransitionGroup v-else name="list" tag="section" class="grid">
      <article v-for="(t, i) in tracks" :key="t.id" class="card" :class="{ active: current?.id === t.id }"
        :style="{ '--i': i }" @click="play(t)">
        <div class="cover">
          <img :src="t.cover" :alt="t.title" loading="lazy" />
          <div v-if="current?.id === t.id && playing" class="eq"><i v-for="n in 4" :key="n" :style="{ animationDelay: n * 0.12 + 's' }"></i></div>
          <span class="overlay">
            <span class="btn">
              <ExternalLink v-if="!t.streamUrl" :size="22" />
              <Pause v-else-if="current?.id === t.id && playing" :size="22" />
              <Play v-else :size="22" />
            </span>
          </span>
        </div>
        <h3>{{ t.title }}</h3>
        <p>{{ t.artist }}</p>
      </article>
    </TransitionGroup>
  </main>

  <Transition name="slide">
    <footer v-if="current" class="player">
      <div class="now">
        <img :class="{ spin: playing }" :src="current.cover" alt="" />
        <div class="meta"><strong>{{ current.title }}</strong><span>{{ current.artist }}</span></div>
      </div>
      <div class="center">
        <div class="controls">
          <button @click="step(-1)" aria-label="Previous"><SkipBack :size="20" /></button>
          <button class="main" :class="{ pulse: playing }" @click="toggle" aria-label="Play or pause">
            <Pause v-if="playing" :size="22" /><Play v-else :size="22" />
          </button>
          <button @click="step(1)" aria-label="Next"><SkipForward :size="20" /></button>
        </div>
        <input class="bar" type="range" min="0" max="100" step="0.1" :value="progress"
          :style="{ '--p': progress + '%' }" @input="seek" />
      </div>
      <label class="vol"><Volume2 :size="18" /><input type="range" min="0" max="1" step="0.01" v-model.number="volume"
        :style="{ '--p': volume * 100 + '%' }" /></label>
      <audio ref="audio" :src="current.streamUrl"
        @play="playing = true" @pause="playing = false" @ended="step(1)" @timeupdate="onTime" />
    </footer>
  </Transition>
</template>

<style>
:root {
  --bg: #f3f8ff; --surface: #ffffff; --text: #0b1f44; --muted: #5d7096;
  --blue: #2563eb; --blue-dark: #1e40af; --sky: #38bdf8; --border: #dbe7fb;
  --grad: linear-gradient(135deg, var(--blue), var(--sky));
  color-scheme: light;
}
* { box-sizing: border-box; margin: 0; }
html { scroll-behavior: smooth; }
body { font-family: Inter, system-ui, sans-serif; background: var(--bg); color: var(--text); padding-bottom: 120px; }

/* Header */
.top { position: sticky; top: 0; z-index: 10; display: flex; gap: 1.5rem; align-items: center; justify-content: space-between;
  padding: 1rem clamp(1rem, 4vw, 3rem); background: rgba(255,255,255,.8); backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border); animation: drop .6s cubic-bezier(.2,.8,.2,1) both; }
.brand { display: flex; gap: .5rem; align-items: center; font-weight: 800; font-size: 1.3rem; color: var(--blue-dark); }
.brand svg { color: var(--blue); animation: bob 2.4s ease-in-out infinite; }
.search { display: flex; align-items: center; gap: .5rem; flex: 1; max-width: 420px; padding: .6rem 1rem;
  background: #fff; border: 1px solid var(--border); border-radius: 999px; color: var(--muted); transition: all .25s; }
.search:focus-within { border-color: var(--blue); box-shadow: 0 0 0 4px rgba(37,99,235,.15); max-width: 480px; }
.search input { flex: 1; border: 0; outline: 0; background: none; color: var(--text); font-size: 1rem; }

/* Hero */
.hero { position: relative; overflow: hidden; margin: 1.5rem clamp(1rem, 4vw, 3rem) 0; padding: clamp(2rem, 5vw, 3.5rem);
  border-radius: 28px; color: #fff; background: linear-gradient(120deg, var(--blue-dark), var(--blue) 55%, var(--sky));
  display: flex; align-items: flex-end; justify-content: space-between; gap: 2rem; animation: rise .8s .1s both; }
.hero-text { position: relative; z-index: 1; max-width: 560px; }
.hero h1 { font-size: clamp(1.8rem, 4.5vw, 3rem); line-height: 1.1; margin: .9rem 0 .6rem; }
.hero em { font-style: normal; background: #fff; color: var(--blue); padding: 0 .35em; border-radius: .3em; }
.hero p { opacity: .9; }
.pill { display: inline-flex; gap: .4rem; align-items: center; padding: .35rem .8rem; border-radius: 999px; font-size: .85rem;
  background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.35); }
.blob { position: absolute; border-radius: 50%; background: rgba(255,255,255,.18); filter: blur(2px); animation: float 9s ease-in-out infinite; }
.b1 { width: 220px; height: 220px; top: -70px; right: 18%; }
.b2 { width: 120px; height: 120px; bottom: -30px; left: 42%; animation-delay: -3s; }
.b3 { width: 70px; height: 70px; top: 30px; left: 55%; animation-delay: -6s; }

/* Equalizer */
.eq { display: flex; align-items: flex-end; gap: 4px; height: 22px; }
.eq i { width: 4px; height: 100%; background: #fff; border-radius: 2px; transform-origin: bottom; animation: eq 1s ease-in-out infinite; }
.eq.big { position: relative; z-index: 1; height: 80px; gap: 6px; }
.eq.big i { width: 7px; opacity: .85; }
.cover .eq { position: absolute; left: 10px; bottom: 10px; padding: 6px 8px; height: 30px; background: rgba(37,99,235,.85); border-radius: 8px; }
.cover .eq i { width: 3px; }

/* Content */
main { padding: 2rem clamp(1rem, 4vw, 3rem); }
h2 { margin-bottom: 1.25rem; font-size: 1.5rem; position: relative; display: inline-block; }
h2::after { content: ''; position: absolute; left: 0; bottom: -6px; height: 4px; width: 60%; border-radius: 4px; background: var(--grad); animation: grow .8s .3s both; }
.state { display: flex; gap: .5rem; align-items: center; color: var(--muted); margin-top: 1rem; }
.state.error { color: #dc2626; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 1.25rem; margin-top: 1rem; }

.card { cursor: pointer; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: .75rem;
  transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s, border-color .3s;
  animation: rise .6s calc(var(--i, 0) * 60ms) cubic-bezier(.2,.8,.2,1) both; }
.card:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 18px 36px -14px rgba(37,99,235,.45); border-color: var(--sky); }
.card:active { transform: scale(.98); }
.card.active { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(37,99,235,.2); }
.cover { position: relative; aspect-ratio: 1; border-radius: 13px; overflow: hidden; margin-bottom: .65rem; background: var(--border); }
.cover img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s; }
.card:hover .cover img { transform: scale(1.12) rotate(1.5deg); }
.overlay { position: absolute; inset: 0; display: grid; place-items: center; background: linear-gradient(to top, rgba(30,64,175,.6), transparent 70%); opacity: 0; transition: opacity .3s; }
.btn { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; background: #fff; color: var(--blue); transform: translateY(14px) scale(.7); transition: transform .35s cubic-bezier(.3,1.6,.5,1); }
.card:hover .overlay, .card.active .overlay { opacity: 1; }
.card:hover .btn, .card.active .btn { transform: none; }
.card h3 { font-size: .95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card p { font-size: .82rem; color: var(--muted); }

/* Skeleton shimmer */
.skeleton { pointer-events: none; }
.skeleton .cover, .skeleton h3, .skeleton p { background: linear-gradient(90deg, #e4eefc 25%, #f5f9ff 50%, #e4eefc 75%); background-size: 200% 100%; animation: shimmer 1.3s infinite; }
.skeleton h3 { height: 14px; width: 80%; border-radius: 6px; margin-bottom: 8px; }
.skeleton p { height: 11px; width: 50%; border-radius: 6px; }

/* List transitions */
.list-enter-active, .list-leave-active { transition: all .35s; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(16px) scale(.95); }

/* Player */
.player { position: fixed; inset: auto clamp(.5rem, 2vw, 1.5rem) 1rem; display: grid; grid-template-columns: 1fr 1.6fr 1fr; gap: 1rem; align-items: center;
  padding: .75rem 1.25rem; border-radius: 22px; color: #fff; background: linear-gradient(120deg, var(--blue-dark), var(--blue));
  box-shadow: 0 20px 50px -15px rgba(30,64,175,.7); z-index: 20; }
.slide-enter-active, .slide-leave-active { transition: all .5s cubic-bezier(.2,.8,.2,1); }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(100%); }
.now { display: flex; gap: .8rem; align-items: center; min-width: 0; }
.now img { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,.7); animation: spin 8s linear infinite paused; flex: none; }
.now img.spin { animation-play-state: running; }
.meta { display: flex; flex-direction: column; min-width: 0; }
.meta strong, .meta span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.meta span { opacity: .8; font-size: .85rem; }
.center { display: flex; flex-direction: column; gap: .4rem; align-items: center; }
.controls { display: flex; gap: .6rem; align-items: center; }
.controls button { display: grid; place-items: center; width: 38px; height: 38px; border: 0; border-radius: 50%; background: none; color: #fff; cursor: pointer; transition: transform .2s, background .2s; }
.controls button:hover { background: rgba(255,255,255,.18); transform: scale(1.12); }
.controls .main { width: 46px; height: 46px; background: #fff; color: var(--blue); }
.controls .main:hover { background: #fff; }
.controls .main.pulse { animation: ring 1.6s infinite; }
.player input[type=range] { -webkit-appearance: none; appearance: none; height: 5px; border-radius: 5px; outline: 0; cursor: pointer;
  background: linear-gradient(to right, #fff var(--p, 0%), rgba(255,255,255,.3) var(--p, 0%)); }
.player input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform .2s; }
.player input[type=range]::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 50%; background: #fff; }
.player input[type=range]:hover::-webkit-slider-thumb { transform: scale(1.35); }
.bar { width: 100%; }
.vol { display: flex; gap: .5rem; align-items: center; justify-content: flex-end; } .vol input { width: 100px; }

/* Keyframes */
@keyframes rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
@keyframes drop { from { opacity: 0; transform: translateY(-100%); } to { opacity: 1; transform: none; } }
@keyframes float { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-20px, 25px); } }
@keyframes bob { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-3px) rotate(-8deg); } }
@keyframes eq { 0%, 100% { transform: scaleY(.2); } 50% { transform: scaleY(1); } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes shimmer { to { background-position: -200% 0; } }
@keyframes grow { from { width: 0; } to { width: 60%; } }
@keyframes ring { 0% { box-shadow: 0 0 0 0 rgba(255,255,255,.6); } 100% { box-shadow: 0 0 0 16px rgba(255,255,255,0); } }

@media (max-width: 720px) {
  .hero .eq.big { display: none; }
  .player { grid-template-columns: 1fr; gap: .5rem; }
  .vol { display: none; }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }
</style>
