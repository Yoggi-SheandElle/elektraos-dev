// ===== ELEKTRA LIVING SIGIL - Three.js 3D Holographic Hexagonal E =====

(function () {
  var container = document.getElementById('sigil3d');
  if (!container) return;

  // Lazy-load Three.js from CDN
  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.onload = initSigil;
  document.head.appendChild(script);

  function initSigil() {
    var THREE = window.THREE;
    var width = container.offsetWidth;
    var height = container.offsetHeight;
    var mouse = { x: 0, y: 0 };
    var targetRotX = 0, targetRotY = 0;
    var isOnline = false;
    var agentCount = 0;
    var clock = new THREE.Clock();

    // ---- Scene setup ----
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 5;

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ---- Colors ----
    var purple = new THREE.Color(0x7c3aed);
    var cyan = new THREE.Color(0x00d4ff);
    var green = new THREE.Color(0x00ff9d);

    // ---- Sigil group ----
    var sigil = new THREE.Group();
    scene.add(sigil);

    // ---- Hollow hex prism (front face, back face, depth struts) ----
    var DEPTH = 0.6;
    var RADIUS = 1.8;
    var hexVerts = [];
    for (var i = 0; i < 6; i++) {
      var angle = (Math.PI / 3) * i - Math.PI / 2;
      hexVerts.push(new THREE.Vector3(Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS, 0));
    }

    // Front face wireframe
    function makeHexRing(z, color, opacity) {
      var positions = [];
      for (var i = 0; i < 6; i++) {
        var a = hexVerts[i], b = hexVerts[(i + 1) % 6];
        positions.push(a.x, a.y, z, b.x, b.y, z);
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity }));
    }

    var frontHex = makeHexRing(DEPTH / 2, purple, 0.6);
    var backHex = makeHexRing(-DEPTH / 2, cyan, 0.35);
    sigil.add(frontHex);
    sigil.add(backHex);
    var hexMat = frontHex.material; // reference for animation

    // Depth struts connecting front to back
    var strutPositions = [];
    for (var i = 0; i < 6; i++) {
      var v = hexVerts[i];
      strutPositions.push(v.x, v.y, DEPTH / 2, v.x, v.y, -DEPTH / 2);
    }
    var strutGeo = new THREE.BufferGeometry();
    strutGeo.setAttribute('position', new THREE.Float32BufferAttribute(strutPositions, 3));
    sigil.add(new THREE.LineSegments(strutGeo, new THREE.LineBasicMaterial({ color: purple, transparent: true, opacity: 0.2 })));

    // ---- E letterform as wireframe edges (hollow, not solid) ----
    var ePositions = [];
    function addEdge(x1, y1, x2, y2) {
      // Front edge
      ePositions.push(x1, y1, DEPTH / 2 - 0.05, x2, y2, DEPTH / 2 - 0.05);
      // Back edge
      ePositions.push(x1, y1, -DEPTH / 2 + 0.05, x2, y2, -DEPTH / 2 + 0.05);
      // Depth connectors at endpoints
      ePositions.push(x1, y1, DEPTH / 2 - 0.05, x1, y1, -DEPTH / 2 + 0.05);
      ePositions.push(x2, y2, DEPTH / 2 - 0.05, x2, y2, -DEPTH / 2 + 0.05);
    }

    // E shape
    addEdge(-0.5, -0.7, -0.5, 0.7);   // vertical
    addEdge(-0.5, 0.7, 0.45, 0.7);    // top
    addEdge(-0.5, 0.0, 0.35, 0.0);    // middle
    addEdge(-0.5, -0.7, 0.45, -0.7);  // bottom

    var eGeo = new THREE.BufferGeometry();
    eGeo.setAttribute('position', new THREE.Float32BufferAttribute(ePositions, 3));
    var eLine = new THREE.LineSegments(eGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
    sigil.add(eLine);

    // E glow (slightly larger, same shape)
    var eGlowLine = eLine.clone();
    eGlowLine.material = new THREE.LineBasicMaterial({ color: cyan, transparent: true, opacity: 0.25, linewidth: 2 });
    eGlowLine.scale.setScalar(1.02);
    sigil.add(eGlowLine);

    // Keep bars reference for animation
    var bars = [{ glow: { material: eGlowLine.material } }];

    // ---- Core glow (hollow ring, not solid sphere) ----
    var coreGeo = new THREE.TorusGeometry(0.15, 0.03, 8, 24);
    var coreMat = new THREE.MeshBasicMaterial({ color: cyan, transparent: true, opacity: 0.8 });
    var core = new THREE.Mesh(coreGeo, coreMat);
    sigil.add(core);

    // ---- Circuit node dots at hex vertices (both faces) ----
    var nodeDots = [];
    hexVerts.forEach(function (v, i) {
      // Front node
      var dotGeo = new THREE.SphereGeometry(0.05, 8, 8);
      var dotMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? cyan : purple,
        transparent: true,
        opacity: 0.7
      });
      var dotF = new THREE.Mesh(dotGeo, dotMat);
      dotF.position.set(v.x, v.y, DEPTH / 2);
      sigil.add(dotF);
      nodeDots.push(dotF);

      // Back node (dimmer)
      var dotB = new THREE.Mesh(dotGeo.clone(), new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? purple : cyan,
        transparent: true,
        opacity: 0.35
      }));
      dotB.position.set(v.x, v.y, -DEPTH / 2);
      sigil.add(dotB);
    });

    // ---- Orbiting particles (agent streams) ----
    var particleCount = 60;
    var particleGeo = new THREE.BufferGeometry();
    var pPositions = new Float32Array(particleCount * 3);
    var pColors = new Float32Array(particleCount * 3);
    var pSpeeds = [];
    var pRadii = [];
    var pAngles = [];
    var pHeights = [];

    for (var i = 0; i < particleCount; i++) {
      pAngles.push(Math.random() * Math.PI * 2);
      pRadii.push(1.2 + Math.random() * 1.2);
      pSpeeds.push(0.3 + Math.random() * 0.8);
      pHeights.push((Math.random() - 0.5) * 0.8);

      var col = Math.random() > 0.5 ? cyan : purple;
      pColors[i * 3] = col.r;
      pColors[i * 3 + 1] = col.g;
      pColors[i * 3 + 2] = col.b;
    }

    particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(pPositions, 3));
    particleGeo.setAttribute('color', new THREE.Float32BufferAttribute(pColors, 3));
    var particleMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var particles = new THREE.Points(particleGeo, particleMat);
    sigil.add(particles);

    // ---- Scanline rings (subtle, thin, contained) ----
    var ringGeo = new THREE.RingGeometry(1.85, 1.88, 64);
    var ringMat = new THREE.MeshBasicMaterial({
      color: cyan,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    });
    var scanRing = new THREE.Mesh(ringGeo, ringMat);
    sigil.add(scanRing);

    var ring2Geo = new THREE.RingGeometry(2.05, 2.07, 64);
    var ring2Mat = new THREE.MeshBasicMaterial({
      color: purple,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide
    });
    var ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.z = Math.PI / 6;
    sigil.add(ring2);

    // ---- Mouse tracking ----
    container.addEventListener('mousemove', function (e) {
      var rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    container.addEventListener('mouseleave', function () {
      mouse.x = 0;
      mouse.y = 0;
    });

    // ---- Click: toggle chat panel ----
    container.addEventListener('click', function () {
      var hiddenToggle = document.getElementById('chatToggle');
      if (hiddenToggle) hiddenToggle.click();
    });
    container.style.cursor = 'pointer';

    // ---- System state polling (from pulse) ----
    function checkPulse() {
      var dot = document.getElementById('pulseDot');
      if (dot) {
        isOnline = dot.style.background && dot.style.background.indexOf('green') !== -1;
      }
      var status = document.getElementById('pulseStatus');
      if (status) {
        var match = status.textContent.match(/(\d+)\s*agents/);
        if (match) agentCount = parseInt(match[1]);
      }
    }
    setInterval(checkPulse, 3000);
    checkPulse();

    // ---- Animation loop ----
    function animate() {
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();
      var dt = clock.getDelta();

      // Gentle auto-rotation
      sigil.rotation.y += 0.003;

      // Mouse-reactive tilt
      targetRotX = mouse.y * 0.3;
      targetRotY = mouse.x * 0.3;
      sigil.rotation.x += (targetRotX - sigil.rotation.x) * 0.05;
      // Don't override Y completely, add to auto-rotation
      var targetY = sigil.rotation.y + mouse.x * 0.15;

      // Core torus pulse + rotation
      var pulse = 0.8 + Math.sin(t * 2) * 0.2;
      core.material.opacity = pulse;
      core.rotation.x = t * 1.5;
      core.rotation.y = t * 0.8;

      // Core color: green when online, cyan when offline
      if (isOnline) {
        core.material.color.lerp(green, 0.05);
      } else {
        core.material.color.lerp(cyan, 0.05);
      }

      // Node dots pulse
      nodeDots.forEach(function (dot, i) {
        dot.material.opacity = 0.4 + Math.sin(t * 2 + i * 1.05) * 0.3;
        dot.scale.setScalar(0.8 + Math.sin(t * 1.5 + i * 0.8) * 0.3);
      });

      // Hex frame opacity pulse
      hexMat.opacity = 0.3 + Math.sin(t * 0.8) * 0.15;

      // E glow pulse
      bars.forEach(function (b, i) {
        b.glow.material.opacity = 0.15 + Math.sin(t * 1.5 + i * 0.5) * 0.15;
      });

      // Scan ring rotation
      scanRing.rotation.z = t * 0.2;
      ring2.rotation.z = -t * 0.15 + Math.PI / 6;

      // Particle orbit
      var activeRatio = Math.min(1, agentCount / 41);
      var visibleParticles = Math.floor(15 + activeRatio * 45);
      var positions = particles.geometry.attributes.position.array;

      for (var i = 0; i < particleCount; i++) {
        pAngles[i] += pSpeeds[i] * 0.02;
        var r = pRadii[i];
        var a = pAngles[i];

        if (i < visibleParticles) {
          positions[i * 3] = Math.cos(a) * r;
          positions[i * 3 + 1] = Math.sin(a) * r + Math.sin(t * 2 + i) * 0.1;
          positions[i * 3 + 2] = pHeights[i] + Math.sin(t + i * 0.3) * 0.15;
        } else {
          positions[i * 3] = 0;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = -10; // hide off-screen
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }

    // ---- Resize handler ----
    function onResize() {
      width = container.offsetWidth;
      height = container.offsetHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener('resize', onResize);

    // ---- Visibility optimization ----
    var sigilVisible = true;
    var visObs = new IntersectionObserver(function (entries) {
      sigilVisible = entries[0].isIntersecting;
      if (sigilVisible) animate();
    }, { threshold: 0.1 });
    visObs.observe(container);

    // Start
    animate();
  }
})();
