(function(window, document){

  class STORAGE {
    constructor() {
      this.apiTokenName = 'fbApiToken';
      this.storage = localStorage;
    }

    getToken = () => {
      return this.storage.getItem(this.apiTokenName);
    }

    setToken = (token) => {
      this.storage.fbApiToken = token;
      console.log('Set token:', this.getToken());
    }
  }

  class API_TOKEN_UI {
    constructor(token) {
      this.token = token;
      this.root = document.querySelector('[data-enter-api-token]');
      this.input = this.root.querySelector('input');
      this.button = this.root.querySelector('button');

      if (token) {
        this.input.value = token;
      } else {
        this.input.value = 'Not set yet. Please enter your token.';
      }

      this.button.addEventListener('click', () => {
        this.root.dispatchEvent(new CustomEvent('newToken', {
          detail: {
            token: this.input.value
          },
          bubbles: true
        }));
      });
    }
  }

  class FB_API {
    constructor(
    ) {
      this.storage = new STORAGE();
      //this.UiEnterToken = new API_TOKEN_UI(this.storage.getToken());
      this.requestUrl = 'https://webfactory.fogbugz.com/f/api/0/jsonapi';
      this.init();
      this.initEvents();
    }

    init = () => {
      this.token = this.storage.getToken();
    }

    initEvents = () => {
      window.addEventListener('newToken', event => {
        this.storage.setToken(event.detail.token);
        this.token = this.storage.getToken();
      })
    }

    callApi = (request, callback) => {
      if (!request) return;

      let requestBody = {
        ...{ token: this.storage.getToken() }, ...request
      }

      fetch(this.requestUrl, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })
        .then(response => response.json())
        .then(data => {
          console.log('Success:', data);

          if (callback) { callback(data) }
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    }

    stopWorking = () => {
      this.callApi({
        cmd: "stopWork"
      });
    }

    startWorkingOn = (cn) => {
      let message = 'Please enter Case Number:'
      let caseNr = cn || window.prompt(message);

      if (caseNr) {
        this.callApi({
          cmd: "startWork",
          ixBug: caseNr
        })
      }
    }

    setEstimate = (cn, est) => {
      this.callApi({"cmd":"edit","ixBug":cn, "hrsCurrEst": est || 1}, function (data) {
      });
    }

    dailyStandup = () => {
      this.callApi({"cmd":"search", "q": "Daily Standup", "cols":"hrsCurrEst"}, (data) => {
        let dailyStandupCase = data.data.cases[0];

        if (!dailyStandupCase.hrsCurrEst) {
          this.callApi({"cmd":"edit", "ixBug":dailyStandupCase.ixBug, "hrsCurrEst": 1}, () => {
            this.startWorkingOn(dailyStandupCase.ixBug);
          });
        } else {
          this.startWorkingOn(dailyStandupCase.ixBug);
        }
      });
    }
  }

  window.fbApi = window.fbApi || new FB_API();

  let scriptsInHead = document.head.getElementsByTagName('script');
  let callString = scriptsInHead[scriptsInHead.length - 1].getAttribute('data-call');

  window.fbApi[callString]();

}(window, document));
