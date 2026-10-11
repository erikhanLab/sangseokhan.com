(function () {
  function initHomeKineticField() {
    const container = document.querySelector('.kinetic-line-field');
    const canvas = container?.querySelector('.kinetic-line-field-canvas');
    if (!container || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const intersectionObserverSupported = typeof IntersectionObserver === 'function';
    const resizeObserverSupported = typeof ResizeObserver === 'function';

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let animationFrame = 0;
    let isVisible = true;

    const lines = Array.from({ length: 11 }, (_, index) => ({
      base: 0.16 + index * 0.062,
      amplitudeA: 7 + (index % 4) * 2.5,
      amplitudeB: 3 + (index % 3) * 1.7,
      drift: 4 + (index % 5) * 1.2,
      phaseA: index * 0.62,
      phaseB: 1.15 + index * 0.37,
      phaseDrift: 0.45 + index * 0.28,
      speed: 0.11 + index * 0.009,
      tension: 0.32 + (index % 4) * 0.05,
      slope: (index - 5) * 0.42,
      glowAlpha: 0.06 + index * 0.004,
      inkAlpha: 0.10 + index * 0.0055,
      steelAlpha: 0.08 + index * 0.005,
      thickness: 0.62 + (index % 3) * 0.22,
      shift: (index - 5) * 3.2
    }));

    function configureCanvas() {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.lineCap = 'round';
      context.lineJoin = 'round';
    }

    function pointAt(line, progress, time) {
      const x = progress * width;
      const centered = progress - 0.5;
      const waveA = Math.sin(time * line.speed + progress * 6.4 + line.phaseA) * line.amplitudeA;
      const waveB = Math.cos(time * (line.speed * 0.56) + progress * 9.2 + line.phaseB) * line.amplitudeB;
      const drift = Math.sin(time * 0.17 + progress * 2.3 + line.phaseDrift) * line.drift;
      const y = line.base * height + waveA + waveB + drift + centered * line.slope + line.shift;
      return { x, y };
    }

    function traceLine(line, time) {
      const samples = 7;
      const points = [];
      for (let i = 0; i <= samples; i += 1) {
        points.push(pointAt(line, i / samples, time));
      }

      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length - 1; i += 1) {
        const current = points[i];
        const next = points[i + 1];
        const controlX = current.x + (next.x - current.x) * line.tension;
        const controlY = current.y;
        const endX = (current.x + next.x) / 2;
        const endY = (current.y + next.y) / 2;
        context.quadraticCurveTo(controlX, controlY, endX, endY);
      }
      const penultimate = points[points.length - 2];
      const last = points[points.length - 1];
      context.quadraticCurveTo(penultimate.x, penultimate.y, last.x, last.y);
    }

    function drawField(timeSeconds) {
      context.clearRect(0, 0, width, height);

      const haze = context.createRadialGradient(
        width * 0.66,
        height * 0.48,
        height * 0.05,
        width * 0.66,
        height * 0.48,
        height * 0.78
      );
      haze.addColorStop(0, 'rgba(86, 117, 138, 0.085)');
      haze.addColorStop(0.4, 'rgba(86, 117, 138, 0.03)');
      haze.addColorStop(1, 'rgba(86, 117, 138, 0)');
      context.fillStyle = haze;
      context.fillRect(0, 0, width, height);

      lines.forEach((line) => {
        traceLine(line, timeSeconds);
        context.strokeStyle = `rgba(86, 117, 138, ${line.glowAlpha})`;
        context.lineWidth = line.thickness + 2.4;
        context.stroke();

        traceLine(line, timeSeconds);
        context.strokeStyle = `rgba(86, 117, 138, ${line.steelAlpha})`;
        context.lineWidth = line.thickness + 0.95;
        context.stroke();

        traceLine(line, timeSeconds);
        context.strokeStyle = `rgba(11, 31, 58, ${line.inkAlpha})`;
        context.lineWidth = line.thickness;
        context.stroke();
      });
    }

    function renderFrame(timestamp) {
      drawField(timestamp / 1000);
      if (!reducedMotionQuery.matches && isVisible) {
        animationFrame = window.requestAnimationFrame(renderFrame);
      }
    }

    function stopAnimation() {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    }

    function startAnimation() {
      stopAnimation();
      if (reducedMotionQuery.matches) {
        drawField(0);
      } else if (isVisible) {
        animationFrame = window.requestAnimationFrame(renderFrame);
      }
    }

    function handleReducedMotionChange() {
      startAnimation();
    }

    function handleResize() {
      configureCanvas();
      startAnimation();
    }

    configureCanvas();
    startAnimation();

    if (typeof reducedMotionQuery.addEventListener === 'function') {
      reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    } else if (typeof reducedMotionQuery.addListener === 'function') {
      reducedMotionQuery.addListener(handleReducedMotionChange);
    }

    if (resizeObserverSupported) {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', handleResize);
    }

    if (intersectionObserverSupported) {
      const visibilityObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;
        isVisible = !!entry?.isIntersecting;
        if (isVisible) {
          startAnimation();
        } else {
          stopAnimation();
        }
      }, { threshold: 0.08 });
      visibilityObserver.observe(container);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeKineticField, { once: true });
  } else {
    initHomeKineticField();
  }
})();
