class Header extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <div class="header fixed top-0 p-4 bg-primary w-full border-0 border-b border-solid border-white border-opacity-10">
          <a href="/" class="flex items-center">
            <img src="img/dataki_logo.svg" class="mr-3 h-8" alt="DATAKI Logo"/>
            <span class="self-center text-xl font-mono whitespace-nowrap text-white">DATAKI</span>
          </a>
        </div>
      `;

        const header = this.querySelector('.header');
        let lastScrollPosition = 0;

        window.addEventListener('scroll', () => {
            const currentScrollPosition = window.scrollY;

            if (currentScrollPosition > lastScrollPosition) {
                header.classList.add('header-up');
                header.classList.remove('header-down');
            } else {
                header.classList.add('header-down');
                header.classList.remove('header-up');
            }

            lastScrollPosition = currentScrollPosition;
        });
    }
}

customElements.define("custom-header", Header);
