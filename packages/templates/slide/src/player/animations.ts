interface PlayerAnimationOptions {
  canvas: HTMLElement;
  loading: HTMLElement;
  spinner: HTMLElement;
  reducedMotion: MediaQueryList;
  signal: AbortSignal;
}

/** 管理播放器的过渡效果，以及中断、减少动态效果和卸载时的清理。 */
export function createPlayerAnimations({
  canvas,
  loading,
  spinner,
  reducedMotion,
  signal,
}: PlayerAnimationOptions) {
  let revealAnimations: Animation[] = [];
  let pageAnimations: Animation[] = [];
  let outgoing: { section: HTMLElement; inert: boolean; ariaHidden: string | null } | undefined;

  function finishReveal() {
    loading.style.visibility = 'hidden';
    revealAnimations.forEach((animation) => {
      animation.onfinish = null;
      animation.cancel();
    });
    revealAnimations = [];
  }

  function finishPageTransition() {
    pageAnimations.forEach((animation) => {
      animation.onfinish = null;
      animation.cancel();
    });
    pageAnimations = [];

    if (outgoing) {
      const { section, inert, ariaHidden } = outgoing;
      section.hidden = true;
      section.style.display = 'none';
      section.inert = inert;

      if (ariaHidden === null) {
        section.removeAttribute('aria-hidden');
      }
      else {
        section.setAttribute('aria-hidden', ariaHidden);
      }

      outgoing = undefined;
    }
  }

  function transition(previous: HTMLElement, next: HTMLElement, direction: number) {
    outgoing = {
      section: previous,
      inert: previous.inert,
      ariaHidden: previous.getAttribute('aria-hidden'),
    };
    previous.hidden = false;
    previous.style.display = 'block';
    previous.inert = true;
    previous.setAttribute('aria-hidden', 'true');
    const timing: KeyframeAnimationOptions = {
      duration: 200,
      easing: 'cubic-bezier(0.2, 0, 0.2, 1)',
      fill: 'both',
    };
    const exit = previous.animate(
      [{ translate: '0 0' }, { translate: `${-direction * 100}% 0` }],
      timing,
    );
    const enter = next.animate(
      [{ translate: `${direction * 100}% 0` }, { translate: '0 0' }],
      timing,
    );
    pageAnimations = [exit, enter];
    enter.onfinish = finishPageTransition;
  }

  function reveal(requestSignal: AbortSignal) {
    const fadeOut = loading.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 120, easing: 'ease-out', fill: 'forwards' },
    );
    const fadeIn = canvas.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 180, easing: 'ease-out' },
    );
    revealAnimations = [fadeOut, fadeIn];
    fadeOut.onfinish = () => {
      if (!requestSignal.aborted && !signal.aborted) {
        loading.style.visibility = 'hidden';
      }
    };
    fadeIn.onfinish = () => {
      if (!requestSignal.aborted && !signal.aborted) {
        finishReveal();
      }
    };
  }

  const spinnerAnimation = spinner.animate(
    [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
    { duration: 900, iterations: Infinity },
  );
  const updateSpinnerMotion = () => {
    if (reducedMotion.matches) {
      spinnerAnimation.pause();
      finishPageTransition();

      if (revealAnimations.length) {
        finishReveal();
      }
    }
    else {
      spinnerAnimation.play();
    }
  };
  reducedMotion.addEventListener('change', updateSpinnerMotion, { signal });
  updateSpinnerMotion();

  return {
    finishReveal,
    finishPageTransition,
    transition,
    reveal,
    destroy() {
      finishReveal();
      finishPageTransition();
      spinnerAnimation.cancel();
    },
  };
}
