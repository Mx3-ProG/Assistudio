"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Abstract, slowly-morphing object for the hero. Three.js is loaded lazily,
 * only when: WebGL is available, the user hasn't asked for reduced motion,
 * and the page is idle. A pure-CSS orb is always rendered underneath as the
 * fallback, so nothing depends on WebGL.
 */
export function HeroScene() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (!el.offsetWidth) return; // hidden by the page (e.g. on small screens): never download Three.js
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const probe = document.createElement("canvas");
    if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) return;

    let disposed = false;
    let cleanup = () => {};

    const start = async () => {
      const THREE = await import("three");
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      el.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = "width:100%;height:100%;display:block";

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.z = 6;

      const css = getComputedStyle(document.documentElement);
      const color = (v: string, fb: string) => new THREE.Color(css.getPropertyValue(v).trim() || fb);

      const uniforms = {
        uTime: { value: 0 },
        uA: { value: color("--accent", "#2f5bff") },
        uB: { value: color("--accent-2", "#7a5cff") },
        uC: { value: new THREE.Color("#7fe3ff") },
        uDark: { value: document.documentElement.dataset.theme === "dark" || (document.documentElement.dataset.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches) ? 1 : 0 },
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        vertexShader: /* glsl */ `
          uniform float uTime;
          varying vec3 vNormal;
          varying vec3 vView;
          varying float vNoise;
          // Compact 3D value noise
          float hash(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
          float noise(vec3 x){
            vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
            return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                       mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
          }
          void main(){
            float n = noise(normal*1.6 + uTime*0.25) * 0.9 + noise(normal*3.2 - uTime*0.15) * 0.35;
            vNoise = n;
            vec3 pos = position + normal * (n - 0.5) * 0.55;
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uDark;
          varying vec3 vNormal; varying vec3 vView; varying float vNoise;
          void main(){
            float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.2);
            vec3 base = mix(uA, uB, smoothstep(0.2, 0.9, vNoise + vNormal.y*0.35));
            base = mix(base, uC, smoothstep(0.55, 1.0, vNormal.x*0.5+0.5) * 0.35);
            vec3 col = base + fres * mix(vec3(0.9), vec3(1.0), uDark) * 0.8;
            float light = 0.65 + 0.35 * dot(vNormal, normalize(vec3(0.4, 0.8, 0.6)));
            gl_FragColor = vec4(col * light, 0.96);
          }
        `,
      });

      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 48), material);
      scene.add(mesh);

      const resize = () => {
        const { width, height } = el.getBoundingClientRect();
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      const target = { x: 0, y: 0 };
      const onMove = (e: PointerEvent) => {
        target.x = (e.clientX / window.innerWidth - 0.5) * 0.6;
        target.y = (e.clientY / window.innerHeight - 0.5) * 0.4;
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
      io.observe(el);

      const t0 = performance.now();
      let raf = 0;
      const frame = () => {
        const t = (performance.now() - t0) / 1000;
        uniforms.uTime.value = t;
        mesh.rotation.y += (target.x + t * 0.05 - mesh.rotation.y) * 0.03;
        mesh.rotation.x += (target.y - mesh.rotation.x) * 0.03;
        renderer.render(scene, camera);
      };
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (visible && !document.hidden) frame(); // pause off-screen / in background tabs
      };
      // Always draw one frame before swapping out the CSS fallback.
      frame();
      setReady(true);
      loop();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        window.removeEventListener("pointermove", onMove);
        mesh.geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    };

    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const handle = idle ? idle(() => void start()) : window.setTimeout(() => void start(), 200);
    return () => {
      disposed = true;
      if (!idle) clearTimeout(handle);
      cleanup();
    };
  }, []);

  return (
    <div className="pointer-events-none relative aspect-square w-full" aria-hidden>
      {/* CSS fallback (and first paint) */}
      <div
        className={`absolute inset-[14%] rounded-full blur-[2px] transition-opacity duration-1000 ${ready ? "opacity-0" : "opacity-100"}`}
        style={{
          background:
            "radial-gradient(circle at 30% 25%, rgb(255 255 255 / .7), transparent 32%), radial-gradient(circle at 70% 70%, var(--accent-2), transparent 60%), radial-gradient(circle at 35% 60%, var(--accent), transparent 65%), var(--accent)",
          boxShadow: "0 40px 120px -20px var(--accent)",
        }}
      />
      <div ref={host} className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} />
      <div className="absolute inset-x-[20%] bottom-[6%] h-10 rounded-[50%] bg-accent/30 blur-2xl" />
    </div>
  );
}
