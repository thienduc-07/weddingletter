/**
 * REPLAY CONTROLLER: Experience Reset & Replay
 * -------------------------------------------------------------
 * Allows the visitor to smoothly reset the envelope-opening ritual
 * and re-experience the 3D rotation and seal interaction anytime.
 */

export class ReplayController {
  constructor(waxSealController, scrollController) {
    this.waxSealController = waxSealController;
    this.scrollController = scrollController;
    this.replayBtn = document.getElementById('btnReplay');

    this.init();
  }

  init() {
    if (!this.replayBtn) return;

    this.replayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.replay();
    });
  }

  replay() {
    // 1. Smoothly scroll back to top of the document
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // 2. Wait until scroll begins settling before resetting the envelope
    setTimeout(() => {
      if (this.waxSealController) {
        this.waxSealController.reset();
      }

      // Hide card reveal effects until opened again
      const card = document.querySelector('.invitation-card');
      if (card) {
        card.style.pointerEvents = 'none';
      }
    }, 400);
  }
}
