// Loaded only by pages containing a valid Markdown YouTube preview.
if (!customElements.get('youtube-preview')) {
  customElements.define('youtube-preview', class extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready) return;
      const id = this.dataset.videoId;
      const button = this.querySelector('button');
      const frame = this.querySelector('.youtube-preview__frame');
      if (!/^[\w-]{11}$/.test(id || '') || !button || !frame) return;
      this.dataset.ready = 'true';
      button.disabled = false;
      const image = button.querySelector('img');
      const hideBrokenImage = () => { image.hidden = true; };
      if (image) {
        image.addEventListener('error', hideBrokenImage, { once: true });
        if (image.complete && !image.naturalWidth) hideBrokenImage();
      }
      // Native buttons generate click for pointer, Enter and Space. No keyboard shim.
      button.addEventListener('click', () => {
        const player = document.createElement('iframe');
        player.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&playsinline=1';
        player.title = this.dataset.title || 'Видео на YouTube';
        player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        player.allowFullscreen = true;
        // YouTube requires a Referer; do not use no-referrer for the player.
        player.referrerPolicy = 'strict-origin-when-cross-origin';
        frame.replaceChildren(player);
        player.focus();
        // The original-video link lives outside this frame and always survives failures.
      }, { once: true });
    }
  });
}
