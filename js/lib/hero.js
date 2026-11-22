// Hero-Hintergrund: in Echtzeit gerenderte Szene (Fragment-Shader) –
// Fadenstrahlrohr im abgedunkelten Raum: Glaskolben, Helmholtz-Spulen aus Kupfer,
// glimmende Elektronenbahn, Staub im Streulicht.
const FS = `
precision highp float;
uniform vec2 R; uniform float t; uniform float motion;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n2(p);p*=2.03;a*=.5;}return v;}
float ell(vec2 p,vec2 r){return (length(p/r)-1.)*min(r.x,r.y);}
vec3 coil(vec2 p, vec2 c, vec2 r, float side){
  vec2 q=p-c; float d=ell(q,r); float band=0.036;
  float m=smoothstep(band,band-0.004,abs(d));
  float ang=atan(q.y/r.y,q.x/r.x);
  float wind=0.5+0.5*sin(ang*260.0+d*900.);
  float shade=clamp(0.35+0.65*(-d/band*0.5+0.5),0.,1.);
  float spec=pow(max(0.,sin(ang+1.9)),10.)*smoothstep(0.02,0.,abs(d+0.012));
  vec3 cu=vec3(0.72,0.36,0.15)*(0.35+0.65*shade)*(0.82+0.18*wind)*side;
  return m*(cu+vec3(1.0,0.75,0.5)*spec*0.9);
}
void main(){
  vec2 fc=gl_FragCoord.xy; float asp=R.x/R.y;
  vec2 c=vec2(asp>1.25?0.68:0.5,asp>1.25?0.5:0.6);
  vec2 p=(fc-R*c)/R.y; float s=asp>1.25?1.0:1.25; p*=s;
  float tm=t*motion;
  vec3 col=vec3(0.025,0.03,0.034);
  // Dunst / Streulicht
  float hz=fbm(p*2.2+vec2(tm*0.02,-tm*0.015));
  col+=vec3(0.05,0.07,0.09)*hz*0.8;
  col+=vec3(0.22,0.12,0.06)*exp(-length(p-vec2(0.55,0.45))*2.2)*0.35;
  // hintere Spule
  col+=coil(p,vec2(0.11,0.0),vec2(0.40,0.50),0.55);
  // Glaskolben
  float rG=0.31; float dg=length(p-vec2(0.0,0.0));
  float inside=smoothstep(rG,rG-0.004,dg);
  col=mix(col,col*0.85+vec3(0.02,0.03,0.035),inside*0.6);
  float rimL=exp(-pow((dg-rG)/0.004,2.));
  col+=vec3(0.55,0.65,0.75)*rimL*0.35;
  float fres=inside*pow(dg/rG,6.);
  col+=vec3(0.16,0.22,0.3)*fres*0.6;
  vec2 hl=p-vec2(-0.12,0.17); col+=vec3(0.9)*exp(-dot(hl*vec2(1.,2.4),hl*vec2(1.,2.4))*900.)*0.35*inside;
  // Messmarken-Leiter
  vec2 ml=p-vec2(-0.13,-0.0);
  float lad=smoothstep(0.003,0.0,abs(ml.y))*step(0.,ml.x)*step(ml.x,0.25);
  for(int i=1;i<=6;i++){float x=float(i)*0.04; lad+=smoothstep(0.0025,0.,abs(ml.x-x))*smoothstep(0.018,0.,abs(ml.y));}
  col+=vec3(0.5,0.52,0.55)*lad*0.35*inside;
  // Elektronenkanone
  vec2 g=p-vec2(-0.13,-0.12); float gun=smoothstep(0.012,0.010,abs(g.x))*smoothstep(0.12,0.115,abs(g.y));
  col=mix(col,vec3(0.07,0.075,0.08)+vec3(0.12)*smoothstep(0.012,0.,abs(g.x-0.005)),gun);
  // Elektronenbahn (Kreis, r ≈ 0.12) mit Puls
  vec2 o=p-vec2(-0.13+0.12,0.0); float d=abs(length(o)-0.12);
  float ang=atan(o.y,o.x);
  float startA=3.14159; // Austritt links
  float rel=mod(startA-ang,6.28318)/6.28318;
  float fade=mix(1.0,0.45,rel);
  float pulse=exp(-pow(mod(rel-tm*0.25,1.0)-0.5,2.)*90.)*0.6;
  vec3 beamC=vec3(0.42,0.78,1.0);
  col+=beamC*(exp(-d*d/0.000012)*1.3+exp(-d*d/0.0004)*0.35+0.004/(d+0.006)*0.25)*(fade+pulse)*inside;
  col+=beamC*exp(-length(p-vec2(-0.13,0.0))*40.)*1.4;
  col+=vec3(1.0,0.55,0.25)*exp(-length(p-vec2(-0.13,-0.115))*90.)*1.2;
  // vordere Spule
  col+=coil(p,vec2(-0.13,0.0),vec2(0.42,0.52),1.0);
  // Staub
  for(int k=0;k<3;k++){
    float fk=float(k); vec2 q=p*(14.+fk*9.)+vec2(tm*(0.05+fk*0.03),tm*0.02*fk);
    vec2 id=floor(q); vec2 f=fract(q)-0.5; float r=h21(id+fk*7.);
    vec2 off=vec2(h21(id+3.1)-.5,h21(id+5.7)-.5)*0.6;
    float dd=length(f-off); col+=vec3(0.7,0.75,0.8)*smoothstep(0.06,0.,dd)*step(0.93,r)*0.18*(1.-fk*0.25);
  }
  // Vignette + Körnung
  vec2 uv=fc/R; col*=0.55+0.45*pow(16.*uv.x*uv.y*(1.-uv.x)*(1.-uv.y),0.22);
  col+=(h21(fc+fract(t))-0.5)*0.018;
  col=col/(1.+col*0.6);
  gl_FragColor=vec4(pow(col,vec3(0.92)),1.);
}`;
const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

export function startHero(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) { canvas.style.background = 'radial-gradient(circle at 70% 50%,#1b2a33,#0a0c0e 60%)'; return () => {}; }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(pr, 'R'), uT = gl.getUniformLocation(pr, 't'), uM = gl.getUniformLocation(pr, 'motion');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, alive = true, vis = true;
  const io = new IntersectionObserver(e => { vis = e[0].isIntersecting; }); io.observe(canvas);
  function frame(now) {
    if (!alive) return; raf = requestAnimationFrame(frame);
    if (!vis || document.hidden) return;
    const dpr = Math.min(1.5, devicePixelRatio || 1), w = canvas.clientWidth * dpr | 0, h = canvas.clientHeight * dpr | 0;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform2f(uR, w, h); gl.uniform1f(uT, now / 1000); gl.uniform1f(uM, reduce ? 0 : 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  raf = requestAnimationFrame(frame);
  return () => { alive = false; cancelAnimationFrame(raf); io.disconnect(); };
}
