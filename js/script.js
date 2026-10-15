/* ==========================================================
   Sonic Unleashed · Día y Noche
   Todo el efecto principal es propio (sin librerías).
   Idea central: una variable "progreso" (0 = día, 1 = noche)
   que depende del scroll y controla colores, astro y partículas.
   ========================================================== */

// ---------- Utilidades ----------
const lerp  = (a, b, t) => a + (b - a) * t;                       // interpolación lineal
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const mezclar = (c1, c2, t) => c1.map((v, i) => Math.round(lerp(v, c2[i], t)));
const rgb = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

// Colores [r, g, b] de cada mundo
const DIA   = { arriba: [74, 168, 255], abajo: [255, 214, 120], acento: [255, 200, 40] };
const NOCHE = { arriba: [10, 5, 32],    abajo: [70, 25, 100],   acento: [230, 235, 255] };

// ---------- Estado ----------
const raiz = document.documentElement;
const astro = document.getElementById('astro');
const seccionTransf = document.getElementById('transformacion');
const tituloTransf = document.getElementById('titulo-transf');
const textoTransf = document.getElementById('texto-transf');

let objetivo = 0;   // progreso según el scroll
let progreso = 0;   // progreso suavizado (el que se dibuja)
let mx = 0, my = 0; // posición del puntero normalizada (-1 a 1)

// ---------- 1. SCROLL: calcula el progreso día -> noche ----------
function calcularScroll() {
  const inicio = seccionTransf.offsetTop - window.innerHeight * 0.5;
  const largo  = seccionTransf.offsetHeight - window.innerHeight * 0.5;
  objetivo = clamp((window.scrollY - inicio) / largo);
}
window.addEventListener('scroll', calcularScroll, { passive: true });
window.addEventListener('resize', calcularScroll);

// ---------- 2. EVENTO: el astro sigue al mouse / dedo ----------
window.addEventListener('pointermove', (e) => {
  mx = (e.clientX / window.innerWidth)  * 2 - 1;
  my = (e.clientY / window.innerHeight) * 2 - 1;
});

// ---------- 3. EVENTO: inclinación 3D de los paneles con hover ----------
document.querySelectorAll('.tilt').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    el.style.transform = `perspective(600px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.03)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
});

// ---------- 4. ENTRADA: aparición al llegar a cada elemento ----------
const observador = new IntersectionObserver((entradas) => {
  entradas.forEach((en) => { if (en.isIntersecting) en.target.classList.add('visible'); });
}, { threshold: 0.2 });
document.querySelectorAll('.reveal').forEach((el) => observador.observe(el));

// ---------- 5. FONDO: partículas que pasan de líneas de velocidad a estrellas ----------
const canvas = document.getElementById('fondo');
const ctx = canvas.getContext('2d');
let particulas = [];

function crearParticulas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const cantidad = window.innerWidth < 700 ? 40 : 100;   // menos en móvil
  particulas = Array.from({ length: cantidad }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    v: 0.5 + Math.random(),           // factor de velocidad propio
    fase: Math.random() * Math.PI * 2 // para el parpadeo
  }));
}
window.addEventListener('resize', crearParticulas);

function dibujarParticulas(t) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = 'round';
  const largo = lerp(70, 0.1, progreso);       // línea larga (día) -> punto (noche)
  const vel   = lerp(18, 0.15, progreso);      // rápido (día) -> casi quieto (noche)
  const color = mezclar([255, 255, 255], [255, 240, 190], progreso).join(',');

  particulas.forEach((p) => {
    p.x -= vel * p.v;
    if (p.x + largo < 0) { p.x = canvas.width + largo; p.y = Math.random() * canvas.height; }
    const parpadeo = 0.6 + 0.4 * Math.sin(t / 600 + p.fase);
    const alfa = lerp(0.55, 1, progreso) * lerp(1, parpadeo, progreso);
    ctx.strokeStyle = `rgba(${color}, ${alfa})`;
    ctx.lineWidth = lerp(2, 3.2, progreso) * p.v;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + largo * p.v, p.y);
    ctx.stroke();
  });
}

// ---------- 6. ANIMACIÓN PROPIA: bucle principal ----------
function bucle(t) {
  // suavizado: el progreso "persigue" al objetivo
  progreso += (objetivo - progreso) * 0.08;

  // colores del cielo mezclados según el progreso
  raiz.style.setProperty('--cielo-arriba', rgb(mezclar(DIA.arriba, NOCHE.arriba, progreso)));
  raiz.style.setProperty('--cielo-abajo',  rgb(mezclar(DIA.abajo,  NOCHE.abajo,  progreso)));
  raiz.style.setProperty('--acento',       rgb(mezclar(DIA.acento, NOCHE.acento, progreso)));
  raiz.style.setProperty('--progreso', progreso.toFixed(3));

  // astro: baja un poco con el scroll + sigue al puntero + escala
  const bajada = window.scrollY * 0.06;
  const escala = lerp(1, 0.85, progreso);
  astro.style.transform =
    `translate(${-mx * 25}px, ${bajada - my * 25}px) scale(${escala})`;

  // título de la transformación: crece y gira levemente
  tituloTransf.style.transform = `scale(${lerp(0.7, 1.25, progreso)}) rotate(${lerp(-4, 4, progreso)}deg)`;
  tituloTransf.style.opacity = lerp(0.4, 1, progreso);
  textoTransf.style.opacity = clamp(1 - progreso * 1.5);

  dibujarParticulas(t);
  requestAnimationFrame(bucle);
}

crearParticulas();
calcularScroll();
requestAnimationFrame(bucle);
