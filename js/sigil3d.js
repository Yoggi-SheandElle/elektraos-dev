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
    var camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.z = 7;

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

    // ---- Hex frame (outer) ----
    var hexVerts = [];
    for (var i = 0; i < 6; i++) {
      var angle = (Math.PI / 3) * i - Math.PI / 2;
      hexVerts.push(new THREE.Vector3(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0));
    }

    var hexGeo = new THREE.BufferGeometry();
    var hexPositions = [];
    for (var i = 0; i < 6; i++) {
      var a = hexVerts[i], b = hexVerts[(i + 1) % 6];
      hexPositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    hexGeo.setAttribute('position', new THREE.Float32BufferAttribute(hexPositions, 3));
    var hexMat = new THREE.LineBasicMaterial({ color: purple, transparent: true, opacity: 0.5 });
    var hexLine = new THREE.LineSegments(hexGeo, hexMat);
    sigil.add(hexLine);

    // ---- Inner hex (smaller, offset Z) ----
    var hexInner = hexLine.clone();
    hexInner.scale.setScalar(0.65);
    hexInner.position.z = 0.15;
    hexInner.material = new THREE.LineBasicMaterial({ color: cyan, transparent: true, opacity: 0.3 });
    sigil.add(hexInner);

    // ---- Connecting lines (depth struts) ----
    var strutGeo = new THREE.BufferGeometry();
    var strutPositions = [];
    for (var i = 0; i < 6; i++) {
      var outer = hexVerts[i];
      var inner = hexVerts[i].clone().multiplyScalar(0.65);
      strutPositions.push(outer.x, outer.y, 0, inner.x, inner.y, 0.15);
    }
    strutGeo.setAttribute('position', new THREE.Float32BufferAttribute(strutPositions, 3));
    var strutMat = new THREE.LineBasicMaterial({ color: purple, transparent: true, opacity: 0.15 });
    sigil.add(new THREE.LineSegments(strutGeo, strutMat));

    // ---- E letterform (3D extruded lines) ----
    var eMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
    var eGlowMat = new THREE.MeshBasicMaterial({ color: cyan, transparent: true, opacity: 0.3 });

    function makeBar(x1, y1, x2, y2, thickness) {
      var dx = x2 - x1, dy = y2 - y1;
      var len = Math.sqrt(dx * dx + dy * dy);
      var geo = new THREE.BoxGeometry(len, thickness, thickness * 0.6);
      var mesh = new THREE.Mesh(geo, eMat);
      mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0.08);
      mesh.rotation.z = Math.atan2(dy, dx);

      // Glow duplicate
      var glowGeo = new THREE.BoxGeometry(len + 0.06, thickness + 0.06, thickness * 0.6 + 0.04);
      var glow = new THREE.Mesh(glowGeo, eGlowMat);
      glow.position.copy(mesh.position);
      glow.rotation.copy(mesh.rotation);

      return { mesh: mesh, glow: glow };
    }

    // E shape: vertical bar + 3 horizontal bars
    var eGroup = new THREE.Group();
    var bars = [
      makeBar(-0.5, -0.7, -0.5, 0.7, 0.1),   // vertical
      makeBar(-0.5, 0.7, 0.45, 0.7, 0.1),     // top
      makeBar(-0.5, 0.0, 0.35, 0.0, 0.09),    // middle
      makeBar(-0.5, -0.7, 0.45, -0.7, 0.1),   // bottom
    ];
    bars.forEach(function (b) {
      eGroup.add(b.mesh);
      eGroup.add(b.glow);
    });
    sigil.add(eGroup);

    // ---- Core glow (center sphere) ----
    var coreGeo = new THREE.SphereGeometry(0.12, 16, 16);
    var coreMat = new THREE.MeshBasicMaterial({ color: cyan, transparent: true, opacity: 0.8 });
    var core = new THREE.Mesh(coreGeo, coreMat);
    core.position.z = 0.08;
    sigil.add(core);

    // ---- Circuit node dots at hex vertices ----
    var nodeDots = [];
    hexVerts.forEach(function (v, i) {
      var dotGeo = new THREE.SphereGeometry(0.06, 8, 8);
      var dotMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? cyan : purple,
        transparent: true,
        opacity: 0.7
      });
      var dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(v.x, v.y, 0);
      sigil.add(dot);
      nodeDots.push(dot);
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

    // ---- Click: open chat or command palette ----
    container.addEventListener('click', function () {
      var chatToggle = document.getElementById('chatToggle');
      if (chatToggle) chatToggle.click();
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

      // Core pulse
      var pulse = 0.8 + Math.sin(t * 2) * 0.2;
      core.material.opacity = pulse;
      core.scale.setScalar(0.8 + Math.sin(t * 3) * 0.2);

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
