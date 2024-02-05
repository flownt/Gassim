import { ParticleBox } from "rs-wasm-gassim";

import { memory } from "rs-wasm-gassim/rs_wasm_gassim_bg.wasm";

const pre = document.getElementById("parts-pre");

const canvas = document.getElementById("parts-canvas");
const graph_cv = document.getElementById("graph-canvas");

canvas.height = 600;
canvas.width = 600;
const ctx = canvas.getContext('2d');

graph_cv.height = canvas.height
graph_cv.width  = canvas.width

const gf_ctx = graph_cv.getContext('2d');

const particleBox = ParticleBox.new();
console.log(particleBox)

window.pb = particleBox

let particles_ptr = particleBox.particles_ptr();
let particles_len = particleBox.particles_len();
let particle_size = particleBox.particle_size();
let particles = new Float64Array(memory.buffer, particles_ptr, particles_len * particle_size);

let scaling = 1.0;

const D = 2;

const loadParticles = () => {
  particles_ptr = particleBox.particles_ptr();
  particles_len = particleBox.particles_len();
  particle_size = particleBox.particle_size();
  particles = new Float64Array(memory.buffer, particles_ptr, particles_len * particle_size);

  const bounds = new Float64Array(memory.buffer,
                            particleBox.bbox_ptr(),
                            2*D)

  scaling = Math.min(canvas.width/(bounds[2]-bounds[0]),
                     canvas.height/bounds[3]-bounds[1])
}

window.ps_f64 = particles



const drawEdge = () => {
  ctx.beginPath()
  ctx.rect(1, 1, canvas.width-1, canvas.height-1)
  ctx.stroke()
}

const drawParticles = () => {

  for(let i =0; i < particles_len; i++){
    const x = particles[i*particle_size+0] * scaling
    const y = particles[i*particle_size+1] * scaling
    const part_radius = particles[i*particle_size + 4] * scaling

    // if(i == 0){
    //   console.log('part[0].x = ', [x, y], 'r = ', part_radius)
    // }

    ctx.beginPath()
    ctx.arc(x, y, part_radius, 0, 7)
    // ctx.strokeText(i, x, y)
    ctx.stroke()
  }


}

const drawGraph = () => {
  const min_v =  0.0;
  const max_v =  0.1;

  const n_buckets = 25;
  const bucket_length = (max_v - min_v)/n_buckets;

  let buckets_cnt = Array(n_buckets).fill(0);
  let buckets_lower = Array(n_buckets)
  let buckets_upper = Array(n_buckets)

  for(var i=0;i<n_buckets;i++){
    buckets_lower[i] = min_v +     i*bucket_length;
    buckets_upper[i] = min_v + (i+1)*bucket_length;
  }

  let v = Array(particles_len)

  for(let i =0; i < particles_len; i++){
    const vx = particles[i*particle_size+2]
    const vy = particles[i*particle_size+3]

    v[i] = Math.sqrt(vx*vx + vy*vy);
  }
  v = v.sort()

  let E =0

  let j=0;
  for(let i =0; i < particles_len; i++){
    while(v[i] > buckets_upper[j] && j < n_buckets) j++

    buckets_cnt[j] +=1;
    E+=v[i]*v[i]
  }

  const v_rms = Math.sqrt(E/particles_len)

  const transform_x = (v_coord) => {
    return (v_coord - min_v)/(max_v - min_v) * graph_cv.width
  }

  const transform_y = (cnt) => {
    return (cnt)/(particles_len/3) * (-graph_cv.height) +  .5* graph_cv.height
  }


  gf_ctx.beginPath()
  gf_ctx.moveTo(0, graph_cv.height/2);
  for(var i=0;i<n_buckets;i++){
    buckets_lower[i] = min_v +     i*bucket_length;
    buckets_upper[i] = min_v + (i+1)*bucket_length;
    const x = transform_x((buckets_lower[i]+buckets_upper[i])/2);
    const y = transform_y(buckets_cnt[i])
    gf_ctx.lineTo(x, y);
  }
  gf_ctx.stroke()

  {
    gf_ctx.beginPath()
    const x = transform_x(v_rms)
    gf_ctx.moveTo(x, 0);
    gf_ctx.lineTo(x, graph_cv.height);
    gf_ctx.stroke()
  }
}

let animationId = null;

const playPauseButton = document.getElementById("play-pause");

const play = () => {
  playPauseButton.textContent = "⏸";
  last_render = Date.now()
  renderLoop();
};

const pause = () => {
  playPauseButton.textContent = "▶";
  cancelAnimationFrame(animationId);
  animationId = null;
};

playPauseButton.addEventListener("click", event => {
  if (animationId === null) {
    play();
  } else {
    pause();
  }
});

let last_render = Date.now()

const renderLoop = () => {
  let now = Date.now()
  const dt = (now-last_render)/1000
  last_render = now

  particleBox.tick(dt);
  loadParticles()
  pre.textContent = 'fps: ' + Math.round(1/dt)
//  pre.textContent = particleBox.text_render();


  ctx.clearRect(1, 1, canvas.width-1, canvas.height-1);
  gf_ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawEdge()
  drawParticles();
  drawGraph()


  animationId = requestAnimationFrame(renderLoop);
};

requestAnimationFrame(renderLoop);
