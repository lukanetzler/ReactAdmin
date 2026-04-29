<!-- fullWidth: false tocVisible: false tableWrap: true -->
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Prevail | The Sacred Stillness</title>

<script src="https://cdn.tailwindcss.com"></script>

<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700&display=swap" rel="stylesheet">

<script src="https://unpkg.com/lucide@latest"></script>

<style>

:root {

\--sacred-parchment: #FDF9F3;

\--morning-cream: #F4EFE6;

\--deep-earth: #433422;

\--terracotta-grace: #D4A373;

\--sage-peace: #8E9775;

\--flame-bright: #FFF9E6;

}

\

body {

background-color: var(--sacred-parchment);

color: var(--deep-earth);

font-family: 'Montserrat', sans-serif;

overflow-x: hidden;

margin: 0;

display: flex;

flex-direction: column;

min-height: 100vh;

}

\

.serif { font-family: 'Playfair Display', serif; }

\

/\* The Arched Horizon Transition \*/

.arched-horizon {

border-top-left-radius: 100% 120px;

border-top-right-radius: 100% 120px;

background-color: var(--morning-cream);

margin-top: -80px;

padding-top: 100px;

flex-grow: 1;

position: relative;

z-index: 10;

}

\

        @media (min-width: 768px) {

            .arched-horizon {

border-top-left-radius: 100% 200px;

border-top-right-radius: 100% 200px;

}

        }

\

/\* Sun-Up Entrance \*/

.sun-up {

opacity: 0;

transform: translateY(20px);

animation: sunUp 1.2s ease-out forwards;

}

\

@keyframes sunUp { to { opacity: 1; transform: translateY(0); } }

\

/\* Breathing Pulse \*/

.pulse-breathing { animation: pulse 4s ease-in-out infinite; }

@keyframes pulse {

0%, 100% { opacity: 1; transform: scale(1); }

50% { opacity: 0.6; transform: scale(1.05); }

}

\

/\* Improved Campfire Backdrop \*/

.fire-scene {

position: relative;

height: 380px;

width: 100%;

display: flex;

justify-content: center;

align-items: flex-end;

overflow: hidden;

background: linear-gradient(to bottom, #FDF9F3 0%, #E8E2D5 100%);

}

\

.forest-silhouette {

position: absolute;

bottom: 40px;

width: 110%;

height: 120px;

fill: var(--deep-earth);

opacity: 0.08;

pointer-events: none;

}

\

.campfire-container {

position: relative;

z-index: 5;

margin-bottom: 65px;

display: flex;

flex-direction: column;

align-items: center;

}

\

/\* Detailed SVG Fire Animation with 1px Blur \*/

.fire-svg {

width: 110px;

height: 140px;

filter: drop-shadow(0 0 10px rgba(212, 163, 115, 0.15));

}

\

.flame-path {

transform-origin: bottom center;

opacity: 0;

transition: opacity 1.5s ease;

/\* 1px blur for sharp, natural definition \*/

filter: blur(0.5px);

}

\

.is-playing .flame-path {

opacity: 1;

animation: flame-flicker var(--d) ease-in-out infinite;

}

\

@keyframes flame-flicker {

0%, 100% { transform: scale(1, 1) rotate(0deg) translateY(0); }

33% { transform: scale(1.05, 0.95) rotate(-1deg) translateY(-1.5px); }

66% { transform: scale(0.95, 1.05) rotate(1deg) translateY(-0.5px); }

}

\

.fire-glow {

position: absolute;

bottom: 30px;

width: 240px;

height: 180px;

background: radial-gradient(circle, var(--terracotta-grace) 0%, transparent 70%);

opacity: 0;

filter: blur(10px); 

transition: opacity 2s ease;

pointer-events: none;

}

.is-playing .fire-glow { opacity: 0.1; }

\

/\* Progress Bar \*/

.progress-bar {

height: 4px;

background: rgba(67, 52, 34, 0.1);

border-radius: 2px;

position: relative;

cursor: pointer;

}

\

.progress-fill {

height: 100%;

background: var(--terracotta-grace);

border-radius: 2px;

width: 0%; 

transition: width 0.3s linear;

}

\

.path-card {

background-color: var(--morning-cream);

border-radius: 40px;

transition: all 0.3s ease;

border: 2px solid transparent;

}

\

.path-card:hover {

border-color: var(--terracotta-grace);

transform: translateY(-4px);

}

\

.pill-button {

border-radius: 24px;

padding: 12px 28px;

font-weight: 700;

letter-spacing: 0.1em;

transition: all 0.3s ease;

}

\

.text-metadata {

text-transform: uppercase;

letter-spacing: 0.4em;

font-weight: 700;

font-size: 0.7rem;

}

</style>

</head>

<body>

\

<header class="p-8 flex justify-between items-center z-20">

<div class="flex items-center space-x-2">

<i data-lucide="sun" class="text-\[#D4A373\]" stroke-width="1.5"></i>

<span class="text-metadata text-deep-earth">PREVAIL</span>

</div>

<button class="p-2"><i data-lucide="menu" class="text-deep-earth" stroke-width="1.5"></i></button>

</header>

\

<main class="flex-grow flex flex-col">

<!-- Campfire Area (Atmospheric Sky) -->

<div id="fireScene" class="fire-scene sun-up">

<!-- Subtle forest line silhouette -->

<svg class="forest-silhouette" viewBox="0 0 1000 100" preserveAspectRatio="none">

<path d="M0,100 L0,80 L20,60 L40,85 L60,40 L80,90 L100,55 L120,80 L150,30 L180,90 L210,50 L250,95 L280,45 L320,85 L350,20 L400,90 L450,40 L500,95 L550,35 L600,85 L650,25 L700,90 L750,45 L800,95 L850,30 L900,85 L950,40 L1000,90 L1000,100 Z" />

</svg>

\

<div class="fire-glow"></div>

\

<div class="campfire-container">

<!-- SVG Fire -->

<svg class="fire-svg" viewBox="0 0 100 120">

<!-- Logs (Grounded) -->

<g fill="#433422" opacity="0.35">

<rect x="25" y="105" width="50" height="7" rx="3.5" transform="rotate(-10 50 108.5)" />

<rect x="25" y="105" width="50" height="7" rx="3.5" transform="rotate(15 50 108.5)" />

<circle cx="50" cy="108.5" r="5" />

</g>

<!-- Outer Flame (Terracotta) -->

<path class="flame-path" style="--d: 3.5s;" fill="#D4A373" d="M50,110 C32,110 28,92 50,48 C72,92 68,110 50,110 Z" />

<!-- Inner Flame (Morning Cream) -->

<path class="flame-path" style="--d: 2.6s;" fill="#F4EFE6" d="M50,108 C40,108 34,98 50,65 C66,98 60,108 50,108 Z" />

<!-- Core Flame (Bright) -->

<path class="flame-path" style="--d: 1.8s;" fill="#FFF9E6" d="M50,106 C44,106 40,102 50,80 C60,102 56,106 50,106 Z" />

</svg>

</div>

</div>

\

<div class="arched-horizon px-8 pb-20 shadow-inner">

<div class="max-w-md mx-auto text-center sun-up" style="animation-delay: 0.3s;">

<p class="text-metadata text-\[#8E9775\] mb-4">Current Session</p>

<h1 class="serif text-4xl mb-6 font-bold">The Embers of Peace</h1>

<p class="serif italic text-lg opacity-70 mb-12 leading-relaxed">

                    "Be still, and know that I am God."<br>

<span class="text-sm not-italic font-sans font-bold tracking-widest">— PSALM 46:10</span>

</p>

\

<div class="space-y-8">

<div class="space-y-2">

<div class="progress-bar">

<div id="progressFill" class="progress-fill"></div>

</div>

<div class="flex justify-between text-metadata text-\[10px\] opacity-60">

<span id="currentTime">00:00</span>

<span id="totalTime">12:00</span>

</div>

</div>

\

<div class="flex items-center justify-center space-x-12">

<button class="hover:opacity-60 transition-opacity">

<i data-lucide="skip-back" stroke-width="1.5"></i>

</button>

<button id="playBtn" class="w-20 h-20 bg-\[#433422\] text-white rounded-full flex items-center justify-center pulse-breathing hover:scale-105 transition-transform">

<i data-lucide="play" fill="white" class="ml-1"></i>

</button>

\

<button class="hover:opacity-60 transition-opacity">

<i data-lucide="skip-forward" stroke-width="1.5"></i>

</button>

</div>

\

<div class="flex justify-center space-x-6 pt-4">

<button class="text-metadata hover:text-\[#D4A373\] transition-colors flex items-center space-x-2">

<i data-lucide="leaf" size="14"></i>

<span>NATURE SOUNDS</span>

</button>

<button class="text-metadata hover:text-\[#D4A373\] transition-colors flex items-center space-x-2">

<i data-lucide="heart" size="14"></i>

<span>SAVE WALK</span>

</button>

</div>

</div>

\

<div class="mt-16 text-left">

<p class="text-metadata mb-4 px-2">YOUR NEXT STEP</p>

<div class="path-card p-8 flex items-center space-x-6 cursor-pointer">

<div class="w-14 h-14 rounded-2xl bg-white flex items-center justify-center">

<i data-lucide="compass" class="text-\[#D4A373\]" stroke-width="2.5"></i>

</div>

<div class="flex-grow">

<h3 class="serif text-xl font-bold">Guided Evening Prayer</h3>

<p class="text-sm opacity-60">15 min • Returning to Presence</p>

</div>

<i data-lucide="chevron-right" class="text-\[#D4A373\]" stroke-width="2"></i>

</div>

</div>

\

<div class="mt-20">

<button class="pill-button bg-\[#433422\] text-white text-metadata hover:opacity-90 active:scale-95">

                        END YOUR WALK

</button>

</div>

</div>

</div>

</main>

\

<footer class="p-8 text-center text-metadata opacity-30 text-\[9px\] z-20">

        &copy; 2024 PREVAIL SACRED STILLNESS. ALL RIGHTS RESERVED.

</footer>

\

<script>

        lucide.createIcons();

\

const playBtn = document.getElementById('playBtn');

const fireScene = document.getElementById('fireScene');

const progressFill = document.getElementById('progressFill');

const currentTimeEl = document.getElementById('currentTime');

let isPlaying = false;

let elapsedSeconds = 0;

const totalSeconds = 720;

let timerInterval = null;

\

function formatTime(seconds) {

const mins = Math.floor(seconds / 60);

const secs = seconds % 60;

return \`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}\`;

}

\

function updateProgress() {

if (elapsedSeconds < totalSeconds) {

                elapsedSeconds++;

const percentage = (elapsedSeconds / totalSeconds) \* 100;

                progressFill.style.width = \`${percentage}%\`;

                currentTimeEl.textContent = formatTime(elapsedSeconds);

} else {

if (isPlaying) togglePlay();

}

}

\

function togglePlay() {

            isPlaying = !isPlaying;

const playIcon = playBtn.querySelector('\[data-lucide\]');

if (isPlaying) {

if (playIcon) {

                    playIcon.setAttribute('data-lucide', 'pause');

                    playIcon.removeAttribute('fill');

}

                playBtn.classList.remove('pulse-breathing');

                fireScene.classList.add('is-playing');

                timerInterval = setInterval(updateProgress, 1000);

} else {

if (playIcon) {

                    playIcon.setAttribute('data-lucide', 'play');

                    playIcon.setAttribute('fill', 'white');

}

                playBtn.classList.add('pulse-breathing');

                fireScene.classList.remove('is-playing');

                clearInterval(timerInterval);

}

            lucide.createIcons();

}

\

        playBtn.addEventListener('click', togglePlay);

</script>

</body>

</html>