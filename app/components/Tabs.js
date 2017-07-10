import React, { Component } from 'react';
import Draggabilly from 'draggabilly';

const tabTemplate = `
  <div class="chrome-tab">
    <div class="chrome-tab-background">
    </div>
    <div class="chrome-tab-favicon"></div>
    <div class="chrome-tab-title"></div>
    <div class="chrome-tab-close"></div>
  </div>
`;

const defaultTapProperties = {
  title: '',
  favicon: ''
};

let instanceId = 0;

class ChromeTabs {
  constructor() {
    this.draggabillyInstances = [];
  }

  init(el, options) {
    this.el = el;
    this.options = options;

    this.instanceId = instanceId;
    this.el.setAttribute('data-chrome-tabs-instance-id', this.instanceId);
    instanceId += 1;

    this.setupStyleEl();
    this.setupEvents();
    this.layoutTabs();
    this.fixZIndexes();
    this.setupDraggabilly();
  }

  emit(eventName, data) {
    this.el.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }

  setupStyleEl() {
    this.animationStyleEl = document.createElement('style');
    this.el.appendChild(this.animationStyleEl);
  }

  setupEvents() {
    window.addEventListener('resize', event => this.layoutTabs());

    this.el.addEventListener('dblclick', event => this.addTab());

    this.el.addEventListener('click', ({ target }) => {
      if (target.classList.contains('chrome-tab')) {
        this.setCurrentTab(target);
      } else if (target.classList.contains('chrome-tab-close')) {
        this.removeTab(target.parentNode);
      } else if (target.classList.contains('chrome-tab-title') || target.classList.contains('chrome-tab-favicon')) {
        this.setCurrentTab(target.parentNode);
      }
    });
  }

  get tabEls() {
    return Array.prototype.slice.call(this.el.querySelectorAll('.chrome-tab'));
  }

  get tabContentEl() {
    return this.el.querySelector('.chrome-tabs-content');
  }

  get tabWidth() {
    const tabsContentWidth = this.tabContentEl.clientWidth - this.options.tabOverlapDistance;
    const width = (tabsContentWidth / this.tabEls.length) + this.options.tabOverlapDistance;
    return Math.max(this.options.minWidth, Math.min(this.options.maxWidth, width));
  }

  get tabEffectiveWidth() {
    return this.tabWidth - this.options.tabOverlapDistance;
  }

  get tabPositions() {
    const tabEffectiveWidth = this.tabEffectiveWidth;
    let left = 0;
    const positions = [];

    this.tabEls.forEach((tabEl, i) => {
      positions.push(left);
      left += tabEffectiveWidth;
    });
    return positions;
  }

  layoutTabs() {
    const tabWidth = this.tabWidth;

    this.cleanUpPreviouslyDraggedTabs();
    this.tabEls.forEach((tabEl) => tabEl.style.width = `${tabWidth}px`);
    requestAnimationFrame(() => {
      let styleHTML = '';
      this.tabPositions.forEach((left, i) => {
        styleHTML += `
          .chrome-tabs[data-chrome-tabs-instance-id="${this.instanceId}"] .chrome-tab:nth-child(${i + 1}) {
            transform: translate3d(${left}px, 0, 0)
          }
        `;
      });
      this.animationStyleEl.innerHTML = styleHTML;
    });
  }

  fixZIndexes() {
    const bottomBarEl = this.el.querySelector('.chrome-tabs-bottom-bar');
    const tabEls = this.tabEls;

    tabEls.forEach((tabEl, i) => {
      let zIndex = tabEls.length - i;

      if (tabEl.classList.contains('chrome-tab-current')) {
        bottomBarEl.style.zIndex = tabEls.length + 1;
        zIndex = tabEls.length + 2;
      }
      tabEl.style.zIndex = zIndex;
    });
  }

  createNewTabEl() {
    const div = document.createElement('div');
    div.innerHTML = tabTemplate;
    return div.firstElementChild;
  }

  addTab(tabProperties) {
    const tabEl = this.createNewTabEl();

    tabEl.classList.add('chrome-tab-just-added');
    setTimeout(() => tabEl.classList.remove('chrome-tab-just-added'), 500);

    tabProperties = Object.assign({}, defaultTapProperties, tabProperties);
    this.tabContentEl.appendChild(tabEl);
    this.updateTab(tabEl, tabProperties);
    this.emit('tabAdd', { tabEl });
    this.setCurrentTab(tabEl);
    this.layoutTabs();
    this.fixZIndexes();
    this.setupDraggabilly();
  }

  setCurrentTab(tabEl) {
    const currentTab = this.el.querySelector('.chrome-tab-current');
    if (currentTab) currentTab.classList.remove('chrome-tab-current');
    tabEl.classList.add('chrome-tab-current');
    this.fixZIndexes();
    this.emit('activeTabChange', { tabEl });
  }

  removeTab(tabEl) {
    if (tabEl.classList.contains('chrome-tab-current')) {
      if (tabEl.previousElementSibling) {
        this.setCurrentTab(tabEl.previousElementSibling);
      } else if (tabEl.nextElementSibling) {
        this.setCurrentTab(tabEl.nextElementSibling);
      }
    }
    tabEl.parentNode.removeChild(tabEl);
    this.emit('tabRemove', { tabEl });
    this.layoutTabs();
    this.fixZIndexes();
    this.setupDraggabilly();
  }

  updateTab(tabEl, tabProperties) {
    tabEl.querySelector('.chrome-tab-title').textContent = tabProperties.title;
    tabEl.querySelector('.chrome-tab-favicon').style.backgroundImage = `url('${tabProperties.favicon}')`;
  }

  cleanUpPreviouslyDraggedTabs() {
    this.tabEls.forEach((tabEl) => tabEl.classList.remove('chrome-tab-just-dragged'));
  }

  setupDraggabilly() {
    const tabEls = this.tabEls;
    const tabEffectiveWidth = this.tabEffectiveWidth;
    const tabPositions = this.tabPositions;

    this.draggabillyInstances.forEach(draggabillyInstance => draggabillyInstance.destroy());

    tabEls.forEach((tabEl, originalIndex) => {
      const originalTabPositionX = tabPositions[originalIndex];
      const draggabillyInstance = new Draggabilly(tabEl, {
        axis: 'x',
        containment: this.tabContentEl
      });

      this.draggabillyInstances.push(draggabillyInstance);

      draggabillyInstance.on('dragStart', () => {
        this.cleanUpPreviouslyDraggedTabs();
        tabEl.classList.add('chrome-tab-currently-dragged');
        this.el.classList.add('chrome-tabs-sorting');
        this.fixZIndexes();
      });

      draggabillyInstance.on('dragEnd', () => {
        const finalTranslateX = parseFloat(tabEl.style.left, 10);
        tabEl.style.transform = 'translate3d(0, 0, 0)';

        // Animate dragged tab back into its place
        requestAnimationFrame(() => {
          tabEl.style.left = '0';
          tabEl.style.transform = `translate3d(${finalTranslateX}px, 0, 0)`;

          requestAnimationFrame(() => {
            tabEl.classList.remove('chrome-tab-currently-dragged');
            this.el.classList.remove('chrome-tabs-sorting');

            this.setCurrentTab(tabEl);
            tabEl.classList.add('chrome-tab-just-dragged');

            requestAnimationFrame(() => {
              tabEl.style.transform = '';

              this.setupDraggabilly();
            });
          });
        });
      });

      draggabillyInstance.on('dragMove', (event, pointer, moveVector) => {
        // Current index be computed within the event since it can change during the dragMove
        const tabEls = this.tabEls;
        const currentIndex = tabEls.indexOf(tabEl);

        const currentTabPositionX = originalTabPositionX + moveVector.x;
        const destinationIndex = Math.max(0, Math.min(tabEls.length, Math.floor((currentTabPositionX + (tabEffectiveWidth / 2)) / tabEffectiveWidth)));

        if (currentIndex !== destinationIndex) {
          this.animateTabMove(tabEl, currentIndex, destinationIndex);
        }
      });
    });
  }

  animateTabMove(tabEl, originIndex, destinationIndex) {
    if (destinationIndex < originIndex) {
      tabEl.parentNode.insertBefore(tabEl, this.tabEls[destinationIndex]);
    } else {
      tabEl.parentNode.insertBefore(tabEl, this.tabEls[destinationIndex + 1]);
    }
  }
}


export default class Tab extends Component {
  componentDidMount() {
    setTimeout(() => {
      const el = document.querySelector('.chrome-tabs');
      const chromeTabs = new ChromeTabs();

      chromeTabs.init(el, {
        tabOverlapDistance: 0,
        minWidth: 45,
        maxWidth: 243
      });

      el.addEventListener('activeTabChange', ({ detail }) => console.log('Active tab changed', detail.tabEl));
      el.addEventListener('tabAdd', ({ detail }) => console.log('Tab added', detail.tabEl));
      el.addEventListener('tabRemove', ({ detail }) => console.log('Tab removed', detail.tabEl));

      document.querySelector('button[data-add-tab]').addEventListener('click', () => {
        chromeTabs.addTab({
          title: 'New Tab',
          favicon: 'demo/images/default-favicon.png'
        });
      });

      document.querySelector('button[data-remove-tab]').addEventListener('click', () => {
        chromeTabs.removeTab(el.querySelector('.chrome-tab-current'));
      });

      document.querySelector('button[data-theme-toggle]').addEventListener('click', () => {
        if (el.classList.contains('chrome-tabs-dark-theme')) {
          document.documentElement.classList.remove('dark-theme');
          el.classList.remove('chrome-tabs-dark-theme');
        } else {
          document.documentElement.classList.add('dark-theme');
          el.classList.add('chrome-tabs-dark-theme');
        }
      });
    }, 0);
  }

  render() {
    const svgString = `
      <div class="chrome-tabs">
        <div class="chrome-tabs-content">
          <div class="chrome-tab">
            <div class="chrome-tab-background">
            </div>
            <div class="chrome-tab-favicon" style="background-image: url('demo/images/google-favicon.png')"></div>
            <div class="chrome-tab-title">compat-db</div>
            <div class="chrome-tab-close"></div>
          </div>
          <div class="chrome-tab chrome-tab-current">
            <div class="chrome-tab-background">
            </div>
            <div class="chrome-tab-favicon" style="background-image: url('demo/images/facebook-favicon.ico')"></div>
            <div class="chrome-tab-title">falcon-test-db</div>
            <div class="chrome-tab-close"></div>
          </div>
        </div>
        <div class="chrome-tabs-bottom-bar"></div>
      </div>
      <button data-add-tab>Add new tab</button> &nbsp;
      <button data-remove-tab>Remove current tab</button>
    `;

    return <div dangerouslySetInnerHTML={{ __html: svgString }} />;
  }
}
